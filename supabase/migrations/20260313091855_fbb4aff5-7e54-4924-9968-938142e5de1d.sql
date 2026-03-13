
CREATE TABLE public.tools_catalog (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  tool_types TEXT[] NOT NULL DEFAULT '{}',
  source TEXT NOT NULL CHECK (source IN ('business', 'featured')),
  is_live BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Public read access (anyone can browse tools)
ALTER TABLE public.tools_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view tools catalog"
ON public.tools_catalog
FOR SELECT
TO public
USING (true);

-- Admin write access
CREATE POLICY "Admins can insert tools"
ON public.tools_catalog
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update tools"
ON public.tools_catalog
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete tools"
ON public.tools_catalog
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Index for common queries
CREATE INDEX idx_tools_catalog_is_live ON public.tools_catalog (is_live);
CREATE INDEX idx_tools_catalog_source ON public.tools_catalog (source);
CREATE INDEX idx_tools_catalog_category ON public.tools_catalog (category);
