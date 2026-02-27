
-- Create table for storing startup analysis sessions per user
CREATE TABLE public.startup_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_name text NOT NULL,
  company_website text,
  analysis_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  markdown_report text,
  status text NOT NULL DEFAULT 'completed',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.startup_analyses ENABLE ROW LEVEL SECURITY;

-- Users can only see their own analyses
CREATE POLICY "Users can view their own analyses"
  ON public.startup_analyses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own analyses
CREATE POLICY "Users can insert their own analyses"
  ON public.startup_analyses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own analyses
CREATE POLICY "Users can update their own analyses"
  ON public.startup_analyses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can delete their own analyses
CREATE POLICY "Users can delete their own analyses"
  ON public.startup_analyses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all analyses
CREATE POLICY "Admins can view all analyses"
  ON public.startup_analyses FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add updated_at trigger
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.startup_analyses
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();
