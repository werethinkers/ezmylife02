-- Influencer logins: each influencer gets their own account and sees ONLY their
-- own numbers, on /influencer. They never reach the admin area.
--
-- Privacy: an influencer is a third party, so they are never shown a buyer's
-- email, even masked. Buyers appear as "Buyer 1", "Buyer 2" in the order they
-- purchased, which is enough to see how many bought and what each sale earned.

-- Link an influencer row to an auth user.
ALTER TABLE public.influencers
  ADD COLUMN IF NOT EXISTS user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;

-- Attribution code captured at checkout, kept separate from real coupon codes
-- so an influencer code can never be mistaken for a discount coupon.
ALTER TABLE public.credit_purchases
  ADD COLUMN IF NOT EXISTS ref_code text;
CREATE INDEX IF NOT EXISTS credit_purchases_ref_code_idx
  ON public.credit_purchases(ref_code) WHERE ref_code IS NOT NULL;

-- ---------- service role: attach a freshly created login to an influencer ----------
CREATE OR REPLACE FUNCTION public.influencer_attach_login(_influencer_id uuid, _user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.influencers WHERE user_id = _user_id AND id <> _influencer_id) THEN
    RAISE EXCEPTION 'that login is already attached to another influencer';
  END IF;
  UPDATE public.influencers SET user_id = _user_id WHERE id = _influencer_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'influencer not found'; END IF;
END $$;

-- ---------- the influencer's own view of their campaign ----------
-- Readable only by the signed-in influencer it belongs to. No admin role needed,
-- and no way to ask for someone else's row: the influencer is found by auth.uid().
CREATE OR REPLACE FUNCTION public.influencer_me()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r public.influencers%ROWTYPE;
  v_clicks bigint; v_buyers bigint; v_orders bigint; v_gross numeric;
  v_pending numeric; v_approved numeric; v_paid numeric;
  v_net_paid numeric; v_tds_paid numeric;
  v_window numeric := public.influencer_setting('refund_window_days');
BEGIN
  SELECT * INTO r FROM public.influencers WHERE user_id = auth.uid();
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'no_influencer_for_this_login');
  END IF;

  SELECT count(*) INTO v_clicks FROM public.influencer_clicks WHERE influencer_id = r.id;
  SELECT count(*), count(DISTINCT buyer_user_id), coalesce(sum(gross_inr), 0)
    INTO v_orders, v_buyers, v_gross
  FROM public.influencer_commissions WHERE influencer_id = r.id AND status <> 'reversed';
  SELECT coalesce(sum(commission_inr) FILTER (WHERE status = 'pending'), 0),
         coalesce(sum(commission_inr) FILTER (WHERE status = 'approved'), 0),
         coalesce(sum(commission_inr) FILTER (WHERE status = 'paid'), 0)
    INTO v_pending, v_approved, v_paid
  FROM public.influencer_commissions WHERE influencer_id = r.id;
  SELECT coalesce(sum(net_inr), 0), coalesce(sum(tds_inr), 0)
    INTO v_net_paid, v_tds_paid
  FROM public.influencer_payouts WHERE influencer_id = r.id;

  RETURN jsonb_build_object(
    'ok', true,
    'name', r.name, 'handle', r.handle, 'city', r.city, 'campaign', r.campaign,
    'code', r.code, 'commission_pct', r.commission_pct, 'status', r.status,
    'link', 'https://ezyourlife.com/?ref=' || r.code,
    'refund_window_days', v_window,
    'clicks', v_clicks,
    'buyers', v_buyers,
    'orders', v_orders,
    'conversion_pct', CASE WHEN v_clicks > 0 THEN round(v_buyers * 100.0 / v_clicks, 2) ELSE 0 END,
    'sales_inr', v_gross,
    'earning_waiting_inr', v_pending,
    'earning_ready_inr', v_approved,
    'earning_paid_inr', v_paid,
    'net_received_inr', v_net_paid,
    'tds_deducted_inr', v_tds_paid,
    -- Pseudonymised: an influencer never sees who the buyer is.
    -- row_number() is computed in the inner query: a window function cannot sit
    -- inside an aggregate like jsonb_agg.
    'sales', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'label', 'Buyer ' || s.n,
        'purchased_at', s.purchased_at,
        'amount_inr', s.gross_inr,
        'commission_inr', s.commission_inr,
        'commission_pct', s.commission_pct,
        'status', s.status,
        'payable_after', s.approve_after
      ) ORDER BY s.purchased_at DESC)
      FROM (
        SELECT c.*, row_number() OVER (ORDER BY c.purchased_at) AS n
        FROM public.influencer_commissions c WHERE c.influencer_id = r.id
      ) s
    ), '[]'::jsonb),
    'clicks_by_day', coalesce((
      SELECT jsonb_agg(jsonb_build_object('day', d, 'clicks', n) ORDER BY d)
      FROM (SELECT (created_at AT TIME ZONE 'Asia/Kolkata')::date AS d, count(*) AS n
            FROM public.influencer_clicks WHERE influencer_id = r.id GROUP BY 1) x
    ), '[]'::jsonb),
    'payments', coalesce((
      SELECT jsonb_agg(jsonb_build_object('paid_at', paid_at, 'commission_inr', gross_inr,
        'tds_inr', tds_inr, 'received_inr', net_inr, 'reference', utr) ORDER BY paid_at DESC)
      FROM public.influencer_payouts WHERE influencer_id = r.id
    ), '[]'::jsonb)
  );
