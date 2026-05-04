
-- Bulk jobs table
CREATE TABLE public.bulk_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tool_id TEXT NOT NULL,
  tool_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  total_items INTEGER NOT NULL DEFAULT 0,
  completed_items INTEGER NOT NULL DEFAULT 0,
  failed_items INTEGER NOT NULL DEFAULT 0,
  input_manifest JSONB NOT NULL DEFAULT '[]'::jsonb,
  outputs JSONB NOT NULL DEFAULT '[]'::jsonb,
  output_zip_path TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.bulk_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own bulk jobs" ON public.bulk_jobs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own bulk jobs" ON public.bulk_jobs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own bulk jobs" ON public.bulk_jobs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own bulk jobs" ON public.bulk_jobs FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins view all bulk jobs" ON public.bulk_jobs FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Moderators view all bulk jobs" ON public.bulk_jobs FOR SELECT TO authenticated USING (has_role(auth.uid(), 'moderator'::app_role));

CREATE TRIGGER bulk_jobs_updated_at BEFORE UPDATE ON public.bulk_jobs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX idx_bulk_jobs_user_created ON public.bulk_jobs(user_id, created_at DESC);

ALTER PUBLICATION supabase_realtime ADD TABLE public.bulk_jobs;
ALTER TABLE public.bulk_jobs REPLICA IDENTITY FULL;

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('bulk-inputs', 'bulk-inputs', false)
  ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('bulk-outputs', 'bulk-outputs', false)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users read own bulk inputs" ON storage.objects FOR SELECT
  USING (bucket_id = 'bulk-inputs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users upload own bulk inputs" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'bulk-inputs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own bulk inputs" ON storage.objects FOR DELETE
  USING (bucket_id = 'bulk-inputs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users read own bulk outputs" ON storage.objects FOR SELECT
  USING (bucket_id = 'bulk-outputs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own bulk outputs" ON storage.objects FOR DELETE
  USING (bucket_id = 'bulk-outputs' AND auth.uid()::text = (storage.foldername(name))[1]);
