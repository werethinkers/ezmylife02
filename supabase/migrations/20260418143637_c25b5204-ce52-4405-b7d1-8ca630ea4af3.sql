-- Add is_free and display_order to tools_catalog
ALTER TABLE public.tools_catalog ADD COLUMN IF NOT EXISTS is_free boolean NOT NULL DEFAULT false;
ALTER TABLE public.tools_catalog ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_tools_catalog_display_order ON public.tools_catalog(display_order);

-- Create gemini_api_keys table
CREATE TABLE IF NOT EXISTS public.gemini_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_value text NOT NULL,
  label text,
  is_active boolean NOT NULL DEFAULT true,
  last_used_at timestamptz,
  failure_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gemini_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view gemini keys"
  ON public.gemini_api_keys FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert gemini keys"
  ON public.gemini_api_keys FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update gemini keys"
  ON public.gemini_api_keys FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete gemini keys"
  ON public.gemini_api_keys FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));