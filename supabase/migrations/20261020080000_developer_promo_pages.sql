-- Developer apps, part 6: a promo page for every developer app, built in.
--
-- The developer (or their Claude) writes the promo copy (headline, tagline, who it is for, highlights, how
-- it works, questions) and adds screenshots. Checks require them. The admin sees all of it while reviewing.
-- On approval the copy and screenshots are written into tool_promo_pages, the table behind /promo/<name>,
-- so the page goes live with the app: no Publish, no code change. An update that is approved rewrites the
-- page; unlisting an app hides it.
-- Screenshots are stored in the database (png, jpeg or webp, 400 KB each, 6 per version) and copied into the
-- promo page as image data. Nothing here touches charging.
-- Additive. Redefines (in full) dev_save_draft_as, dev_run_qa, admin_dev_queue, admin_dev_approve and
-- admin_dev_set_listed on top of the charge-options and cost/frequency migrations: apply those first.

ALTER TABLE public.dev_app_versions ADD COLUMN IF NOT EXISTS promo jsonb;

CREATE TABLE IF NOT EXISTS public.dev_app_images (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id   uuid NOT NULL REFERENCES public.dev_app_versions(id) ON DELETE CASCADE,
  developer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  position     integer NOT NULL CHECK (position BETWEEN 1 AND 99),
  caption      text,
  mime         text NOT NULL CHECK (mime IN ('image/png', 'image/jpeg', 'image/webp')),
  data         text NOT NULL,
  bytes        integer NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (version_id, position)
);
CREATE INDEX IF NOT EXISTS dev_app_images_version_idx ON public.dev_app_images (version_id);

ALTER TABLE public.dev_app_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Developers read their images, admins read all" ON public.dev_app_images;
CREATE POLICY "Developers read their images, admins read all" ON public.dev_app_images
  FOR SELECT TO authenticated
  USING (developer_id = (SELECT auth.uid()) OR public.has_role((SELECT auth.uid()), 'admin'::public.app_role));
REVOKE ALL ON public.dev_app_images FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.dev_app_images FROM authenticated;

-- Promo copy: headline, tagline, audience, highlights [{title, body}], steps [{title, body}], faq [{q, a}].
CREATE OR REPLACE FUNCTION public.dev_clean_promo(_p jsonb)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
SET search_path = ''
AS $$
DECLARE
  _out jsonb;
  _hl  jsonb;
  _st  jsonb;
  _fq  jsonb;
BEGIN
  IF _p IS NULL OR jsonb_typeof(_p) = 'null' THEN RETURN NULL; END IF;
  IF jsonb_typeof(_p) <> 'object' THEN RAISE EXCEPTION 'The promo page must be an object with a headline, highlights and steps.'; END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object('title', left(trim(e->>'title'), 60), 'body', left(trim(COALESCE(e->>'body', '')), 220))), '[]'::jsonb)
    INTO _hl
    FROM (SELECT e FROM jsonb_array_elements(CASE WHEN jsonb_typeof(_p->'highlights') = 'array' THEN _p->'highlights' ELSE '[]'::jsonb END) e
          WHERE jsonb_typeof(e) = 'object' AND trim(COALESCE(e->>'title', '')) <> '' LIMIT 6) s;
  SELECT COALESCE(jsonb_agg(jsonb_build_object('title', left(trim(e->>'title'), 60), 'body', left(trim(COALESCE(e->>'body', '')), 220))), '[]'::jsonb)
    INTO _st
    FROM (SELECT e FROM jsonb_array_elements(CASE WHEN jsonb_typeof(_p->'steps') = 'array' THEN _p->'steps' ELSE '[]'::jsonb END) e
          WHERE jsonb_typeof(e) = 'object' AND trim(COALESCE(e->>'title', '')) <> '' LIMIT 5) s;
  SELECT COALESCE(jsonb_agg(jsonb_build_object('q', left(trim(e->>'q'), 120), 'a', left(trim(e->>'a'), 400))), '[]'::jsonb)
    INTO _fq
    FROM (SELECT e FROM jsonb_array_elements(CASE WHEN jsonb_typeof(_p->'faq') = 'array' THEN _p->'faq' ELSE '[]'::jsonb END) e
          WHERE jsonb_typeof(e) = 'object' AND trim(COALESCE(e->>'q', '')) <> '' AND trim(COALESCE(e->>'a', '')) <> '' LIMIT 5) s;

  _out := jsonb_build_object(
    'headline', left(trim(COALESCE(_p->>'headline', '')), 80),
    'tagline', left(trim(COALESCE(_p->>'tagline', '')), 200),
    'audience', left(trim(COALESCE(_p->>'audience', '')), 160),
    'highlights', _hl, 'steps', _st, 'faq', _fq);
  RETURN _out;
