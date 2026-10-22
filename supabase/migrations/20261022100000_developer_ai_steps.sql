-- Developer apps, part 6: an AI step inside a file app, and a look inside bundled code.
--
-- Some apps have their own screens AND need AI: a card-by-card story, a calculator that writes advice, a
-- designer that drafts text. They cannot be rebuilt on the doc / chat / vision engines without losing the
-- screens, and a file app is a static page that cannot hold an AI key. So a FILE app (dev_apps.kind = 'hosted')
-- may carry one AI step: dev_app_versions.spec = { engine: 'api', ai: { system, task, model, maxTokens, json },
-- inputs, fallback }. The page calls window.ezyourlife.ai(inputs); the store runs the step on its own AI
-- (dev-app-run), reading the instructions on the server, and charges the visitor per result through the usual
-- credit system. Instructions never leave the server. The team reads the step, the test runs and the AI cost
-- when reviewing, and the step is locked by the checks exactly like the file.
--
-- Also: bundled apps (32c866a) keep their JavaScript base64-encoded inside an import map, which the text checks
-- cannot read. The checks now decode that code and look for keys in it.
--
-- Rules for this file: nothing here re-creates the older developer functions; it only replaces the ones the
-- 20261020090000 migration put on top (dev_run_qa, admin_dev_queue, admin_dev_approve, dev_ai_load, dev_ai_log,
-- get_hosted_app).

-- ---------------------------------------------------------------------------------------------------------
-- Keys: one list of patterns, used on app code and on AI instructions. Each needs a digit, so ordinary words
-- and CSS class names such as "task-card-container-wrapper" never match.
-- ---------------------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.dev_secret_labels(_t text)
RETURNS text[]
LANGUAGE plpgsql
IMMUTABLE
SET search_path = ''
AS $$
DECLARE
  _found text[] := '{}';
  _p     record;
BEGIN
  FOR _p IN SELECT * FROM (VALUES
      ('OpenAI or Anthropic key', '(^|[^A-Za-z0-9])sk-(ant-|proj-)?(?=[A-Za-z0-9_-]*[0-9])[A-Za-z0-9_-]{20,}'),
      ('Google API key', 'AIza[0-9A-Za-z_-]{35}'),
      ('AWS key', 'AKIA[0-9A-Z]{16}'),
      ('GitHub token', 'gh[pousr]_[A-Za-z0-9]{36}'),
      ('Slack token', 'xox[abprs]-[A-Za-z0-9-]{10,}'),
      ('Private key', '-----BEGIN [A-Z ]*PRIVATE KEY-----'),
      ('Live payment key', '(^|[^A-Za-z0-9])(sk|rk)_live_[A-Za-z0-9]{16,}')
    ) AS t(label, pattern)
  LOOP
    IF _t ~ _p.pattern THEN _found := _found || _p.label; END IF;
  END LOOP;
  RETURN _found;
END $$;

