-- Developer apps, part 3: charge options.
--
-- A developer (or Claude on their behalf) can list how the app could be charged:
--   * "per_use": levels of use, for example "Quick estimate" and "Full report";
--   * "money": something the developer would sell in rupees, for example "Export pack, 49 rupees".
-- The admin sees every option when reviewing and decides how many credits each one costs. Rupee
-- options come with a suggested conversion at the worst case (the 999 rupee kit, 0.108 rupees a credit).
--
-- This only records proposals and the team's decision (dev_app_versions.charge_options and
-- dev_apps.charge_plan). It does not change how visitors are charged: the store still charges the
-- single price in tool_pricing when a visitor presses Start (UsageGate / tool-charge / start_tool_run
-- are untouched). Charging per option at use time would need changes to that code.
-- Additive: two columns, one helper, and new bodies for dev_save_draft_as, admin_dev_queue and
-- admin_dev_approve (which gets one optional fourth argument).

ALTER TABLE public.dev_app_versions ADD COLUMN IF NOT EXISTS charge_options jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.dev_apps ADD COLUMN IF NOT EXISTS charge_plan jsonb;

-- Checks and tidies what a developer sends. Up to 6 options.
CREATE OR REPLACE FUNCTION public.dev_clean_charge_options(_o jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
DECLARE
  _row   jsonb;
  _out   jsonb := '[]'::jsonb;
  _label text;
  _kind  text;
  _inr   numeric;
BEGIN
  IF _o IS NULL OR jsonb_typeof(_o) = 'null' THEN RETURN '[]'::jsonb; END IF;
  IF jsonb_typeof(_o) <> 'array' THEN RAISE EXCEPTION 'Charge options must be a list.'; END IF;
  IF jsonb_array_length(_o) > 6 THEN RAISE EXCEPTION 'Up to 6 charge options.'; END IF;
  FOR _row IN SELECT * FROM jsonb_array_elements(_o) LOOP
    IF jsonb_typeof(_row) <> 'object' THEN RAISE EXCEPTION 'Each charge option needs a name and a type.'; END IF;
    _label := left(trim(COALESCE(_row->>'label', '')), 60);
    IF length(_label) < 2 THEN RAISE EXCEPTION 'Each charge option needs a name.'; END IF;
    _kind := COALESCE(NULLIF(_row->>'kind', ''), 'per_use');
    IF _kind NOT IN ('per_use', 'money') THEN RAISE EXCEPTION 'A charge option is either per_use or money.'; END IF;
    _inr := NULL;
    IF _kind = 'money' THEN
      BEGIN
        _inr := round((_row->>'inr')::numeric, 2);
      EXCEPTION WHEN others THEN
        _inr := NULL;
      END;
      IF _inr IS NULL OR _inr <= 0 OR _inr > 100000 THEN
        RAISE EXCEPTION 'A rupee option needs a price between 1 and 100000 rupees.';
      END IF;
    END IF;
    _out := _out || jsonb_build_array(jsonb_strip_nulls(jsonb_build_object(
      'label', _label, 'kind', _kind, 'inr', _inr,
      'note', NULLIF(left(trim(COALESCE(_row->>'note', '')), 200), ''))));
  END LOOP;
  RETURN _out;
END $$;

-- Saving: same as before, plus charge_options inside the listing.
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
                                  category, tool_types, support_email, charge_options)
    VALUES (_app_id, _uid, _latest.version_no + 1, _latest.html, _latest.source, _latest.name, _latest.short_description,
            _latest.description, _latest.category, _latest.tool_types, _latest.support_email, _latest.charge_options)
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
    charge_options    = CASE WHEN _listing ? 'charge_options' THEN public.dev_clean_charge_options(_listing->'charge_options') ELSE charge_options END,
    status            = 'draft',
    qa = NULL, qa_passed = false, qa_at = NULL, html_sha256 = NULL,
    updated_at        = now()
  WHERE id = _vid;

  UPDATE dev_apps SET updated_at = now() WHERE id = _app_id;
  RETURN jsonb_build_object('version_id', _vid, 'version_no', _vno);
END $$;

-- Admin queue: also carries the developer's charge options.
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
             v.support_email, v.release_notes, v.source, v.charge_options, v.qa, v.qa_passed, v.qa_at, v.submitted_at,
             octet_length(v.html) AS bytes, v.html_sha256,
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

-- Approve: same as before, plus the team's credits for each charge option the developer listed.
-- _plan is a list in the same order as the version's charge_options: [{"credits": 40}, ...].
DROP FUNCTION IF EXISTS public.admin_dev_approve(uuid, integer, numeric);

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

  RETURN jsonb_build_object('ok', true, 'tool_id', _a.tool_id, 'path', '/tool/' || _a.tool_id,
                            'version_no', _v.version_no, 'credits', _credits, 'share_pct', _share_pct,
                            'charge_plan', CASE WHEN _n > 0 THEN _final ELSE NULL END);
END $$;

REVOKE ALL ON FUNCTION public.dev_clean_charge_options(jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_dev_approve(uuid, integer, numeric, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_dev_approve(uuid, integer, numeric, jsonb) TO authenticated;
REVOKE ALL ON FUNCTION public.admin_dev_queue() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_dev_queue() TO authenticated;
