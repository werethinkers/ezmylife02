CREATE TABLE public.virasat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'Meri Kahani',
  book_style text NOT NULL DEFAULT 'emotional',
  conversation jsonb NOT NULL DEFAULT '[]'::jsonb,
  chapter_outline jsonb,
  book_content text,
  status text NOT NULL DEFAULT 'recording',
  question_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.virasat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own virasat sessions"
ON public.virasat_sessions
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all virasat sessions"
ON public.virasat_sessions
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

CREATE INDEX idx_virasat_user_updated ON public.virasat_sessions(user_id, updated_at DESC);

CREATE TRIGGER update_virasat_sessions_updated_at
BEFORE UPDATE ON public.virasat_sessions
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

INSERT INTO public.tools_catalog (id, name, description, category, source, is_live, is_premium, is_free, dedicated_route, display_order, tool_types)
VALUES (
  'virasat',
  'Virasat — A Father''s Legacy',
  'Record your life stories by voice; AI turns them into a beautiful book for your children.',
  'AI Agent',
  'featured',
  true,
  true,
  false,
  '/virasat',
  5,
  ARRAY['ai-agent', 'voice', 'storytelling']
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  dedicated_route = EXCLUDED.dedicated_route,
  is_live = true,
  is_premium = true;