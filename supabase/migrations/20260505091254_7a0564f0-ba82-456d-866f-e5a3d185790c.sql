
-- ============================================================
-- CREDITS SYSTEM
-- ============================================================

-- 1. WALLETS ---------------------------------------------------
CREATE TABLE public.credit_wallets (
  user_id uuid PRIMARY KEY,
  free_balance int NOT NULL DEFAULT 0,
  paid_balance int NOT NULL DEFAULT 0,
  last_free_reset_at timestamptz,
  signup_bonus_granted boolean NOT NULL DEFAULT false,
  first_action_bonus_granted boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.credit_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own wallet" ON public.credit_wallets
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all wallets" ON public.credit_wallets
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Moderators view all wallets" ON public.credit_wallets
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'moderator'::app_role));

-- 2. LEDGER ----------------------------------------------------
CREATE TABLE public.credit_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  delta int NOT NULL,
  free_delta int NOT NULL DEFAULT 0,
  paid_delta int NOT NULL DEFAULT 0,
  reason text NOT NULL CHECK (reason IN (
    'signup_bonus','first_action_bonus','monthly_reset',
    'purchase','tool_run','coupon','admin_adjust','refund'
  )),
  tool_id text,
  run_id uuid,
  cost_inr numeric,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_credit_ledger_user ON public.credit_ledger(user_id, created_at DESC);
ALTER TABLE public.credit_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own ledger" ON public.credit_ledger
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all ledger" ON public.credit_ledger
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. PURCHASES -------------------------------------------------
CREATE TABLE public.credit_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  pack_id text NOT NULL,
  inr_amount int NOT NULL,
  credits int NOT NULL,
  razorpay_order_id text UNIQUE,
  razorpay_payment_id text,
  status text NOT NULL DEFAULT 'created' CHECK (status IN ('created','paid','failed')),
  coupon_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz
);
CREATE INDEX idx_credit_purchases_user ON public.credit_purchases(user_id, created_at DESC);
ALTER TABLE public.credit_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own purchases" ON public.credit_purchases
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all purchases" ON public.credit_purchases
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. TOOL PRICING ----------------------------------------------
CREATE TABLE public.tool_pricing (
  tool_id text PRIMARY KEY,
  cost_inr numeric NOT NULL DEFAULT 0,
  credit_cost int NOT NULL DEFAULT 1,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tool_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone reads pricing" ON public.tool_pricing FOR SELECT USING (true);
CREATE POLICY "Admins manage pricing" ON public.tool_pricing
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.compute_credit_cost(_cost_inr numeric)
RETURNS int LANGUAGE sql IMMUTABLE AS $$
  SELECT GREATEST(1, CEIL((_cost_inr * 1.5) / 0.45))::int;
$$;

CREATE OR REPLACE FUNCTION public.tool_pricing_set_credits()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.credit_cost := public.compute_credit_cost(NEW.cost_inr);
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_tool_pricing_set_credits
  BEFORE INSERT OR UPDATE ON public.tool_pricing
  FOR EACH ROW EXECUTE FUNCTION public.tool_pricing_set_credits();

-- 5. TOOL RUNS -------------------------------------------------
CREATE TABLE public.tool_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tool_id text NOT NULL,
  status text NOT NULL DEFAULT 'started' CHECK (status IN ('started','succeeded','failed')),
  credits_quoted int NOT NULL DEFAULT 0,
  credits_charged int NOT NULL DEFAULT 0,
  free_used int NOT NULL DEFAULT 0,
  paid_used int NOT NULL DEFAULT 0,
  cost_inr numeric,
  error text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);
CREATE INDEX idx_tool_runs_user ON public.tool_runs(user_id, started_at DESC);
CREATE INDEX idx_tool_runs_tool ON public.tool_runs(tool_id, started_at DESC);
ALTER TABLE public.tool_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own runs" ON public.tool_runs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all runs" ON public.tool_runs
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- 6. COUPONS extension ----------------------------------------
ALTER TABLE public.coupon_codes ADD COLUMN IF NOT EXISTS credit_grant int;

