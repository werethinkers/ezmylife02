ALTER TABLE public.tools_catalog
  ADD COLUMN IF NOT EXISTS demo_input text,
  ADD COLUMN IF NOT EXISTS demo_output text;