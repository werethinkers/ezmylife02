-- WhatsApp updates (via Wavo): a message after every purchase and every finished AI task.

-- Edge functions read API keys kept in Supabase Vault (so they never live in git).
-- The WAVO_API_KEY secret itself is created directly in Vault, not in this file.
CREATE OR REPLACE FUNCTION public.app_secret(_name text)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, vault AS $$
  SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = _name LIMIT 1;
$$;
REVOKE EXECUTE ON FUNCTION public.app_secret(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.app_secret(text) TO service_role;

-- Customers can turn WhatsApp updates off from their profile.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS whatsapp_updates boolean NOT NULL DEFAULT true;

-- One row per message we send. (kind, ref) is unique so a payment confirmed twice
-- (browser + webhook) is messaged once; topic + created_at throttle repeated app runs.
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('purchase', 'task', 'page', 'bulk')),
  ref text NOT NULL,
  topic text,
  phone text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (kind, ref)
);
CREATE INDEX IF NOT EXISTS whatsapp_messages_user_idx ON public.whatsapp_messages(user_id, kind, topic, created_at DESC);
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "whatsapp_messages: owner reads" ON public.whatsapp_messages FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Private bucket for files we send on WhatsApp (invoices, generated images); shared by signed URL.
INSERT INTO storage.buckets (id, name, public) VALUES ('wa-media', 'wa-media', false) ON CONFLICT (id) DO NOTHING;
