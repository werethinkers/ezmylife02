-- Developer apps, part 2: bigger apps and more ways to send them.
--
-- * The app file limit goes from 2 MB to 10 MB (checks warn above 2 MB).
-- * Upload sessions: a file is sent in parts of up to 1 MB and joined on the server, so big files
--   work from the web page, from the connector (GitHub or link import, done by the server) and
--   from Claude Code on a computer (a one-time upload key, valid for 1 hour, for one file).
-- * dev_app_versions.source records how each file arrived (inline, upload, GitHub repo and commit,
--   link), shown to the admin. It is reported by the uploader, so it is information, not proof;
--   the checks and the admin's own test are what decide.
-- Additive: new table columns, two new tables and new functions; three functions get new bodies
-- with the same signatures. No existing app, price or charging function changes.

ALTER TABLE public.dev_app_versions ADD COLUMN IF NOT EXISTS source jsonb;

CREATE TABLE IF NOT EXISTS public.dev_uploads (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id        uuid NOT NULL REFERENCES public.dev_apps(id) ON DELETE CASCADE,
  developer_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key_hash      text UNIQUE,
  source        jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  expires_at    timestamptz NOT NULL DEFAULT now() + interval '1 hour',
  finished_at   timestamptz
);
CREATE INDEX IF NOT EXISTS dev_uploads_app_idx ON public.dev_uploads (app_id);
CREATE INDEX IF NOT EXISTS dev_uploads_developer_idx ON public.dev_uploads (developer_id);

CREATE TABLE IF NOT EXISTS public.dev_upload_parts (
  upload_id  uuid NOT NULL REFERENCES public.dev_uploads(id) ON DELETE CASCADE,
  part_no    integer NOT NULL CHECK (part_no BETWEEN 1 AND 40),
  data       text NOT NULL,
  PRIMARY KEY (upload_id, part_no)
);

-- Only the functions below touch these tables.
ALTER TABLE public.dev_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dev_upload_parts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.dev_uploads, public.dev_upload_parts FROM anon, authenticated;

