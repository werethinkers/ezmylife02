-- Email updates alongside WhatsApp: every finished task gets an email too (receipts already do).
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_updates boolean NOT NULL DEFAULT true;

-- One row per email sent for a task. (kind, ref) is unique so each run is emailed once;
-- topic + created_at throttle chat-style apps.
CREATE TABLE IF NOT EXISTS public.email_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL,
  ref text NOT NULL,
  topic text,
  email text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (kind, ref)
);
CREATE INDEX IF NOT EXISTS email_notifications_user_idx ON public.email_notifications(user_id, kind, topic, created_at DESC);
ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "email_notifications: owner reads" ON public.email_notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
