-- Websites and cards are priced and paid in credits only, and "Send all on WhatsApp" is charged in credits.
--
-- 1. ip_products.price_credits: the price people see and pay. Filled from the old rupee price at the
--    same rate the site already used (2.2 credits per rupee, rounded up), so nobody pays more or less.
--    price_inr stays as an internal value (the kit's design limits still read it). A product added
--    later without price_credits falls back to ip_credits_for_inr(price_inr).
-- 2. ip_pay_with_credits() charges price_credits.
-- 3. ip_bulk_sends + ip_bulk_recipients: one row per "Send all", and for automatic sends one row per
--    person. The charge and the job are written in one transaction (ip_bulk_send_start), so a failed
--    start never keeps credits. Automatic messages that fail are refunded (ip_bulk_send_finish).
--    Prices (keep src/lib/creditRate.ts in step):
--      from the sender's own WhatsApp: 1 credit per 10 people, rounded up
--      automatic, from the EZYOURLIFE WhatsApp number: 4 credits per person with a valid mobile number

-- ---------- 1. credit prices ----------
ALTER TABLE public.ip_products ADD COLUMN IF NOT EXISTS price_credits integer
  CHECK (price_credits IS NULL OR (price_credits >= 0 AND price_credits <= 1000000));
UPDATE public.ip_products SET price_credits = public.ip_credits_for_inr(price_inr) WHERE price_credits IS NULL;

CREATE OR REPLACE FUNCTION public.ip_product_credits(_prod public.ip_products)
RETURNS int LANGUAGE sql IMMUTABLE AS $$ SELECT COALESCE(_prod.price_credits, public.ip_credits_for_inr(_prod.price_inr)) $$;

-- ---------- 2. pay for a page with credits ----------
CREATE OR REPLACE FUNCTION public.ip_pay_with_credits(_uid uuid, _page_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _p public.ip_pages%ROWTYPE; _prod public.ip_products%ROWTYPE; _w public.credit_wallets%ROWTYPE;
  _need int; _use_promo int; _use_free int; _use_paid int; _pub jsonb; _order uuid;
BEGIN
  SELECT * INTO _p FROM public.ip_pages WHERE id = _page_id FOR UPDATE;
  IF NOT FOUND OR _p.owner_id <> _uid THEN RETURN jsonb_build_object('ok', false, 'reason', 'not_found'); END IF;
  IF _p.status = 'published' THEN RETURN jsonb_build_object('ok', true, 'slug', _p.slug, 'noop', true); END IF;
  SELECT * INTO _prod FROM public.ip_products WHERE id = _p.product_id;
  IF NOT FOUND OR NOT _prod.is_active THEN RETURN jsonb_build_object('ok', false, 'reason', 'unavailable'); END IF;
  _need := public.ip_product_credits(_prod);
  IF _need <= 0 THEN RETURN jsonb_build_object('ok', false, 'reason', 'free'); END IF;

  PERFORM public.ensure_wallet(_uid);
  SELECT * INTO _w FROM public.credit_wallets WHERE user_id = _uid FOR UPDATE;
  IF GREATEST(0, _w.promo_balance) + _w.free_balance + _w.paid_balance < _need THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'insufficient', 'credits_required', _need,
                              'balance', GREATEST(0, _w.promo_balance) + _w.free_balance + _w.paid_balance);
  END IF;
  _use_promo := LEAST(GREATEST(0, _w.promo_balance), _need);
  _use_free := LEAST(_w.free_balance, _need - _use_promo);
  _use_paid := _need - _use_promo - _use_free;

  UPDATE public.credit_wallets
    SET promo_balance = promo_balance - _use_promo, free_balance = free_balance - _use_free,
        paid_balance = paid_balance - _use_paid, updated_at = now()
    WHERE user_id = _uid;

  INSERT INTO public.ip_orders(user_id, page_id, product_id, inr_amount, status, paid_at, credits_charged)
    VALUES (_uid, _p.id, _prod.id, _prod.price_inr, 'credits', now(), _need) RETURNING id INTO _order; -- inr_amount kept as the reference value, as before

  INSERT INTO public.credit_ledger(user_id, delta, promo_delta, free_delta, paid_delta, reason, tool_id, metadata)
    VALUES (_uid, -_need, -_use_promo, -_use_free, -_use_paid, 'tool_run', 'page-' || _prod.id,
            jsonb_build_object('page_id', _p.id, 'order_id', _order));

  _pub := public.ip_publish_page(_p.id);
  IF NOT COALESCE((_pub->>'ok')::boolean, false) THEN
    RAISE EXCEPTION 'publish failed: %', COALESCE(_pub->>'reason', 'unknown'); -- rolls the charge back
  END IF;
  RETURN jsonb_build_object('ok', true, 'slug', _pub->>'slug', 'charged', _need, 'promo_used', _use_promo, 'free_used', _use_free, 'paid_used', _use_paid);
END;
$function$;
REVOKE EXECUTE ON FUNCTION public.ip_pay_with_credits(uuid, uuid) FROM PUBLIC, anon, authenticated;

-- ---------- 3. Send all on WhatsApp ----------
CREATE TABLE IF NOT EXISTS public.ip_bulk_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  page_id uuid NOT NULL REFERENCES public.ip_pages(id) ON DELETE CASCADE,
  mode text NOT NULL CHECK (mode IN ('queue', 'auto')),
  lang text NOT NULL DEFAULT 'en',
  people integer NOT NULL CHECK (people > 0 AND people <= 2000),
  credits_charged integer NOT NULL DEFAULT 0,
  promo_used integer NOT NULL DEFAULT 0,
  free_used integer NOT NULL DEFAULT 0,
  paid_used integer NOT NULL DEFAULT 0,
  credits_refunded integer NOT NULL DEFAULT 0,
  sent integer NOT NULL DEFAULT 0,
  failed integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'sending' CHECK (status IN ('sending', 'done')),
  consent_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);
