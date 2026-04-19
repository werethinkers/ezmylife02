-- Page views analytics
CREATE TABLE public.page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path text NOT NULL,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  country text,
  city text,
  user_agent text,
  session_id text,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_page_views_created_at ON public.page_views(created_at DESC);
CREATE INDEX idx_page_views_path ON public.page_views(path);
CREATE INDEX idx_page_views_utm_campaign ON public.page_views(utm_campaign);
CREATE INDEX idx_page_views_session_id ON public.page_views(session_id);
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log page views" ON public.page_views
  FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Admins can view analytics" ON public.page_views
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Moderators can view analytics" ON public.page_views
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'moderator'::app_role));

-- UTM links
CREATE TABLE public.utm_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  target_path text NOT NULL DEFAULT '/',
  utm_source text NOT NULL,
  utm_medium text NOT NULL,
  utm_campaign text NOT NULL,
  short_code text UNIQUE,
  click_count integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.utm_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage utm links" ON public.utm_links
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Moderators view utm links" ON public.utm_links
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'moderator'::app_role));

-- Coupon codes (admin-managed)
CREATE TABLE public.coupon_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text,
  access_type text NOT NULL DEFAULT 'lifetime',
  duration_days integer,
  max_uses integer,
  use_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.coupon_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage coupons" ON public.coupon_codes
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Moderators view coupons" ON public.coupon_codes
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'moderator'::app_role));
CREATE POLICY "Anyone can check coupon validity" ON public.coupon_codes
  FOR SELECT TO public USING (is_active = true);

-- Add icon_url to tools_catalog
ALTER TABLE public.tools_catalog ADD COLUMN IF NOT EXISTS icon_url text;

-- Seed existing hardcoded coupons
INSERT INTO public.coupon_codes (code, description, access_type, duration_days, is_active) VALUES
  ('ezmylife2000', 'Legacy lifetime coupon', 'lifetime', NULL, true),
  ('abhi2k', 'Legacy lifetime coupon', 'lifetime', NULL, true),
  ('abhi100', 'Legacy lifetime coupon', 'lifetime', NULL, true),
  ('ezylaunch', 'Launch offer - 30 days free', 'trial', 30, true)
ON CONFLICT (code) DO NOTHING;