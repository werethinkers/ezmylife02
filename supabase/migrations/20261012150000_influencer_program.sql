-- Influencer (affiliate) program: codes, clicks, commissions, payouts, dashboard.
-- Read-only with respect to checkout: commissions are created from paid
-- credit_purchases whose coupon_code matches an influencer code (see the
-- influencer-sync edge function). No change to order creation or payment flow.
-- TDS rate and threshold are placeholders until a CA confirms them (see settings).

-- ---------- settings ----------
CREATE TABLE IF NOT EXISTS public.influencer_settings (
  key text PRIMARY KEY,
  value numeric NOT NULL
);
INSERT INTO public.influencer_settings (key, value) VALUES
  ('refund_window_days', 7),
  ('tds_rate_pct', 2),
  ('tds_threshold_inr', 20000)
ON CONFLICT (key) DO NOTHING;

-- ---------- influencers ----------
CREATE TABLE IF NOT EXISTS public.influencers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  handle text,
  city text,
  campaign text NOT NULL DEFAULT 'diwali-2026',
  code text NOT NULL UNIQUE CHECK (code = lower(code) AND code ~ '^[a-z0-9-]{3,20}$'),
  commission_pct numeric(5,2) NOT NULL DEFAULT 20 CHECK (commission_pct >= 0 AND commission_pct <= 50),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','ended')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- link clicks (from ezyourlife.com/?ref=CODE) ----------