-- ============================================================
-- FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION public.ensure_wallet(_uid uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.credit_wallets(user_id) VALUES (_uid)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.grant_signup_bonus(_uid uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _granted boolean;
BEGIN
  PERFORM public.ensure_wallet(_uid);
  SELECT signup_bonus_granted INTO _granted FROM public.credit_wallets WHERE user_id = _uid FOR UPDATE;
  IF _granted THEN RETURN; END IF;
  UPDATE public.credit_wallets
    SET free_balance = free_balance + 50,
        signup_bonus_granted = true,
        last_free_reset_at = COALESCE(last_free_reset_at, now()),
        updated_at = now()
    WHERE user_id = _uid;
  INSERT INTO public.credit_ledger(user_id, delta, free_delta, reason)
    VALUES (_uid, 50, 50, 'signup_bonus');
END;
$$;

CREATE OR REPLACE FUNCTION public.grant_first_action_bonus(_uid uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _granted boolean;
  _success_count int;
BEGIN
  PERFORM public.ensure_wallet(_uid);
  SELECT first_action_bonus_granted INTO _granted FROM public.credit_wallets WHERE user_id = _uid FOR UPDATE;
  IF _granted THEN RETURN; END IF;
  SELECT count(*) INTO _success_count FROM public.tool_runs WHERE user_id = _uid AND status = 'succeeded';
  IF _success_count < 1 THEN RETURN; END IF;
  UPDATE public.credit_wallets
    SET free_balance = free_balance + 50,
        first_action_bonus_granted = true,
        updated_at = now()
    WHERE user_id = _uid;
  INSERT INTO public.credit_ledger(user_id, delta, free_delta, reason)
    VALUES (_uid, 50, 50, 'first_action_bonus');
END;
$$;

CREATE OR REPLACE FUNCTION public.monthly_free_reset()
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _ist timestamptz := now() AT TIME ZONE 'Asia/Kolkata';
  _affected int;
BEGIN
  -- Only act on the 1st day of the IST month
  IF EXTRACT(DAY FROM _ist) <> 1 THEN RETURN 0; END IF;

  WITH upd AS (
    UPDATE public.credit_wallets w
       SET free_balance = 100,
           last_free_reset_at = now(),
           updated_at = now()
     WHERE last_free_reset_at IS NULL
        OR date_trunc('month', last_free_reset_at AT TIME ZONE 'Asia/Kolkata')
           < date_trunc('month', _ist)
     RETURNING user_id
  )
  INSERT INTO public.credit_ledger(user_id, delta, free_delta, reason)
    SELECT user_id, 0, 0, 'monthly_reset' FROM upd;

  GET DIAGNOSTICS _affected = ROW_COUNT;
  RETURN _affected;
END;
$$;

CREATE OR REPLACE FUNCTION public.start_tool_run(_uid uuid, _tool_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _credits int;
  _cost numeric;
  _free int;
  _paid int;
  _run_id uuid;
BEGIN
  PERFORM public.ensure_wallet(_uid);
  SELECT credit_cost, cost_inr INTO _credits, _cost FROM public.tool_pricing WHERE tool_id = _tool_id;
  IF _credits IS NULL THEN _credits := 1; _cost := 0; END IF;

  SELECT free_balance, paid_balance INTO _free, _paid FROM public.credit_wallets WHERE user_id = _uid;
  IF (_free + _paid) < _credits THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'insufficient', 'credits_required', _credits, 'balance', _free + _paid);
  END IF;

  INSERT INTO public.tool_runs(user_id, tool_id, credits_quoted, cost_inr)
    VALUES (_uid, _tool_id, _credits, _cost)
    RETURNING id INTO _run_id;

  RETURN jsonb_build_object('ok', true, 'run_id', _run_id, 'credits_required', _credits, 'cost_inr', _cost);
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_tool_run(_uid uuid, _run_id uuid, _success boolean, _error text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _run public.tool_runs%ROWTYPE;
  _free int; _paid int; _need int;
  _use_free int := 0; _use_paid int := 0;
BEGIN
  SELECT * INTO _run FROM public.tool_runs WHERE id = _run_id AND user_id = _uid FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'reason', 'not_found'); END IF;
  IF _run.status <> 'started' THEN RETURN jsonb_build_object('ok', true, 'noop', true); END IF;

  IF NOT _success THEN
    UPDATE public.tool_runs SET status='failed', finished_at=now(), error=_error WHERE id=_run_id;
    RETURN jsonb_build_object('ok', true, 'charged', 0);
  END IF;

  SELECT free_balance, paid_balance INTO _free, _paid FROM public.credit_wallets WHERE user_id=_uid FOR UPDATE;
  _need := _run.credits_quoted;
  _use_free := LEAST(_free, _need);
  _use_paid := _need - _use_free;
  IF (_free + _paid) < _need THEN
    UPDATE public.tool_runs SET status='failed', finished_at=now(), error='insufficient_at_complete' WHERE id=_run_id;
    RETURN jsonb_build_object('ok', false, 'reason', 'insufficient');
  END IF;

  UPDATE public.credit_wallets
    SET free_balance = free_balance - _use_free,
        paid_balance = paid_balance - _use_paid,
        updated_at = now()
    WHERE user_id = _uid;

  UPDATE public.tool_runs
    SET status='succeeded', finished_at=now(),
        credits_charged=_need, free_used=_use_free, paid_used=_use_paid
    WHERE id=_run_id;

  INSERT INTO public.credit_ledger(user_id, delta, free_delta, paid_delta, reason, tool_id, run_id, cost_inr)
    VALUES (_uid, -_need, -_use_free, -_use_paid, 'tool_run', _run.tool_id, _run_id, _run.cost_inr);

  PERFORM public.grant_first_action_bonus(_uid);

  RETURN jsonb_build_object('ok', true, 'charged', _need, 'free_used', _use_free, 'paid_used', _use_paid);
END;
$$;

CREATE OR REPLACE FUNCTION public.apply_credit_purchase(_purchase_id uuid, _payment_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _p public.credit_purchases%ROWTYPE;
BEGIN
  SELECT * INTO _p FROM public.credit_purchases WHERE id=_purchase_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'reason', 'not_found'); END IF;
  IF _p.status = 'paid' THEN RETURN jsonb_build_object('ok', true, 'noop', true); END IF;

  PERFORM public.ensure_wallet(_p.user_id);
  UPDATE public.credit_wallets
    SET paid_balance = paid_balance + _p.credits, updated_at = now()
    WHERE user_id = _p.user_id;

  UPDATE public.credit_purchases
    SET status='paid', paid_at=now(), razorpay_payment_id=_payment_id
    WHERE id=_purchase_id;

  INSERT INTO public.credit_ledger(user_id, delta, paid_delta, reason, metadata)
    VALUES (_p.user_id, _p.credits, _p.credits, 'purchase',
            jsonb_build_object('purchase_id', _purchase_id, 'inr_amount', _p.inr_amount, 'pack_id', _p.pack_id));

  RETURN jsonb_build_object('ok', true, 'credits', _p.credits);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_adjust_credits(_target uuid, _delta int, _bucket text, _note text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _free_d int := 0; _paid_d int := 0;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'access denied';
  END IF;
  PERFORM public.ensure_wallet(_target);
  IF _bucket = 'free' THEN _free_d := _delta;
  ELSIF _bucket = 'paid' THEN _paid_d := _delta;
  ELSE RAISE EXCEPTION 'invalid bucket'; END IF;

  UPDATE public.credit_wallets
    SET free_balance = GREATEST(0, free_balance + _free_d),
        paid_balance = GREATEST(0, paid_balance + _paid_d),
        updated_at = now()
    WHERE user_id = _target;

  INSERT INTO public.credit_ledger(user_id, delta, free_delta, paid_delta, reason, metadata)
    VALUES (_target, _delta, _free_d, _paid_d, 'admin_adjust',
            jsonb_build_object('note', _note, 'by', auth.uid()));
  RETURN jsonb_build_object('ok', true);
END;
$$;

-- Trigger signup bonus on new auth user
CREATE OR REPLACE FUNCTION public.handle_new_user_credits()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.grant_signup_bonus(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_credits ON auth.users;
CREATE TRIGGER on_auth_user_created_credits
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_credits();

-- Backfill wallets + signup bonus for existing users
INSERT INTO public.credit_wallets(user_id, free_balance, signup_bonus_granted, last_free_reset_at)
SELECT id, 50, true, now() FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.credit_ledger(user_id, delta, free_delta, reason)
SELECT id, 50, 50, 'signup_bonus' FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM public.credit_ledger l WHERE l.user_id = auth.users.id AND l.reason='signup_bonus'
);

-- ============================================================
-- CRON: monthly reset (00:00 IST = 18:30 UTC)
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  PERFORM cron.unschedule('credits-monthly-reset');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'credits-monthly-reset',
  '30 18 * * *',
  $$ SELECT public.monthly_free_reset(); $$
);
