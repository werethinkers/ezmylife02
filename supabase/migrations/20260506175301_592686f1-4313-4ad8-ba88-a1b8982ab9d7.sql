ALTER TABLE public.tools_catalog
  ADD COLUMN IF NOT EXISTS preview_image_fit text NOT NULL DEFAULT 'cover'
  CHECK (preview_image_fit IN ('cover','contain'));