-- Visiting-card promo: a QR/code on a printed card gives 5,000 promo credits, once, to one account.
--
-- Promo credits are a third bucket (credit_wallets.promo_balance) spent BEFORE free and bought credits.
-- To keep AI cost bounded, a person may spend promo credits on any one app at most `promo_per_app_limit`
-- times (default 3). A "use" is one successful run, so in Bulk Mode each file is one use. After that the app
-- needs free or bought credits. Developer apps (dev-*) are never paid for with promo credits.
-- Everything else in start_tool_run / complete_tool_run behaves exactly as in 20261013100000.

ALTER TABLE public.credit_wallets ADD COLUMN IF NOT EXISTS promo_balance int NOT NULL DEFAULT 0;
ALTER TABLE public.credit_wallets ADD COLUMN IF NOT EXISTS promo_per_app_limit int NOT NULL DEFAULT 3;
ALTER TABLE public.tool_runs ADD COLUMN IF NOT EXISTS promo_used int NOT NULL DEFAULT 0;
ALTER TABLE public.credit_ledger ADD COLUMN IF NOT EXISTS promo_delta int NOT NULL DEFAULT 0;

-- How many times each person has spent promo credits on each app.
CREATE TABLE IF NOT EXISTS public.promo_app_uses (
  user_id uuid NOT NULL,
  tool_id text NOT NULL,
  uses int NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, tool_id)
);
ALTER TABLE public.promo_app_uses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own promo uses" ON public.promo_app_uses FOR SELECT USING (auth.uid() = user_id);

-- Cards. kind 'unique' = one code per printed card (one claim in total); 'shared' = one code on many cards
-- (each account can still claim only once). expires_at is optional.
CREATE TABLE IF NOT EXISTS public.card_promos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  kind text NOT NULL DEFAULT 'unique' CHECK (kind IN ('unique', 'shared')),
  credits int NOT NULL DEFAULT 5000 CHECK (credits > 0),
  per_app_limit int NOT NULL DEFAULT 3 CHECK (per_app_limit > 0),
  label text,
  expires_at timestamptz,
  max_claims int,
  claim_count int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.card_promos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage card promos" ON public.card_promos FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- One claim per account, ever (so many cards cannot be stacked on one account).
CREATE TABLE IF NOT EXISTS public.card_promo_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_id uuid NOT NULL REFERENCES public.card_promos(id),
  user_id uuid NOT NULL UNIQUE,
  credits int NOT NULL,
  claimed_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.card_promo_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own card claim" ON public.card_promo_claims FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view card claims" ON public.card_promo_claims FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Promo credits this person can spend on this app right now (0 once the per-app limit is used).
CREATE OR REPLACE FUNCTION public.promo_available(_uid uuid, _tool_id text)
RETURNS int
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT CASE
    WHEN _tool_id LIKE 'dev-%' THEN 0
    WHEN COALESCE(u.uses, 0) >= w.promo_per_app_limit THEN 0
    ELSE GREATEST(0, w.promo_balance)
  END
  FROM public.credit_wallets w
  LEFT JOIN public.promo_app_uses u ON u.user_id = w.user_id AND u.tool_id = _tool_id
  WHERE w.user_id = _uid;
$$;

-- How many more runs of an app (at `_per` credits) promo credits can pay for in full. Used by Bulk Mode.
CREATE OR REPLACE FUNCTION public.promo_runs_affordable(_uid uuid, _tool_id text, _per int)
RETURNS int
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE((
    SELECT CASE
      WHEN _tool_id LIKE 'dev-%' THEN 0
      ELSE GREATEST(0, LEAST(w.promo_per_app_limit - COALESCE(u.uses, 0), w.promo_balance / GREATEST(1, _per)))
    END
    FROM public.credit_wallets w
    LEFT JOIN public.promo_app_uses u ON u.user_id = w.user_id AND u.tool_id = _tool_id
    WHERE w.user_id = _uid
  ), 0);
$$;