CREATE TABLE IF NOT EXISTS public.influencer_clicks (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  influencer_id uuid NOT NULL REFERENCES public.influencers(id) ON DELETE CASCADE,
  visitor_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS influencer_clicks_inf_idx ON public.influencer_clicks(influencer_id, created_at);

-- ---------- payouts (created before commissions so the FK can point at it) ----------
CREATE TABLE IF NOT EXISTS public.influencer_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id uuid NOT NULL REFERENCES public.influencers(id) ON DELETE RESTRICT,
  gross_inr numeric(10,2) NOT NULL,
  tds_inr numeric(10,2) NOT NULL DEFAULT 0,
  net_inr numeric(10,2) NOT NULL,
  utr text NOT NULL,
  paid_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- commissions: one row per paid purchase ----------
CREATE TABLE IF NOT EXISTS public.influencer_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id uuid NOT NULL REFERENCES public.influencers(id) ON DELETE CASCADE,
  purchase_id uuid NOT NULL UNIQUE REFERENCES public.credit_purchases(id) ON DELETE CASCADE,
  buyer_user_id uuid NOT NULL,
  gross_inr integer NOT NULL,
  commission_pct numeric(5,2) NOT NULL,
  commission_inr numeric(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','paid','reversed')),
  purchased_at timestamptz NOT NULL,
  approve_after timestamptz NOT NULL,
  reversed_reason text,
  payout_id uuid REFERENCES public.influencer_payouts(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS influencer_commissions_inf_idx ON public.influencer_commissions(influencer_id, status);

-- ---------- RLS: no direct client access; everything goes through admin RPCs / service role ----------
ALTER TABLE public.influencer_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influencers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influencer_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influencer_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influencer_payouts ENABLE ROW LEVEL SECURITY;

-- ---------- helpers ----------
CREATE OR REPLACE FUNCTION public.influencer_assert_admin()
RETURNS void LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'admin only' USING ERRCODE = '42501';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.influencer_setting(_key text)
RETURNS numeric LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT value FROM public.influencer_settings WHERE key = _key;
$$;

-- Start of the current Indian financial year (1 April, IST), as timestamptz.
CREATE OR REPLACE FUNCTION public.influencer_fy_start()
RETURNS timestamptz LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT make_timestamptz(
    CASE WHEN extract(month FROM now() AT TIME ZONE 'Asia/Kolkata') >= 4
         THEN extract(year FROM now() AT TIME ZONE 'Asia/Kolkata')::int
         ELSE extract(year FROM now() AT TIME ZONE 'Asia/Kolkata')::int - 1 END,
    4, 1, 0, 0, 0, 'Asia/Kolkata');
$$;

-- ---------- admin: save an influencer (insert or update) ----------
CREATE OR REPLACE FUNCTION public.influencer_save(
  _id uuid, _name text, _handle text, _city text, _campaign text,
  _code text, _commission_pct numeric, _status text
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  PERFORM public.influencer_assert_admin();
  IF _id IS NULL THEN
    INSERT INTO public.influencers (name, handle, city, campaign, code, commission_pct, status)
    VALUES (trim(_name), nullif(trim(_handle), ''), nullif(trim(_city), ''),
            coalesce(nullif(trim(_campaign), ''), 'diwali-2026'),
            lower(trim(_code)), _commission_pct, coalesce(_status, 'active'))
    RETURNING id INTO v_id;
  ELSE
    UPDATE public.influencers SET
      name = trim(_name), handle = nullif(trim(_handle), ''), city = nullif(trim(_city), ''),
      campaign = coalesce(nullif(trim(_campaign), ''), campaign),
      commission_pct = _commission_pct, status = coalesce(_status, status)
    WHERE id = _id
    RETURNING id INTO v_id;
    IF v_id IS NULL THEN RAISE EXCEPTION 'influencer not found'; END IF;
  END IF;
  RETURN v_id;
END $$;

-- ---------- public: record a click on an influencer link ----------
CREATE OR REPLACE FUNCTION public.influencer_record_click(_code text, _visitor text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  SELECT id INTO v_id FROM public.influencers
  WHERE code = lower(trim(_code)) AND status = 'active';
  IF v_id IS NULL THEN RETURN false; END IF;
  INSERT INTO public.influencer_clicks (influencer_id, visitor_id)
  VALUES (v_id, left(_visitor, 64));
  RETURN true;
END $$;

-- ---------- admin: move matured, unreversed commissions to approved ----------
CREATE OR REPLACE FUNCTION public.influencer_approve_due()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer;
BEGIN
  PERFORM public.influencer_assert_admin();
  UPDATE public.influencer_commissions SET status = 'approved'
  WHERE status = 'pending' AND approve_after <= now();
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;

-- ---------- admin: reverse a commission (refund or cancellation) ----------
CREATE OR REPLACE FUNCTION public.influencer_reverse(_purchase_id uuid, _reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_status text;
BEGIN
  PERFORM public.influencer_assert_admin();
  SELECT status INTO v_status FROM public.influencer_commissions WHERE purchase_id = _purchase_id;
  IF v_status IS NULL THEN RAISE EXCEPTION 'no commission for this purchase'; END IF;
  IF v_status = 'paid' THEN
    RAISE EXCEPTION 'already paid out: deduct this amount from the next payout and record the reason';
  END IF;
  UPDATE public.influencer_commissions
  SET status = 'reversed', reversed_reason = coalesce(nullif(trim(_reason), ''), 'reversed by admin')
  WHERE purchase_id = _purchase_id;
END $$;

-- ---------- admin: pay all approved commissions for one influencer ----------
CREATE OR REPLACE FUNCTION public.influencer_mark_paid(_influencer_id uuid, _utr text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_gross numeric(10,2);
  v_ids uuid[];
  v_fy_paid numeric(10,2);
  v_rate numeric := public.influencer_setting('tds_rate_pct');
  v_threshold numeric := public.influencer_setting('tds_threshold_inr');
  v_tds numeric(10,2);
  v_payout_id uuid;
BEGIN
  PERFORM public.influencer_assert_admin();
  IF length(trim(coalesce(_utr, ''))) < 6 THEN RAISE EXCEPTION 'enter the bank UTR / reference'; END IF;

  SELECT coalesce(sum(commission_inr), 0), coalesce(array_agg(id), '{}')
    INTO v_gross, v_ids
  FROM public.influencer_commissions
  WHERE influencer_id = _influencer_id AND status = 'approved';
  IF cardinality(v_ids) = 0 THEN RAISE EXCEPTION 'nothing approved to pay'; END IF;

  SELECT coalesce(sum(gross_inr), 0) INTO v_fy_paid
  FROM public.influencer_payouts
  WHERE influencer_id = _influencer_id AND paid_at >= public.influencer_fy_start();

  -- Simplified: once the year's total payouts cross the threshold, TDS applies to this payout.
  -- Confirm with a CA (section, rate and threshold) before the first real payout.
  v_tds := CASE WHEN v_fy_paid + v_gross > v_threshold
                THEN round(v_gross * v_rate / 100, 2) ELSE 0 END;

  INSERT INTO public.influencer_payouts (influencer_id, gross_inr, tds_inr, net_inr, utr)
  VALUES (_influencer_id, v_gross, v_tds, v_gross - v_tds, trim(_utr))
  RETURNING id INTO v_payout_id;

  UPDATE public.influencer_commissions
  SET status = 'paid', payout_id = v_payout_id
  WHERE id = ANY(v_ids);

  RETURN jsonb_build_object('payout_id', v_payout_id, 'gross_inr', v_gross,
                            'tds_inr', v_tds, 'net_inr', v_gross - v_tds);
END $$;

-- ---------- admin: dashboard for all influencers ----------
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
  FOR r IN SELECT * FROM public.influencers ORDER BY created_at LOOP
    SELECT count(*) INTO v_clicks FROM public.influencer_clicks WHERE influencer_id = r.id;
    SELECT count(*), count(DISTINCT buyer_user_id), coalesce(sum(gross_inr), 0)
      INTO v_orders, v_buyers, v_gross
    FROM public.influencer_commissions WHERE influencer_id = r.id AND status <> 'reversed';
    SELECT coalesce(sum(commission_inr) FILTER (WHERE status = 'pending'), 0),
           coalesce(sum(commission_inr) FILTER (WHERE status = 'approved'), 0),
           coalesce(sum(commission_inr) FILTER (WHERE status = 'paid'), 0)
      INTO v_pending, v_approved, v_paid_gross
    FROM public.influencer_commissions WHERE influencer_id = r.id;
    SELECT coalesce(sum(gross_inr), 0), coalesce(sum(tds_inr), 0), coalesce(sum(net_inr), 0)
      INTO v_fy_paid, v_tds_paid, v_net_paid
    FROM public.influencer_payouts WHERE influencer_id = r.id;
    SELECT coalesce(sum(gross_inr), 0) INTO v_fy_paid FROM public.influencer_payouts
      WHERE influencer_id = r.id AND paid_at >= public.influencer_fy_start();
    v_tds_est := CASE WHEN v_fy_paid + v_approved > v_threshold
                      THEN round(v_approved * v_rate / 100, 2) ELSE 0 END;

    v_rows := v_rows || jsonb_build_object(
      'id', r.id, 'name', r.name, 'handle', r.handle, 'city', r.city, 'campaign', r.campaign,
      'code', r.code, 'commission_pct', r.commission_pct, 'status', r.status,
      'clicks', v_clicks,
      'buyers', v_buyers,
      'orders', v_orders,
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

-- ---------- admin: one influencer's buyers (emails masked) ----------
CREATE OR REPLACE FUNCTION public.influencer_detail(_influencer_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.influencer_assert_admin();
  RETURN jsonb_build_object(
    'buyers', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'commission_id', c.id, 'purchase_id', c.purchase_id,
        'purchased_at', c.purchased_at, 'pack', p.pack_id, 'credits', p.credits,
        'gross_inr', c.gross_inr, 'commission_pct', c.commission_pct,
        'commission_inr', c.commission_inr, 'status', c.status,
        'approve_after', c.approve_after, 'reversed_reason', c.reversed_reason,
        'buyer', left(split_part(u.email, '@', 1), 2) || '***@' || split_part(u.email, '@', 2)
      ) ORDER BY c.purchased_at DESC)
      FROM public.influencer_commissions c
      JOIN public.credit_purchases p ON p.id = c.purchase_id
      LEFT JOIN auth.users u ON u.id = c.buyer_user_id
      WHERE c.influencer_id = _influencer_id
    ), '[]'::jsonb),
    'clicks_by_day', coalesce((
      SELECT jsonb_agg(jsonb_build_object('day', d, 'clicks', n) ORDER BY d)
      FROM (SELECT (created_at AT TIME ZONE 'Asia/Kolkata')::date AS d, count(*) AS n
            FROM public.influencer_clicks WHERE influencer_id = _influencer_id
            GROUP BY 1) x
    ), '[]'::jsonb),
    'payouts', coalesce((
      SELECT jsonb_agg(jsonb_build_object('paid_at', paid_at, 'gross_inr', gross_inr,
        'tds_inr', tds_inr, 'net_inr', net_inr, 'utr', utr) ORDER BY paid_at DESC)
      FROM public.influencer_payouts WHERE influencer_id = _influencer_id
    ), '[]'::jsonb)
  );
END $$;

-- Only the RPCs are callable by signed-in users (they self-check admin). Public click endpoint is anon-callable.
REVOKE ALL ON FUNCTION public.influencer_assert_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.influencer_save(uuid, text, text, text, text, text, numeric, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.influencer_approve_due() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.influencer_reverse(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.influencer_mark_paid(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.influencer_dashboard() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.influencer_detail(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.influencer_record_click(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.influencer_save(uuid, text, text, text, text, text, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.influencer_approve_due() TO authenticated;
GRANT EXECUTE ON FUNCTION public.influencer_reverse(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.influencer_mark_paid(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.influencer_dashboard() TO authenticated;
GRANT EXECUTE ON FUNCTION public.influencer_detail(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.influencer_record_click(text, text) TO anon, authenticated;