-- Saving, shared by the web page, the connector and finished uploads. Internal only.
CREATE OR REPLACE FUNCTION public.dev_save_draft_as(_uid uuid, _app_id uuid, _html text, _listing jsonb, _source jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _latest dev_app_versions%ROWTYPE;
  _vid    uuid;
  _vno    integer;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Please sign in first.'; END IF;
  PERFORM 1 FROM dev_apps WHERE id = _app_id AND developer_id = _uid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'App not found.'; END IF;
  IF _html IS NOT NULL AND octet_length(_html) > 10000000 THEN
    RAISE EXCEPTION 'The app file is larger than 10 MB. Compress images or load big libraries from a CDN.';
  END IF;

  SELECT * INTO _latest FROM dev_app_versions WHERE app_id = _app_id ORDER BY version_no DESC LIMIT 1;
  IF _latest.status = 'submitted' THEN
    RAISE EXCEPTION 'This version is waiting for review. Withdraw it first to make changes.';
  ELSIF _latest.status IN ('draft', 'changes_requested') THEN
    _vid := _latest.id;
    _vno := _latest.version_no;
  ELSE
    INSERT INTO dev_app_versions (app_id, developer_id, version_no, html, source, name, short_description, description,
                                  category, tool_types, support_email)
    VALUES (_app_id, _uid, _latest.version_no + 1, _latest.html, _latest.source, _latest.name, _latest.short_description,
            _latest.description, _latest.category, _latest.tool_types, _latest.support_email)
    RETURNING id, version_no INTO _vid, _vno;
  END IF;

  UPDATE dev_app_versions SET
    html              = COALESCE(_html, html),
    source            = CASE WHEN _html IS NOT NULL THEN COALESCE(_source, jsonb_build_object('kind', 'inline')) ELSE source END,
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

-- The signed-in developer saving directly (small files and the listing).
CREATE OR REPLACE FUNCTION public.dev_save_draft(_app_id uuid, _html text DEFAULT NULL, _listing jsonb DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Please sign in first.'; END IF;
  RETURN public.dev_save_draft_as(auth.uid(), _app_id, _html, _listing, NULL);
END $$;

-- Keeps only the fields the admin is shown, trimmed.
CREATE OR REPLACE FUNCTION public.dev_clean_source(_s jsonb)
RETURNS jsonb
LANGUAGE sql IMMUTABLE
SET search_path = ''
AS $$
  SELECT CASE WHEN _s IS NULL OR jsonb_typeof(_s) <> 'object' THEN NULL ELSE jsonb_strip_nulls(jsonb_build_object(
    'kind', left(_s->>'kind', 20), 'repo', left(_s->>'repo', 200), 'path', left(_s->>'path', 300),
    'ref', left(_s->>'ref', 200), 'commit', left(_s->>'commit', 64), 'url', left(_s->>'url', 500),
    'file_name', left(_s->>'file_name', 200), 'via', left(_s->>'via', 40))) END;
$$;

-- Starts an upload of one app file. With _with_key the answer carries a one-time key that lets a
-- script without a sign-in (Claude Code on a computer) send this one file for the next hour.
CREATE OR REPLACE FUNCTION public.dev_begin_upload(_app_id uuid, _source jsonb DEFAULT NULL, _with_key boolean DEFAULT false)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _uid    uuid := auth.uid();
  _key    text;
  _id     uuid;
  _status text;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Please sign in first.'; END IF;
  PERFORM 1 FROM dev_apps WHERE id = _app_id AND developer_id = _uid;
  IF NOT FOUND THEN RAISE EXCEPTION 'App not found.'; END IF;
  SELECT status INTO _status FROM dev_app_versions WHERE app_id = _app_id ORDER BY version_no DESC LIMIT 1;
  IF _status = 'submitted' THEN
    RAISE EXCEPTION 'This version is waiting for review. Withdraw it first to make changes.';
  END IF;
  DELETE FROM dev_uploads WHERE expires_at < now() - interval '1 day';
  IF (SELECT count(*) FROM dev_uploads WHERE developer_id = _uid AND finished_at IS NULL AND expires_at > now()) >= 5 THEN
    RAISE EXCEPTION 'Too many uploads in progress. Finish them or wait an hour.';
  END IF;
  IF _with_key THEN
    _key := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  END IF;
  INSERT INTO dev_uploads (app_id, developer_id, key_hash, source)
  VALUES (_app_id, _uid, CASE WHEN _key IS NULL THEN NULL ELSE encode(sha256(convert_to(_key, 'UTF8')), 'hex') END,
          public.dev_clean_source(_source))
  RETURNING id INTO _id;
  RETURN jsonb_build_object('upload_id', _id, 'key', _key, 'expires_at', now() + interval '1 hour',
                            'max_part_bytes', 1000000, 'max_parts', 40, 'max_total_bytes', 10000000);
END $$;

CREATE OR REPLACE FUNCTION public.dev_put_part(_upload_id uuid, _part_no integer, _data text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _u dev_uploads%ROWTYPE;
BEGIN
  SELECT * INTO _u FROM dev_uploads WHERE id = _upload_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Upload not found.'; END IF;
  IF _u.finished_at IS NOT NULL THEN RAISE EXCEPTION 'This upload is already finished. Start a new one.'; END IF;
  IF _u.expires_at < now() THEN RAISE EXCEPTION 'This upload expired. Start a new one.'; END IF;
  IF _part_no IS NULL OR _part_no NOT BETWEEN 1 AND 40 THEN RAISE EXCEPTION 'Part numbers go from 1 to 40.'; END IF;
  IF _data IS NULL OR octet_length(_data) > 1000000 THEN RAISE EXCEPTION 'Each part can be up to 1 MB.'; END IF;
  INSERT INTO dev_upload_parts (upload_id, part_no, data) VALUES (_upload_id, _part_no, _data)
  ON CONFLICT (upload_id, part_no) DO UPDATE SET data = EXCLUDED.data;
END $$;

CREATE OR REPLACE FUNCTION public.dev_finish_upload_as(_upload_id uuid, _bytes integer, _parts integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _u    dev_uploads%ROWTYPE;
  _html text;
  _got  integer;
  _r    jsonb;
BEGIN
  SELECT * INTO _u FROM dev_uploads WHERE id = _upload_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Upload not found.'; END IF;
  IF _u.finished_at IS NOT NULL THEN RAISE EXCEPTION 'This upload is already finished. Start a new one.'; END IF;
  IF _u.expires_at < now() THEN RAISE EXCEPTION 'This upload expired. Start a new one.'; END IF;
  IF _parts IS NULL OR _parts NOT BETWEEN 1 AND 40 THEN RAISE EXCEPTION 'Part numbers go from 1 to 40.'; END IF;
  IF (SELECT count(*) FROM dev_upload_parts WHERE upload_id = _upload_id) <> _parts
     OR EXISTS (SELECT 1 FROM generate_series(1, _parts) g
                WHERE NOT EXISTS (SELECT 1 FROM dev_upload_parts p WHERE p.upload_id = _upload_id AND p.part_no = g)) THEN
    RAISE EXCEPTION 'Some parts are missing. Send parts 1 to %, then finish.', _parts;
  END IF;
  SELECT string_agg(data, '' ORDER BY part_no) INTO _html FROM dev_upload_parts WHERE upload_id = _upload_id;
  _got := octet_length(_html);
  IF _got <> _bytes THEN
    RAISE EXCEPTION 'The file arrived incomplete (% of % bytes). Upload it again.', _got, _bytes;
  END IF;
  _r := public.dev_save_draft_as(_u.developer_id, _u.app_id, _html, NULL,
          COALESCE(_u.source, jsonb_build_object('kind', 'upload')) || jsonb_build_object('bytes', _got, 'at', now()));
  DELETE FROM dev_upload_parts WHERE upload_id = _upload_id;
  UPDATE dev_uploads SET finished_at = now() WHERE id = _upload_id;
  RETURN _r || jsonb_build_object('bytes', _got);
END $$;

-- Signed-in developer: send parts, then finish.
CREATE OR REPLACE FUNCTION public.dev_upload_part(_upload_id uuid, _part_no integer, _data text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  PERFORM 1 FROM dev_uploads WHERE id = _upload_id AND developer_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'Upload not found.'; END IF;
  PERFORM public.dev_put_part(_upload_id, _part_no, _data);
  RETURN jsonb_build_object('ok', true, 'part_no', _part_no);
END $$;

CREATE OR REPLACE FUNCTION public.dev_finish_upload(_upload_id uuid, _bytes integer, _parts integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  PERFORM 1 FROM dev_uploads WHERE id = _upload_id AND developer_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'Upload not found.'; END IF;
  RETURN public.dev_finish_upload_as(_upload_id, _bytes, _parts);
END $$;

-- One-time key (no sign-in): the key stands in for the developer, for this one upload only.
CREATE OR REPLACE FUNCTION public.dev_keyed_upload_part(_key text, _part_no integer, _data text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _id uuid;
BEGIN
  SELECT id INTO _id FROM dev_uploads WHERE key_hash = encode(sha256(convert_to(COALESCE(_key, ''), 'UTF8')), 'hex');
  IF _id IS NULL THEN RAISE EXCEPTION 'Upload key not recognised. Ask for a new upload link.'; END IF;
  PERFORM public.dev_put_part(_id, _part_no, _data);
  RETURN jsonb_build_object('ok', true, 'part_no', _part_no);
END $$;

CREATE OR REPLACE FUNCTION public.dev_keyed_upload_finish(_key text, _bytes integer, _parts integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _id uuid;
BEGIN
  SELECT id INTO _id FROM dev_uploads WHERE key_hash = encode(sha256(convert_to(COALESCE(_key, ''), 'UTF8')), 'hex');
  IF _id IS NULL THEN RAISE EXCEPTION 'Upload key not recognised. Ask for a new upload link.'; END IF;
  RETURN public.dev_finish_upload_as(_id, _bytes, _parts);
END $$;

-- Checks: same as before, with the new size limits.
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
  IF _bytes > 10000000 THEN
    _checks := _checks || public.dev_check('size', 'Size', 'fail', 'Larger than 10 MB.');
  ELSIF _bytes > 2000000 THEN
    _checks := _checks || public.dev_check('size', 'Size', 'warn', 'Over 2 MB (' || ceil(_bytes / 1048576.0) || ' MB). It will load slowly on phones; compress images or load libraries from a CDN.');
  ELSE
    _checks := _checks || public.dev_check('size', 'Size', 'pass', 'Under 2 MB.');
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

-- Admin queue: also says how the file arrived.
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
             v.support_email, v.release_notes, v.source, v.qa, v.qa_passed, v.qa_at, v.submitted_at,
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

-- Who may call what
REVOKE ALL ON FUNCTION public.dev_save_draft_as(uuid, uuid, text, jsonb, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.dev_put_part(uuid, integer, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.dev_finish_upload_as(uuid, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.dev_clean_source(jsonb) FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.dev_save_draft(uuid, text, jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.dev_begin_upload(uuid, jsonb, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.dev_upload_part(uuid, integer, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.dev_finish_upload(uuid, integer, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.dev_run_qa(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_dev_queue() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.dev_keyed_upload_part(text, integer, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.dev_keyed_upload_finish(text, integer, integer) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.dev_save_draft(uuid, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.dev_begin_upload(uuid, jsonb, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.dev_upload_part(uuid, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.dev_finish_upload(uuid, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.dev_run_qa(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_dev_queue() TO authenticated;
GRANT EXECUTE ON FUNCTION public.dev_keyed_upload_part(text, integer, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.dev_keyed_upload_finish(text, integer, integer) TO anon, authenticated;
