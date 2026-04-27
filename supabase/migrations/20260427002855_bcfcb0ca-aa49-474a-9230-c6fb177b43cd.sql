
-- Sessions table
CREATE TABLE IF NOT EXISTS public.virasat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'in_progress',
  book_style text NOT NULL DEFAULT 'emotional',
  input_mode text NOT NULL DEFAULT 'voice',
  child_name text,
  father_name text,
  history jsonb NOT NULL DEFAULT '[]'::jsonb,
  current_question text,
  question_count int NOT NULL DEFAULT 0,
  book_content text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.virasat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own virasat sessions" ON public.virasat_sessions
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all virasat sessions" ON public.virasat_sessions
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Moderators view all virasat sessions" ON public.virasat_sessions
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'moderator'::app_role));

CREATE TRIGGER virasat_sessions_set_updated_at
  BEFORE UPDATE ON public.virasat_sessions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_virasat_sessions_user ON public.virasat_sessions(user_id, updated_at DESC);

-- Media table
CREATE TABLE IF NOT EXISTS public.virasat_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.virasat_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  question_index int,
  chapter text,
  media_type text NOT NULL,
  storage_path text NOT NULL,
  caption text,
  duration_seconds numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.virasat_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own virasat media" ON public.virasat_media
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all virasat media" ON public.virasat_media
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Moderators view all virasat media" ON public.virasat_media
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'moderator'::app_role));

CREATE INDEX IF NOT EXISTS idx_virasat_media_session ON public.virasat_media(session_id);

-- Private bucket
INSERT INTO storage.buckets (id, name, public)
  VALUES ('virasat-media', 'virasat-media', false)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Virasat: users upload own media" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'virasat-media' AND auth.uid()::text = (storage.foldername(name))[1]
  );
CREATE POLICY "Virasat: users read own media" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'virasat-media' AND auth.uid()::text = (storage.foldername(name))[1]
  );
CREATE POLICY "Virasat: users delete own media" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'virasat-media' AND auth.uid()::text = (storage.foldername(name))[1]
  );
CREATE POLICY "Virasat: admins read all media" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'virasat-media' AND (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'moderator'::app_role))
  );