END $$;

-- Saving a draft now also takes the promo copy; the next version starts from the live one's promo and images.
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
                                  category, tool_types, support_email, charge_options, promo)
    VALUES (_app_id, _uid, _latest.version_no + 1, _latest.html, _latest.source, _latest.name, _latest.short_description,
            _latest.description, _latest.category, _latest.tool_types, _latest.support_email, _latest.charge_options, _latest.promo)
    RETURNING id, version_no INTO _vid, _vno;
    INSERT INTO dev_app_images (version_id, developer_id, position, caption, mime, data, bytes)
      SELECT _vid, developer_id, position, caption, mime, data, bytes FROM dev_app_images WHERE version_id = _latest.id;
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
    charge_options    = CASE WHEN _listing ? 'charge_options' THEN public.dev_clean_charge_options(_listing->'charge_options') ELSE charge_options END,
    promo             = CASE WHEN _listing ? 'promo' THEN public.dev_clean_promo(_listing->'promo') ELSE promo END,
    status            = 'draft',
    qa = NULL, qa_passed = false, qa_at = NULL, html_sha256 = NULL,
    updated_at        = now()
  WHERE id = _vid;

  UPDATE dev_apps SET updated_at = now() WHERE id = _app_id;
  RETURN jsonb_build_object('version_id', _vid, 'version_no', _vno);
END $$;

