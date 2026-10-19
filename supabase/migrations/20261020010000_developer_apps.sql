-- Developer apps: outside developers (or Claude working for them through the connector) submit
-- a single-file web app, test it in a sandboxed live preview, run checks on the server, and
-- submit it. An admin reviews it and one click publishes it to the store.
--
-- Additive only: two new tables and new functions. No existing row, app, price or charging
-- function is changed. Approving an app adds the same two rows every app already has:
-- a tools_catalog row (so it is listed) and a tool_pricing row (so the existing UsageGate /
-- tool-charge / start_tool_run flow charges it). Developer apps run in a sandboxed frame with
-- no access to the ezyourlife.com sign-in (src/apps/hosted/HostedApp.tsx).

-- ---------------------------------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.dev_apps (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- The catalogue id the app gets when it is published (/tool/<tool_id>). Always starts with
  -- "dev-" so it can never collide with an EzYourLife app.
  tool_id          text NOT NULL UNIQUE CHECK (tool_id ~ '^dev-[a-z0-9][a-z0-9-]{2,47}$'),
  status           text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'live', 'unlisted')),
  live_version_id  uuid,
  -- Set by Team EzYourLife at approval only. Developers and the connector cannot set these.
  credits          integer CHECK (credits BETWEEN 1 AND 100),
  share_pct        numeric(5,2) CHECK (share_pct BETWEEN 0 AND 90),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS dev_apps_developer_idx ON public.dev_apps (developer_id);

CREATE TABLE IF NOT EXISTS public.dev_app_versions (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id             uuid NOT NULL REFERENCES public.dev_apps(id) ON DELETE CASCADE,
  developer_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version_no         integer NOT NULL CHECK (version_no >= 1),
  -- draft → submitted → approved (live) | changes_requested | rejected; an approved version
  -- becomes superseded when a newer one is approved. Only draft and changes_requested can be edited.
  status             text NOT NULL DEFAULT 'draft'
                     CHECK (status IN ('draft', 'submitted', 'changes_requested', 'approved', 'rejected', 'superseded')),
  html               text NOT NULL DEFAULT '',
  html_sha256        text,
  name               text NOT NULL DEFAULT '',
  short_description  text NOT NULL DEFAULT '',
  description        text NOT NULL DEFAULT '',
  category           text,
  tool_types         text[] NOT NULL DEFAULT '{}',
  support_email      text,
  release_notes      text,
  qa                 jsonb,
  qa_passed          boolean NOT NULL DEFAULT false,
  qa_at              timestamptz,
  submitted_at       timestamptz,
  reviewed_by        uuid,
  reviewed_at        timestamptz,
  review_notes       text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (app_id, version_no)
);

