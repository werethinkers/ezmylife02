
-- Create storage bucket for tool uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('tool-uploads', 'tool-uploads', true);

-- RLS: Anyone can read (public bucket for iframe loading)
CREATE POLICY "Public read access for tool uploads"
ON storage.objects FOR SELECT
USING (bucket_id = 'tool-uploads');

-- RLS: Only admins can upload/update/delete
CREATE POLICY "Admins can upload tool files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'tool-uploads' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update tool files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'tool-uploads' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete tool files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'tool-uploads' AND public.has_role(auth.uid(), 'admin'));

-- Generic tool sessions table for uploaded tools
CREATE TABLE public.tool_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tool_id text NOT NULL,
  session_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, tool_id)
);

ALTER TABLE public.tool_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tool sessions"
ON public.tool_sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tool sessions"
ON public.tool_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tool sessions"
ON public.tool_sessions FOR UPDATE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER handle_tool_sessions_updated_at
  BEFORE UPDATE ON public.tool_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Add has_uploaded_files column to tools_catalog
ALTER TABLE public.tools_catalog ADD COLUMN has_uploaded_files boolean NOT NULL DEFAULT false;

-- Add is_premium column to tools_catalog  
ALTER TABLE public.tools_catalog ADD COLUMN is_premium boolean NOT NULL DEFAULT false;

-- Add dedicated_route for tools that have internal routes
ALTER TABLE public.tools_catalog ADD COLUMN dedicated_route text DEFAULT NULL;
