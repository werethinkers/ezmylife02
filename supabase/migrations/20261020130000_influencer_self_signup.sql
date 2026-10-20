-- Creators can register themselves on /influencer (no admin step needed to get a login).
--
-- A self-registered creator gets their own influencer row, link and dashboard at once, but the row
-- starts 'paused' with 0% commission. Only 'active' rows are tracked, shown on /kit?ref= or earn
-- commission, so nothing is paid until an admin approves the creator and sets the commission
-- (the Approve button on /admin/influencers). The creator can edit their offer page meanwhile.
--
-- Safety: found by auth.uid(), one row per login (influencers.user_id is UNIQUE), no way to pass
-- another user's id, commission and status cannot be set by the caller.

ALTER TABLE public.influencers
  ADD COLUMN IF NOT EXISTS self_signup boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.influencer_register(_name text, _handle text, _city text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_name text := trim(coalesce(_name, ''));
  v_handle text := nullif(ltrim(trim(coalesce(_handle, '')), '@'), '');
  v_base text;
  v_code text;
  v_try int := 0;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in first'; END IF;
  IF EXISTS (SELECT 1 FROM public.influencers WHERE user_id = auth.uid()) THEN
    RETURN jsonb_build_object('ok', true, 'already', true);
  END IF;
  IF length(v_name) < 2 OR length(v_name) > 60 THEN RAISE EXCEPTION 'Enter your name (2 to 60 characters)'; END IF;
  IF v_handle IS NOT NULL AND length(v_handle) > 40 THEN RAISE EXCEPTION 'That handle is too long'; END IF;
  IF length(coalesce(_city, '')) > 60 THEN RAISE EXCEPTION 'Keep the city under 60 characters'; END IF;

  v_base := left(regexp_replace(lower(coalesce(v_handle, v_name)), '[^a-z0-9]+', '', 'g'), 14);
  IF length(v_base) < 3 THEN v_base := 'creator'; END IF;
  v_code := v_base;
  WHILE EXISTS (SELECT 1 FROM public.influencers WHERE code = v_code) LOOP
    v_try := v_try + 1;
    IF v_try > 20 THEN RAISE EXCEPTION 'Could not make a link, try again'; END IF;
    v_code := left(v_base, 16) || (100 + floor(random() * 900))::int;
  END LOOP;

  INSERT INTO public.influencers (name, handle, city, code, commission_pct, status, user_id, self_signup)
  VALUES (v_name, v_handle, nullif(trim(coalesce(_city, '')), ''), v_code, 0, 'paused', auth.uid(), true);

  RETURN jsonb_build_object('ok', true, 'code', v_code);
END $$;

REVOKE ALL ON FUNCTION public.influencer_register(text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.influencer_register(text, text, text) TO authenticated;