CREATE INDEX IF NOT EXISTS ip_bulk_sends_owner_idx ON public.ip_bulk_sends(owner_id, created_at DESC);
ALTER TABLE public.ip_bulk_sends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ip_bulk_sends: owner reads" ON public.ip_bulk_sends FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Only automatic sends store people (the server has to message them). Queue sends store only the count.
CREATE TABLE IF NOT EXISTS public.ip_bulk_recipients (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  send_id uuid NOT NULL REFERENCES public.ip_bulk_sends(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 30),
  phone text NOT NULL CHECK (phone ~ '^[0-9]{11,15}$'),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'working', 'sent', 'failed')),
  error text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ip_bulk_recipients_pending_idx ON public.ip_bulk_recipients(send_id, status, id);
ALTER TABLE public.ip_bulk_recipients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ip_bulk_recipients: owner reads" ON public.ip_bulk_recipients FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.ip_bulk_sends s WHERE s.id = send_id AND (s.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

CREATE OR REPLACE FUNCTION public.ip_bulk_send_price(_mode text, _people int)
RETURNS int LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN _people <= 0 THEN 0
              WHEN _mode = 'auto' THEN _people * 4
              ELSE ceil(_people / 10.0)::int END
$$;

-- Charges and creates the job in one go. _people: [{name, phone}] (phones as digits, 91XXXXXXXXXX).
-- Queue mode only needs the count, so names and numbers are not stored for it.
CREATE OR REPLACE FUNCTION public.ip_bulk_send_start(_uid uuid, _page_id uuid, _mode text, _lang text, _count int, _people jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _p public.ip_pages%ROWTYPE; _w public.credit_wallets%ROWTYPE;
  _n int; _need int; _use_promo int; _use_free int; _use_paid int; _id uuid;
BEGIN
  IF _mode NOT IN ('queue', 'auto') THEN RETURN jsonb_build_object('ok', false, 'reason', 'bad_mode'); END IF;
  SELECT * INTO _p FROM public.ip_pages WHERE id = _page_id;
  IF NOT FOUND OR _p.owner_id <> _uid THEN RETURN jsonb_build_object('ok', false, 'reason', 'not_found'); END IF;
  IF _p.status <> 'published' THEN RETURN jsonb_build_object('ok', false, 'reason', 'not_published'); END IF;

  _n := CASE WHEN _mode = 'auto' THEN COALESCE(jsonb_array_length(_people), 0) ELSE _count END;
  IF _n IS NULL OR _n < 1 OR _n > 2000 THEN RETURN jsonb_build_object('ok', false, 'reason', 'bad_count'); END IF;
  _need := public.ip_bulk_send_price(_mode, _n);

  PERFORM public.ensure_wallet(_uid);
  SELECT * INTO _w FROM public.credit_wallets WHERE user_id = _uid FOR UPDATE;
  IF GREATEST(0, _w.promo_balance) + _w.free_balance + _w.paid_balance < _need THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'insufficient', 'credits_required', _need,
                              'balance', GREATEST(0, _w.promo_balance) + _w.free_balance + _w.paid_balance);
  END IF;
  _use_promo := LEAST(GREATEST(0, _w.promo_balance), _need);
  _use_free := LEAST(_w.free_balance, _need - _use_promo);
  _use_paid := _need - _use_promo - _use_free;

  UPDATE public.credit_wallets
    SET promo_balance = promo_balance - _use_promo, free_balance = free_balance - _use_free,
        paid_balance = paid_balance - _use_paid, updated_at = now()
    WHERE user_id = _uid;

  INSERT INTO public.ip_bulk_sends(owner_id, page_id, mode, lang, people, credits_charged, promo_used, free_used, paid_used, consent_at, status, finished_at)
    VALUES (_uid, _p.id, _mode, left(COALESCE(_lang, 'en'), 8), _n, _need, _use_promo, _use_free, _use_paid, now(),
            CASE WHEN _mode = 'queue' THEN 'done' ELSE 'sending' END, CASE WHEN _mode = 'queue' THEN now() END)
    RETURNING id INTO _id;

  IF _mode = 'auto' THEN
    INSERT INTO public.ip_bulk_recipients(send_id, name, phone)
      SELECT _id, left(trim(x->>'name'), 30), x->>'phone' FROM jsonb_array_elements(_people) x;
  END IF;

  INSERT INTO public.credit_ledger(user_id, delta, promo_delta, free_delta, paid_delta, reason, tool_id, metadata)
    VALUES (_uid, -_need, -_use_promo, -_use_free, -_use_paid, 'tool_run', 'whatsapp-send-all',
            jsonb_build_object('page_id', _p.id, 'send_id', _id, 'mode', _mode, 'people', _n));

  RETURN jsonb_build_object('ok', true, 'send_id', _id, 'charged', _need, 'people', _n);
