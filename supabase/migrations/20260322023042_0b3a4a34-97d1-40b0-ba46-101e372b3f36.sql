
CREATE TABLE public.tool_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  tool_description text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tool_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit tool requests"
  ON public.tool_requests FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Admins can view all tool requests"
  ON public.tool_requests FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update tool requests"
  ON public.tool_requests FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete tool requests"
  ON public.tool_requests FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

ALTER PUBLICATION supabase_realtime ADD TABLE public.tool_requests;

CREATE TRIGGER handle_tool_requests_updated_at
  BEFORE UPDATE ON public.tool_requests
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();
