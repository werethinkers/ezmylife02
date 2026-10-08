-- Harden credit purchases against applying one Razorpay payment to another purchase.
-- 1. A Razorpay payment can settle at most one purchase.
-- 2. apply_credit_purchase now requires the order id and checks it matches the row.

ALTER TABLE public.credit_purchases
  ADD CONSTRAINT credit_purchases_razorpay_payment_id_key UNIQUE (razorpay_payment_id);

DROP FUNCTION IF EXISTS public.apply_credit_purchase(uuid, text);

CREATE OR REPLACE FUNCTION public.apply_credit_purchase(_purchase_id uuid, _order_id text, _payment_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _p public.credit_purchases%ROWTYPE;
BEGIN
  IF _order_id IS NULL OR _order_id = '' OR _payment_id IS NULL OR _payment_id = '' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'missing_ids');
  END IF;

  SELECT * INTO _p FROM public.credit_purchases WHERE id=_purchase_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'reason', 'not_found'); END IF;
  IF _p.razorpay_order_id IS DISTINCT FROM _order_id THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'order_mismatch');
  END IF;

  IF _p.status = 'paid' THEN
    IF _p.razorpay_payment_id = _payment_id THEN
      RETURN jsonb_build_object('ok', true, 'noop', true);
    END IF;
    RETURN jsonb_build_object('ok', false, 'reason', 'already_paid_with_other_payment');
  END IF;

  IF EXISTS (SELECT 1 FROM public.credit_purchases WHERE razorpay_payment_id=_payment_id AND id<>_purchase_id) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'payment_already_used');
  END IF;

  PERFORM public.ensure_wallet(_p.user_id);
  UPDATE public.credit_wallets
    SET paid_balance = paid_balance + _p.credits, updated_at = now()
    WHERE user_id = _p.user_id;

  UPDATE public.credit_purchases
    SET status='paid', paid_at=now(), razorpay_payment_id=_payment_id
    WHERE id=_purchase_id;

  INSERT INTO public.credit_ledger(user_id, delta, paid_delta, reason, metadata)
    VALUES (_p.user_id, _p.credits, _p.credits, 'purchase',
            jsonb_build_object('purchase_id', _purchase_id, 'inr_amount', _p.inr_amount, 'pack_id', _p.pack_id,
                               'razorpay_order_id', _order_id, 'razorpay_payment_id', _payment_id));

  RETURN jsonb_build_object('ok', true, 'credits', _p.credits);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.apply_credit_purchase(uuid, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_credit_purchase(uuid, text, text) TO service_role;
