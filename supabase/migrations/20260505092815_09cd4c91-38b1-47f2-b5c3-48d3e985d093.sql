
-- Free tools: cost_inr = 0 → credit_cost = 0 (otherwise unchanged formula)
CREATE OR REPLACE FUNCTION public.compute_credit_cost(_cost_inr numeric)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $$
  SELECT CASE
    WHEN _cost_inr IS NULL OR _cost_inr <= 0 THEN 0
    ELSE GREATEST(1, CEIL((_cost_inr * 1.5) / 0.45))::int
  END;
$$;

-- start_tool_run: short-circuit when credit_cost = 0
CREATE OR REPLACE FUNCTION public.start_tool_run(_uid uuid, _tool_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _credits int;
  _cost numeric;
  _free int;
  _paid int;
  _run_id uuid;
BEGIN
  PERFORM public.ensure_wallet(_uid);
  SELECT credit_cost, cost_inr INTO _credits, _cost FROM public.tool_pricing WHERE tool_id = _tool_id;
  IF _credits IS NULL THEN _credits := 0; _cost := 0; END IF;

  IF _credits = 0 THEN
    INSERT INTO public.tool_runs(user_id, tool_id, credits_quoted, cost_inr)
      VALUES (_uid, _tool_id, 0, COALESCE(_cost, 0))
      RETURNING id INTO _run_id;
    RETURN jsonb_build_object('ok', true, 'run_id', _run_id, 'credits_required', 0, 'cost_inr', COALESCE(_cost, 0), 'free_tool', true);
  END IF;

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

-- complete_tool_run: handle free runs (no debit, no ledger)
CREATE OR REPLACE FUNCTION public.complete_tool_run(_uid uuid, _run_id uuid, _success boolean, _error text DEFAULT NULL::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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

  IF COALESCE(_run.credits_quoted, 0) = 0 THEN
    UPDATE public.tool_runs SET status='succeeded', finished_at=now(), credits_charged=0 WHERE id=_run_id;
    PERFORM public.grant_first_action_bonus(_uid);
    RETURN jsonb_build_object('ok', true, 'charged', 0, 'free_tool', true);
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

-- Re-apply trigger so existing rows can be re-priced via touch
-- (no-op here; trigger already on table)

-- Bulk jobs: track total credits charged
ALTER TABLE public.bulk_jobs ADD COLUMN IF NOT EXISTS total_credits_charged integer NOT NULL DEFAULT 0;
