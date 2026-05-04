
-- tool_media
CREATE TABLE public.tool_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('video','image','gif')),
  url text NOT NULL,
  poster_url text,
  alt text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_tool_media_tool_id ON public.tool_media(tool_id, sort_order);
ALTER TABLE public.tool_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view tool media" ON public.tool_media FOR SELECT USING (true);
CREATE POLICY "Admins insert tool media" ON public.tool_media FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Admins update tool media" ON public.tool_media FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Admins delete tool media" ON public.tool_media FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'::app_role));

-- enterprise_inquiries
CREATE TABLE public.enterprise_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  name text NOT NULL,
  email text NOT NULL,
  company text,
  company_size text,
  use_case text,
  message text,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.enterprise_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit inquiry" ON public.enterprise_inquiries FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins view inquiries" ON public.enterprise_inquiries FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Moderators view inquiries" ON public.enterprise_inquiries FOR SELECT TO authenticated USING (has_role(auth.uid(),'moderator'::app_role));
CREATE POLICY "Admins update inquiries" ON public.enterprise_inquiries FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Admins delete inquiries" ON public.enterprise_inquiries FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'::app_role));

CREATE TRIGGER trg_enterprise_inquiries_updated
BEFORE UPDATE ON public.enterprise_inquiries
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('tool-media','tool-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Tool media public read" ON storage.objects FOR SELECT USING (bucket_id = 'tool-media');
CREATE POLICY "Admins upload tool media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'tool-media' AND has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Admins update tool media files" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'tool-media' AND has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Admins delete tool media files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'tool-media' AND has_role(auth.uid(),'admin'::app_role));