END;
$function$;

-- The worker takes the next batch of an automatic send (rows stuck in 'working' for 10 minutes are retried).
CREATE OR REPLACE FUNCTION public.ip_bulk_claim(_send_id uuid, _limit int)
RETURNS SETOF public.ip_bulk_recipients
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  UPDATE public.ip_bulk_recipients r SET status = 'working', updated_at = now()
  WHERE r.id IN (
    SELECT id FROM public.ip_bulk_recipients
    WHERE send_id = _send_id AND (status = 'pending' OR (status = 'working' AND updated_at < now() - interval '10 minutes'))
    ORDER BY id LIMIT _limit FOR UPDATE SKIP LOCKED)
  RETURNING r.*;
$$;

-- Closes an automatic send once nobody is left: counts it and gives back 4 credits for each failed
-- message, to the buckets they came from (bought first, then free, then promo).
CREATE OR REPLACE FUNCTION public.ip_bulk_send_finish(_send_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _s public.ip_bulk_sends%ROWTYPE; _sent int; _failed int; _left int; _back int; _bp int; _bf int; _bpr int;
BEGIN
  SELECT * INTO _s FROM public.ip_bulk_sends WHERE id = _send_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'reason', 'not_found'); END IF;
  SELECT count(*) FILTER (WHERE status = 'sent'), count(*) FILTER (WHERE status = 'failed'),
         count(*) FILTER (WHERE status IN ('pending', 'working'))
    INTO _sent, _failed, _left FROM public.ip_bulk_recipients WHERE send_id = _send_id;
  UPDATE public.ip_bulk_sends SET sent = _sent, failed = _failed WHERE id = _send_id;
  IF _left > 0 OR _s.status = 'done' THEN RETURN jsonb_build_object('ok', true, 'sent', _sent, 'failed', _failed, 'left', _left, 'done', _s.status = 'done'); END IF;

  _back := LEAST(_s.credits_charged, public.ip_bulk_send_price('auto', _failed));
  _bp := LEAST(_s.paid_used, _back);
  _bf := LEAST(_s.free_used, _back - _bp);
  _bpr := _back - _bp - _bf;
  IF _back > 0 THEN
    UPDATE public.credit_wallets
      SET paid_balance = paid_balance + _bp, free_balance = free_balance + _bf, promo_balance = promo_balance + _bpr, updated_at = now()
      WHERE user_id = _s.owner_id;
    INSERT INTO public.credit_ledger(user_id, delta, promo_delta, free_delta, paid_delta, reason, tool_id, metadata)
      VALUES (_s.owner_id, _back, _bpr, _bf, _bp, 'refund', 'whatsapp-send-all',
              jsonb_build_object('send_id', _s.id, 'failed', _failed));
  END IF;
  UPDATE public.ip_bulk_sends SET status = 'done', finished_at = now(), credits_refunded = _back WHERE id = _send_id;
  -- Names and numbers are only needed while sending.
  UPDATE public.ip_bulk_recipients SET phone = '00000000000', name = '-' WHERE send_id = _send_id AND status = 'sent';
  RETURN jsonb_build_object('ok', true, 'sent', _sent, 'failed', _failed, 'left', 0, 'done', true, 'refunded', _back);
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.ip_bulk_send_start(uuid, uuid, text, text, int, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ip_bulk_claim(uuid, int) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ip_bulk_send_finish(uuid) FROM PUBLIC, anon, authenticated;
