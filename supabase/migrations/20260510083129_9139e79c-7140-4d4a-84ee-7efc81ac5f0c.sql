ALTER TABLE public.virasat_media
  ADD COLUMN IF NOT EXISTS mp4_storage_path text,
  ADD COLUMN IF NOT EXISTS transcode_status text DEFAULT 'pending';