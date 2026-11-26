-- Idempotent paid runs: a client-supplied request_id lets start_tool_run reject a retried or
-- duplicated submission (same user, same request_id) instead of opening a second run that could
-- later be charged a second time. request_id is optional — callers that don't send one keep
-- behaving exactly as before.

ALTER TABLE public.tool_runs ADD COLUMN IF NOT EXISTS request_id text;

-- One row per (user, request_id) when a request_id is given; NULLs (no request_id sent) are
-- unconstrained, so existing callers are unaffected.
CREATE UNIQUE INDEX IF NOT EXISTS idx_tool_runs_user_request
  ON public.tool_runs(user_id, request_id) WHERE request_id IS NOT NULL;

DROP FUNCTION IF EXISTS public.start_tool_run(uuid, text);

CREATE OR REPLACE FUNCTION public.start_tool_run(_uid uuid, _tool_id text, _request_id text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _credits int;
  _cost numeric;
  _free int;
  _paid int;
  _run_id uuid;
  _existing public.tool_runs%ROWTYPE;
BEGIN
  PERFORM public.ensure_wallet(_uid);

  IF _request_id IS NOT NULL THEN
    SELECT * INTO _existing FROM public.tool_runs WHERE user_id = _uid AND request_id = _request_id;
    IF FOUND THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'duplicate_request', 'run_id', _existing.id, 'status', _existing.status);
    END IF;
  END IF;

  SELECT credit_cost, cost_inr INTO _credits, _cost FROM public.tool_pricing WHERE tool_id = _tool_id;
  IF _credits IS NULL THEN _credits := 1; _cost := 0; END IF;

  SELECT free_balance, paid_balance INTO _free, _paid FROM public.credit_wallets WHERE user_id = _uid;
  IF (_free + _paid) < _credits THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'insufficient', 'credits_required', _credits, 'balance', _free + _paid);
  END IF;

  BEGIN
    INSERT INTO public.tool_runs(user_id, tool_id, credits_quoted, cost_inr, request_id)
      VALUES (_uid, _tool_id, _credits, _cost, _request_id)
      RETURNING id INTO _run_id;
  EXCEPTION WHEN unique_violation THEN
    -- Two concurrent starts raced for the same request_id: the loser reports the winner's run as a duplicate.
    SELECT * INTO _existing FROM public.tool_runs WHERE user_id = _uid AND request_id = _request_id;
    RETURN jsonb_build_object('ok', false, 'reason', 'duplicate_request', 'run_id', _existing.id, 'status', _existing.status);
  END;

  RETURN jsonb_build_object('ok', true, 'run_id', _run_id, 'credits_required', _credits, 'cost_inr', _cost);
END;
$$;
