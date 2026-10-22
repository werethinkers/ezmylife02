-- What the owner chose to show when their link is shared: picture, title, description and message.
-- Written by the owner from the share screen; read only by the owner's own screens.
ALTER TABLE public.ip_pages ADD COLUMN IF NOT EXISTS share_prefs jsonb;
