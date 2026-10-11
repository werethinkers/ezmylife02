-- Harmless go-live test for the 2,000-app launch (docs/launch-plan.md).
-- Only sets a description on the table; no data or structure changes.
COMMENT ON TABLE public.tools_catalog IS 'App catalogue. Rows are generated from the app data files; see docs/launch-plan.md.';
