-- Developer apps, part 7: AI apps built on EzYourLife's own engines.
--
-- Until now a developer app was one HTML file in a sandbox that could not use AI. Most of what developers
-- bring (Google AI Studio exports, Express + Gemini apps, Claude artifacts) is an AI app: a form or chat, one
-- or more prompts, and a result. Those cannot run as a file, and must not carry their own AI key, wallet or
-- payments. This adds a second kind of developer app, kind = 'ai': the developer (or their Claude) sends a
-- DEFINITION, not code: the screen (engine doc, chat or vision), its fields, and the AI instructions. It runs
-- on the same shared screens as the 440+ built-in apps and is billed through the same billed() wrapper, so
-- EzYourLife's own AI and EzYourLife's own credits are the only AI and the only payment system.
--
--   * The definition is stored in dev_app_versions.spec (jsonb). dev_app_versions.html holds the same
--     definition as canonical text, so the existing SHA-256 lock, submit and approve steps cover it unchanged.
--   * The instructions (ai.system, ai.task) never leave the server: the public reader get_ai_app removes them.
--   * Test runs before approval are free to the developer, limited per day, logged, and shown to the admin
--     (inputs, outputs, estimated AI cost). Checks require one successful test run of the exact definition.
--   * Cost is admin-only, like the hosted lane: estimates are computed in admin_dev_queue only.
--
-- Nothing here changes charging: start_tool_run, complete_tool_run, billed(), tool_pricing and the wallet are
-- untouched. Approval still writes the same tools_catalog / tool_pricing / tool_promo_pages rows.
-- Apply after 20261020080000 (it renames and wraps dev_save_draft_as, dev_run_qa, admin_dev_queue and
-- admin_dev_approve, and re-creates get_hosted_app).

-- ---------------------------------------------------------------------------------------------
-- 1. Tables and columns
-- ---------------------------------------------------------------------------------------------

ALTER TABLE public.dev_apps ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'hosted';
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'dev_apps_kind_check') THEN
    ALTER TABLE public.dev_apps ADD CONSTRAINT dev_apps_kind_check CHECK (kind IN ('hosted', 'ai'));
  END IF;
END $$;

ALTER TABLE public.dev_app_versions ADD COLUMN IF NOT EXISTS spec jsonb;
-- Why this app is different from a similar one already in the store (written by the developer, read by the admin).
ALTER TABLE public.dev_app_versions ADD COLUMN IF NOT EXISTS similar_note text;

