-- Developer apps, part 4: what an app really costs to run, and "runs only when pressed".
--
-- 1. Cost estimate for the admin only. admin_dev_queue now returns cost_estimate: the planning cost of one
--    run (bytes served per run plus a small fixed cost per run) and the minimum credits that keep a 3x margin
--    at the worst-case credit value (0.108 rupees). The developer and the connector never see it: it is
--    computed inside the admin-only function and stored nowhere a developer can read. A developer who asks
--    for a free app only proposes; credits are always at least 1 and always set by the team.
--    The numbers are planning assumptions (see dev_cost_estimate), not a bill.
-- 2. Frequency: apps run only when a visitor presses a button, and each press is one use. The checks now
--    flag timers, auto-refresh and schedule wording (a "LOOK" for the admin and the developer's Claude to
--    turn into a button). Repeat runs on a schedule would need a scheduler and changes to the charging code;
--    they are not built.
-- Additive. dev_run_qa is wrapped, not rewritten: the existing function is renamed dev_run_qa_base (no longer
-- callable by users) and the new dev_run_qa calls it, then adds one check.

CREATE OR REPLACE FUNCTION public.dev_cost_estimate(_bytes integer, _hosts text[])
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
SET search_path = ''
AS $$
DECLARE
  -- Planning assumptions. Change here when the real costs are known.
  _egress_inr_per_gb   constant numeric := 8;      -- rupees to serve one gigabyte (database read + bandwidth)
  _overhead_inr_per_run constant numeric := 0.01;  -- charge call, usage record, page load, per run
  _margin              constant numeric := 3;      -- same 3x rule as docs/pricing.md
  _worst_inr_per_credit constant numeric := 0.108; -- 999 rupee kit at the 50% commission cap
  _egress   numeric;
  _per_run  numeric;
  _notes    text[] := '{}';
BEGIN
  _egress := COALESCE(_bytes, 0)::numeric / 1000000000 * _egress_inr_per_gb;
  _per_run := _egress + _overhead_inr_per_run;
  IF COALESCE(cardinality(_hosts), 0) > 0 THEN
    _notes := _notes || 'The app calls outside addresses; their cost is not included.'::text;
  END IF;
  RETURN jsonb_build_object(
    'bytes', COALESCE(_bytes, 0),
    'egress_inr', round(_egress, 4),
    'overhead_inr', _overhead_inr_per_run,
    'per_run_inr', round(_per_run, 4),
    'margin', _margin,
    'worst_case_inr_per_credit', _worst_inr_per_credit,
    'min_credits', greatest(1, ceil(_per_run * _margin / _worst_inr_per_credit - 0.000001)::integer),
    'notes', to_jsonb(_notes));
END $$;

-- Words and code that mean "runs by itself or on a schedule".
CREATE OR REPLACE FUNCTION public.dev_frequency_flags(_h text)
RETURNS text[]
LANGUAGE plpgsql
IMMUTABLE
SET search_path = ''
AS $$
DECLARE
  _f text[] := '{}';
BEGIN
  IF _h ~ 'setInterval\s*\(' THEN _f := _f || 'setInterval'::text; END IF;
  IF _h ~* '<meta[^>]+http-equiv\s*=\s*["'']?refresh' THEN _f := _f || 'auto-refresh'::text; END IF;
  IF _h ~* '(node-cron|cron\.schedule|node-schedule|new\s+CronJob)' THEN _f := _f || 'cron or scheduler code'::text; END IF;
  IF _h ~* '((every|each)\s+(minute|hour|day|week|month)\y|\y(hourly|daily|weekly|monthly)\s+(run|job|report|schedule|check|digest|email|reminder|task|sync|backup))' THEN
    _f := _f || 'hourly, daily or monthly wording'::text;
  END IF;
  RETURN _f;
END $$;

DO $$
BEGIN
  IF to_regprocedure('public.dev_run_qa_base(uuid)') IS NULL THEN
    ALTER FUNCTION public.dev_run_qa(uuid) RENAME TO dev_run_qa_base;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.dev_run_qa(_version_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _qa     jsonb;
  _html   text;
  _flags  text[];
  _checks jsonb;
BEGIN
  _qa := public.dev_run_qa_base(_version_id);   -- access checks, the usual checks, and storing the result
  SELECT html INTO _html FROM dev_app_versions WHERE id = _version_id;
  _flags := public.dev_frequency_flags(COALESCE(_html, ''));
  IF cardinality(_flags) > 0 THEN
    _checks := (_qa->'checks') || jsonb_build_array(public.dev_check('repeat', 'Runs only when pressed', 'warn',
      'The app has repeating or scheduled behaviour (' || array_to_string(_flags, ', ') ||
      '). EzYourLife apps run only when the visitor presses a button, and every press is one use. Turn each repeat into a button, or ask for repeat runs to be listed as a charge option so the team can price them per run.'));
  ELSE
    _checks := (_qa->'checks') || jsonb_build_array(public.dev_check('repeat', 'Runs only when pressed', 'pass', 'No timers or schedules found.'));
  END IF;
  _qa := _qa || jsonb_build_object('checks', _checks, 'repeat_flags', to_jsonb(_flags));
  UPDATE dev_app_versions SET qa = _qa WHERE id = _version_id;
  RETURN _qa;
END $$;

-- Admin queue: also carries the cost estimate (admins only).
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
             public.dev_cost_estimate(
               octet_length(v.html),
               ARRAY(SELECT jsonb_array_elements_text(COALESCE(v.qa->'hosts', '[]'::jsonb)))) AS cost_estimate,
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

REVOKE ALL ON FUNCTION public.dev_cost_estimate(integer, text[]) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.dev_frequency_flags(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.dev_run_qa_base(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.dev_run_qa(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.dev_run_qa(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.admin_dev_queue() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_dev_queue() TO authenticated;
