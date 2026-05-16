
-- Home sections (admin-editable)
CREATE TABLE public.home_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  subtitle text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.home_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view home sections"
  ON public.home_sections FOR SELECT
  USING (true);

CREATE POLICY "Admins manage home sections"
  ON public.home_sections FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_home_sections_updated_at
  BEFORE UPDATE ON public.home_sections
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Tool ↔ section assignments (many-to-many)
CREATE TABLE public.tool_section_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id text NOT NULL REFERENCES public.tools_catalog(id) ON DELETE CASCADE,
  section_id uuid NOT NULL REFERENCES public.home_sections(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tool_id, section_id)
);

CREATE INDEX idx_tsa_section ON public.tool_section_assignments(section_id, position);
CREATE INDEX idx_tsa_tool ON public.tool_section_assignments(tool_id);

ALTER TABLE public.tool_section_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view section assignments"
  ON public.tool_section_assignments FOR SELECT
  USING (true);

CREATE POLICY "Admins manage section assignments"
  ON public.tool_section_assignments FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- GSC URL index status
CREATE TABLE public.gsc_url_status (
  url text PRIMARY KEY,
  coverage_state text,
  indexing_state text,
  page_fetch_state text,
  robots_state text,
  last_crawl_time timestamptz,
  last_checked_at timestamptz,
  inspection_result jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_gsc_coverage ON public.gsc_url_status(coverage_state);
CREATE INDEX idx_gsc_last_checked ON public.gsc_url_status(last_checked_at);

ALTER TABLE public.gsc_url_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage gsc status"
  ON public.gsc_url_status FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Moderators view gsc status"
  ON public.gsc_url_status FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'moderator'::app_role));

CREATE TRIGGER trg_gsc_updated_at
  BEFORE UPDATE ON public.gsc_url_status
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Seed default home sections
INSERT INTO public.home_sections (slug, title, subtitle, display_order) VALUES
  ('hot', 'Hot Right Now', 'The AI tools everyone is using this week', 1),
  ('trending', 'Trending', 'Fast-rising apps across categories', 2),
  ('new', 'New Arrivals', 'Just launched on EZYOURLIFE', 3),
  ('editors_pick', 'Editor''s Pick', 'Hand-picked by our team', 4),
  ('most_used', 'Most Used', 'Top performers by usage', 5),
  ('staff_pick', 'Staff Pick', 'Favourites of the EZYOURLIFE crew', 6);

-- Backfill assignments from existing legacy home_section column
INSERT INTO public.tool_section_assignments (tool_id, section_id, position)
SELECT tc.id, hs.id, COALESCE(tc.display_order, 0)
FROM public.tools_catalog tc
JOIN public.home_sections hs ON hs.slug = tc.home_section
WHERE tc.home_section IS NOT NULL
ON CONFLICT DO NOTHING;