-- The JavaScript that bundleProject packed as base64 data: modules, decoded and joined.
CREATE OR REPLACE FUNCTION public.dev_packed_code(_html text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = 'public'
AS $$
DECLARE
  _m   text[];
  _out text := '';
BEGIN
  FOR _m IN SELECT regexp_matches(COALESCE(_html, ''), 'data:text/javascript;base64,([A-Za-z0-9+/=]+)', 'g') LOOP
    BEGIN
      _out := _out || convert_from(decode(_m[1], 'base64'), 'UTF8') || E'\n';
    EXCEPTION WHEN OTHERS THEN
      NULL; -- not text after all; nothing to read
    END;
  END LOOP;
  RETURN _out;
END $$;

-- ---------------------------------------------------------------------------------------------------------
-- The AI step: clean what the developer sent into the one shape the store runs.
-- ---------------------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.dev_clean_ai_step(_s jsonb)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
SET search_path = ''
AS $$
DECLARE
  _ai     jsonb;
  _model  text;
  _tokens integer;
  _inputs jsonb := '[]'::jsonb;
  _out    jsonb;
BEGIN
  IF _s IS NULL OR jsonb_typeof(_s) <> 'object' THEN
    RAISE EXCEPTION 'The AI step must be an object with ai (system, task, model, maxTokens, json) and inputs.';
  END IF;
  IF lower(trim(COALESCE(_s->>'engine', 'api'))) <> 'api' THEN
    RAISE EXCEPTION 'An AI step inside a file app uses engine "api". The doc, chat and vision engines are for apps without their own screens (dev_save_ai_app).';
  END IF;
  _ai := CASE WHEN jsonb_typeof(_s->'ai') = 'object' THEN _s->'ai' ELSE '{}'::jsonb END;
  _model := lower(trim(COALESCE(_ai->>'model', 'flash')));
  IF _model NOT IN ('flash', 'lite') THEN
    RAISE EXCEPTION 'ai.model must be "flash" (careful work, the default) or "lite" (short, simple jobs). No other model is available.';
  END IF;
  _tokens := CASE WHEN COALESCE(_ai->>'maxTokens', '') ~ '^[0-9]{1,6}$' THEN (_ai->>'maxTokens')::integer ELSE 4096 END;
  _tokens := least(8192, greatest(256, _tokens));

  IF jsonb_typeof(_s->'inputs') = 'array' THEN
    SELECT COALESCE(jsonb_agg(jsonb_build_object('key', q.k, 'label', q.l)), '[]'::jsonb) INTO _inputs FROM (
      SELECT left(regexp_replace(trim(COALESCE(e->>'key', '')), '[^A-Za-z0-9_]', '', 'g'), 40) AS k,
             left(trim(COALESCE(NULLIF(trim(e->>'label'), ''), e->>'key', '')), 80) AS l
        FROM jsonb_array_elements(_s->'inputs') WITH ORDINALITY AS t(e, n)
       WHERE jsonb_typeof(e) = 'object'
       ORDER BY n
       LIMIT 30
    ) q WHERE q.k <> '';
  END IF;

  _out := jsonb_build_object(
    'engine', 'api',
    'inputs', _inputs,
    'fallback', NULLIF(left(trim(COALESCE(_s->>'fallback', '')), 500), ''),
    'ai', jsonb_strip_nulls(jsonb_build_object(
      'system', left(trim(COALESCE(_ai->>'system', '')), 20000),
      'task', NULLIF(left(trim(COALESCE(_ai->>'task', '')), 4000), ''),
      'model', _model,
      'maxTokens', _tokens,
      'json', COALESCE(_ai->'json' = 'true'::jsonb, false)
    ))
  );
  _out := jsonb_strip_nulls(_out);
  IF octet_length(_out::text) > 60000 THEN
    RAISE EXCEPTION 'The AI step is larger than 60 KB. Shorten the instructions.';
  END IF;
  RETURN _out;
END $$;

-- Developer: save, replace or (with no definition) remove the AI step of a file app. It goes on the version
-- being edited, and resets that version's checks. New versions start with the previous version's step.
CREATE OR REPLACE FUNCTION public.dev_save_ai_step(_app_id uuid, _spec jsonb DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _uid   uuid := auth.uid();
  _a     dev_apps%ROWTYPE;
  _v     dev_app_versions%ROWTYPE;
  _clean jsonb;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Please sign in first.'; END IF;
  SELECT * INTO _a FROM dev_apps WHERE id = _app_id AND developer_id = _uid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'App not found.'; END IF;
  IF _a.kind <> 'hosted' THEN
    RAISE EXCEPTION 'This app is an AI app: its whole definition is the AI. Change it with dev_save_ai_app.';
  END IF;
  SELECT * INTO _v FROM dev_app_versions WHERE app_id = _app_id ORDER BY version_no DESC LIMIT 1 FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Upload the app first (dev_import_project or the upload link). The AI step is saved on the version that upload creates.';
  END IF;
  IF _v.status NOT IN ('draft', 'changes_requested') THEN
    RAISE EXCEPTION 'Version % is already %. Upload the changed app first (that starts a new version, which keeps the current AI step), then change the step.', _v.version_no, _v.status;
  END IF;
  _clean := CASE WHEN _spec IS NULL THEN NULL ELSE public.dev_clean_ai_step(_spec) END;
  UPDATE dev_app_versions
     SET spec = _clean, status = 'draft', qa = NULL, qa_passed = false, qa_at = NULL, html_sha256 = NULL, updated_at = now()
   WHERE id = _v.id;
  RETURN jsonb_build_object('ok', true, 'version_id', _v.id, 'version_no', _v.version_no, 'ai_step', _clean IS NOT NULL, 'spec', _clean);
END $$;

-- A new version of a file app starts with the AI step of the version before it (the developer changes it, or
-- removes it with dev_save_ai_step(app, null), on the new version).
CREATE OR REPLACE FUNCTION public.dev_inherit_ai_step()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.spec IS NULL AND EXISTS (SELECT 1 FROM dev_apps a WHERE a.id = NEW.app_id AND a.kind = 'hosted') THEN
    SELECT p.spec INTO NEW.spec FROM dev_app_versions p WHERE p.app_id = NEW.app_id ORDER BY p.version_no DESC LIMIT 1;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS dev_app_versions_inherit_ai_step ON public.dev_app_versions;
CREATE TRIGGER dev_app_versions_inherit_ai_step
  BEFORE INSERT ON public.dev_app_versions
  FOR EACH ROW EXECUTE FUNCTION public.dev_inherit_ai_step();

-- ---------------------------------------------------------------------------------------------------------
-- The edge function: load an app's step (live or one version) for a run, and log the run.
-- The "definition hash" is the hash of the spec text: for an AI app that is the same text as its html (the
-- checks require it), for a file app with an AI step it is the step.
-- ---------------------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.dev_ai_load(_tool_id text, _version_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT jsonb_build_object('app_id', a.id, 'version_id', v.id, 'tool_id', a.tool_id, 'developer_id', a.developer_id,
                            'status', v.status, 'spec', v.spec, 'kind', a.kind,
                            'sha', encode(sha256(convert_to(v.spec::text, 'UTF8')), 'hex'))
  FROM dev_app_versions v
  JOIN dev_apps a ON a.id = v.app_id
  WHERE v.spec IS NOT NULL
    AND ((_version_id IS NOT NULL AND v.id = _version_id)
      OR (_version_id IS NULL AND a.tool_id = _tool_id AND a.status = 'live' AND v.id = a.live_version_id));
$$;

CREATE OR REPLACE FUNCTION public.dev_ai_log(_user uuid, _mode text, _version_id uuid, _model text, _in_chars integer,
                                             _out_chars integer, _images integer, _ok boolean, _inputs jsonb, _output text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _v   dev_app_versions%ROWTYPE;
  _sha text;
  _in  integer;
  _out integer;
BEGIN
  SELECT * INTO _v FROM dev_app_versions WHERE id = _version_id;
  IF NOT FOUND THEN RETURN; END IF;
  _sha := encode(sha256(convert_to(COALESCE(_v.spec::text, _v.html), 'UTF8')), 'hex');
  _in := ceil(COALESCE(_in_chars, 0) / 4.0)::integer + COALESCE(_images, 0) * 1100;
  _out := ceil(COALESCE(_out_chars, 0) / 4.0)::integer;
  INSERT INTO dev_ai_usage (app_id, version_id, user_id, mode, model, spec_sha, in_tokens, out_tokens, cost_inr, ok)
  VALUES (_v.app_id, _v.id, _user, _mode, COALESCE(_model, 'flash'), _sha, _in, _out,
          public.dev_ai_cost_inr(_model, _in, _out), COALESCE(_ok, false));
  IF _mode = 'preview' AND COALESCE(_ok, false) AND _output IS NOT NULL THEN
    INSERT INTO dev_ai_samples (app_id, version_id, user_id, spec_sha, inputs, output)
    VALUES (_v.app_id, _v.id, _user, _sha, _inputs, left(_output, 20000));
    DELETE FROM dev_ai_samples s
     WHERE s.app_id = _v.app_id AND s.spec_sha = _sha
       AND s.id NOT IN (SELECT id FROM dev_ai_samples WHERE app_id = _v.app_id AND spec_sha = _sha ORDER BY created_at DESC LIMIT 3);
    DELETE FROM dev_ai_samples s
     WHERE s.app_id = _v.app_id
       AND NOT EXISTS (SELECT 1 FROM dev_app_versions x
                        WHERE x.app_id = s.app_id
                          AND encode(sha256(convert_to(COALESCE(x.spec::text, x.html), 'UTF8')), 'hex') = s.spec_sha);
  END IF;
END $$;

-- ---------------------------------------------------------------------------------------------------------
-- Checks. Every file app also gets a look inside its packed code; one with an AI step gets the AI checks.
-- ---------------------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.dev_qa_extra(_version_id uuid, _qa jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _v      dev_app_versions%ROWTYPE;
  _code   text;
  _all    text;
  _checks jsonb := COALESCE(_qa->'checks', '[]'::jsonb);
  _found  text[];
  _s      jsonb;
  _sha    text;
  _tested integer;
  _calls  boolean;
  _passed boolean;
BEGIN
  SELECT * INTO _v FROM dev_app_versions WHERE id = _version_id;
  IF NOT FOUND THEN RETURN _qa; END IF;
  _s := _v.spec;
  _code := public.dev_packed_code(_v.html);
  _all := COALESCE(_v.html, '') || E'\n' || _code;

  -- Keys inside the app's own code (the text checks cannot read packed modules).
  _found := public.dev_secret_labels(_code);
  IF cardinality(_found) > 0 THEN
    _checks := _checks || jsonb_build_array(public.dev_check('code_secrets', 'No keys inside the code', 'fail',
      'The app''s code contains: ' || array_to_string(_found, ', ') || '. Remove it. Anyone who opens the app could read it. If the app needs AI, use the AI step: the store runs it on its own keys.'));
  ELSE
    _checks := _checks || jsonb_build_array(public.dev_check('code_secrets', 'No keys inside the code', 'pass',
      'Looked through the page and the code it loads.'));
  END IF;

  -- The page calls window.ezyourlife.ai(...), directly or through a short name (const ez = window.ezyourlife; ez.ai(x)),
  -- and minified builds keep either form: look for the bridge's name and a call to .ai( anywhere in the page or its code.
  _calls := _all ~ 'ezyourlife' AND _all ~ '(\.|\?\.|\[\s*["'']\s*)ai\s*["'']?\s*\]?\s*\(';

  IF _s IS NULL THEN
    IF _calls THEN
      _checks := _checks || jsonb_build_array(public.dev_check('aistep', 'AI step', 'fail',
        'The app calls window.ezyourlife.ai(...) but no AI step is saved. Save it with dev_save_ai_step (what the AI is told, which inputs the page sends), then run the checks again.'));
    END IF;
  ELSE
    _sha := encode(sha256(convert_to(_s::text, 'UTF8')), 'hex');
    IF length(COALESCE(_s#>>'{ai,system}', '')) < 80 THEN
      _checks := _checks || jsonb_build_array(public.dev_check('aistep', 'AI step', 'fail',
        'ai.system needs the real instructions (at least 80 characters): what the AI is, what it must produce, and what it must never invent.'));
    ELSIF length(COALESCE(_s#>>'{ai,task}', '')) < 20 THEN
      _checks := _checks || jsonb_build_array(public.dev_check('aistep', 'AI step', 'fail',
        'ai.task needs to say what the AI should produce from the inputs, and the exact layout of the answer (for JSON, every field).'));
    ELSIF jsonb_array_length(COALESCE(_s->'inputs', '[]'::jsonb)) = 0 THEN
      _checks := _checks || jsonb_build_array(public.dev_check('aistep', 'AI step', 'warn',
        'List the inputs the page sends (inputs: [{key, label}]) so the team can see which of the visitor''s answers reach the AI.'));
    ELSIF length(COALESCE(_s->>'fallback', '')) < 10 THEN
      _checks := _checks || jsonb_build_array(public.dev_check('aistep', 'AI step', 'warn',
        'Say in "fallback" what the page shows when the AI is unavailable or the visitor has no credits. A page that works without the AI is a better product.'));
    ELSE
      _checks := _checks || jsonb_build_array(public.dev_check('aistep', 'AI step', 'pass',
        'Model "' || COALESCE(_s#>>'{ai,model}', 'flash') || '", up to ' || COALESCE(_s#>>'{ai,maxTokens}', '4096') || ' tokens per result' ||
        CASE WHEN _s#>'{ai,json}' = 'true'::jsonb THEN ', answers as JSON.' ELSE '.' END));
    END IF;

    IF NOT _calls THEN
      _checks := _checks || jsonb_build_array(public.dev_check('aicall', 'Page uses the AI step', 'fail',
        'An AI step is saved, but nothing in the app calls window.ezyourlife.ai(inputs). Replace the old server call (fetch to /api/...) with it, keeping the page''s own fallback.'));
    ELSE
      _checks := _checks || jsonb_build_array(public.dev_check('aicall', 'Page uses the AI step', 'pass', 'The page calls window.ezyourlife.ai.'));
    END IF;

    _found := public.dev_secret_labels(_s::text);
    IF cardinality(_found) > 0 THEN
      _checks := _checks || jsonb_build_array(public.dev_check('aisecrets', 'No keys in the instructions', 'fail',
        'Remove these from the AI step: ' || array_to_string(_found, ', ') || '. The store runs the AI with its own keys.'));
    END IF;

    SELECT count(*) INTO _tested FROM dev_ai_samples WHERE app_id = _v.app_id AND spec_sha = _sha;
    IF _tested = 0 THEN
      _checks := _checks || jsonb_build_array(public.dev_check('aitested', 'AI test run', 'fail',
        'Run the app once on the preview page (or with dev_test_run) and read the result. Test runs are free for you, and the team reads them at review.'));
    ELSE
      _checks := _checks || jsonb_build_array(public.dev_check('aitested', 'AI test run', 'pass', _tested || ' successful test run(s) of this exact AI step.'));
    END IF;
  END IF;

  _passed := NOT EXISTS (SELECT 1 FROM jsonb_array_elements(_checks) c WHERE c->>'status' = 'fail');
  _qa := _qa || jsonb_build_object('checks', _checks, 'passed', _passed)
              || CASE WHEN _s IS NOT NULL THEN jsonb_build_object('spec_sha', _sha) ELSE '{}'::jsonb END;
  UPDATE dev_app_versions SET qa = _qa, qa_passed = _passed WHERE id = _version_id;
  RETURN _qa;
END $$;

-- The dispatcher: AI apps and file apps as before, then (file apps) the extra checks, then the similar-app rule.
CREATE OR REPLACE FUNCTION public.dev_run_qa(_version_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _kind text;
  _qa   jsonb;
BEGIN
  SELECT a.kind INTO _kind FROM dev_app_versions v JOIN dev_apps a ON a.id = v.app_id WHERE v.id = _version_id;
  IF _kind = 'ai' THEN
    _qa := public.dev_run_qa_ai(_version_id);
  ELSE
    _qa := public.dev_run_qa_hosted(_version_id);
    _qa := public.dev_qa_extra(_version_id, _qa);
  END IF;
  RETURN public.dev_apply_similar_rule(_version_id, _qa);
END $$;

-- ---------------------------------------------------------------------------------------------------------
-- Public page data: whether a live file app has an AI step (the page then opens free and charges per result).
-- ---------------------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_hosted_app(_tool_id text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT jsonb_build_object('tool_id', a.tool_id, 'name', v.name, 'html', v.html, 'version_no', v.version_no,
                            'has_ai', v.spec IS NOT NULL)
  FROM dev_apps a
  JOIN dev_app_versions v ON v.id = a.live_version_id
  WHERE a.tool_id = _tool_id AND a.status = 'live' AND a.kind = 'hosted';
$$;

-- ---------------------------------------------------------------------------------------------------------
-- Admin: the queue shows the AI step, its test runs and its cost for file apps with a step too.
-- ---------------------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_dev_queue()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _base jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN RAISE EXCEPTION 'Admins only.'; END IF;
  _base := public.admin_dev_queue_base();
  RETURN COALESCE((
    SELECT jsonb_agg(
             (t.e || jsonb_build_object('kind', a.kind, 'similar_note', v.similar_note,
                                        'similar_apps', public.dev_similar_apps(v.name, v.short_description, v.app_id, true),
                                        'has_ai_step', a.kind = 'hosted' AND v.spec IS NOT NULL))
             || CASE WHEN a.kind = 'ai' THEN jsonb_build_object('cost_estimate', 'null'::jsonb) ELSE '{}'::jsonb END
             || CASE WHEN v.spec IS NOT NULL THEN jsonb_build_object(
                  'spec', v.spec,
                  'live_spec', lv.spec,
                  'ai_cost', public.dev_ai_cost_estimate(v.spec, a.id, encode(sha256(convert_to(v.spec::text, 'UTF8')), 'hex')),
                  'samples', COALESCE((SELECT jsonb_agg(jsonb_build_object('inputs', s.inputs, 'output', s.output, 'at', s.created_at) ORDER BY s.created_at DESC)
                                         FROM dev_ai_samples s
                                        WHERE s.app_id = a.id AND s.spec_sha = encode(sha256(convert_to(v.spec::text, 'UTF8')), 'hex')), '[]'::jsonb))
                ELSE '{}'::jsonb END
             ORDER BY t.ord)
    FROM jsonb_array_elements(_base) WITH ORDINALITY AS t(e, ord)
    JOIN dev_app_versions v ON v.id = (t.e->>'version_id')::uuid
    JOIN dev_apps a ON a.id = v.app_id
    LEFT JOIN dev_app_versions lv ON lv.id = a.live_version_id
  ), '[]'::jsonb);
END $$;

-- Admin: approving an app that calls AI needs the AI step to be the one the checks passed, and at least 2 credits.
CREATE OR REPLACE FUNCTION public.admin_dev_approve(_version_id uuid, _credits integer, _share_pct numeric, _plan jsonb DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _kind text;
  _spec jsonb;
  _qa   jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN RAISE EXCEPTION 'Admins only.'; END IF;
  SELECT a.kind, v.spec, v.qa INTO _kind, _spec, _qa FROM dev_app_versions v JOIN dev_apps a ON a.id = v.app_id WHERE v.id = _version_id;
  IF _kind = 'ai' AND _spec IS NULL THEN RAISE EXCEPTION 'This AI app has no definition saved.'; END IF;
  IF _spec IS NOT NULL THEN
    IF _credits IS NOT NULL AND _credits < 2 THEN
      RAISE EXCEPTION 'An app that calls AI costs at least 2 credits per use (docs/pricing.md).';
    END IF;
    IF _kind = 'hosted' AND _qa->>'spec_sha' IS DISTINCT FROM encode(sha256(convert_to(_spec::text, 'UTF8')), 'hex') THEN
      RAISE EXCEPTION 'The AI step changed after its checks. Ask the developer to run them again.';
    END IF;
  END IF;
  RETURN public.admin_dev_approve_base(_version_id, _credits, _share_pct, _plan);
END $$;

-- ---------------------------------------------------------------------------------------------------------
-- Who may call what.
-- ---------------------------------------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.dev_secret_labels(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.dev_packed_code(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.dev_clean_ai_step(jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.dev_inherit_ai_step() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.dev_qa_extra(uuid, jsonb) FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.dev_save_ai_step(uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.dev_save_ai_step(uuid, jsonb) TO authenticated;

REVOKE ALL ON FUNCTION public.dev_run_qa(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.dev_run_qa(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.admin_dev_queue() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_dev_queue() TO authenticated;
REVOKE ALL ON FUNCTION public.admin_dev_approve(uuid, integer, numeric, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_dev_approve(uuid, integer, numeric, jsonb) TO authenticated;

REVOKE ALL ON FUNCTION public.dev_ai_load(text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.dev_ai_load(text, uuid) TO service_role;
REVOKE ALL ON FUNCTION public.dev_ai_log(uuid, text, uuid, text, integer, integer, integer, boolean, jsonb, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.dev_ai_log(uuid, text, uuid, text, integer, integer, integer, boolean, jsonb, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_hosted_app(text) TO anon, authenticated;