-- One row per AI run on a developer AI app (test runs and live runs). Tokens are estimated from text length.
CREATE TABLE IF NOT EXISTS public.dev_ai_usage (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id     uuid REFERENCES public.dev_apps(id) ON DELETE CASCADE,
  version_id uuid REFERENCES public.dev_app_versions(id) ON DELETE SET NULL,
  user_id    uuid,
  mode       text NOT NULL CHECK (mode IN ('preview', 'live')),
  model      text NOT NULL,
  spec_sha   text,
  in_tokens  integer NOT NULL DEFAULT 0,
  out_tokens integer NOT NULL DEFAULT 0,
  cost_inr   numeric(10,4) NOT NULL DEFAULT 0,
  ok         boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS dev_ai_usage_user_idx ON public.dev_ai_usage (user_id, created_at DESC) WHERE mode = 'preview';
CREATE INDEX IF NOT EXISTS dev_ai_usage_app_idx ON public.dev_ai_usage (app_id, spec_sha);

-- The last few successful test runs of a definition, for the admin to read.
CREATE TABLE IF NOT EXISTS public.dev_ai_samples (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id     uuid NOT NULL REFERENCES public.dev_apps(id) ON DELETE CASCADE,
  version_id uuid REFERENCES public.dev_app_versions(id) ON DELETE SET NULL,
  user_id    uuid,
  spec_sha   text NOT NULL,
  inputs     jsonb,
  output     text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS dev_ai_samples_app_idx ON public.dev_ai_samples (app_id, spec_sha, created_at DESC);

-- No policies: only the SECURITY DEFINER functions below (and the service role) can touch these.
ALTER TABLE public.dev_ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dev_ai_samples ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.dev_ai_usage, public.dev_ai_samples FROM anon, authenticated;

-- ---------------------------------------------------------------------------------------------
-- 2. Cost of one run (rates in docs/pricing.md: Gemini 2.5 Flash $0.30 in / $2.50 out per 1M tokens,
--    Flash-Lite $0.10 / $0.40, USD to INR 96.36). Admin use only.
-- ---------------------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.dev_ai_cost_inr(_model text, _in numeric, _out numeric)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT round(((COALESCE(_in, 0) / 1000000.0) * CASE WHEN _model ~* 'lite' THEN 0.10 ELSE 0.30 END
              + (COALESCE(_out, 0) / 1000000.0) * CASE WHEN _model ~* 'lite' THEN 0.40 ELSE 2.50 END) * 96.36, 4);
$$;

-- ---------------------------------------------------------------------------------------------
-- 3. The definition: cleaned on every save so only known, size-limited fields are stored.
-- ---------------------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.dev_clean_ai_spec(_s jsonb)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
SET search_path = ''
AS $$
DECLARE
  _engine text;
  _ai     jsonb;
  _model  text;
  _fields jsonb := '[]'::jsonb;
  _out    jsonb;
  _f      record;
  _types  constant text[] := ARRAY['text', 'textarea', 'number', 'money', 'date', 'select', 'chips', 'rows'];
  _ctypes constant text[] := ARRAY['text', 'number', 'money', 'date', 'select'];
  _profs  constant text[] := ARRAY['businessName', 'ownerName', 'industry', 'city', 'state', 'phone', 'email', 'address',
                                   'gstin', 'website', 'products', 'audience', 'tone', 'language'];
  _ftype  text;
  _opts   jsonb;
  _cols   jsonb;
  _key    text;
  _tokens integer;
BEGIN
  IF _s IS NULL OR jsonb_typeof(_s) <> 'object' THEN
    RAISE EXCEPTION 'The app definition must be an object with engine, intro, steps, fields and ai.';
  END IF;
  _engine := lower(trim(COALESCE(_s->>'engine', '')));
  IF _engine NOT IN ('doc', 'chat', 'vision') THEN
    RAISE EXCEPTION 'engine must be "doc" (a form in, a written result out), "chat" (a conversation) or "vision" (photos or scanned pages in, text out).';
  END IF;
  _ai := CASE WHEN jsonb_typeof(_s->'ai') = 'object' THEN _s->'ai' ELSE '{}'::jsonb END;
  _model := lower(trim(COALESCE(_ai->>'model', 'flash')));
  IF _model NOT IN ('flash', 'lite') THEN
    RAISE EXCEPTION 'ai.model must be "flash" (careful work, the default) or "lite" (short, simple jobs). No other model is available.';
  END IF;
  _tokens := CASE WHEN COALESCE(_ai->>'maxTokens', '') ~ '^[0-9]{1,6}$' THEN (_ai->>'maxTokens')::integer ELSE 4096 END;
  _tokens := least(8192, greatest(256, _tokens));

  IF _engine IN ('doc') AND jsonb_typeof(_s->'fields') = 'array' THEN
    FOR _f IN SELECT e, n FROM jsonb_array_elements(_s->'fields') WITH ORDINALITY AS t(e, n)
              WHERE jsonb_typeof(e) = 'object' ORDER BY n LIMIT 20 LOOP
      IF trim(COALESCE(_f.e->>'label', '')) = '' THEN
        RAISE EXCEPTION 'Field % has no label. Every field needs a label the visitor can read.', _f.n;
      END IF;
      _ftype := lower(trim(COALESCE(_f.e->>'type', 'text')));
      IF _ftype <> ALL (_types) THEN
        RAISE EXCEPTION 'Field "%" has type "%". Use one of: text, textarea, number, money, date, select, chips, rows.', left(_f.e->>'label', 40), left(_ftype, 20);
      END IF;
      _key := left(trim(COALESCE(NULLIF(trim(_f.e->>'key'), ''), regexp_replace(lower(_f.e->>'label'), '[^a-z0-9]+', '_', 'g'))), 40);
      _opts := CASE WHEN jsonb_typeof(_f.e->'options') = 'array' THEN
        (SELECT COALESCE(jsonb_agg(o), '[]'::jsonb) FROM (SELECT left(trim(x), 60) AS o FROM jsonb_array_elements_text(_f.e->'options') x
                                                          WHERE trim(x) <> '' LIMIT 24) q) ELSE NULL END;
      _cols := CASE WHEN _ftype = 'rows' AND jsonb_typeof(_f.e->'columns') = 'array' THEN
        (SELECT COALESCE(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
            'key', left(trim(COALESCE(NULLIF(trim(c->>'key'), ''), regexp_replace(lower(c->>'label'), '[^a-z0-9]+', '_', 'g'))), 40),
            'label', left(trim(COALESCE(c->>'label', '')), 40),
            'type', CASE WHEN lower(COALESCE(c->>'type', 'text')) = ANY (_ctypes) THEN lower(c->>'type') ELSE 'text' END,
            'placeholder', NULLIF(left(trim(COALESCE(c->>'placeholder', '')), 80), ''),
            'options', CASE WHEN jsonb_typeof(c->'options') = 'array'
                       THEN (SELECT jsonb_agg(left(trim(x), 60)) FROM jsonb_array_elements_text(c->'options') x WHERE trim(x) <> '') ELSE NULL END
          )) ORDER BY n), '[]'::jsonb)
         FROM (SELECT c, n FROM jsonb_array_elements(_f.e->'columns') WITH ORDINALITY AS u(c, n)
               WHERE jsonb_typeof(c) = 'object' AND trim(COALESCE(c->>'label', '')) <> '' ORDER BY n LIMIT 8) cc)
        ELSE NULL END;
      _fields := _fields || jsonb_build_array(jsonb_strip_nulls(jsonb_build_object(
        'key', _key,
        'label', left(trim(_f.e->>'label'), 60),
        'type', _ftype,
        'placeholder', NULLIF(left(trim(COALESCE(_f.e->>'placeholder', '')), 240), ''),
        'options', CASE WHEN _ftype IN ('select', 'chips') THEN _opts ELSE NULL END,
        'required', CASE WHEN _f.e->'required' = 'true'::jsonb THEN true ELSE NULL END,
        'half', CASE WHEN _f.e->'half' = 'true'::jsonb THEN true ELSE NULL END,
        'help', NULLIF(left(trim(COALESCE(_f.e->>'help', '')), 200), ''),
        'default', NULLIF(left(trim(COALESCE(_f.e->>'default', '')), 500), ''),
        'rows', CASE WHEN COALESCE(_f.e->>'rows', '') ~ '^[0-9]{1,2}$' THEN least(20, greatest(2, (_f.e->>'rows')::integer)) ELSE NULL END,
        'columns', _cols,
        'defaultRows', CASE WHEN _ftype = 'rows' AND jsonb_typeof(_f.e->'defaultRows') = 'array'
                       THEN (SELECT COALESCE(jsonb_agg(r), '[]'::jsonb) FROM (SELECT r FROM jsonb_array_elements(_f.e->'defaultRows') r
                                                                              WHERE jsonb_typeof(r) = 'object' LIMIT 10) q) ELSE NULL END,
        'profile', CASE WHEN _f.e->>'profile' = ANY (_profs) THEN _f.e->>'profile' ELSE NULL END,
        'acceptsHandoff', CASE WHEN _f.e->'acceptsHandoff' = 'true'::jsonb THEN true ELSE NULL END
      )));
    END LOOP;
  END IF;

  _out := jsonb_strip_nulls(jsonb_build_object(
    'engine', _engine,
    'intro', left(trim(COALESCE(_s->>'intro', '')), 200),
    'steps', CASE WHEN jsonb_typeof(_s->'steps') = 'array' THEN
        (SELECT COALESCE(jsonb_agg(s), '[]'::jsonb) FROM (SELECT left(trim(x), 80) AS s FROM jsonb_array_elements_text(_s->'steps') x WHERE trim(x) <> '' LIMIT 4) q)
      ELSE '[]'::jsonb END,
    'cta', NULLIF(left(trim(COALESCE(_s->>'cta', '')), 40), ''),
    'fileName', COALESCE(NULLIF(left(trim(both '-' from regexp_replace(lower(COALESCE(_s->>'fileName', '')), '[^a-z0-9]+', '-', 'g')), 40), ''), 'result'),
    'fields', CASE WHEN _engine = 'doc' THEN _fields ELSE NULL END,
    'sample', CASE WHEN _engine = 'doc' AND jsonb_typeof(_s->'sample') = 'object' THEN _s->'sample' ELSE NULL END,
    'refineChips', CASE WHEN jsonb_typeof(_s->'refineChips') = 'array' THEN
        (SELECT COALESCE(jsonb_agg(s), '[]'::jsonb) FROM (SELECT left(trim(x), 40) AS s FROM jsonb_array_elements_text(_s->'refineChips') x WHERE trim(x) <> '' LIMIT 6) q)
      ELSE NULL END,
    'welcome', CASE WHEN _engine = 'chat' THEN NULLIF(left(trim(COALESCE(_s->>'welcome', '')), 300), '') ELSE NULL END,
    'suggestions', CASE WHEN _engine = 'chat' AND jsonb_typeof(_s->'suggestions') = 'array' THEN
        (SELECT COALESCE(jsonb_agg(s), '[]'::jsonb) FROM (SELECT left(trim(x), 100) AS s FROM jsonb_array_elements_text(_s->'suggestions') x WHERE trim(x) <> '' LIMIT 6) q)
      ELSE NULL END,
    'documents', CASE WHEN _engine = 'chat' AND _s->'documents' = 'true'::jsonb THEN true ELSE NULL END,
    'documentHint', CASE WHEN _engine = 'chat' THEN NULLIF(left(trim(COALESCE(_s->>'documentHint', '')), 200), '') ELSE NULL END,
    'instructionsLabel', CASE WHEN _engine = 'vision' THEN NULLIF(left(trim(COALESCE(_s->>'instructionsLabel', '')), 80), '') ELSE NULL END,
    'ai', jsonb_strip_nulls(jsonb_build_object(
      'system', left(trim(COALESCE(_ai->>'system', '')), 20000),
      'task', NULLIF(left(trim(COALESCE(_ai->>'task', '')), 4000), ''),
      'model', _model,
      'maxTokens', _tokens,
      'maxImages', CASE WHEN _engine = 'vision' THEN
          least(4, greatest(1, CASE WHEN COALESCE(_ai->>'maxImages', '') ~ '^[0-9]$' THEN (_ai->>'maxImages')::integer ELSE 2 END)) ELSE NULL END,
      'maxContext', CASE WHEN _engine = 'chat' THEN
          least(30000, greatest(2000, CASE WHEN COALESCE(_ai->>'maxContext', '') ~ '^[0-9]{1,6}$' THEN (_ai->>'maxContext')::integer ELSE 20000 END)) ELSE NULL END
    ))
  ));
  IF octet_length(_out::text) > 60000 THEN
    RAISE EXCEPTION 'The app definition is larger than 60 KB. Shorten the instructions or remove sample data.';
  END IF;
  RETURN _out;
