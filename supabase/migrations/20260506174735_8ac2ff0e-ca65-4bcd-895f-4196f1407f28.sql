ALTER TABLE public.tools_catalog
  ADD COLUMN IF NOT EXISTS rating numeric(3,2),
  ADD COLUMN IF NOT EXISTS review_count integer,
  ADD COLUMN IF NOT EXISTS preview_image_url text;