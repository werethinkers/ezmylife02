-- Diwali 2026 (Indore push): the other Diwali-week cards, a live count of diyas lit, and shop co-branding.
-- Additive only: new product rows (insert-only), new tables and new functions. Nothing existing changes.

-- ---------- 1. Diwali-week cards (src/instant/catalog/festivals.ts). Same price as the Diwali card. ----------
INSERT INTO public.ip_products (id, family, category, name, price_inr, is_featured, sort) VALUES
  ('dhanteras', 'festival', 'festivals', 'Dhanteras Greeting', 11, true, 130),
  ('govardhan', 'festival', 'festivals', 'Govardhan Puja', 11, false, 131),
  ('bhai-dooj', 'festival', 'festivals', 'Bhai Dooj', 11, true, 132),
  ('veer-nirvan', 'festival', 'festivals', 'Jain Diwali (Veer Nirvan)', 11, true, 133)
ON CONFLICT (id) DO NOTHING;

-- ---------- 2. Live diya counter ----------
-- One row per card per browser that lit it. The total lives in ip_counters so reading it stays cheap.
-- Only real lights are counted: no seed value, at most 2,000 per card so one card can't run the number up.
CREATE TABLE IF NOT EXISTS public.ip_diya_lights (
  page_id uuid NOT NULL REFERENCES public.ip_pages(id) ON DELETE CASCADE,
  visitor text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (page_id, visitor)
);
ALTER TABLE public.ip_diya_lights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ip_diya_lights: admins read" ON public.ip_diya_lights FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.ip_counters (
  key text PRIMARY KEY,
  n bigint NOT NULL DEFAULT 0
);
ALTER TABLE public.ip_counters ENABLE ROW LEVEL SECURITY;
INSERT INTO public.ip_counters (key, n) VALUES ('diyas', 0) ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.ip_diya_count()
RETURNS bigint LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT n FROM public.ip_counters WHERE key = 'diyas'), 0);
$$;
GRANT EXECUTE ON FUNCTION public.ip_diya_count() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.ip_light_diya(_slug text, _visitor text)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _pid uuid; _added int; _n bigint;
BEGIN
  IF _visitor IS NULL OR length(_visitor) NOT BETWEEN 8 AND 64 THEN RETURN public.ip_diya_count(); END IF;
  SELECT id INTO _pid FROM public.ip_pages
   WHERE slug = _slug AND status = 'published' AND (expires_at IS NULL OR expires_at > now())
     AND product_id IN ('diwali', 'dhanteras', 'govardhan', 'bhai-dooj', 'veer-nirvan');
  IF _pid IS NULL THEN RETURN public.ip_diya_count(); END IF;
  IF (SELECT count(*) FROM public.ip_diya_lights WHERE page_id = _pid) >= 2000 THEN RETURN public.ip_diya_count(); END IF;
  INSERT INTO public.ip_diya_lights (page_id, visitor) VALUES (_pid, _visitor) ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS _added = ROW_COUNT;
  IF _added > 0 THEN
    UPDATE public.ip_counters SET n = n + 1 WHERE key = 'diyas' RETURNING n INTO _n;
    RETURN _n;
  END IF;
  RETURN public.ip_diya_count();
END;
$$;
GRANT EXECUTE ON FUNCTION public.ip_light_diya(text, text) TO anon, authenticated;

-- ---------- 3. Shops (mithai-box QR co-branding) ----------
-- A shop's QR opens /create/diwali?shop=<slug>. Cards made from it carry the shop's name, logo and
-- next-visit coupon (content.shop = slug), and the person who signs up is linked to the shop once.
CREATE TABLE IF NOT EXISTS public.ip_shops (
  slug text PRIMARY KEY CHECK (slug ~ '^[a-z0-9][a-z0-9-]{1,40}$'),
  name text NOT NULL CHECK (length(name) BETWEEN 2 AND 60),
  logo_url text,
  city text DEFAULT 'Indore',
  coupon_text text CHECK (coupon_text IS NULL OR length(coupon_text) <= 120),
  coupon_code text CHECK (coupon_code IS NULL OR length(coupon_code) <= 24),
  whatsapp text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ip_shops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ip_shops: admins manage" ON public.ip_shops FOR ALL
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- The public sees only what goes on a card.
CREATE OR REPLACE FUNCTION public.ip_get_shop(_slug text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object('slug', s.slug, 'name', s.name, 'logo_url', s.logo_url, 'city', s.city,
    'coupon_text', s.coupon_text, 'coupon_code', s.coupon_code)
  FROM public.ip_shops s WHERE s.slug = _slug AND s.is_active LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.ip_get_shop(text) TO anon, authenticated;

-- First shop wins: a person is linked to one shop, the one whose QR brought them.
CREATE TABLE IF NOT EXISTS public.ip_shop_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_slug text NOT NULL REFERENCES public.ip_shops(slug) ON UPDATE CASCADE ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ip_shop_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ip_shop_users: admins read" ON public.ip_shop_users FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.ip_tag_shop(_slug text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;
  INSERT INTO public.ip_shop_users (user_id, shop_slug)
  SELECT auth.uid(), s.slug FROM public.ip_shops s WHERE s.slug = _slug AND s.is_active
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;
GRANT EXECUTE ON FUNCTION public.ip_tag_shop(text) TO authenticated;

-- Admin report: people linked, live cards carrying the shop, and diyas lit on those cards.
CREATE OR REPLACE FUNCTION public.ip_shop_stats()
RETURNS TABLE (slug text, users bigint, cards bigint, lights bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'admins only'; END IF;
  RETURN QUERY
  SELECT s.slug,
    (SELECT count(*) FROM public.ip_shop_users u WHERE u.shop_slug = s.slug),
    (SELECT count(*) FROM public.ip_pages p WHERE p.status = 'published' AND p.published_content->>'shop' = s.slug),
    (SELECT count(*) FROM public.ip_diya_lights l JOIN public.ip_pages p ON p.id = l.page_id WHERE p.published_content->>'shop' = s.slug)
  FROM public.ip_shops s ORDER BY s.created_at DESC;
END;
$$;
GRANT EXECUTE ON FUNCTION public.ip_shop_stats() TO authenticated;