END $$;

-- ---------------------------------------------------------------------------------------------
-- 4. Saving. An app's kind is set by what is saved while it has no live version: a definition makes it an AI
--    app, a file makes it a hosted app. Once an app has a live version its kind cannot change.
-- ---------------------------------------------------------------------------------------------

DO $$
BEGIN
  IF to_regprocedure('public.dev_save_draft_as_base(uuid, uuid, text, jsonb, jsonb)') IS NULL THEN
    ALTER FUNCTION public.dev_save_draft_as(uuid, uuid, text, jsonb, jsonb) RENAME TO dev_save_draft_as_base;
  END IF;
END $$;

-- Every file save (including GitHub imports and big uploads) comes through here.
CREATE OR REPLACE FUNCTION public.dev_save_draft_as(_uid uuid, _app_id uuid, _html text, _listing jsonb, _source jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _a   dev_apps%ROWTYPE;
  _res jsonb;
BEGIN
  SELECT * INTO _a FROM dev_apps WHERE id = _app_id AND developer_id = _uid FOR UPDATE;
  IF FOUND AND _a.kind = 'ai' AND _html IS NOT NULL THEN
    IF _a.live_version_id IS NOT NULL THEN
      RAISE EXCEPTION 'This app is live as an AI app, so it is saved as an app definition (dev_save_ai_app), not as a file. To publish a file, create a new app.';
    END IF;
    UPDATE dev_apps SET kind = 'hosted' WHERE id = _app_id;
    UPDATE dev_app_versions SET spec = NULL WHERE app_id = _app_id;
  END IF;
  _res := public.dev_save_draft_as_base(_uid, _app_id, _html, _listing, _source);
  PERFORM public.dev_set_similar_note((_res->>'version_id')::uuid, _listing);
  RETURN _res;
END $$;

-- Saves the AI app's definition and/or listing to the editable version (starts the next version when the
-- latest is decided, like a file save). A new definition clears the checks.
CREATE OR REPLACE FUNCTION public.dev_save_ai_app(_app_id uuid, _spec jsonb DEFAULT NULL, _listing jsonb DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _uid   uuid := auth.uid();
  _a     dev_apps%ROWTYPE;
  _clean jsonb;
  _res   jsonb;
  _vid   uuid;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Please sign in first.'; END IF;
  SELECT * INTO _a FROM dev_apps WHERE id = _app_id AND developer_id = _uid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'App not found.'; END IF;
  IF _a.kind <> 'ai' THEN
    IF _a.live_version_id IS NOT NULL THEN
      RAISE EXCEPTION 'This app is live as a file (hosted) app. To publish an AI app, create a new app.';
    END IF;
    IF _spec IS NULL THEN
      RAISE EXCEPTION 'This app has no definition yet. Send the app definition (engine, fields and ai instructions).';
    END IF;
    UPDATE dev_apps SET kind = 'ai' WHERE id = _app_id;
  END IF;
  _clean := CASE WHEN _spec IS NULL THEN NULL ELSE public.dev_clean_ai_spec(_spec) END;
  _res := public.dev_save_draft_as_base(_uid, _app_id, _clean::text, COALESCE(_listing, '{}'::jsonb),
                                        CASE WHEN _clean IS NULL THEN NULL ELSE jsonb_build_object('kind', 'definition') END);
  _vid := (_res->>'version_id')::uuid;
  UPDATE dev_app_versions SET spec = CASE WHEN html ~ '^\s*\{' THEN html::jsonb ELSE NULL END WHERE id = _vid;
  PERFORM public.dev_set_similar_note(_vid, COALESCE(_listing, '{}'::jsonb));
  RETURN _res || jsonb_build_object('kind', 'ai');
END $$;

-- ---------------------------------------------------------------------------------------------
-- 5. Checks
-- ---------------------------------------------------------------------------------------------

DO $$
BEGIN
  IF to_regprocedure('public.dev_run_qa_hosted(uuid)') IS NULL THEN
    ALTER FUNCTION public.dev_run_qa(uuid) RENAME TO dev_run_qa_hosted;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.dev_run_qa_ai(_version_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _uid     uuid := auth.uid();
  _v       dev_app_versions%ROWTYPE;
  _tool    text;
  _s       jsonb;
  _ai      jsonb;
  _eng     text;
  _checks  jsonb := '[]'::jsonb;
  _problems text[] := '{}';
  _found   text[];
  _all     text;
  _user    text;
  _promo   jsonb;
  _imgs    integer;
  _missing text[] := '{}';
  _dups    jsonb;
  _sha     text;
  _tested  integer;
  _n       integer;
  _f       record;
  _keys    text[] := '{}';
  _p       record;
  _qa      jsonb;
  _passed  boolean;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Please sign in first.'; END IF;
  SELECT * INTO _v FROM dev_app_versions WHERE id = _version_id FOR UPDATE;
  IF NOT FOUND OR (_v.developer_id <> _uid AND NOT public.has_role(_uid, 'admin'::public.app_role)) THEN
    RAISE EXCEPTION 'Version not found.';
  END IF;
  IF _v.status NOT IN ('draft', 'changes_requested', 'submitted') THEN
    RAISE EXCEPTION 'This version is already decided. Save a change to start a new version.';
  END IF;
  SELECT tool_id INTO _tool FROM dev_apps WHERE id = _v.app_id;
  _promo := _v.promo;
  _s := _v.spec;
  _sha := encode(sha256(convert_to(COALESCE(_v.html, ''), 'UTF8')), 'hex');

  -- The definition itself
  IF _s IS NULL OR COALESCE(_v.html, '') <> _s::text THEN
    _checks := _checks || public.dev_check('spec', 'App definition', 'fail',
      'No app definition is saved on this version. Send it with dev_save_ai_app (engine, intro, fields and ai instructions).');
    _s := '{}'::jsonb;
  ELSE
    _eng := _s->>'engine';
    _ai := COALESCE(_s->'ai', '{}'::jsonb);
    IF length(COALESCE(_s->>'intro', '')) < 20 THEN _problems := _problems || 'an intro line of at least 20 characters'::text; END IF;
    IF jsonb_array_length(COALESCE(_s->'steps', '[]'::jsonb)) < 2 THEN _problems := _problems || '2 to 4 short "how it works" steps'::text; END IF;
    IF _eng IN ('doc', 'vision') AND length(COALESCE(_s->>'cta', '')) < 3 THEN _problems := _problems || 'a button label (cta), for example "Create the report"'::text; END IF;
    IF _eng = 'chat' AND length(COALESCE(_s->>'welcome', '')) < 10 THEN _problems := _problems || 'a welcome message'::text; END IF;
    IF _eng = 'chat' AND jsonb_array_length(COALESCE(_s->'suggestions', '[]'::jsonb)) < 2 THEN _problems := _problems || '2 or more suggested first questions'::text; END IF;
    IF cardinality(_problems) > 0 THEN
      _checks := _checks || public.dev_check('spec', 'App definition', 'fail', 'Add: ' || array_to_string(_problems, ', ') || '.');
    ELSE
      _checks := _checks || public.dev_check('spec', 'App definition', 'pass', 'Engine "' || _eng || '", intro and steps are in.');
    END IF;
  END IF;

  -- The form
  IF _s->>'engine' = 'doc' THEN
    _problems := '{}';
    _n := jsonb_array_length(COALESCE(_s->'fields', '[]'::jsonb));
    IF _n = 0 THEN
      _problems := _problems || 'at least one field'::text;
    ELSE
      FOR _f IN SELECT e FROM jsonb_array_elements(_s->'fields') AS t(e) LOOP
        IF _f.e->>'key' = ANY (_keys) THEN _problems := _problems || ('"' || (_f.e->>'label') || '" repeats a key'); END IF;
        _keys := _keys || (_f.e->>'key');
        IF _f.e->>'type' = 'select' AND jsonb_array_length(COALESCE(_f.e->'options', '[]'::jsonb)) < 2 THEN
          _problems := _problems || ('"' || (_f.e->>'label') || '" is a select with fewer than 2 options');
        END IF;
        IF _f.e->>'type' = 'chips' AND jsonb_array_length(COALESCE(_f.e->'options', '[]'::jsonb)) < 2 THEN
          _problems := _problems || ('"' || (_f.e->>'label') || '" is chips with fewer than 2 options');
        END IF;
        IF _f.e->>'type' = 'rows' AND jsonb_array_length(COALESCE(_f.e->'columns', '[]'::jsonb)) < 1 THEN
          _problems := _problems || ('"' || (_f.e->>'label') || '" is a table with no columns');
        END IF;
      END LOOP;
    END IF;
    IF cardinality(_problems) > 0 THEN
      _checks := _checks || public.dev_check('fields', 'Form fields', 'fail', 'Fix: ' || array_to_string(_problems, '; ') || '.');
    ELSIF NOT EXISTS (SELECT 1 FROM jsonb_array_elements(_s->'fields') e WHERE e->'required' = 'true'::jsonb) THEN
      _checks := _checks || public.dev_check('fields', 'Form fields', 'warn', _n || ' field(s), none marked required. Mark the ones the result cannot be made without.');
    ELSE
      _checks := _checks || public.dev_check('fields', 'Form fields', 'pass', _n || ' field(s).');
    END IF;
  END IF;

  -- The instructions
  IF length(COALESCE(_s#>>'{ai,system}', '')) < 80 THEN
    _checks := _checks || public.dev_check('prompt', 'AI instructions', 'fail',
      'ai.system needs the real instructions (at least 80 characters): what the AI is, what it must do, how the result is laid out, and what it must never invent.');
  ELSIF _s->>'engine' IN ('doc', 'vision') AND length(COALESCE(_s#>>'{ai,task}', '')) < 20 THEN
    _checks := _checks || public.dev_check('prompt', 'AI instructions', 'warn',
      'ai.task is short or empty. Say what the AI should produce from the visitor''s inputs, and the layout of the result.');
  ELSE
    _checks := _checks || public.dev_check('prompt', 'AI instructions', 'pass', 'Instructions are in.');
  END IF;
  IF COALESCE(_s#>>'{ai,model}', '') IN ('flash', 'lite') AND COALESCE((_s#>>'{ai,maxTokens}')::integer, 0) BETWEEN 256 AND 8192 THEN
    _checks := _checks || public.dev_check('model', 'Model and length', 'pass',
      'EzYourLife''s AI, "' || (_s#>>'{ai,model}') || '", up to ' || (_s#>>'{ai,maxTokens}') || ' tokens per answer.');
  ELSE
    _checks := _checks || public.dev_check('model', 'Model and length', 'fail', 'ai.model must be "flash" or "lite" and ai.maxTokens between 256 and 8192.');
  END IF;

  -- All text in the definition, and the text the visitor reads
  _all := _s::text;
  _user := concat_ws(' ', _s->>'intro', _s->>'steps', _s->>'cta', _s->>'welcome', _s->>'suggestions', _s->>'documentHint',
                     (SELECT string_agg(concat_ws(' ', e->>'label', e->>'placeholder', e->>'help', e->>'options'), ' ') FROM jsonb_array_elements(COALESCE(_s->'fields', '[]'::jsonb)) e),
                     _v.name, _v.short_description, _v.description);

  _found := '{}';
  FOR _p IN SELECT * FROM (VALUES
      ('OpenAI or Anthropic key', 'sk-(ant-|proj-)?[A-Za-z0-9_-]{20,}'),
      ('Google API key', 'AIza[0-9A-Za-z_-]{35}'),
      ('AWS key', 'AKIA[0-9A-Z]{16}'),
      ('GitHub token', 'gh[pousr]_[A-Za-z0-9]{36}'),
      ('Slack token', 'xox[abprs]-[A-Za-z0-9-]{10,}'),
      ('Private key', '-----BEGIN [A-Z ]*PRIVATE KEY-----'),
      ('Access token (JWT)', 'eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}'),
      ('Key or secret', '(api[_-]?key|secret|access[_-]?token)\s*[:=]\s*["'']?[A-Za-z0-9_\-]{16,}')
    ) AS t(label, pattern)
  LOOP
    IF _all ~* _p.pattern THEN _found := _found || _p.label; END IF;
  END LOOP;
  IF cardinality(_found) > 0 THEN
    _checks := _checks || public.dev_check('secrets', 'No keys or passwords', 'fail',
      'Remove these from the definition: ' || array_to_string(_found, ', ') || '. EzYourLife runs the AI with its own keys.');
  ELSE
    _checks := _checks || public.dev_check('secrets', 'No keys or passwords', 'pass', 'None found.');
  END IF;

  -- An AI app has no code of its own, so it cannot take payments; this catches wording copied from an app that did.
  IF _all ~* '(razorpay|stripe|paypal|cashfree|paytm|phonepe|google pay)' OR
     _user ~* '(wallet|top[- ]?up|buy credits|free trial|free uses|free reports?|pay (₹|rs|inr)|checkout|add money|per[- ]report price)' THEN
    _checks := _checks || public.dev_check('payments', 'No own payments', 'warn',
      'The text mentions payments, a wallet, credits or a free trial. If that was copied from the original app, remove it: EzYourLife credits are the only payment system, the team sets the price, and the visitor is charged by the platform when the result is produced. If it is part of what the app is about (for example an invoice or payment-reminder writer), leave it.');
  ELSE
    _checks := _checks || public.dev_check('payments', 'No own payments', 'pass', 'None found.');
  END IF;

  IF _all ~* 'https?://' THEN
    _checks := _checks || public.dev_check('network', 'Outside addresses', 'warn',
      'The definition contains web addresses. An AI app cannot call outside services: the AI only sees the visitor''s inputs. If the instructions depend on a live page or API, that part will not work.');
  ELSE
    _checks := _checks || public.dev_check('network', 'Outside addresses', 'pass', 'None. The app uses only EzYourLife''s AI.');
  END IF;

  -- A real test run of exactly this definition
  SELECT count(*) INTO _tested FROM dev_ai_samples WHERE app_id = _v.app_id AND spec_sha = _sha;
  IF _tested = 0 THEN
    _checks := _checks || public.dev_check('tested', 'Test run', 'fail',
      'Run the app once on the preview page (or with dev_test_run) and read the result. The team sees your test runs when they review.');
  ELSE
    _checks := _checks || public.dev_check('tested', 'Test run', 'pass', _tested || ' successful test run(s) of this exact definition.');
  END IF;

  -- Listing, unique name, similar apps
  IF length(_v.name) < 3 THEN _missing := _missing || 'name (3 to 60 characters)'::text; END IF;
  IF length(_v.short_description) < 20 THEN _missing := _missing || 'one-line description (20 to 160 characters)'::text; END IF;
  IF length(_v.description) < 40 THEN _missing := _missing || 'full description (at least 40 characters)'::text; END IF;
  IF _v.category IS NULL OR NOT EXISTS (SELECT 1 FROM catalog_categories WHERE name = _v.category) THEN
    _missing := _missing || 'category'::text;
  END IF;
  IF cardinality(_missing) > 0 THEN
    _checks := _checks || public.dev_check('listing', 'Store listing', 'fail', 'Fill in: ' || array_to_string(_missing, ', ') || '.');
  ELSE
    _checks := _checks || public.dev_check('listing', 'Store listing', 'pass', 'Complete.');
  END IF;

  IF length(_v.name) >= 3 AND (
       EXISTS (SELECT 1 FROM tools_catalog WHERE lower(name) = lower(_v.name) AND id <> _tool)
    OR EXISTS (SELECT 1 FROM dev_app_versions o JOIN dev_apps a ON a.id = o.app_id
               WHERE o.app_id <> _v.app_id AND a.status = 'live' AND o.id = a.live_version_id AND lower(o.name) = lower(_v.name))) THEN
    _checks := _checks || public.dev_check('name', 'Unique name', 'fail', 'An app called "' || _v.name || '" is already in the store.');
  ELSE
    _checks := _checks || public.dev_check('name', 'Unique name', 'pass', 'No other app has this name.');
  END IF;

  _dups := public.dev_similar_apps(_v.name, _v.short_description, _v.app_id);
  IF jsonb_array_length(_dups) > 0 THEN
    _checks := _checks || public.dev_check('duplicates', 'Similar apps', 'warn',
      jsonb_array_length(_dups) || ' similar app(s) found. The admin decides whether yours is different enough.');
  ELSE
    _checks := _checks || public.dev_check('duplicates', 'Similar apps', 'pass', 'Nothing close in the store.');
  END IF;

  -- Promo page and screenshots (same rules as file apps)
  _problems := '{}';
  IF _promo IS NULL THEN
    _problems := _problems || 'no promo page text yet'::text;
  ELSE
    IF length(COALESCE(_promo->>'headline', '')) < 10 THEN _problems := _problems || 'a headline of at least 10 characters'::text; END IF;
    IF length(COALESCE(_promo->>'tagline', '')) < 20 THEN _problems := _problems || 'a tagline of at least 20 characters'::text; END IF;
    IF jsonb_array_length(COALESCE(_promo->'highlights', '[]'::jsonb)) < 3 THEN _problems := _problems || 'at least 3 highlights'::text; END IF;
    IF jsonb_array_length(COALESCE(_promo->'steps', '[]'::jsonb)) < 2 THEN _problems := _problems || 'at least 2 "how it works" steps'::text; END IF;
  END IF;
  IF cardinality(_problems) > 0 THEN
    _checks := _checks || public.dev_check('promo', 'Promo page', 'fail',
      'The app gets its own page where visitors see what it does. It needs: ' || array_to_string(_problems, ', ') || '.');
  ELSIF jsonb_array_length(COALESCE(_promo->'faq', '[]'::jsonb)) = 0 THEN
    _checks := _checks || public.dev_check('promo', 'Promo page', 'warn', 'Ready. Two or three questions and answers would help visitors.');
  ELSE
    _checks := _checks || public.dev_check('promo', 'Promo page', 'pass', 'Headline, tagline, highlights and steps are in.');
  END IF;

  SELECT count(*) INTO _imgs FROM dev_app_images WHERE version_id = _version_id;
  IF _imgs = 0 THEN
    _checks := _checks || public.dev_check('images', 'Screenshots', 'fail',
      'Add at least one real screenshot of the app, ideally 3 or more (the app in use, and what it produces).');
  ELSIF _imgs < 3 THEN
    _checks := _checks || public.dev_check('images', 'Screenshots', 'warn',
      _imgs || ' screenshot(s) added. 3 or more show the app better: the start screen, the app in use and the result.');
  ELSE
    _checks := _checks || public.dev_check('images', 'Screenshots', 'pass', _imgs || ' screenshots added.');
  END IF;

  _passed := NOT EXISTS (SELECT 1 FROM jsonb_array_elements(_checks) c WHERE c->>'status' = 'fail');
  _qa := jsonb_build_object('checks', _checks, 'duplicates', _dups, 'hosts', '[]'::jsonb, 'repeat_flags', '[]'::jsonb,
                            'bytes', octet_length(COALESCE(_v.html, '')), 'passed', _passed, 'ran_at', now());
  UPDATE dev_app_versions
     SET qa = _qa, qa_passed = _passed, qa_at = now(), html_sha256 = _sha
   WHERE id = _version_id;
  RETURN _qa;
END $$;

-- The one entry point everyone calls: AI apps get the AI checks, file apps the file checks, and both get the
-- "similar app" rule (a similar app already in the store needs the developer's note on how theirs differs).
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
  END IF;
  RETURN public.dev_apply_similar_rule(_version_id, _qa);
END $$;

-- ---------------------------------------------------------------------------------------------
-- 6. Test runs and live runs: allowance, log, samples (called by the dev-app-run function only)
-- ---------------------------------------------------------------------------------------------

-- Test runs: 25 a day per developer, 400 a day for everyone together. Admins are not limited.
CREATE OR REPLACE FUNCTION public.dev_ai_preview_allow(_user uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _per_user constant integer := 25;
  _per_day  constant integer := 400;
  _mine integer;
  _all  integer;
BEGIN
  IF public.has_role(_user, 'admin'::public.app_role) THEN
    RETURN jsonb_build_object('allowed', true, 'left', NULL, 'limit', NULL);
  END IF;
  SELECT count(*) INTO _mine FROM dev_ai_usage WHERE user_id = _user AND mode = 'preview' AND ok AND created_at > now() - interval '24 hours';
  SELECT count(*) INTO _all FROM dev_ai_usage WHERE mode = 'preview' AND ok AND created_at > now() - interval '24 hours';
  RETURN jsonb_build_object(
    'allowed', _mine < _per_user AND _all < _per_day,
    'left', greatest(0, _per_user - _mine),
    'limit', _per_user,
    'reason', CASE WHEN _mine >= _per_user THEN 'user' WHEN _all >= _per_day THEN 'platform' ELSE NULL END);
END $$;

-- The developer's own count, for the preview page.
CREATE OR REPLACE FUNCTION public.dev_ai_runs_left()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Please sign in first.'; END IF;
  RETURN public.dev_ai_preview_allow(auth.uid());
END $$;

-- What the run function needs: the live definition of an AI app, or one specific version (test runs).
CREATE OR REPLACE FUNCTION public.dev_ai_load(_tool_id text, _version_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT jsonb_build_object('app_id', a.id, 'version_id', v.id, 'tool_id', a.tool_id, 'developer_id', a.developer_id,
                            'status', v.status, 'spec', v.spec,
                            'sha', encode(sha256(convert_to(v.html, 'UTF8')), 'hex'))
  FROM dev_app_versions v
  JOIN dev_apps a ON a.id = v.app_id
  WHERE a.kind = 'ai' AND v.spec IS NOT NULL
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
  _sha := encode(sha256(convert_to(_v.html, 'UTF8')), 'hex');
  _in := ceil(COALESCE(_in_chars, 0) / 4.0)::integer + COALESCE(_images, 0) * 1100;
  _out := ceil(COALESCE(_out_chars, 0) / 4.0)::integer;
  INSERT INTO dev_ai_usage (app_id, version_id, user_id, mode, model, spec_sha, in_tokens, out_tokens, cost_inr, ok)
  VALUES (_v.app_id, _v.id, _user, _mode, COALESCE(_model, 'flash'), _sha, _in, _out,
          public.dev_ai_cost_inr(_model, _in, _out), COALESCE(_ok, false));
  IF _mode = 'preview' AND COALESCE(_ok, false) AND _output IS NOT NULL THEN
    INSERT INTO dev_ai_samples (app_id, version_id, user_id, spec_sha, inputs, output)
    VALUES (_v.app_id, _v.id, _user, _sha, _inputs, left(_output, 20000));
    -- keep the latest three for this definition
    DELETE FROM dev_ai_samples s
     WHERE s.app_id = _v.app_id AND s.spec_sha = _sha
       AND s.id NOT IN (SELECT id FROM dev_ai_samples WHERE app_id = _v.app_id AND spec_sha = _sha ORDER BY created_at DESC LIMIT 3);
    -- and drop samples of definitions that no longer exist on any version of this app
    DELETE FROM dev_ai_samples s
     WHERE s.app_id = _v.app_id
       AND NOT EXISTS (SELECT 1 FROM dev_app_versions x WHERE x.app_id = s.app_id AND encode(sha256(convert_to(x.html, 'UTF8')), 'hex') = s.spec_sha);
  END IF;
END $$;

-- ---------------------------------------------------------------------------------------------
-- 7. Admin: cost of the AI, the definition, and the test runs, added to the review queue
-- ---------------------------------------------------------------------------------------------

-- Admin only. Typical run: the instructions plus about 1,500 tokens of input, and an answer of at most
-- 2,500 tokens (700 for chat). Ceiling: a full-length answer. Measured: the average of this definition's own
-- successful runs (tokens estimated from text length). Price rule from docs/pricing.md:
-- credits = round up (AI cost x 3 / 0.376), minimum 2.
CREATE OR REPLACE FUNCTION public.dev_ai_cost_estimate(_spec jsonb, _app_id uuid, _sha text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _model  text := COALESCE(_spec#>>'{ai,model}', 'flash');
  _maxt   integer := COALESCE((_spec#>>'{ai,maxTokens}')::integer, 4096);
  _eng    text := _spec->>'engine';
  _prompt integer := ceil((length(COALESCE(_spec#>>'{ai,system}', '')) + length(COALESCE(_spec#>>'{ai,task}', ''))) / 4.0)::integer + 40;
  _imgs   integer := CASE WHEN _eng = 'vision' THEN COALESCE((_spec#>>'{ai,maxImages}')::integer, 2) ELSE 0 END;
  _in     integer;
  _typ    integer;
  _typical numeric;
  _ceiling numeric;
  _n      integer;
  _avg    numeric;
  _basis  numeric;
BEGIN
  _in := _prompt + CASE WHEN _eng = 'chat' THEN 1200 ELSE 1500 END + _imgs * 1100;
  _typ := least(_maxt, CASE WHEN _eng = 'chat' THEN 700 ELSE 2500 END);
  _typical := public.dev_ai_cost_inr(_model, _in, _typ);
  _ceiling := public.dev_ai_cost_inr(_model, _in, _maxt);
  SELECT count(*), avg(cost_inr) INTO _n, _avg
    FROM (SELECT cost_inr FROM dev_ai_usage WHERE app_id = _app_id AND spec_sha = _sha AND ok ORDER BY created_at DESC LIMIT 20) u;
  _basis := greatest(_typical, COALESCE(_avg, 0));
  RETURN jsonb_build_object(
    'model', _model, 'max_tokens', _maxt, 'prompt_tokens', _prompt, 'typical_in_tokens', _in, 'typical_out_tokens', _typ,
    'typical_inr', _typical, 'ceiling_inr', _ceiling, 'runs_measured', _n, 'measured_avg_inr', _avg,
    'rate_inr_per_credit', 0.376, 'margin', 3,
    'suggested_credits', greatest(2, ceil(_basis * 3 / 0.376 - 0.000001)::integer),
    'ceiling_credits', greatest(2, ceil(_ceiling * 3 / 0.376 - 0.000001)::integer),
    'notes', jsonb_build_array(
      'Only the AI is counted. Our hosting is not.',
      'Tokens are estimated from text length (4 characters per token), not read from the provider.',
      'Credits = AI cost x 3 / 0.376 rounded up, minimum 2 (docs/pricing.md).'));
END $$;

DO $$
BEGIN
  IF to_regprocedure('public.admin_dev_queue_base()') IS NULL THEN
    ALTER FUNCTION public.admin_dev_queue() RENAME TO admin_dev_queue_base;
  END IF;
END $$;

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
                                        'similar_apps', public.dev_similar_apps(v.name, v.short_description, v.app_id, true)))
             || CASE WHEN a.kind = 'ai' THEN jsonb_build_object(
                  'cost_estimate', 'null'::jsonb,
                  'spec', v.spec,
                  'live_spec', lv.spec,
                  'ai_cost', public.dev_ai_cost_estimate(v.spec, a.id, encode(sha256(convert_to(v.html, 'UTF8')), 'hex')),
                  'samples', COALESCE((SELECT jsonb_agg(jsonb_build_object('inputs', s.inputs, 'output', s.output, 'at', s.created_at) ORDER BY s.created_at DESC)
                                         FROM dev_ai_samples s
                                        WHERE s.app_id = a.id AND s.spec_sha = encode(sha256(convert_to(v.html, 'UTF8')), 'hex')), '[]'::jsonb))
                ELSE '{}'::jsonb END
             ORDER BY t.ord)
    FROM jsonb_array_elements(_base) WITH ORDINALITY AS t(e, ord)
    JOIN dev_app_versions v ON v.id = (t.e->>'version_id')::uuid
    JOIN dev_apps a ON a.id = v.app_id
    LEFT JOIN dev_app_versions lv ON lv.id = a.live_version_id
  ), '[]'::jsonb);
END $$;

-- ---------------------------------------------------------------------------------------------
-- 8. Approval: the same one click. AI apps cost at least 2 credits (docs/pricing.md).
-- ---------------------------------------------------------------------------------------------

DO $$
BEGIN
  IF to_regprocedure('public.admin_dev_approve_base(uuid, integer, numeric, jsonb)') IS NULL THEN
    ALTER FUNCTION public.admin_dev_approve(uuid, integer, numeric, jsonb) RENAME TO admin_dev_approve_base;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.admin_dev_approve(_version_id uuid, _credits integer, _share_pct numeric, _plan jsonb DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _kind text;
  _spec jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN RAISE EXCEPTION 'Admins only.'; END IF;
  SELECT a.kind, v.spec INTO _kind, _spec FROM dev_app_versions v JOIN dev_apps a ON a.id = v.app_id WHERE v.id = _version_id;
  IF _kind = 'ai' THEN
    IF _spec IS NULL THEN RAISE EXCEPTION 'This AI app has no definition saved.'; END IF;
    IF _credits IS NOT NULL AND _credits < 2 THEN
      RAISE EXCEPTION 'An app that calls AI costs at least 2 credits per use (docs/pricing.md).';
    END IF;
  END IF;
  RETURN public.admin_dev_approve_base(_version_id, _credits, _share_pct, _plan);
END $$;

-- ---------------------------------------------------------------------------------------------
-- 9. Public readers
-- ---------------------------------------------------------------------------------------------

-- A file app's code is served to the sandbox; an AI app's definition holds the instructions and must not be.
CREATE OR REPLACE FUNCTION public.get_hosted_app(_tool_id text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT jsonb_build_object('tool_id', a.tool_id, 'name', v.name, 'html', v.html, 'version_no', v.version_no)
  FROM dev_apps a
  JOIN dev_app_versions v ON v.id = a.live_version_id
  WHERE a.tool_id = _tool_id AND a.status = 'live' AND a.kind = 'hosted';
$$;

-- Which kind of developer app is this address? (null when it is not a live developer app)
CREATE OR REPLACE FUNCTION public.get_dev_app_kind(_tool_id text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT a.kind FROM dev_apps a WHERE a.tool_id = _tool_id AND a.status = 'live' AND a.live_version_id IS NOT NULL;
$$;

-- The screen of a live AI app: everything except the instructions (ai.system, ai.task stay on the server).
CREATE OR REPLACE FUNCTION public.get_ai_app(_tool_id text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT jsonb_build_object('tool_id', a.tool_id, 'name', v.name, 'version_no', v.version_no,
                            'spec', (v.spec - 'ai') || jsonb_build_object('ai', jsonb_build_object('model', v.spec#>'{ai,model}')))
  FROM dev_apps a
  JOIN dev_app_versions v ON v.id = a.live_version_id
  WHERE a.tool_id = _tool_id AND a.status = 'live' AND a.kind = 'ai' AND v.spec IS NOT NULL;
$$;

-- ---------------------------------------------------------------------------------------------
-- 9b. Similar apps. Before building, the connector asks whether something like it exists. If it does, the
--     developer must say how theirs is different (similar_note). The admin sees the similar apps next to
--     that note and decides. Overlap is the share of shared words in name + one-line description (0 to 1).
-- ---------------------------------------------------------------------------------------------

-- Up to 5 apps scoring 0.34 or more. Other developers' apps still in review are shown without their name
-- unless _full (admin).
CREATE OR REPLACE FUNCTION public.dev_similar_apps(_name text, _short text, _app_id uuid DEFAULT NULL, _full boolean DEFAULT false)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _words text[] := public.dev_words(COALESCE(_name, '') || ' ' || COALESCE(_short, ''));
  _tool  text;
BEGIN
  SELECT tool_id INTO _tool FROM dev_apps WHERE id = _app_id;
  RETURN COALESCE((
    SELECT jsonb_agg(x.d ORDER BY x.score DESC) FROM (
      SELECT * FROM (
        SELECT jsonb_build_object('tool_id', c.id, 'name', c.name, 'source', 'store', 'status', 'live',
                                  'short_description', left(c.description, 200), 'path', '/tool/' || c.id,
                                  'score', public.dev_overlap(_words, public.dev_words(c.name || ' ' || c.description))) AS d,
               public.dev_overlap(_words, public.dev_words(c.name || ' ' || c.description)) AS score
        FROM tools_catalog c WHERE c.is_live AND c.id IS DISTINCT FROM _tool
        UNION ALL
        SELECT CASE WHEN _full THEN jsonb_build_object('tool_id', a.tool_id, 'name', o.name, 'source', 'developer', 'status', 'in review',
                                                      'short_description', left(o.short_description, 200), 'path', NULL,
                                                      'score', public.dev_overlap(_words, public.dev_words(o.name || ' ' || o.short_description)))
               ELSE jsonb_build_object('name', 'Another developer''s app waiting for review', 'source', 'developer', 'status', 'in review',
                                       'score', public.dev_overlap(_words, public.dev_words(o.name || ' ' || o.short_description))) END,
               public.dev_overlap(_words, public.dev_words(o.name || ' ' || o.short_description))
        FROM dev_apps a
        JOIN LATERAL (SELECT * FROM dev_app_versions v WHERE v.app_id = a.id ORDER BY v.version_no DESC LIMIT 1) o ON true
        WHERE a.id IS DISTINCT FROM _app_id AND a.status <> 'live' AND o.status = 'submitted'
      ) all_apps
      WHERE score >= 0.34
      ORDER BY score DESC
      LIMIT 5
    ) x
  ), '[]'::jsonb);
END $$;

-- The connector's early question: "does something like this already exist?" Same rule as the checks.
CREATE OR REPLACE FUNCTION public.dev_find_similar(_name text, _short text, _app_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Please sign in first.'; END IF;
  IF length(trim(COALESCE(_name, ''))) < 3 THEN RAISE EXCEPTION 'Give the app name (at least 3 characters).'; END IF;
  IF _app_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dev_apps WHERE id = _app_id AND developer_id = auth.uid()) THEN
    _app_id := NULL;
  END IF;
  RETURN public.dev_similar_apps(_name, _short, _app_id, false);
END $$;

-- Saves the developer's note on a version (and carries the previous version's note forward).
CREATE OR REPLACE FUNCTION public.dev_set_similar_note(_vid uuid, _listing jsonb)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  UPDATE dev_app_versions v SET similar_note = CASE
      WHEN _listing IS NOT NULL AND jsonb_typeof(_listing) = 'object' AND _listing ? 'similar_note'
        THEN NULLIF(left(trim(COALESCE(_listing->>'similar_note', '')), 1000), '')
      ELSE COALESCE(v.similar_note, (SELECT p.similar_note FROM dev_app_versions p WHERE p.app_id = v.app_id AND p.version_no = v.version_no - 1))
    END
  WHERE v.id = _vid;
$$;

-- Applies the rule to a finished check run (both kinds of app): similar apps found and no note → must fix;
-- note given → a look-at item for the admin. Other developers' unreleased apps are shown without a name.
CREATE OR REPLACE FUNCTION public.dev_apply_similar_rule(_version_id uuid, _qa jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _note   text;
  _dups   jsonb;
  _names  text;
  _check  jsonb;
  _checks jsonb;
BEGIN
  SELECT similar_note INTO _note FROM dev_app_versions WHERE id = _version_id;
  -- Unreleased apps of other developers lose their name; the same app found twice counts once.
  SELECT COALESCE(jsonb_agg(k.d ORDER BY k.score DESC), '[]'::jsonb) INTO _dups FROM (
    SELECT DISTINCT ON (COALESCE(e.tool_id, e.name)) e.d, e.score FROM (
      SELECT CASE WHEN d->>'source' = 'store' OR EXISTS (SELECT 1 FROM tools_catalog c WHERE c.id = d->>'tool_id' AND c.is_live)
                  THEN d
                  ELSE jsonb_build_object('name', 'Another developer''s app waiting for review', 'source', 'developer', 'score', d->'score') END AS d,
             d->>'tool_id' AS tool_id, d->>'name' AS name, (d->>'score')::numeric AS score
      FROM jsonb_array_elements(COALESCE(_qa->'duplicates', '[]'::jsonb)) d
    ) e
    ORDER BY COALESCE(e.tool_id, e.name), e.score DESC
  ) k;
  IF jsonb_array_length(_dups) = 0 THEN RETURN _qa; END IF;
  SELECT string_agg(d->>'name', ', ') INTO _names FROM jsonb_array_elements(_dups) d;
  IF length(trim(COALESCE(_note, ''))) >= 20 THEN
    _check := public.dev_check('duplicates', 'Similar apps', 'warn',
      'Similar to: ' || _names || '. Your note on how yours is different is saved. The admin reads it next to these apps and decides.');
  ELSE
    _check := public.dev_check('duplicates', 'Similar apps', 'fail',
      jsonb_array_length(_dups) || ' similar app(s) already exist: ' || _names || '. If yours does something different, add a note of one or two sentences saying how (similar_note in the listing; "How is yours different?" on the page) and run the checks again. The admin reads your note next to these apps and decides. If it does the same job, do not send it.');
  END IF;
  SELECT COALESCE(jsonb_agg(CASE WHEN c->>'id' = 'duplicates' THEN _check ELSE c END ORDER BY ord), '[]'::jsonb) INTO _checks
    FROM jsonb_array_elements(_qa->'checks') WITH ORDINALITY AS t(c, ord);
  _qa := _qa || jsonb_build_object('checks', _checks, 'duplicates', _dups,
                                   'passed', NOT EXISTS (SELECT 1 FROM jsonb_array_elements(_checks) c WHERE c->>'status' = 'fail'));
  UPDATE dev_app_versions SET qa = _qa, qa_passed = (_qa->>'passed')::boolean WHERE id = _version_id;
  RETURN _qa;
END $$;

-- ---------------------------------------------------------------------------------------------
-- 10. Who may call what
-- ---------------------------------------------------------------------------------------------

REVOKE ALL ON FUNCTION public.dev_ai_cost_inr(text, numeric, numeric) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.dev_similar_apps(text, text, uuid, boolean) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.dev_set_similar_note(uuid, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.dev_apply_similar_rule(uuid, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.dev_find_similar(text, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.dev_find_similar(text, text, uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.dev_clean_ai_spec(jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.dev_save_draft_as_base(uuid, uuid, text, jsonb, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.dev_save_draft_as(uuid, uuid, text, jsonb, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.dev_run_qa_hosted(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.dev_run_qa_ai(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.dev_ai_preview_allow(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.dev_ai_load(text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.dev_ai_log(uuid, text, uuid, text, integer, integer, integer, boolean, jsonb, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.dev_ai_cost_estimate(jsonb, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_dev_queue_base() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_dev_approve_base(uuid, integer, numeric, jsonb) FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.dev_save_ai_app(uuid, jsonb, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.dev_save_ai_app(uuid, jsonb, jsonb) TO authenticated;
REVOKE ALL ON FUNCTION public.dev_ai_runs_left() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.dev_ai_runs_left() TO authenticated;
REVOKE ALL ON FUNCTION public.dev_run_qa(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.dev_run_qa(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.admin_dev_queue() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_dev_queue() TO authenticated;
REVOKE ALL ON FUNCTION public.admin_dev_approve(uuid, integer, numeric, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_dev_approve(uuid, integer, numeric, jsonb) TO authenticated;

GRANT EXECUTE ON FUNCTION public.get_hosted_app(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_dev_app_kind(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_ai_app(text) TO anon, authenticated;

-- The run function reaches these with the service role (RLS-free), which is not one of the roles revoked above.
GRANT EXECUTE ON FUNCTION public.dev_ai_preview_allow(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.dev_ai_load(text, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.dev_ai_log(uuid, text, uuid, text, integer, integer, integer, boolean, jsonb, text) TO service_role;
