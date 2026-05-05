
-- 1) user_secrets table (owner-only)
CREATE TABLE IF NOT EXISTS public.user_secrets (
  user_id uuid PRIMARY KEY,
  gemini_api_key text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_secrets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own secrets" ON public.user_secrets
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own secrets" ON public.user_secrets
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own secrets" ON public.user_secrets
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own secrets" ON public.user_secrets
  FOR DELETE USING (auth.uid() = user_id);

-- Migrate existing keys
INSERT INTO public.user_secrets (user_id, gemini_api_key)
  SELECT id, gemini_api_key FROM public.profiles WHERE gemini_api_key IS NOT NULL
  ON CONFLICT (user_id) DO UPDATE SET gemini_api_key = EXCLUDED.gemini_api_key;

ALTER TABLE public.profiles DROP COLUMN IF EXISTS gemini_api_key;

-- 2) Coupon validation: drop public read, add SECURITY DEFINER lookup
DROP POLICY IF EXISTS "Anyone can check coupon validity" ON public.coupon_codes;

CREATE OR REPLACE FUNCTION public.validate_coupon(_code text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _c public.coupon_codes%ROWTYPE;
BEGIN
  SELECT * INTO _c FROM public.coupon_codes
    WHERE lower(code) = lower(_code) AND is_active = true LIMIT 1;
  IF NOT FOUND THEN RETURN jsonb_build_object('valid', false, 'reason', 'not_found'); END IF;
  IF _c.expires_at IS NOT NULL AND _c.expires_at < now() THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'expired');
  END IF;
  IF _c.max_uses IS NOT NULL AND _c.use_count >= _c.max_uses THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'limit');
  END IF;
  RETURN jsonb_build_object(
    'valid', true,
    'access_type', _c.access_type,
    'description', _c.description,
    'credit_grant', _c.credit_grant
  );
END;
$$;
REVOKE EXECUTE ON FUNCTION public.validate_coupon(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_coupon(text) TO anon, authenticated;

-- 3) activity_logs: allow self-read + constrain action_type
CREATE POLICY "Users view own activity logs" ON public.activity_logs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

ALTER TABLE public.activity_logs DROP CONSTRAINT IF EXISTS chk_activity_action_type;
ALTER TABLE public.activity_logs
  ADD CONSTRAINT chk_activity_action_type
  CHECK (action_type IN ('login','signup','tool_usage','profile_edit','payment','subscription','coupon_redeem','admin_action'));

-- 4) Remove sensitive tables from realtime broadcast
ALTER PUBLICATION supabase_realtime DROP TABLE public.meet_nudge_contacts;
ALTER PUBLICATION supabase_realtime DROP TABLE public.tool_requests;

-- 5) Lock down admin-only definer functions from direct API call
REVOKE EXECUTE ON FUNCTION public.admin_adjust_credits(uuid, integer, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_visitor_sessions(timestamptz, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.monthly_free_reset() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.grant_signup_bonus(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.grant_first_action_bonus(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.apply_credit_purchase(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ensure_wallet(uuid) FROM PUBLIC, anon, authenticated;