END $$;

-- ---------- admin dashboard: also report whether a login exists ----------
CREATE OR REPLACE FUNCTION public.influencer_dashboard()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r record;
  v_rows jsonb := '[]'::jsonb;
  v_clicks bigint; v_buyers bigint; v_orders bigint;
  v_gross numeric; v_pending numeric; v_approved numeric;
  v_paid_gross numeric; v_fy_paid numeric; v_tds_paid numeric; v_net_paid numeric;
  v_tds_est numeric;
  v_rate numeric := public.influencer_setting('tds_rate_pct');
  v_threshold numeric := public.influencer_setting('tds_threshold_inr');
BEGIN
  PERFORM public.influencer_assert_admin();
  FOR r IN SELECT i.*, u.email AS login_email FROM public.influencers i
           LEFT JOIN auth.users u ON u.id = i.user_id ORDER BY i.created_at LOOP
    SELECT count(*) INTO v_clicks FROM public.influencer_clicks WHERE influencer_id = r.id;
    SELECT count(*), count(DISTINCT buyer_user_id), coalesce(sum(gross_inr), 0)
      INTO v_orders, v_buyers, v_gross
    FROM public.influencer_commissions WHERE influencer_id = r.id AND status <> 'reversed';
    SELECT coalesce(sum(commission_inr) FILTER (WHERE status = 'pending'), 0),
           coalesce(sum(commission_inr) FILTER (WHERE status = 'approved'), 0),
           coalesce(sum(commission_inr) FILTER (WHERE status = 'paid'), 0)
      INTO v_pending, v_approved, v_paid_gross
    FROM public.influencer_commissions WHERE influencer_id = r.id;
    SELECT coalesce(sum(tds_inr), 0), coalesce(sum(net_inr), 0)
      INTO v_tds_paid, v_net_paid
    FROM public.influencer_payouts WHERE influencer_id = r.id;
    SELECT coalesce(sum(gross_inr), 0) INTO v_fy_paid FROM public.influencer_payouts
      WHERE influencer_id = r.id AND paid_at >= public.influencer_fy_start();
    v_tds_est := CASE WHEN v_fy_paid + v_approved > v_threshold
                      THEN round(v_approved * v_rate / 100, 2) ELSE 0 END;

    v_rows := v_rows || jsonb_build_object(
      'id', r.id, 'name', r.name, 'handle', r.handle, 'city', r.city, 'campaign', r.campaign,
      'code', r.code, 'commission_pct', r.commission_pct, 'status', r.status,
      'has_login', r.user_id IS NOT NULL, 'login_email', r.login_email,
      'clicks', v_clicks, 'buyers', v_buyers, 'orders', v_orders,
      'conversion_pct', CASE WHEN v_clicks > 0 THEN round(v_buyers * 100.0 / v_clicks, 2) ELSE 0 END,
      'gross_inr', v_gross,
      'commission_pending_inr', v_pending,
      'commission_approved_inr', v_approved,
      'commission_paid_inr', v_paid_gross,
      'tds_on_payable_est_inr', v_tds_est,
      'net_payable_now_inr', v_approved - v_tds_est,
      'tds_deducted_total_inr', v_tds_paid,
      'net_paid_total_inr', v_net_paid
    );
  END LOOP;
  RETURN jsonb_build_object('generated_at', now(), 'influencers', v_rows,
    'refund_window_days', public.influencer_setting('refund_window_days'));
END $$;

REVOKE ALL ON FUNCTION public.influencer_me() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.influencer_attach_login(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.influencer_me() TO authenticated;
GRANT EXECUTE ON FUNCTION public.influencer_attach_login(uuid, uuid) TO service_role;
