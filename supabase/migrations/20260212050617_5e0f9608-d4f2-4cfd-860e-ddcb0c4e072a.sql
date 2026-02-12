
-- Create notebook_sessions table for per-user editor state persistence
CREATE TABLE public.notebook_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  editor_content TEXT DEFAULT '',
  session_shortcuts JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT notebook_sessions_user_id_unique UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.notebook_sessions ENABLE ROW LEVEL SECURITY;

-- Users can view their own session
CREATE POLICY "Users can view their own notebook session"
  ON public.notebook_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own session
CREATE POLICY "Users can insert their own notebook session"
  ON public.notebook_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own session
CREATE POLICY "Users can update their own notebook session"
  ON public.notebook_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger to auto-update updated_at
CREATE TRIGGER update_notebook_sessions_updated_at
  BEFORE UPDATE ON public.notebook_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
