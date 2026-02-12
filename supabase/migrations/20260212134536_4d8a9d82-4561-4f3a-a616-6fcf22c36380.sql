
-- Create table for PromptMaster user sessions
CREATE TABLE public.promptmaster_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT promptmaster_sessions_user_id_key UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.promptmaster_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own promptmaster session"
  ON public.promptmaster_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own promptmaster session"
  ON public.promptmaster_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own promptmaster session"
  ON public.promptmaster_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Auto-update timestamp trigger
CREATE TRIGGER update_promptmaster_sessions_updated_at
  BEFORE UPDATE ON public.promptmaster_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
