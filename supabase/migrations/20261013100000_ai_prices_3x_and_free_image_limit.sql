-- AI app prices by the 3x cost rule, and a limit on free credits for AI images.
-- Rule and sources: docs/pricing.md. Approved by the owner on 12 Oct 2026.
--
-- 1. Prices. credit_cost and cost_inr are set together, so the pricing trigger keeps credit_cost
--    as written. cost_inr is the estimated AI cost of one run at Google's list price.

-- Gemini Flash, standard documents (was 2 credits)
UPDATE public.tool_pricing SET credit_cost = 6, cost_inr = 0.65
WHERE tool_id IN ('tool-5','tool-9','tool-10','tool-12','tool-15','tool-16','tool-17','tool-18','tool-29','tool-36','tool-38',
                  'cognimap','storybook-creator','pdf-profile-extractor');

-- Gemini Flash, long documents (was 3 credits)
UPDATE public.tool_pricing SET credit_cost = 9, cost_inr = 1.02 WHERE tool_id IN ('tool-7','tool-8');

-- Gemini Flash, short content (was 1 credit)
UPDATE public.tool_pricing SET credit_cost = 4, cost_inr = 0.41
WHERE tool_id IN ('social-post-generator','caption-generator','hashtag-generator','content-idea-generator',
                  'video-script-writer','content-workflow-step','interactive-videos');

-- Reading photos and documents with Gemini Flash (was 1-2 credits)
UPDATE public.tool_pricing SET credit_cost = 4, cost_inr = 0.48
WHERE tool_id IN ('ocr','advance-text-extractor','auto-text-extractor','meet-nudge','business-card-scanner');

-- Chat with Gemini Flash, per message (was 1 credit)
UPDATE public.tool_pricing SET credit_cost = 3, cost_inr = 0.38 WHERE tool_id = 'advance-ai-bot';

-- One AI image on Gemini 2.5 Flash Image (was 12 credits)
UPDATE public.tool_pricing SET credit_cost = 31, cost_inr = 3.80
WHERE tool_id IN ('image-creator','create-3d-images','sketchflow-ai','storybook-illustration','thumbnail-maker-img',
                  'video-keyframe','bulk-ai-background','bulk-ai-passport','bulk-ai-beautify');

-- One ProductVision angle on Gemini 3.1 Flash-Lite Image (was 12 credits)
UPDATE public.tool_pricing SET credit_cost = 27, cost_inr = 3.28 WHERE tool_id = 'productvision-angle';

-- 2. Free credits pay for at most 4 AI images per person; after that, image apps use bought credits.
ALTER TABLE public.tool_pricing ADD COLUMN IF NOT EXISTS is_image boolean NOT NULL DEFAULT false;

UPDATE public.tool_pricing SET is_image = true
WHERE tool_id IN ('image-creator','create-3d-images','sketchflow-ai','storybook-illustration','thumbnail-maker-img',
                  'video-keyframe','bulk-ai-background','bulk-ai-passport','bulk-ai-beautify','productvision-angle');

-- AI image runs this person has already paid for (partly or fully) with free credits.
CREATE OR REPLACE FUNCTION public.free_image_runs_used(_uid uuid)
RETURNS int
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT count(*)::int
  FROM public.tool_runs r
  JOIN public.tool_pricing p ON p.tool_id = r.tool_id
  WHERE r.user_id = _uid AND p.is_image AND r.status = 'succeeded' AND r.free_used > 0;
$$;

-- How many image runs at _per credits this wallet can pay for, counting the free-image limit.
CREATE OR REPLACE FUNCTION public.image_runs_affordable(_uid uuid, _per int)
RETURNS int
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE _free int; _paid int; _left int; _n int := 0;
BEGIN
  _per := GREATEST(1, COALESCE(_per, 1));
  SELECT COALESCE(free_balance, 0), COALESCE(paid_balance, 0) INTO _free, _paid FROM public.credit_wallets WHERE user_id = _uid;
  _free := COALESCE(_free, 0); _paid := COALESCE(_paid, 0);
  _left := GREATEST(0, 4 - public.free_image_runs_used(_uid));
  WHILE _n < 100 LOOP
    IF _left > 0 AND _free > 0 AND _free + _paid >= _per THEN
      _paid := _paid - GREATEST(0, _per - _free);
      _free := GREATEST(0, _free - _per);
      _left := _left - 1;
    ELSIF _paid >= _per THEN
      _paid := _paid - _per;
    ELSE
      EXIT;
    END IF;
    _n := _n + 1;
  END LOOP;
  RETURN _n;
END;
$$;

-- Same as before, plus: an image app ignores free credits once the free-image limit is used.
CREATE OR REPLACE FUNCTION public.start_tool_run(_uid uuid, _tool_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE _credits int; _cost numeric; _free int; _paid int; _run_id uuid; _img boolean; _capped boolean := false;
BEGIN
  PERFORM public.ensure_wallet(_uid);
  SELECT credit_cost, cost_inr, is_image INTO _credits, _cost, _img FROM public.tool_pricing WHERE tool_id = _tool_id;
  _credits := GREATEST(1, COALESCE(_credits, 1)); _cost := COALESCE(_cost, 0.30); -- no app is free
  SELECT free_balance, paid_balance INTO _free, _paid FROM public.credit_wallets WHERE user_id = _uid;
  IF COALESCE(_img, false) AND public.free_image_runs_used(_uid) >= 4 THEN
    _capped := _free > 0;
    _free := 0;
  END IF;
  IF (_free + _paid) < _credits THEN
    RETURN jsonb_build_object('ok', false, 'reason', CASE WHEN _capped THEN 'free_image_limit' ELSE 'insufficient' END,
                              'credits_required', _credits, 'balance', _free + _paid);
  END IF;
  INSERT INTO public.tool_runs(user_id, tool_id, credits_quoted, cost_inr) VALUES (_uid, _tool_id, _credits, _cost) RETURNING id INTO _run_id;
  RETURN jsonb_build_object('ok', true, 'run_id', _run_id, 'credits_required', _credits, 'cost_inr', _cost);
END;
$function$;

CREATE OR REPLACE FUNCTION public.complete_tool_run(_uid uuid, _run_id uuid, _success boolean, _error text DEFAULT NULL::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
  -- Free credits do not pay for AI images once this person has had 4 that way.
  IF EXISTS (SELECT 1 FROM public.tool_pricing WHERE tool_id = _run.tool_id AND is_image)
     AND public.free_image_runs_used(_uid) >= 4 THEN
    _free := 0;
  END IF;
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
$function$;

-- Only the server (service role) calls these.
REVOKE EXECUTE ON FUNCTION public.free_image_runs_used(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.image_runs_affordable(uuid, int) FROM PUBLIC, anon, authenticated;
