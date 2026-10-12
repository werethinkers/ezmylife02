-- Admin-approved refunds for credit purchases.
--
-- Rules this encodes:
--   1. A refund NEVER happens automatically. A request is created, an admin
--      approves it, and only then may the refund be sent to Razorpay.
--   2. The refundable amount is the UNUSED part of the pack. Credits already
--      spent are deducted. Attribution is FIFO over paid credits, so a user
--      with two packs has the older pack consumed first.
--   3. On processing: the unused credits are removed from the wallet, a
--      'refund' ledger row is written, and any influencer commission on that
--      purchase is reversed (or flagged if it was already paid out).
--
-- No money moves from inside the database. The refund-process edge function
-- calls Razorpay only for a request an admin has already approved.

CREATE TABLE IF NOT EXISTS public.refund_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id uuid NOT NULL REFERENCES public.credit_purchases(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  reason text,
  status text NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested','approved','rejected','processed','failed')),
  -- snapshot at request time, for the audit trail
  credits_purchased int NOT NULL,
  credits_used int NOT NULL,
  credits_unused int NOT NULL,
  refundable_inr numeric(10,2) NOT NULL,
  -- recomputed at processing time (credits can be spent while a request waits)
  processed_credits_unused int,
  processed_inr numeric(10,2),
  razorpay_refund_id text UNIQUE,
  admin_note text,
  decided_by uuid,
  decided_at timestamptz,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
-- At most one open request per purchase.
CREATE UNIQUE INDEX IF NOT EXISTS refund_requests_open_idx
  ON public.refund_requests(purchase_id)
  WHERE status IN ('requested','approved','processed');
CREATE INDEX IF NOT EXISTS refund_requests_status_idx ON public.refund_requests(status, created_at DESC);

ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "refund_requests: own or admin reads" ON public.refund_requests
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

-- ---------- quote: how much of a purchase is unused, FIFO over paid credits ----------
-- granted_before = paid credits granted by purchases that settled strictly earlier.
-- spent_total    = all paid credits ever spent by this user.
-- Credits consumed out of THIS purchase = clamp(spent_total - granted_before, 0, credits).
CREATE OR REPLACE FUNCTION public.refund_quote(_purchase_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  p public.credit_purchases%ROWTYPE;
  v_granted_before bigint;
  v_spent_total bigint;
  v_used int;
  v_unused int;
  v_inr numeric(10,2);
BEGIN
  SELECT * INTO p FROM public.credit_purchases WHERE id = _purchase_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'purchase not found'; END IF;
  IF NOT (auth.uid() = p.user_id OR public.has_role(auth.uid(), 'admin'::app_role)) THEN
    RAISE EXCEPTION 'not allowed' USING ERRCODE = '42501';
  END IF;
  IF p.status <> 'paid' THEN RAISE EXCEPTION 'purchase is not paid'; END IF;

  SELECT coalesce(sum(credits), 0) INTO v_granted_before
  FROM public.credit_purchases
  WHERE user_id = p.user_id AND status = 'paid'
    AND (paid_at < p.paid_at OR (paid_at = p.paid_at AND id < p.id));

  SELECT coalesce(-sum(paid_delta), 0) INTO v_spent_total
  FROM public.credit_ledger
  WHERE user_id = p.user_id AND paid_delta < 0;

  v_used := LEAST(GREATEST(v_spent_total - v_granted_before, 0), p.credits)::int;
  v_unused := p.credits - v_used;
  v_inr := round(p.inr_amount::numeric * v_unused / NULLIF(p.credits, 0), 2);

  RETURN jsonb_build_object(
    'purchase_id', p.id, 'user_id', p.user_id, 'pack_id', p.pack_id,
    'paid_inr', p.inr_amount, 'credits_purchased', p.credits,
    'credits_used', v_used, 'credits_unused', v_unused,
    'per_credit_inr', round(p.inr_amount::numeric / NULLIF(p.credits, 0), 4),
    'used_value_inr', round(p.inr_amount::numeric - v_inr, 2),
    'refundable_inr', v_inr,
    'razorpay_payment_id', p.razorpay_payment_id,
    'paid_at', p.paid_at
  );
END $$;

-- ---------- a buyer (or an admin on their behalf) opens a request ----------
CREATE OR REPLACE FUNCTION public.refund_request_create(_purchase_id uuid, _reason text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE q jsonb; v_id uuid;
BEGIN
  q := public.refund_quote(_purchase_id);  -- also enforces owner-or-admin
  IF EXISTS (SELECT 1 FROM public.refund_requests
             WHERE purchase_id = _purchase_id AND status IN ('requested','approved','processed')) THEN
    RAISE EXCEPTION 'a refund request for this purchase already exists';
  END IF;
  INSERT INTO public.refund_requests
    (purchase_id, user_id, reason, credits_purchased, credits_used, credits_unused, refundable_inr)
  VALUES (_purchase_id, (q->>'user_id')::uuid, nullif(trim(_reason), ''),
          (q->>'credits_purchased')::int, (q->>'credits_used')::int,
          (q->>'credits_unused')::int, (q->>'refundable_inr')::numeric)
  RETURNING id INTO v_id;
  RETURN v_id;
END $$;

-- ---------- admin: the queue, with a live re-quote per row ----------
CREATE OR REPLACE FUNCTION public.refund_admin_list(_status text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.influencer_assert_admin();
  RETURN coalesce((
    SELECT jsonb_agg(jsonb_build_object(
      'id', r.id, 'purchase_id', r.purchase_id, 'status', r.status,
      'reason', r.reason, 'admin_note', r.admin_note,
      'created_at', r.created_at, 'decided_at', r.decided_at, 'processed_at', r.processed_at,
      'razorpay_refund_id', r.razorpay_refund_id,
      'buyer', left(split_part(u.email, '@', 1), 2) || '***@' || split_part(u.email, '@', 2),
      'pack_id', p.pack_id, 'paid_inr', p.inr_amount, 'paid_at', p.paid_at,
      'credits_purchased', r.credits_purchased,
      'credits_used_at_request', r.credits_used,
      'refundable_at_request_inr', r.refundable_inr,
      'processed_inr', r.processed_inr,
      -- live figures, so an admin approves against today's usage
      'live', public.refund_quote(r.purchase_id),
      'commission_status', (SELECT c.status FROM public.influencer_commissions c
                            WHERE c.purchase_id = r.purchase_id),
      'commission_inr', (SELECT c.commission_inr FROM public.influencer_commissions c
                         WHERE c.purchase_id = r.purchase_id)
    ) ORDER BY r.created_at DESC)
    FROM public.refund_requests r
    JOIN public.credit_purchases p ON p.id = r.purchase_id
    LEFT JOIN auth.users u ON u.id = r.user_id
    WHERE _status IS NULL OR r.status = _status
  ), '[]'::jsonb);
END $$;

-- ---------- admin: approve (authorises the payout; sends no money) ----------
CREATE OR REPLACE FUNCTION public.refund_approve(_request_id uuid, _note text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.refund_requests%ROWTYPE; q jsonb;
BEGIN
  PERFORM public.influencer_assert_admin();
  SELECT * INTO r FROM public.refund_requests WHERE id = _request_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'request not found'; END IF;
  IF r.status <> 'requested' THEN RAISE EXCEPTION 'request is % , only a requested one can be approved', r.status; END IF;

  q := public.refund_quote(r.purchase_id);
  IF (q->>'refundable_inr')::numeric <= 0 THEN
    RAISE EXCEPTION 'nothing refundable: all % credits have been used', r.credits_purchased;
  END IF;

  UPDATE public.refund_requests
  SET status = 'approved', admin_note = nullif(trim(_note), ''),
      decided_by = auth.uid(), decided_at = now(),
      credits_used = (q->>'credits_used')::int,
      credits_unused = (q->>'credits_unused')::int,
      refundable_inr = (q->>'refundable_inr')::numeric
  WHERE id = _request_id;

  RETURN jsonb_build_object('ok', true, 'approved_inr', (q->>'refundable_inr')::numeric,
                            'credits_to_remove', (q->>'credits_unused')::int);
END $$;

-- ---------- admin: reject ----------
CREATE OR REPLACE FUNCTION public.refund_reject(_request_id uuid, _note text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_status text;
BEGIN
  PERFORM public.influencer_assert_admin();
  SELECT status INTO v_status FROM public.refund_requests WHERE id = _request_id FOR UPDATE;
  IF v_status IS NULL THEN RAISE EXCEPTION 'request not found'; END IF;
  IF v_status NOT IN ('requested','approved') THEN
    RAISE EXCEPTION 'request is %, cannot reject', v_status;
  END IF;
  UPDATE public.refund_requests
  SET status = 'rejected', admin_note = nullif(trim(_note), ''),
      decided_by = auth.uid(), decided_at = now()
  WHERE id = _request_id;
END $$;

-- ---------- service role: claim an approved request just before calling Razorpay ----------
-- Returns the amount to refund and locks the row out of a second attempt.
CREATE OR REPLACE FUNCTION public.refund_claim_for_processing(_request_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.refund_requests%ROWTYPE; q jsonb; v_unused int; v_inr numeric(10,2);
BEGIN
  SELECT * INTO r FROM public.refund_requests WHERE id = _request_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'reason', 'not_found'); END IF;
  IF r.status = 'processed' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_processed',
                              'razorpay_refund_id', r.razorpay_refund_id);
  END IF;
  IF r.status <> 'approved' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_approved', 'status', r.status);
  END IF;

  q := public.refund_quote(r.purchase_id);
  v_unused := (q->>'credits_unused')::int;
  v_inr := (q->>'refundable_inr')::numeric;
  IF v_inr <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'nothing_refundable');
  END IF;

  RETURN jsonb_build_object('ok', true, 'request_id', r.id, 'purchase_id', r.purchase_id,
    'user_id', r.user_id, 'razorpay_payment_id', q->>'razorpay_payment_id',
    'credits_unused', v_unused, 'refund_inr', v_inr,
    'credits_used', (q->>'credits_used')::int, 'paid_inr', (q->>'paid_inr')::int);
END $$;

-- ---------- service role: settle a refund that Razorpay has accepted ----------
-- Removes the unused credits, writes the ledger row, reverses the commission.
CREATE OR REPLACE FUNCTION public.refund_mark_processed(
  _request_id uuid, _refund_id text, _amount_inr numeric, _credits_removed int
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r public.refund_requests%ROWTYPE;
  v_removed int;
  v_commission text;
BEGIN
  SELECT * INTO r FROM public.refund_requests WHERE id = _request_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'request not found'; END IF;
  IF r.status = 'processed' THEN
    RETURN jsonb_build_object('ok', true, 'noop', true);
  END IF;

  PERFORM public.ensure_wallet(r.user_id);
  -- Never drive the balance negative: if the buyer spent some of it meanwhile,
  -- remove only what is actually there.
  SELECT LEAST(GREATEST(_credits_removed, 0), paid_balance) INTO v_removed
  FROM public.credit_wallets WHERE user_id = r.user_id FOR UPDATE;

  UPDATE public.credit_wallets
  SET paid_balance = paid_balance - v_removed, updated_at = now()
  WHERE user_id = r.user_id;

  INSERT INTO public.credit_ledger (user_id, delta, paid_delta, reason, cost_inr, metadata)
  VALUES (r.user_id, -v_removed, -v_removed, 'refund', _amount_inr,
          jsonb_build_object('refund_request_id', r.id, 'purchase_id', r.purchase_id,
                             'razorpay_refund_id', _refund_id,
                             'credits_requested_removal', _credits_removed));

  UPDATE public.refund_requests
  SET status = 'processed', razorpay_refund_id = _refund_id,
      processed_inr = _amount_inr, processed_credits_unused = v_removed,
      processed_at = now()
  WHERE id = _request_id;

  -- Influencer commission on a refunded sale.
  SELECT status INTO v_commission FROM public.influencer_commissions
  WHERE purchase_id = r.purchase_id FOR UPDATE;
  IF v_commission IN ('pending','approved') THEN
    UPDATE public.influencer_commissions
    SET status = 'reversed', reversed_reason = 'buyer refund approved by admin'
    WHERE purchase_id = r.purchase_id;
  ELSIF v_commission = 'paid' THEN
    UPDATE public.influencer_commissions
    SET reversed_reason = 'refunded AFTER payout — deduct from the next payout'
    WHERE purchase_id = r.purchase_id;
  END IF;

  RETURN jsonb_build_object('ok', true, 'credits_removed', v_removed,
                            'amount_inr', _amount_inr, 'commission_was', v_commission);
END $$;

CREATE OR REPLACE FUNCTION public.refund_mark_failed(_request_id uuid, _note text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.refund_requests
  SET status = 'failed', admin_note = left(coalesce(_note, 'gateway error'), 500)
  WHERE id = _request_id AND status = 'approved';
END $$;

-- ---------- grants ----------
REVOKE ALL ON FUNCTION public.refund_quote(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.refund_request_create(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.refund_admin_list(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.refund_approve(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.refund_reject(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.refund_claim_for_processing(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.refund_mark_processed(uuid, text, numeric, int) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.refund_mark_failed(uuid, text) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.refund_quote(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.refund_request_create(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.refund_admin_list(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.refund_approve(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.refund_reject(uuid, text) TO authenticated;
-- Only the edge function (service role) may claim and settle.
GRANT EXECUTE ON FUNCTION public.refund_claim_for_processing(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.refund_mark_processed(uuid, text, numeric, int) TO service_role;
GRANT EXECUTE ON FUNCTION public.refund_mark_failed(uuid, text) TO service_role;