-- Same as 20261013100000, plus: promo credits (within the per-app limit) count towards what can be paid.
CREATE OR REPLACE FUNCTION public.start_tool_run(_uid uuid, _tool_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE _credits int; _cost numeric; _free int; _paid int; _promo int; _run_id uuid; _img boolean; _capped boolean := false;
BEGIN
  PERFORM public.ensure_wallet(_uid);
  SELECT credit_cost, cost_inr, is_image INTO _credits, _cost, _img FROM public.tool_pricing WHERE tool_id = _tool_id;
  _credits := GREATEST(1, COALESCE(_credits, 1)); _cost := COALESCE(_cost, 0.30); -- no app is free
  SELECT free_balance, paid_balance INTO _free, _paid FROM public.credit_wallets WHERE user_id = _uid;
  _promo := COALESCE(public.promo_available(_uid, _tool_id), 0);
  IF COALESCE(_img, false) AND public.free_image_runs_used(_uid) >= 4 THEN
    _capped := _free > 0;
    _free := 0;
  END IF;
  IF (_free + _paid + _promo) < _credits THEN
    RETURN jsonb_build_object('ok', false, 'reason', CASE WHEN _capped THEN 'free_image_limit' ELSE 'insufficient' END,
                              'credits_required', _credits, 'balance', _free + _paid + _promo);
  END IF;
  INSERT INTO public.tool_runs(user_id, tool_id, credits_quoted, cost_inr) VALUES (_uid, _tool_id, _credits, _cost) RETURNING id INTO _run_id;
  RETURN jsonb_build_object('ok', true, 'run_id', _run_id, 'credits_required', _credits, 'cost_inr', _cost);
END;
$function$;

-- Same as 20261013100000, plus: a run is paid with promo credits first (if within the per-app limit),
-- then free credits, then bought credits. Using any promo credits on an app counts as one use of it.
CREATE OR REPLACE FUNCTION public.complete_tool_run(_uid uuid, _run_id uuid, _success boolean, _error text DEFAULT NULL::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _run public.tool_runs%ROWTYPE;
  _free int; _paid int; _promo int; _need int;
  _use_promo int := 0; _use_free int := 0; _use_paid int := 0;
BEGIN
  SELECT * INTO _run FROM public.tool_runs WHERE id = _run_id AND user_id = _uid FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'reason', 'not_found'); END IF;
  IF _run.status <> 'started' THEN RETURN jsonb_build_object('ok', true, 'noop', true); END IF;

  IF NOT _success THEN
    UPDATE public.tool_runs SET status='failed', finished_at=now(), error=_error WHERE id=_run_id;
    RETURN jsonb_build_object('ok', true, 'charged', 0);
  END IF;

  IF COALESCE(_run.credits_quoted, 0) = 0 THEN
    UPDATE public.tool_runs SET status='succeeded', finished_at=now(), credits_charged=0 WHERE id=_run_id;
    PERFORM public.grant_first_action_bonus(_uid);
    RETURN jsonb_build_object('ok', true, 'charged', 0, 'free_tool', true);
  END IF;

  SELECT free_balance, paid_balance INTO _free, _paid FROM public.credit_wallets WHERE user_id=_uid FOR UPDATE;
  _promo := COALESCE(public.promo_available(_uid, _run.tool_id), 0);
  -- Free credits do not pay for AI images once this person has had 4 that way.
  IF EXISTS (SELECT 1 FROM public.tool_pricing WHERE tool_id = _run.tool_id AND is_image)
     AND public.free_image_runs_used(_uid) >= 4 THEN
    _free := 0;
  END IF;
  _need := _run.credits_quoted;
  _use_promo := LEAST(_promo, _need);
  _use_free := LEAST(_free, _need - _use_promo);
  _use_paid := _need - _use_promo - _use_free;
  IF (_promo + _free + _paid) < _need THEN
    UPDATE public.tool_runs SET status='failed', finished_at=now(), error='insufficient_at_complete' WHERE id=_run_id;
    RETURN jsonb_build_object('ok', false, 'reason', 'insufficient');
  END IF;

  UPDATE public.credit_wallets
    SET promo_balance = promo_balance - _use_promo,
        free_balance = free_balance - _use_free,
        paid_balance = paid_balance - _use_paid,
        updated_at = now()
    WHERE user_id = _uid;

  IF _use_promo > 0 THEN
    INSERT INTO public.promo_app_uses(user_id, tool_id, uses) VALUES (_uid, _run.tool_id, 1)
      ON CONFLICT (user_id, tool_id) DO UPDATE SET uses = public.promo_app_uses.uses + 1;
  END IF;

  UPDATE public.tool_runs
    SET status='succeeded', finished_at=now(),
        credits_charged=_need, promo_used=_use_promo, free_used=_use_free, paid_used=_use_paid
    WHERE id=_run_id;

  INSERT INTO public.credit_ledger(user_id, delta, promo_delta, free_delta, paid_delta, reason, tool_id, run_id, cost_inr)
    VALUES (_uid, -_need, -_use_promo, -_use_free, -_use_paid, 'tool_run', _run.tool_id, _run_id, _run.cost_inr);

  PERFORM public.grant_first_action_bonus(_uid);

  RETURN jsonb_build_object('ok', true, 'charged', _need, 'promo_used', _use_promo, 'free_used', _use_free, 'paid_used', _use_paid);
END;
$function$;

-- Claim a card. Called by the claim-card-promo function with the signed-in user's id.
CREATE OR REPLACE FUNCTION public.claim_card_promo(_uid uuid, _code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE _p public.card_promos%ROWTYPE; _norm text := upper(regexp_replace(COALESCE(_code, ''), '[^A-Za-z0-9]', '', 'g'));
BEGIN
  PERFORM public.ensure_wallet(_uid);
  -- Codes are stored as XXXX-XXXX-XXXX; compare without dashes so typing is forgiving.
  SELECT * INTO _p FROM public.card_promos WHERE upper(replace(code, '-', '')) = _norm FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'reason', 'invalid'); END IF;
  IF EXISTS (SELECT 1 FROM public.card_promo_claims WHERE user_id = _uid) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_claimed_by_you');
  END IF;
  IF NOT _p.is_active THEN RETURN jsonb_build_object('ok', false, 'reason', 'inactive'); END IF;
  IF _p.expires_at IS NOT NULL AND _p.expires_at < now() THEN RETURN jsonb_build_object('ok', false, 'reason', 'expired'); END IF;
  IF _p.kind = 'unique' AND _p.claim_count >= 1 THEN RETURN jsonb_build_object('ok', false, 'reason', 'used'); END IF;
  IF _p.max_claims IS NOT NULL AND _p.claim_count >= _p.max_claims THEN RETURN jsonb_build_object('ok', false, 'reason', 'full'); END IF;

  INSERT INTO public.card_promo_claims(promo_id, user_id, credits) VALUES (_p.id, _uid, _p.credits);
  UPDATE public.card_promos SET claim_count = claim_count + 1 WHERE id = _p.id;
  UPDATE public.credit_wallets
    SET promo_balance = promo_balance + _p.credits, promo_per_app_limit = _p.per_app_limit, updated_at = now()
    WHERE user_id = _uid;
  INSERT INTO public.credit_ledger(user_id, delta, promo_delta, reason, metadata)
    VALUES (_uid, _p.credits, _p.credits, 'coupon', jsonb_build_object('card_promo', _p.code));
  RETURN jsonb_build_object('ok', true, 'credits', _p.credits, 'per_app_limit', _p.per_app_limit);
END;
$function$;

-- Public check used by the card landing page (no sign-in needed): is this card still good?
CREATE OR REPLACE FUNCTION public.card_promo_status(_code text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE _p public.card_promos%ROWTYPE; _norm text := upper(regexp_replace(COALESCE(_code, ''), '[^A-Za-z0-9]', '', 'g'));
BEGIN
  SELECT * INTO _p FROM public.card_promos WHERE upper(replace(code, '-', '')) = _norm;
  IF NOT FOUND THEN RETURN jsonb_build_object('valid', false, 'reason', 'invalid'); END IF;
  IF NOT _p.is_active THEN RETURN jsonb_build_object('valid', false, 'reason', 'inactive'); END IF;
  IF _p.expires_at IS NOT NULL AND _p.expires_at < now() THEN RETURN jsonb_build_object('valid', false, 'reason', 'expired'); END IF;
  IF (_p.kind = 'unique' AND _p.claim_count >= 1) OR (_p.max_claims IS NOT NULL AND _p.claim_count >= _p.max_claims) THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'used');
  END IF;
  RETURN jsonb_build_object('valid', true, 'credits', _p.credits, 'per_app_limit', _p.per_app_limit, 'expires_at', _p.expires_at);
END;
$function$;

-- Admin: print a batch of cards. Codes look like K7M2-9XQP-4TRD (no 0/O/1/I).
CREATE OR REPLACE FUNCTION public.admin_create_card_promos(
  _count int, _label text, _kind text DEFAULT 'unique', _credits int DEFAULT 5000,
  _per_app_limit int DEFAULT 3, _expires_at timestamptz DEFAULT NULL, _max_claims int DEFAULT NULL,
  _shared_code text DEFAULT NULL)
RETURNS SETOF public.card_promos
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE _alpha text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; _i int := 0; _c text; _g int; _row public.card_promos%ROWTYPE;
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN RAISE EXCEPTION 'admin only'; END IF;
  IF _kind = 'shared' THEN
    _count := 1;
    IF COALESCE(_shared_code, '') = '' THEN RAISE EXCEPTION 'a shared card needs a code'; END IF;
  END IF;
  IF _count < 1 OR _count > 2000 THEN RAISE EXCEPTION 'count must be 1 to 2000'; END IF;
  WHILE _i < _count LOOP
    IF _kind = 'shared' THEN
      _c := upper(trim(_shared_code));
    ELSE
      _c := '';
      FOR _g IN 1..12 LOOP
        _c := _c || substr(_alpha, 1 + floor(random() * length(_alpha))::int, 1);
        IF _g IN (4, 8) THEN _c := _c || '-'; END IF;
      END LOOP;
    END IF;
    BEGIN
      INSERT INTO public.card_promos(code, kind, credits, per_app_limit, label, expires_at, max_claims, created_by)
        VALUES (_c, _kind, _credits, _per_app_limit, _label, _expires_at, _max_claims, auth.uid())
        RETURNING * INTO _row;
      _i := _i + 1;
      RETURN NEXT _row;
    EXCEPTION WHEN unique_violation THEN
      IF _kind = 'shared' THEN RAISE EXCEPTION 'that code already exists'; END IF;
    END;
  END LOOP;
END;
$function$;

-- Only the server calls the claim function; the status check is public.
REVOKE EXECUTE ON FUNCTION public.claim_card_promo(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.promo_available(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.promo_runs_affordable(uuid, text, int) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_create_card_promos(int, text, text, int, int, timestamptz, int, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_create_card_promos(int, text, text, int, int, timestamptz, int, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.card_promo_status(text) TO anon, authenticated;