-- Screenshots -------------------------------------------------------------------------------------
-- The editable version of an app (starts the next version when the latest is live).
CREATE OR REPLACE FUNCTION public.dev_add_image(_app_id uuid, _mime text, _data text, _caption text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _uid    uuid := auth.uid();
  _latest dev_app_versions%ROWTYPE;
  _vid    uuid;
  _clean  text;
  _head   text;
  _n      integer;
  _pos    integer;
  _id     uuid;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Please sign in first.'; END IF;
  PERFORM 1 FROM dev_apps WHERE id = _app_id AND developer_id = _uid;
  IF NOT FOUND THEN RAISE EXCEPTION 'App not found.'; END IF;
  IF _mime IS NULL OR _mime NOT IN ('image/png', 'image/jpeg', 'image/webp') THEN
    RAISE EXCEPTION 'Screenshots must be png, jpeg or webp.';
  END IF;
  _clean := regexp_replace(COALESCE(_data, ''), '\s', '', 'g');
  IF _clean !~ '^[A-Za-z0-9+/]+={0,2}$' OR length(_clean) < 100 THEN RAISE EXCEPTION 'That is not image data.'; END IF;
  IF length(_clean) > 540000 THEN RAISE EXCEPTION 'The screenshot is over 400 KB. Shrink it (for example 1100 px wide, webp) and send it again.'; END IF;
  _head := encode(decode(left(_clean, 16), 'base64'), 'hex');
  IF NOT ((_mime = 'image/png' AND _head LIKE '89504e47%')
       OR (_mime = 'image/jpeg' AND _head LIKE 'ffd8ff%')
       OR (_mime = 'image/webp' AND _head LIKE '52494646%')) THEN
    RAISE EXCEPTION 'That file does not look like a % picture. Send a real screenshot.', replace(_mime, 'image/', '');
  END IF;

  SELECT * INTO _latest FROM dev_app_versions WHERE app_id = _app_id ORDER BY version_no DESC LIMIT 1;
  IF _latest.status = 'submitted' THEN
    RAISE EXCEPTION 'This version is waiting for review. Withdraw it first to make changes.';
  ELSIF _latest.status IN ('draft', 'changes_requested') THEN
    _vid := _latest.id;
  ELSE
    _vid := (public.dev_save_draft_as(_uid, _app_id, NULL, NULL, NULL)->>'version_id')::uuid;
  END IF;

  SELECT count(*), COALESCE(max(position), 0) INTO _n, _pos FROM dev_app_images WHERE version_id = _vid;
  IF _n >= 6 THEN RAISE EXCEPTION 'An app can have up to 6 screenshots. Remove one first.'; END IF;
  _pos := _pos + 1;
  INSERT INTO dev_app_images (version_id, developer_id, position, caption, mime, data, bytes)
  VALUES (_vid, _uid, _pos, NULLIF(left(trim(COALESCE(_caption, '')), 140), ''), _mime, _clean, (length(_clean) * 3) / 4)
  RETURNING id INTO _id;
  UPDATE dev_app_versions SET status = 'draft', qa = NULL, qa_passed = false, qa_at = NULL, html_sha256 = NULL, updated_at = now() WHERE id = _vid;
  RETURN jsonb_build_object('image_id', _id, 'position', _pos, 'version_id', _vid, 'count', _n + 1);
END $$;

CREATE OR REPLACE FUNCTION public.dev_remove_image(_image_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _i dev_app_images%ROWTYPE;
  _v dev_app_versions%ROWTYPE;
BEGIN
  SELECT * INTO _i FROM dev_app_images WHERE id = _image_id AND developer_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'Screenshot not found.'; END IF;
  SELECT * INTO _v FROM dev_app_versions WHERE id = _i.version_id FOR UPDATE;
  IF _v.status NOT IN ('draft', 'changes_requested') THEN
    RAISE EXCEPTION 'Only the version being edited can change its screenshots.';
  END IF;
  DELETE FROM dev_app_images WHERE id = _image_id;
  UPDATE dev_app_versions SET status = 'draft', qa = NULL, qa_passed = false, qa_at = NULL, html_sha256 = NULL, updated_at = now() WHERE id = _v.id;
  RETURN jsonb_build_object('ok', true);
END $$;

-- Checks: everything before, plus the promo page and screenshots.
CREATE OR REPLACE FUNCTION public.dev_run_qa(_version_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _qa     jsonb;
  _html   text;
  _promo  jsonb;
  _flags  text[];
  _checks jsonb;
  _imgs   integer;
  _problems text[] := '{}';
BEGIN
  _qa := public.dev_run_qa_base(_version_id);   -- access checks, the usual checks, and storing the result
  SELECT html, promo INTO _html, _promo FROM dev_app_versions WHERE id = _version_id;
  SELECT count(*) INTO _imgs FROM dev_app_images WHERE version_id = _version_id;
  _checks := _qa->'checks';

  _flags := public.dev_frequency_flags(COALESCE(_html, ''));
  IF cardinality(_flags) > 0 THEN
    _checks := _checks || jsonb_build_array(public.dev_check('repeat', 'Runs only when pressed', 'warn',
      'The app has repeating or scheduled behaviour (' || array_to_string(_flags, ', ') ||
      '). EzYourLife apps run only when the visitor presses a button, and every press is one use. Turn each repeat into a button, or ask for repeat runs to be listed as a charge option so the team can price them per run.'));
  ELSE
    _checks := _checks || jsonb_build_array(public.dev_check('repeat', 'Runs only when pressed', 'pass', 'No timers or schedules found.'));
  END IF;

  IF _promo IS NULL THEN
    _problems := _problems || 'no promo page text yet'::text;
  ELSE
    IF length(COALESCE(_promo->>'headline', '')) < 10 THEN _problems := _problems || 'a headline of at least 10 characters'::text; END IF;
    IF length(COALESCE(_promo->>'tagline', '')) < 20 THEN _problems := _problems || 'a tagline of at least 20 characters'::text; END IF;
    IF jsonb_array_length(COALESCE(_promo->'highlights', '[]'::jsonb)) < 3 THEN _problems := _problems || 'at least 3 highlights'::text; END IF;
    IF jsonb_array_length(COALESCE(_promo->'steps', '[]'::jsonb)) < 2 THEN _problems := _problems || 'at least 2 "how it works" steps'::text; END IF;
  END IF;
  IF cardinality(_problems) > 0 THEN
    _checks := _checks || jsonb_build_array(public.dev_check('promo', 'Promo page', 'fail',
      'The app gets its own page where visitors see what it does. It needs: ' || array_to_string(_problems, ', ') || '.'));
  ELSIF jsonb_array_length(COALESCE(_promo->'faq', '[]'::jsonb)) = 0 THEN
    _checks := _checks || jsonb_build_array(public.dev_check('promo', 'Promo page', 'warn', 'Ready. Two or three questions and answers would help visitors.'));
  ELSE
    _checks := _checks || jsonb_build_array(public.dev_check('promo', 'Promo page', 'pass', 'Headline, tagline, highlights and steps are in.'));
  END IF;

  IF _imgs = 0 THEN
    _checks := _checks || jsonb_build_array(public.dev_check('images', 'Screenshots', 'fail',
      'Add at least one real screenshot of the app, ideally 3 or more (the app in use, and what it produces).'));
  ELSIF _imgs < 3 THEN
    _checks := _checks || jsonb_build_array(public.dev_check('images', 'Screenshots', 'warn',
      _imgs || ' screenshot(s) added. 3 or more show the app better: the start screen, the app in use and the result.'));
  ELSE
    _checks := _checks || jsonb_build_array(public.dev_check('images', 'Screenshots', 'pass', _imgs || ' screenshots added.'));
  END IF;

  _qa := _qa || jsonb_build_object('checks', _checks, 'repeat_flags', to_jsonb(_flags),
                                   'passed', COALESCE((_qa->>'passed')::boolean, false) AND cardinality(_problems) = 0 AND _imgs > 0);
  UPDATE dev_app_versions SET qa = _qa, qa_passed = (_qa->>'passed')::boolean WHERE id = _version_id;
  RETURN _qa;
END $$;

-- Admin queue: also carries the promo copy, screenshot list and the live version, to compare an update with.
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
             v.support_email, v.release_notes, v.source, v.charge_options, v.promo, v.qa, v.qa_passed, v.qa_at, v.submitted_at,
             octet_length(v.html) AS bytes, v.html_sha256,
             COALESCE((SELECT jsonb_agg(jsonb_build_object('id', i.id, 'position', i.position, 'caption', i.caption, 'mime', i.mime, 'bytes', i.bytes) ORDER BY i.position)
                         FROM dev_app_images i WHERE i.version_id = v.id), '[]'::jsonb) AS images,
             public.dev_cost_estimate(
               octet_length(v.html),
               ARRAY(SELECT jsonb_array_elements_text(COALESCE(v.qa->'hosts', '[]'::jsonb)))) AS cost_estimate,
             CASE WHEN lv.id IS NULL THEN NULL ELSE jsonb_build_object(
               'version_no', lv.version_no, 'name', lv.name, 'short_description', lv.short_description,
               'description', lv.description, 'category', lv.category, 'tool_types', to_jsonb(lv.tool_types),
               'charge_options', lv.charge_options, 'promo', lv.promo, 'bytes', octet_length(lv.html),
               'html_sha256', lv.html_sha256, 'hosts', COALESCE(lv.qa->'hosts', '[]'::jsonb),
               'image_count', (SELECT count(*) FROM dev_app_images i WHERE i.version_id = lv.id)) END AS live,
             a.id AS app_id, a.tool_id, a.status AS app_status, a.credits, a.share_pct, a.charge_plan,
             lv.version_no AS live_version_no, u.email AS developer_email
      FROM dev_app_versions v
      JOIN dev_apps a ON a.id = v.app_id
      LEFT JOIN dev_app_versions lv ON lv.id = a.live_version_id
      LEFT JOIN auth.users u ON u.id = a.developer_id
      WHERE v.status = 'submitted'
    ) q
  );
END $$;

-- Approval: as before, and the promo page goes live with the app.
CREATE OR REPLACE FUNCTION public.admin_dev_approve(_version_id uuid, _credits integer, _share_pct numeric, _plan jsonb DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _uid   uuid := auth.uid();
  _v     dev_app_versions%ROWTYPE;
  _a     dev_apps%ROWTYPE;
  _n     integer;
  _i     integer;
  _cr    numeric;
  _final jsonb := '[]'::jsonb;
  _slug  text;
  _gallery jsonb;
BEGIN
  IF NOT public.has_role(_uid, 'admin'::public.app_role) THEN RAISE EXCEPTION 'Admins only.'; END IF;
  SELECT * INTO _v FROM dev_app_versions WHERE id = _version_id FOR UPDATE;
  IF NOT FOUND OR _v.status <> 'submitted' THEN RAISE EXCEPTION 'This version is not waiting for review.'; END IF;
  IF NOT _v.qa_passed THEN RAISE EXCEPTION 'This version has failed checks.'; END IF;
  IF _v.html_sha256 IS DISTINCT FROM encode(sha256(convert_to(_v.html, 'UTF8')), 'hex') THEN
    RAISE EXCEPTION 'The app changed after its checks. Ask the developer to run them again.';
  END IF;
  IF _v.promo IS NULL OR length(COALESCE(_v.promo->>'headline', '')) < 10
     OR NOT EXISTS (SELECT 1 FROM dev_app_images WHERE version_id = _v.id) THEN
    RAISE EXCEPTION 'The promo page text and at least one screenshot are missing. Ask the developer to add them and run the checks again.';
  END IF;
  IF _credits IS NULL OR _credits < 1 OR _credits > 100 THEN RAISE EXCEPTION 'Credits per use must be between 1 and 100.'; END IF;
  IF _share_pct IS NULL OR _share_pct < 0 OR _share_pct > 90 THEN RAISE EXCEPTION 'Developer share must be between 0 and 90%%.'; END IF;
  IF _v.category IS NULL OR NOT EXISTS (SELECT 1 FROM catalog_categories WHERE name = _v.category) THEN
    RAISE EXCEPTION 'The app needs a valid category.';
  END IF;

  _n := jsonb_array_length(COALESCE(_v.charge_options, '[]'::jsonb));
  IF _n > 0 THEN
    IF _plan IS NULL OR jsonb_typeof(_plan) <> 'array' OR jsonb_array_length(_plan) <> _n THEN
      RAISE EXCEPTION 'Set the credits for each of the % charge options the developer listed.', _n;
    END IF;
    FOR _i IN 0 .. _n - 1 LOOP
      IF jsonb_typeof(_plan->_i->'credits') <> 'number' THEN
        RAISE EXCEPTION 'Set the credits for each charge option.';
      END IF;
      _cr := (_plan->_i->>'credits')::numeric;
      IF _cr <> floor(_cr) OR _cr < 1 OR _cr > 5000 THEN
        RAISE EXCEPTION 'Credits for a charge option must be a whole number from 1 to 5000.';
      END IF;
      _final := _final || jsonb_build_array((_v.charge_options->_i) || jsonb_build_object('credits', _cr::integer));
    END LOOP;
  END IF;

  SELECT * INTO _a FROM dev_apps WHERE id = _v.app_id FOR UPDATE;

  UPDATE dev_app_versions SET status = 'superseded', updated_at = now() WHERE app_id = _a.id AND status = 'approved';
  UPDATE dev_app_versions SET status = 'approved', reviewed_by = _uid, reviewed_at = now(), updated_at = now() WHERE id = _v.id;
  UPDATE dev_apps SET status = 'live', live_version_id = _v.id, credits = _credits, share_pct = _share_pct,
         charge_plan = CASE WHEN _n > 0 THEN _final ELSE NULL END, updated_at = now()
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

  -- The promo page (/promo/<name>) is written from the developer's copy and screenshots.
  _slug := trim(both '-' from regexp_replace(lower(trim(_v.name)), '[^a-z0-9]+', '-', 'g'));
  IF _slug = '' OR EXISTS (SELECT 1 FROM tool_promo_pages WHERE slug = _slug AND tool_id <> _a.tool_id) THEN
    _slug := _a.tool_id;
  END IF;
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'url', 'data:' || mime || ';base64,' || data,
           'caption', COALESCE(caption, ''),
           'kind', CASE position WHEN 1 THEN 'screenshot' WHEN 2 THEN 'output' ELSE 'promotional' END) ORDER BY position), '[]'::jsonb)
    INTO _gallery FROM dev_app_images WHERE version_id = _v.id;
  INSERT INTO tool_promo_pages (tool_id, slug, is_published, hero_title, hero_subtitle, hero_chips, features, how_it_works,
                                gallery_images, seo_title, seo_description)
  VALUES (_a.tool_id, _slug, true, _v.promo->>'headline', _v.promo->>'tagline',
          CASE WHEN COALESCE(_v.promo->>'audience', '') <> '' THEN jsonb_build_array(jsonb_build_object('label', _v.promo->>'audience')) ELSE '[]'::jsonb END,
          COALESCE(_v.promo->'highlights', '[]'::jsonb), COALESCE(_v.promo->'steps', '[]'::jsonb), _gallery,
          left(_v.name || ' | EzYourLife', 70), left(_v.short_description, 160))
  ON CONFLICT (tool_id) DO UPDATE
    SET slug = EXCLUDED.slug, is_published = true, hero_title = EXCLUDED.hero_title, hero_subtitle = EXCLUDED.hero_subtitle,
        hero_chips = EXCLUDED.hero_chips, features = EXCLUDED.features, how_it_works = EXCLUDED.how_it_works,
        gallery_images = EXCLUDED.gallery_images, seo_title = EXCLUDED.seo_title, seo_description = EXCLUDED.seo_description,
        updated_at = now();

  RETURN jsonb_build_object('ok', true, 'tool_id', _a.tool_id, 'path', '/tool/' || _a.tool_id, 'promo_path', '/promo/' || _slug,
                            'version_no', _v.version_no, 'credits', _credits, 'share_pct', _share_pct,
                            'charge_plan', CASE WHEN _n > 0 THEN _final ELSE NULL END);
END $$;

-- Unlisting an app also hides its promo page.
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
  UPDATE tool_promo_pages SET is_published = _listed, updated_at = now() WHERE tool_id = _a.tool_id;
  RETURN jsonb_build_object('ok', true, 'status', CASE WHEN _listed THEN 'live' ELSE 'unlisted' END);
END $$;

REVOKE ALL ON FUNCTION public.dev_clean_promo(jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.dev_save_draft_as(uuid, uuid, text, jsonb, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.dev_add_image(uuid, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.dev_add_image(uuid, text, text, text) TO authenticated;
REVOKE ALL ON FUNCTION public.dev_remove_image(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.dev_remove_image(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.dev_run_qa(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.dev_run_qa(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.admin_dev_queue() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_dev_queue() TO authenticated;
REVOKE ALL ON FUNCTION public.admin_dev_approve(uuid, integer, numeric, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_dev_approve(uuid, integer, numeric, jsonb) TO authenticated;
REVOKE ALL ON FUNCTION public.admin_dev_set_listed(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_dev_set_listed(uuid, boolean) TO authenticated;
