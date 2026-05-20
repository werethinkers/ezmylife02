
CREATE TABLE public.tool_promo_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id text NOT NULL UNIQUE REFERENCES public.tools_catalog(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  is_published boolean NOT NULL DEFAULT false,

  hero_eyebrow text,
  hero_title text,
  hero_title_accent text,
  hero_subtitle text,
  hero_image_url text,
  hero_chips jsonb NOT NULL DEFAULT '[]'::jsonb,

  cta_label text,
  cta_sublabel text,

  rating numeric(3,2),
  reviews_count integer,
  social_proof text,

  trust_logos jsonb NOT NULL DEFAULT '[]'::jsonb,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  how_it_works jsonb NOT NULL DEFAULT '[]'::jsonb,
  testimonials jsonb NOT NULL DEFAULT '[]'::jsonb,
  stats jsonb NOT NULL DEFAULT '{}'::jsonb,

  final_cta_title text,
  final_cta_subtitle text,
  footer_badges jsonb NOT NULL DEFAULT '[]'::jsonb,

  seo_title text,
  seo_description text,
  og_image_url text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tool_promo_pages_slug ON public.tool_promo_pages(slug);
CREATE INDEX idx_tool_promo_pages_published ON public.tool_promo_pages(is_published);

ALTER TABLE public.tool_promo_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published promo pages"
  ON public.tool_promo_pages FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins view all promo pages"
  ON public.tool_promo_pages FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins insert promo pages"
  ON public.tool_promo_pages FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update promo pages"
  ON public.tool_promo_pages FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete promo pages"
  ON public.tool_promo_pages FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_tool_promo_pages_updated_at
  BEFORE UPDATE ON public.tool_promo_pages
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