CREATE INDEX IF NOT EXISTS dev_app_versions_developer_idx ON public.dev_app_versions (developer_id);
CREATE INDEX IF NOT EXISTS dev_app_versions_queue_idx ON public.dev_app_versions (submitted_at) WHERE status = 'submitted';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'dev_apps_live_version_fk') THEN
    ALTER TABLE public.dev_apps
      ADD CONSTRAINT dev_apps_live_version_fk FOREIGN KEY (live_version_id)
      REFERENCES public.dev_app_versions(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ---------------------------------------------------------------------------------------------
-- 2. Row-level security: a developer reads only their own apps; admins read everything.
--    There are no write policies: every change goes through the functions below, which keep
--    the draft → submitted → approved order and lock a version once it is submitted.
-- ---------------------------------------------------------------------------------------------

ALTER TABLE public.dev_apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dev_app_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Developers read their apps, admins read all" ON public.dev_apps;
CREATE POLICY "Developers read their apps, admins read all" ON public.dev_apps
  FOR SELECT TO authenticated
  USING (developer_id = (SELECT auth.uid()) OR public.has_role((SELECT auth.uid()), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Developers read their versions, admins read all" ON public.dev_app_versions;
CREATE POLICY "Developers read their versions, admins read all" ON public.dev_app_versions
  FOR SELECT TO authenticated
  USING (developer_id = (SELECT auth.uid()) OR public.has_role((SELECT auth.uid()), 'admin'::public.app_role));

REVOKE ALL ON public.dev_apps, public.dev_app_versions FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.dev_apps, public.dev_app_versions FROM authenticated;

-- ---------------------------------------------------------------------------------------------
-- 3. Small helpers for the checks (words for duplicate matching, one check row)
-- ---------------------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.dev_words(_t text)
RETURNS text[]
LANGUAGE sql IMMUTABLE
SET search_path = ''
AS $$
  SELECT COALESCE(array_agg(DISTINCT w), '{}')
  FROM regexp_split_to_table(lower(COALESCE(_t, '')), '[^a-z0-9]+') AS w
  WHERE length(w) >= 3
    AND w NOT IN ('the', 'and', 'for', 'with', 'your', 'you', 'any', 'from', 'into', 'that', 'this', 'are',
                  'app', 'apps', 'tool', 'tools', 'make', 'get', 'one', 'all', 'free', 'online', 'its', 'our',
                  'can', 'use', 'using', 'more', 'each', 'per', 'out', 'via', 'who', 'what', 'how', 'easy', 'fast');
$$;

CREATE OR REPLACE FUNCTION public.dev_overlap(a text[], b text[])
RETURNS numeric
LANGUAGE sql IMMUTABLE
SET search_path = ''
AS $$
  SELECT CASE WHEN cardinality(a) = 0 OR cardinality(b) = 0 THEN 0::numeric
    ELSE round(
      (SELECT count(*) FROM (SELECT unnest(a) INTERSECT SELECT unnest(b)) i)::numeric
      / (SELECT count(*) FROM (SELECT unnest(a) UNION SELECT unnest(b)) u), 2)
  END;
$$;

CREATE OR REPLACE FUNCTION public.dev_check(_id text, _label text, _status text, _detail text)
RETURNS jsonb
LANGUAGE sql IMMUTABLE
SET search_path = ''
AS $$
  SELECT jsonb_build_object('id', _id, 'label', _label, 'status', _status, 'detail', _detail);
$$;

-- ---------------------------------------------------------------------------------------------
-- 4. Developer functions (signed-in users)
-- ---------------------------------------------------------------------------------------------

-- Creates an app with its first draft version. _slug becomes the address /tool/dev-<slug>.
CREATE OR REPLACE FUNCTION public.dev_create_app(_slug text, _name text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _uid  uuid := auth.uid();
  _tool text;
  _app  uuid;
  _ver  uuid;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Please sign in first.'; END IF;
  _slug := trim(both '-' from regexp_replace(lower(trim(COALESCE(_slug, ''))), '[^a-z0-9]+', '-', 'g'));
  IF _slug !~ '^[a-z0-9][a-z0-9-]{2,47}$' THEN
    RAISE EXCEPTION 'The web address needs 3 to 48 letters, numbers or dashes.';
  END IF;
  IF length(trim(COALESCE(_name, ''))) < 3 THEN RAISE EXCEPTION 'The app name needs at least 3 characters.'; END IF;
  IF (SELECT count(*) FROM dev_apps WHERE developer_id = _uid) >= 10 THEN
    RAISE EXCEPTION 'You can have up to 10 apps for now.';
  END IF;
  _tool := 'dev-' || _slug;
  IF EXISTS (SELECT 1 FROM dev_apps WHERE tool_id = _tool) OR EXISTS (SELECT 1 FROM tools_catalog WHERE id = _tool) THEN
    RAISE EXCEPTION 'That web address is taken. Pick another one.';
  END IF;
  INSERT INTO dev_apps (developer_id, tool_id) VALUES (_uid, _tool) RETURNING id INTO _app;
  INSERT INTO dev_app_versions (app_id, developer_id, version_no, name)
    VALUES (_app, _uid, 1, left(trim(_name), 60)) RETURNING id INTO _ver;
  RETURN jsonb_build_object('app_id', _app, 'tool_id', _tool, 'version_id', _ver, 'version_no', 1);
END $$;

-- Saves the app file and/or listing to the editable version. If the latest version is already
-- approved (or rejected), this starts the next version from it, so a live app is never changed
-- in place. Any change clears the checks, so a version can only be submitted after fresh checks.
CREATE OR REPLACE FUNCTION public.dev_save_draft(_app_id uuid, _html text DEFAULT NULL, _listing jsonb DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _uid    uuid := auth.uid();
  _latest dev_app_versions%ROWTYPE;
  _vid    uuid;
  _vno    integer;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Please sign in first.'; END IF;
  PERFORM 1 FROM dev_apps WHERE id = _app_id AND developer_id = _uid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'App not found.'; END IF;
  IF _html IS NOT NULL AND octet_length(_html) > 2000000 THEN
    RAISE EXCEPTION 'The app file is larger than 2 MB. Compress images or load big libraries from a CDN.';
  END IF;

  SELECT * INTO _latest FROM dev_app_versions WHERE app_id = _app_id ORDER BY version_no DESC LIMIT 1;
  IF _latest.status = 'submitted' THEN
    RAISE EXCEPTION 'This version is waiting for review. Withdraw it first to make changes.';
  ELSIF _latest.status IN ('draft', 'changes_requested') THEN
    _vid := _latest.id;
    _vno := _latest.version_no;
  ELSE
    INSERT INTO dev_app_versions (app_id, developer_id, version_no, html, name, short_description, description,
                                  category, tool_types, support_email)
    VALUES (_app_id, _uid, _latest.version_no + 1, _latest.html, _latest.name, _latest.short_description,
            _latest.description, _latest.category, _latest.tool_types, _latest.support_email)
    RETURNING id, version_no INTO _vid, _vno;
  END IF;

  UPDATE dev_app_versions SET
    html              = COALESCE(_html, html),
    name              = CASE WHEN _listing ? 'name' THEN left(trim(_listing->>'name'), 60) ELSE name END,
    short_description = CASE WHEN _listing ? 'short_description' THEN left(trim(_listing->>'short_description'), 160) ELSE short_description END,
    description       = CASE WHEN _listing ? 'description' THEN left(trim(_listing->>'description'), 4000) ELSE description END,
    category          = CASE WHEN _listing ? 'category' THEN NULLIF(trim(_listing->>'category'), '') ELSE category END,
    tool_types        = CASE WHEN _listing ? 'tool_types' AND jsonb_typeof(_listing->'tool_types') = 'array'
                          THEN ARRAY(SELECT DISTINCT left(trim(x), 30) FROM jsonb_array_elements_text(_listing->'tool_types') AS x
                                     WHERE trim(x) <> '' LIMIT 5)
                          ELSE tool_types END,
    support_email     = CASE WHEN _listing ? 'support_email' THEN NULLIF(left(trim(_listing->>'support_email'), 200), '') ELSE support_email END,
    release_notes     = CASE WHEN _listing ? 'release_notes' THEN NULLIF(left(trim(_listing->>'release_notes'), 1000), '') ELSE release_notes END,
    status            = 'draft',
    qa = NULL, qa_passed = false, qa_at = NULL, html_sha256 = NULL,
    updated_at        = now()
  WHERE id = _vid;

  UPDATE dev_apps SET updated_at = now() WHERE id = _app_id;
  RETURN jsonb_build_object('version_id', _vid, 'version_no', _vno);
END $$;

-- Takes a submitted version back to draft so it can be changed.
CREATE OR REPLACE FUNCTION public.dev_withdraw(_version_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE dev_app_versions SET status = 'draft', submitted_at = NULL, updated_at = now()
  WHERE id = _version_id AND developer_id = auth.uid() AND status = 'submitted';
  IF NOT FOUND THEN RAISE EXCEPTION 'Only a version waiting for review can be withdrawn.'; END IF;
  RETURN jsonb_build_object('ok', true);
END $$;

-- The checks. They run here on the server, so the result the admin sees cannot be faked by the
-- developer's own tools. "fail" blocks submission; "warn" is shown to the developer and admin.
CREATE OR REPLACE FUNCTION public.dev_run_qa(_version_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _uid     uuid := auth.uid();
  _v       dev_app_versions%ROWTYPE;
  _tool    text;
  _h       text;
  _bytes   integer;
  _checks  jsonb := '[]'::jsonb;
  _found   text[];
  _hosts   text[];
  _missing text[] := '{}';
  _dups    jsonb;
  _words   text[];
  _qa      jsonb;
  _passed  boolean;
  _p       record;
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
  _h := COALESCE(_v.html, '');
  _bytes := octet_length(_h);

  -- App file
  IF _bytes < 50 OR _h !~* '<(html|body|div|main|script|form|section|canvas|button)' THEN
    _checks := _checks || public.dev_check('file', 'App file', 'fail',
      'Upload the app as one HTML file with its CSS and JavaScript inside it.');
  ELSE
    _checks := _checks || public.dev_check('file', 'App file', 'pass', 'One HTML file, ' || ceil(_bytes / 1024.0) || ' KB.');
  END IF;

  -- Size
  IF _bytes > 2000000 THEN
    _checks := _checks || public.dev_check('size', 'Size', 'fail', 'Larger than 2 MB.');
  ELSIF _bytes > 1000000 THEN
    _checks := _checks || public.dev_check('size', 'Size', 'warn', 'Over 1 MB. It will load slowly on phones.');
  ELSE
    _checks := _checks || public.dev_check('size', 'Size', 'pass', 'Under 1 MB.');
  END IF;

  -- Phones
  IF _h ~* '<meta[^>]+name\s*=\s*["'']?viewport' THEN
    _checks := _checks || public.dev_check('mobile', 'Fits phones', 'pass', 'Has a viewport tag.');
  ELSE
    _checks := _checks || public.dev_check('mobile', 'Fits phones', 'warn',
      'Add <meta name="viewport" content="width=device-width, initial-scale=1"> so the app fits phone screens. Check it in the phone preview.');
  END IF;

  -- Keys and secrets (never echo the key itself)
  _found := '{}';
  FOR _p IN SELECT * FROM (VALUES
      ('OpenAI or Anthropic key', 'sk-(ant-|proj-)?[A-Za-z0-9_-]{20,}'),
      ('Google API key', 'AIza[0-9A-Za-z_-]{35}'),
      ('AWS key', 'AKIA[0-9A-Z]{16}'),
      ('GitHub token', 'gh[pousr]_[A-Za-z0-9]{36}'),
      ('Slack token', 'xox[abprs]-[A-Za-z0-9-]{10,}'),
      ('Private key', '-----BEGIN [A-Z ]*PRIVATE KEY-----'),
      ('Access token (JWT)', 'eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}'),
      ('Key or secret in code', '(api[_-]?key|secret|access[_-]?token)\s*[:=]\s*["''][A-Za-z0-9_\-]{16,}["'']')
    ) AS t(label, pattern)
  LOOP
    IF _h ~* _p.pattern THEN _found := _found || _p.label; END IF;
  END LOOP;
  IF cardinality(_found) > 0 THEN
    _checks := _checks || public.dev_check('secrets', 'No keys or passwords', 'fail',
      'Remove these from the app: ' || array_to_string(_found, ', ') || '. Anyone can read an app''s code.');
  ELSE
    _checks := _checks || public.dev_check('secrets', 'No keys or passwords', 'pass', 'None found.');
  END IF;

  -- AI services (not allowed in developer apps for now: AI cost is EzYourLife's to control)
  SELECT COALESCE(array_agg(DISTINCT lower(m[1])), '{}') INTO _found
  FROM regexp_matches(_h, '(api\.openai\.com|api\.anthropic\.com|generativelanguage\.googleapis\.com|aiplatform\.googleapis\.com|api\.groq\.com|api\.mistral\.ai|api\.cohere\.(?:ai|com)|openrouter\.ai|api\.together\.(?:xyz|ai)|api-inference\.huggingface\.co|api\.deepseek\.com|api\.perplexity\.ai|api\.x\.ai|api\.replicate\.com)', 'gi') AS m;
  IF cardinality(_found) > 0 THEN
    _checks := _checks || public.dev_check('ai', 'No AI calls', 'fail',
      'Developer apps cannot call AI services for now. Remove calls to: ' || array_to_string(_found, ', ') || '.');
  ELSE
    _checks := _checks || public.dev_check('ai', 'No AI calls', 'pass', 'None found.');
  END IF;

  -- Own payments
  IF _h ~* '(checkout\.razorpay\.com|js\.stripe\.com|api\.stripe\.com|paypal\.com/sdk|cashfree\.com|paytm\.(com|in)/)' THEN
    _checks := _checks || public.dev_check('payments', 'No own payments', 'fail',
      'Apps cannot take payments. EzYourLife charges credits for every use.');
  ELSE
    _checks := _checks || public.dev_check('payments', 'No own payments', 'pass', 'None found.');
  END IF;

  -- Outside addresses the app talks to (the admin checks these)
  SELECT COALESCE(array_agg(DISTINCT h ORDER BY h), '{}') INTO _hosts
  FROM (SELECT lower(m[1]) AS h FROM regexp_matches(_h, 'https?://([A-Za-z0-9.-]+\.[A-Za-z]{2,})', 'g') AS m) s
  WHERE h NOT IN ('cdnjs.cloudflare.com', 'cdn.jsdelivr.net', 'unpkg.com', 'fonts.googleapis.com', 'fonts.gstatic.com',
                  'www.w3.org', 'w3.org', 'schema.org', 'cdn.tailwindcss.com', 'code.jquery.com',
                  'ezyourlife.com', 'www.ezyourlife.com');
  IF cardinality(_hosts) > 0 THEN
    _checks := _checks || public.dev_check('network', 'Outside addresses', 'warn',
      'The app loads or calls: ' || array_to_string(_hosts[1:15], ', ') || '. The admin will check these.');
  ELSE
    _checks := _checks || public.dev_check('network', 'Outside addresses', 'pass', 'Only well-known code libraries.');
  END IF;

  -- Browser storage is blocked in the sandbox
  IF _h ~ '(localStorage|sessionStorage|indexedDB|document\.cookie)' THEN
    _checks := _checks || public.dev_check('storage', 'Browser storage', 'warn',
      'The app uses browser storage, which is blocked inside the EzYourLife sandbox. Wrap it in try/catch and check the preview still works.');
  ELSE
    _checks := _checks || public.dev_check('storage', 'Browser storage', 'pass', 'Not used.');
  END IF;

  -- Trying to control the EzYourLife page
  IF _h ~ '(top\.location|parent\.location|window\.top\y|parent\.document)' THEN
    _checks := _checks || public.dev_check('frame', 'Stays in its frame', 'warn',
      'The app tries to reach the page around it. That is blocked; remove it.');
  ELSE
    _checks := _checks || public.dev_check('frame', 'Stays in its frame', 'pass', 'Yes.');
  END IF;

  -- Camera, microphone, location, notifications
  IF _h ~ '(getUserMedia|geolocation|Notification\.requestPermission)' THEN
    _checks := _checks || public.dev_check('device', 'Camera and location', 'warn',
      'Camera, microphone, location and notifications are blocked for developer apps for now.');
  END IF;

  -- Listing
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

  -- Same name as an app already in the store
  IF length(_v.name) >= 3 AND (
       EXISTS (SELECT 1 FROM tools_catalog WHERE lower(name) = lower(_v.name) AND id <> _tool)
    OR EXISTS (SELECT 1 FROM dev_app_versions o JOIN dev_apps a ON a.id = o.app_id
               WHERE o.app_id <> _v.app_id AND a.status = 'live' AND o.id = a.live_version_id AND lower(o.name) = lower(_v.name))) THEN
    _checks := _checks || public.dev_check('name', 'Unique name', 'fail', 'An app called "' || _v.name || '" is already in the store.');
  ELSE
    _checks := _checks || public.dev_check('name', 'Unique name', 'pass', 'No other app has this name.');
  END IF;

  -- Similar apps: flagged for the admin, never rejected automatically
  _words := public.dev_words(_v.name || ' ' || _v.short_description);
  SELECT COALESCE(jsonb_agg(d ORDER BY d.score DESC), '[]'::jsonb) INTO _dups FROM (
    SELECT * FROM (
      SELECT c.id AS tool_id, c.name, 'store'::text AS source,
             public.dev_overlap(_words, public.dev_words(c.name || ' ' || c.description)) AS score
      FROM tools_catalog c WHERE c.is_live AND c.id <> _tool
      UNION ALL
      SELECT a.tool_id, o.name, 'developer'::text,
             public.dev_overlap(_words, public.dev_words(o.name || ' ' || o.short_description))
      FROM dev_apps a
      JOIN LATERAL (SELECT * FROM dev_app_versions x WHERE x.app_id = a.id ORDER BY x.version_no DESC LIMIT 1) o ON true
      WHERE a.id <> _v.app_id AND o.status IN ('submitted', 'approved')
    ) all_apps
    WHERE score >= 0.34
    ORDER BY score DESC
    LIMIT 5
  ) d;
  IF jsonb_array_length(_dups) > 0 THEN
    _checks := _checks || public.dev_check('duplicates', 'Similar apps', 'warn',
      jsonb_array_length(_dups) || ' similar app(s) found. The admin decides whether yours is different enough.');
  ELSE
    _checks := _checks || public.dev_check('duplicates', 'Similar apps', 'pass', 'Nothing close in the store.');
  END IF;

  _passed := NOT EXISTS (SELECT 1 FROM jsonb_array_elements(_checks) c WHERE c->>'status' = 'fail');
  _qa := jsonb_build_object('checks', _checks, 'duplicates', _dups, 'hosts', to_jsonb(_hosts),
                            'bytes', _bytes, 'passed', _passed, 'ran_at', now());

  UPDATE dev_app_versions
     SET qa = _qa, qa_passed = _passed, qa_at = now(),
         html_sha256 = encode(sha256(convert_to(_h, 'UTF8')), 'hex')
   WHERE id = _version_id;
  RETURN _qa;
END $$;

-- Sends a version to the admin queue. Only after the checks passed on this exact content.
CREATE OR REPLACE FUNCTION public.dev_submit(_version_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _v dev_app_versions%ROWTYPE;
BEGIN
  SELECT * INTO _v FROM dev_app_versions WHERE id = _version_id AND developer_id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Version not found.'; END IF;
  IF _v.status NOT IN ('draft', 'changes_requested') THEN RAISE EXCEPTION 'This version was already sent.'; END IF;
  IF NOT _v.qa_passed OR _v.qa_at IS NULL THEN
    RAISE EXCEPTION 'Run the checks and fix everything marked "Must fix" before sending.';
  END IF;
  IF _v.html_sha256 IS DISTINCT FROM encode(sha256(convert_to(_v.html, 'UTF8')), 'hex') THEN
    RAISE EXCEPTION 'The app changed after its checks. Run the checks again.';
  END IF;
  UPDATE dev_app_versions
     SET status = 'submitted', submitted_at = now(), review_notes = NULL, reviewed_by = NULL, reviewed_at = NULL, updated_at = now()
   WHERE id = _version_id;
  RETURN jsonb_build_object('ok', true, 'status', 'submitted');
END $$;

-- ---------------------------------------------------------------------------------------------
-- 5. Admin functions
-- ---------------------------------------------------------------------------------------------

-- Versions waiting for review, oldest first (no app file; the preview loads it separately).
CREATE OR REPLACE FUNCTION public.admin_dev_queue()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN RAISE EXCEPTION 'Admins only.'; END IF;
  RETURN (
    SELECT COALESCE(jsonb_agg(to_jsonb(q) ORDER BY q.submitted_at), '[]'::jsonb) FROM (
      SELECT v.id AS version_id, v.version_no, v.name, v.short_description, v.description, v.category, v.tool_types,
             v.support_email, v.release_notes, v.qa, v.qa_passed, v.qa_at, v.submitted_at,
             octet_length(v.html) AS bytes, v.html_sha256,
             a.id AS app_id, a.tool_id, a.status AS app_status, a.credits, a.share_pct,
             lv.version_no AS live_version_no, u.email AS developer_email
      FROM dev_app_versions v
      JOIN dev_apps a ON a.id = v.app_id
      LEFT JOIN dev_app_versions lv ON lv.id = a.live_version_id
      LEFT JOIN auth.users u ON u.id = a.developer_id
      WHERE v.status = 'submitted'
    ) q
  );
END $$;

-- Every developer app with its latest version, for the admin's overview and take-downs.
CREATE OR REPLACE FUNCTION public.admin_dev_apps()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN RAISE EXCEPTION 'Admins only.'; END IF;
  RETURN (
    SELECT COALESCE(jsonb_agg(to_jsonb(q) ORDER BY q.updated_at DESC), '[]'::jsonb) FROM (
      SELECT a.id AS app_id, a.tool_id, a.status, a.credits, a.share_pct, a.updated_at,
             lv.version_no AS live_version_no, lt.version_no AS latest_version_no, lt.status AS latest_status,
             lt.name, u.email AS developer_email
      FROM dev_apps a
      LEFT JOIN dev_app_versions lv ON lv.id = a.live_version_id
      LEFT JOIN LATERAL (SELECT * FROM dev_app_versions x WHERE x.app_id = a.id ORDER BY x.version_no DESC LIMIT 1) lt ON true
      LEFT JOIN auth.users u ON u.id = a.developer_id
    ) q
  );
END $$;

-- One click: approve this exact version and put it live. Sets the price and the developer share.
-- Adds/updates the app's tools_catalog row (listed) and tool_pricing row (charged per use by the
-- existing UsageGate flow). The version that was live before is kept as "superseded".
CREATE OR REPLACE FUNCTION public.admin_dev_approve(_version_id uuid, _credits integer, _share_pct numeric)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _uid uuid := auth.uid();
  _v   dev_app_versions%ROWTYPE;
  _a   dev_apps%ROWTYPE;
BEGIN
  IF NOT public.has_role(_uid, 'admin'::public.app_role) THEN RAISE EXCEPTION 'Admins only.'; END IF;
  SELECT * INTO _v FROM dev_app_versions WHERE id = _version_id FOR UPDATE;
  IF NOT FOUND OR _v.status <> 'submitted' THEN RAISE EXCEPTION 'This version is not waiting for review.'; END IF;
  IF NOT _v.qa_passed THEN RAISE EXCEPTION 'This version has failed checks.'; END IF;
  IF _v.html_sha256 IS DISTINCT FROM encode(sha256(convert_to(_v.html, 'UTF8')), 'hex') THEN
    RAISE EXCEPTION 'The app changed after its checks. Ask the developer to run them again.';
  END IF;
  IF _credits IS NULL OR _credits < 1 OR _credits > 100 THEN RAISE EXCEPTION 'Credits per use must be between 1 and 100.'; END IF;
  IF _share_pct IS NULL OR _share_pct < 0 OR _share_pct > 90 THEN RAISE EXCEPTION 'Developer share must be between 0 and 90%%.'; END IF;
  IF _v.category IS NULL OR NOT EXISTS (SELECT 1 FROM catalog_categories WHERE name = _v.category) THEN
    RAISE EXCEPTION 'The app needs a valid category.';
  END IF;

  SELECT * INTO _a FROM dev_apps WHERE id = _v.app_id FOR UPDATE;

  UPDATE dev_app_versions SET status = 'superseded', updated_at = now() WHERE app_id = _a.id AND status = 'approved';
  UPDATE dev_app_versions SET status = 'approved', reviewed_by = _uid, reviewed_at = now(), updated_at = now() WHERE id = _v.id;
  UPDATE dev_apps SET status = 'live', live_version_id = _v.id, credits = _credits, share_pct = _share_pct, updated_at = now()
   WHERE id = _a.id;

  INSERT INTO tools_catalog (id, name, description, category, tool_types, source, is_live, is_premium, is_free, display_order, extra_categories)
  VALUES (_a.tool_id, _v.name, _v.short_description, _v.category, _v.tool_types, 'featured', true, false, false, 0, '{}')
  ON CONFLICT (id) DO UPDATE
    SET name = EXCLUDED.name, description = EXCLUDED.description, category = EXCLUDED.category,
        tool_types = EXCLUDED.tool_types, is_live = true, updated_at = now();

  INSERT INTO tool_pricing (tool_id, credit_cost, cost_inr, updated_by, updated_at)
  VALUES (_a.tool_id, _credits, 0, _uid, now())
  ON CONFLICT (tool_id) DO UPDATE
    SET credit_cost = EXCLUDED.credit_cost, cost_inr = 0, updated_by = _uid, updated_at = now();

  RETURN jsonb_build_object('ok', true, 'tool_id', _a.tool_id, 'path', '/tool/' || _a.tool_id,
                            'version_no', _v.version_no, 'credits', _credits, 'share_pct', _share_pct);
END $$;

-- Sends a version back to the developer with what to change.
CREATE OR REPLACE FUNCTION public.admin_dev_request_changes(_version_id uuid, _notes text, _reject boolean DEFAULT false)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN RAISE EXCEPTION 'Admins only.'; END IF;
  IF length(trim(COALESCE(_notes, ''))) < 5 THEN RAISE EXCEPTION 'Say what needs to change.'; END IF;
  UPDATE dev_app_versions
     SET status = CASE WHEN _reject THEN 'rejected' ELSE 'changes_requested' END,
         review_notes = left(trim(_notes), 2000), reviewed_by = auth.uid(), reviewed_at = now(), updated_at = now()
   WHERE id = _version_id AND status = 'submitted';
  IF NOT FOUND THEN RAISE EXCEPTION 'This version is not waiting for review.'; END IF;
  RETURN jsonb_build_object('ok', true);
END $$;

-- Takes a live developer app out of the store, or puts it back. Nothing is deleted.
CREATE OR REPLACE FUNCTION public.admin_dev_set_listed(_app_id uuid, _listed boolean)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _a dev_apps%ROWTYPE;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN RAISE EXCEPTION 'Admins only.'; END IF;
  SELECT * INTO _a FROM dev_apps WHERE id = _app_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'App not found.'; END IF;
  IF _listed AND _a.live_version_id IS NULL THEN RAISE EXCEPTION 'This app has no approved version yet.'; END IF;
  UPDATE dev_apps SET status = CASE WHEN _listed THEN 'live' ELSE 'unlisted' END, updated_at = now() WHERE id = _app_id;
  UPDATE tools_catalog SET is_live = _listed, updated_at = now() WHERE id = _a.tool_id;
  RETURN jsonb_build_object('ok', true, 'status', CASE WHEN _listed THEN 'live' ELSE 'unlisted' END);
END $$;

-- ---------------------------------------------------------------------------------------------
-- 6. Public: the live version of a published developer app, for /tool/<tool_id>
-- ---------------------------------------------------------------------------------------------

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
  WHERE a.tool_id = _tool_id AND a.status = 'live';
$$;

-- ---------------------------------------------------------------------------------------------
-- 7. Who may call what
-- ---------------------------------------------------------------------------------------------

REVOKE ALL ON FUNCTION public.dev_words(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.dev_overlap(text[], text[]) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.dev_check(text, text, text, text) FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.dev_create_app(text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.dev_save_draft(uuid, text, jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.dev_withdraw(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.dev_run_qa(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.dev_submit(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_dev_queue() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_dev_apps() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_dev_approve(uuid, integer, numeric) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_dev_request_changes(uuid, text, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_dev_set_listed(uuid, boolean) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.dev_create_app(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.dev_save_draft(uuid, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.dev_withdraw(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.dev_run_qa(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.dev_submit(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_dev_queue() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_dev_apps() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_dev_approve(uuid, integer, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_dev_request_changes(uuid, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_dev_set_listed(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_hosted_app(text) TO anon, authenticated;
