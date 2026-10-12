-- Create an influencer's login from the database instead of an edge function.
--
-- Why: influencer-create-login is an edge function, and an edge function only
-- exists once the site is published. The admin had no way to make a login until
-- then. These run inside Postgres, so they work as soon as this migration is
-- applied and never depend on a deploy again.
--
-- Inserting into auth.users directly is what the admin API does underneath:
-- a bcrypt password, a confirmed email, and a matching auth.identities row.
-- The existing on_auth_user_created triggers still fire, so the influencer gets
-- a profile and a wallet exactly as a normal sign-up would.
--
-- SECURITY. These are SECURITY DEFINER and can write to auth.users, so they are
-- written to make account takeover impossible:
--   * A password is only ever set on an account this function itself creates.
--     If the email already exists, the account is linked and its password is
--     left completely alone, so an admin cannot set a password on someone
--     else's account (including another admin's).
--   * A reset only works on a login already attached to an influencer, and is
--     refused outright if that user holds any role in user_roles.
-- Both are admin-only and granted to authenticated, never to anon.

-- ---------- create (or link) an influencer's login ----------
CREATE OR REPLACE FUNCTION public.influencer_create_login(
  _influencer_id uuid, _email text, _password text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
  v_email text := lower(trim(coalesce(_email, '')));
  v_existing uuid;
  v_uid uuid;
BEGIN
  PERFORM public.influencer_assert_admin();

  IF v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' THEN
    RAISE EXCEPTION 'Enter a valid email address';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.influencers WHERE id = _influencer_id) THEN
    RAISE EXCEPTION 'influencer not found';
  END IF;

  SELECT id INTO v_existing FROM auth.users WHERE lower(email) = v_email;

  IF v_existing IS NOT NULL THEN
    -- Never touch an existing account's password. Just link it.
    PERFORM public.influencer_attach_login(_influencer_id, v_existing);
    RETURN jsonb_build_object(
      'ok', true, 'email', v_email, 'created', false, 'user_id', v_existing,
      'note', 'This email already had an Ezyourlife account, so it keeps its own password. It is now linked to this influencer.');
  END IF;

  IF length(coalesce(_password, '')) < 8 THEN
    RAISE EXCEPTION 'Password must be at least 8 characters';
  END IF;

  v_uid := gen_random_uuid();
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    confirmation_token, recovery_token, email_change, email_change_token_new
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', v_email,
    extensions.crypt(_password, extensions.gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('influencer_id', _influencer_id),
    '', '', '', ''
  );

  INSERT INTO auth.identities (provider_id, user_id, identity_data, provider,
                               last_sign_in_at, created_at, updated_at)
  VALUES (v_uid::text, v_uid,
          jsonb_build_object('sub', v_uid::text, 'email', v_email,
                             'email_verified', true, 'phone_verified', false),
          'email', now(), now(), now());

  PERFORM public.influencer_attach_login(_influencer_id, v_uid);

  RETURN jsonb_build_object('ok', true, 'email', v_email, 'created', true, 'user_id', v_uid);
END $fn$;

-- ---------- reset the password of a login we created ----------
CREATE OR REPLACE FUNCTION public.influencer_reset_password(
  _influencer_id uuid, _password text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE v_uid uuid; v_email text;
BEGIN
  PERFORM public.influencer_assert_admin();
  IF length(coalesce(_password, '')) < 8 THEN
    RAISE EXCEPTION 'Password must be at least 8 characters';
  END IF;

  SELECT user_id INTO v_uid FROM public.influencers WHERE id = _influencer_id;
  IF v_uid IS NULL THEN RAISE EXCEPTION 'This influencer has no login yet'; END IF;

  -- Refuse on any account that holds a role, so this can never be used to take
  -- over an admin or moderator account.
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = v_uid) THEN
    RAISE EXCEPTION 'That account holds a staff role; reset its password through the normal account flow';
  END IF;

  UPDATE auth.users
  SET encrypted_password = extensions.crypt(_password, extensions.gen_salt('bf')),
      updated_at = now()
  WHERE id = v_uid
  RETURNING email INTO v_email;

  RETURN jsonb_build_object('ok', true, 'email', v_email);
END $fn$;

-- ---------- link an account the influencer already has ----------
CREATE OR REPLACE FUNCTION public.influencer_link_by_email(_influencer_id uuid, _email text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE v_uid uuid; v_email text := lower(trim(coalesce(_email, '')));
BEGIN
  PERFORM public.influencer_assert_admin();
  SELECT id INTO v_uid FROM auth.users WHERE lower(email) = v_email;
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'No Ezyourlife account uses that email. Ask them to sign up first, or create a login for them.';
  END IF;
  PERFORM public.influencer_attach_login(_influencer_id, v_uid);
  RETURN jsonb_build_object('ok', true, 'email', v_email, 'user_id', v_uid);
END $fn$;

-- influencer_attach_login is called by the three functions above, which are
-- themselves admin-only, so it also needs to be callable by an admin now.
GRANT EXECUTE ON FUNCTION public.influencer_attach_login(uuid, uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.influencer_create_login(uuid, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.influencer_reset_password(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.influencer_link_by_email(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.influencer_create_login(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.influencer_reset_password(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.influencer_link_by_email(uuid, text) TO authenticated;
