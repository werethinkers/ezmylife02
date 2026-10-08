-- Instant Digital Products Engine
-- One publishing model for every micro-product (birthday surprise, gym website, menu, invitation...).
--   ip_products : commercial settings per product (price, active, featured). The design lives in code.
--   ip_pages    : one row per created page. `content` is the owner's draft; `published_content` is the
--                 snapshot the public sees and can only be written by the publish functions below.
--   ip_orders   : Razorpay orders for pages, priced on the server.
--   ip_leads    : enquiries / RSVPs / orders submitted by visitors, readable only by the page owner.

-- ---------- products ----------
CREATE TABLE IF NOT EXISTS public.ip_products (
  id text PRIMARY KEY,
  family text NOT NULL CHECK (family IN ('celebration','festival','event','business','menu','profile')),
  category text NOT NULL,
  name text NOT NULL,
  price_inr integer NOT NULL CHECK (price_inr >= 0 AND price_inr <= 100000),
  hosting_days integer NOT NULL DEFAULT 365 CHECK (hosting_days > 0),
  is_active boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  sort integer NOT NULL DEFAULT 100,
  share_overrides jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ip_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ip_products: anyone reads active" ON public.ip_products FOR SELECT USING (is_active OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "ip_products: admins update" ON public.ip_products FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "ip_products: admins insert" ON public.ip_products FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ---------- pages ----------
CREATE TABLE IF NOT EXISTS public.ip_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id text NOT NULL REFERENCES public.ip_products(id),
  variant_id text NOT NULL,
  title text NOT NULL DEFAULT '',
  slug text UNIQUE,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','pending_payment','published','unpublished','removed')),
  content jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (pg_column_size(content) < 400000),
  published_content jsonb,
  published_variant_id text,
  views integer NOT NULL DEFAULT 0,
  published_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ip_pages_owner_idx ON public.ip_pages(owner_id, created_at DESC);
ALTER TABLE public.ip_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ip_pages: owner reads" ON public.ip_pages FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "ip_pages: owner creates" ON public.ip_pages FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());
CREATE POLICY "ip_pages: owner edits" ON public.ip_pages FOR UPDATE TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "ip_pages: owner deletes drafts" ON public.ip_pages FOR DELETE TO authenticated
  USING (owner_id = auth.uid() AND status IN ('draft','pending_payment'));

-- Owners may edit their draft, but never the publish state. Only the SECURITY DEFINER
-- functions below set the transaction-local flag `ip.trusted`, which PostgREST callers cannot.
CREATE OR REPLACE FUNCTION public.ip_pages_guard()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF coalesce(current_setting('ip.trusted', true), '') = 'on' THEN
    NEW.updated_at := now();
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.status := 'draft'; NEW.slug := NULL; NEW.published_content := NULL; NEW.published_variant_id := NULL;
    NEW.published_at := NULL; NEW.expires_at := NULL; NEW.views := 0;
  ELSE
    NEW.owner_id := OLD.owner_id; NEW.product_id := OLD.product_id; NEW.status := OLD.status; NEW.slug := OLD.slug;
    NEW.published_content := OLD.published_content; NEW.published_variant_id := OLD.published_variant_id;
    NEW.published_at := OLD.published_at; NEW.expires_at := OLD.expires_at; NEW.views := OLD.views;
    NEW.created_at := OLD.created_at;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS ip_pages_guard ON public.ip_pages;
CREATE TRIGGER ip_pages_guard BEFORE INSERT OR UPDATE ON public.ip_pages
  FOR EACH ROW EXECUTE FUNCTION public.ip_pages_guard();

-- ---------- orders ----------
CREATE TABLE IF NOT EXISTS public.ip_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  page_id uuid NOT NULL REFERENCES public.ip_pages(id) ON DELETE CASCADE,
  product_id text NOT NULL,
  inr_amount integer NOT NULL CHECK (inr_amount >= 0),
  status text NOT NULL DEFAULT 'created' CHECK (status IN ('created','paid','failed','free')),
  razorpay_order_id text UNIQUE,
  razorpay_payment_id text UNIQUE,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ip_orders_page_idx ON public.ip_orders(page_id);
ALTER TABLE public.ip_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ip_orders: owner reads" ON public.ip_orders FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- ---------- leads ----------
CREATE TABLE IF NOT EXISTS public.ip_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES public.ip_pages(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'lead' CHECK (kind IN ('lead','rsvp','order')),
  name text NOT NULL,
  phone text NOT NULL,
  message text,
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','converted','closed')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ip_leads_page_idx ON public.ip_leads(page_id, created_at DESC);
ALTER TABLE public.ip_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ip_leads: owner reads" ON public.ip_leads FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "ip_leads: owner updates" ON public.ip_leads FOR UPDATE TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "ip_leads: owner deletes" ON public.ip_leads FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

-- ---------- publishing ----------
CREATE OR REPLACE FUNCTION public.ip_slugify(_s text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT coalesce(nullif(left(trim(both '-' from regexp_replace(lower(coalesce(_s,'')), '[^a-z0-9]+', '-', 'g')), 40), ''), 'page');
$$;

-- Publishes a page: copies the draft into the public snapshot, picks a slug and an expiry.
-- Business-style pages get clean slugs; personal pages get an unguessable suffix.
CREATE OR REPLACE FUNCTION public.ip_publish_page(_page_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _p public.ip_pages%ROWTYPE;
  _prod public.ip_products%ROWTYPE;
  _base text; _slug text; _n int := 1;
BEGIN
  SELECT * INTO _p FROM public.ip_pages WHERE id = _page_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'reason', 'not_found'); END IF;
  SELECT * INTO _prod FROM public.ip_products WHERE id = _p.product_id;
  PERFORM set_config('ip.trusted', 'on', true);
  _slug := _p.slug;
  IF _slug IS NULL THEN
    _base := public.ip_slugify(_p.title);
    IF _prod.family IN ('business','menu','profile') THEN
      _slug := _base;
      WHILE EXISTS (SELECT 1 FROM public.ip_pages WHERE slug = _slug) OR _slug IN ('create','new','admin','api','login','my-pages') LOOP
        _n := _n + 1; _slug := _base || '-' || _n;
      END LOOP;
    ELSE
      LOOP
        _slug := _base || '-' || substr(md5(random()::text || clock_timestamp()::text), 1, 5);
        EXIT WHEN NOT EXISTS (SELECT 1 FROM public.ip_pages WHERE slug = _slug);
      END LOOP;
    END IF;
  END IF;
  UPDATE public.ip_pages SET
    slug = _slug, status = 'published', published_content = content, published_variant_id = variant_id,
    published_at = coalesce(published_at, now()),
    expires_at = coalesce(expires_at, now() + make_interval(days => coalesce(_prod.hosting_days, 365)))
  WHERE id = _page_id;
  RETURN jsonb_build_object('ok', true, 'slug', _slug);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.ip_publish_page(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ip_publish_page(uuid) TO service_role;

-- Called by the checkout function and the Razorpay webhook once Razorpay confirms the payment.
CREATE OR REPLACE FUNCTION public.ip_mark_order_paid(_razorpay_order_id text, _payment_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _o public.ip_orders%ROWTYPE; _r jsonb;
BEGIN
  IF coalesce(_razorpay_order_id,'') = '' OR coalesce(_payment_id,'') = '' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'missing_ids');
  END IF;
  SELECT * INTO _o FROM public.ip_orders WHERE razorpay_order_id = _razorpay_order_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'reason', 'not_found'); END IF;
  IF _o.status = 'paid' THEN
    IF _o.razorpay_payment_id = _payment_id THEN
      RETURN jsonb_build_object('ok', true, 'noop', true, 'slug', (SELECT slug FROM public.ip_pages WHERE id = _o.page_id));
    END IF;
    RETURN jsonb_build_object('ok', false, 'reason', 'already_paid_with_other_payment');
  END IF;
  IF EXISTS (SELECT 1 FROM public.ip_orders WHERE razorpay_payment_id = _payment_id)
     OR EXISTS (SELECT 1 FROM public.credit_purchases WHERE razorpay_payment_id = _payment_id) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'payment_already_used');
  END IF;
  UPDATE public.ip_orders SET status = 'paid', razorpay_payment_id = _payment_id, paid_at = now() WHERE id = _o.id;
  _r := public.ip_publish_page(_o.page_id);
  RETURN _r || jsonb_build_object('page_id', _o.page_id);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.ip_mark_order_paid(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ip_mark_order_paid(text, text) TO service_role;

-- Owners can push edits of an already-published page live again (typo fixes etc.) at no cost.
CREATE OR REPLACE FUNCTION public.ip_republish(_page_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _p public.ip_pages%ROWTYPE;
BEGIN
  SELECT * INTO _p FROM public.ip_pages WHERE id = _page_id FOR UPDATE;
  IF NOT FOUND OR _p.owner_id <> auth.uid() THEN RETURN jsonb_build_object('ok', false, 'reason', 'not_found'); END IF;
  IF _p.status NOT IN ('published','unpublished') THEN RETURN jsonb_build_object('ok', false, 'reason', 'not_published'); END IF;
  PERFORM set_config('ip.trusted', 'on', true);
  UPDATE public.ip_pages SET published_content = content, published_variant_id = variant_id, status = 'published' WHERE id = _page_id;
  RETURN jsonb_build_object('ok', true, 'slug', _p.slug);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.ip_republish(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ip_republish(uuid) TO authenticated;

-- Owners can take a page offline (and back with ip_republish).
CREATE OR REPLACE FUNCTION public.ip_unpublish(_page_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM set_config('ip.trusted', 'on', true);
  UPDATE public.ip_pages SET status = 'unpublished'
    WHERE id = _page_id AND status = 'published'
      AND (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
  RETURN jsonb_build_object('ok', FOUND);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.ip_unpublish(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ip_unpublish(uuid) TO authenticated;

-- ---------- public read ----------
-- The only way the public reads a page: the snapshot of a live, unexpired page. No owner details.
CREATE OR REPLACE FUNCTION public.ip_get_public_page(_slug text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'slug', p.slug, 'product_id', p.product_id, 'variant_id', p.published_variant_id,
    'content', p.published_content, 'published_at', p.published_at)
  FROM public.ip_pages p
  WHERE p.slug = _slug AND p.status = 'published' AND (p.expires_at IS NULL OR p.expires_at > now())
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.ip_get_public_page(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.ip_page_hit(_slug text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM set_config('ip.trusted', 'on', true);
  UPDATE public.ip_pages SET views = views + 1 WHERE slug = _slug AND status = 'published';
END;
$$;
GRANT EXECUTE ON FUNCTION public.ip_page_hit(text) TO anon, authenticated;

-- Visitors submit enquiries, RSVPs and orders here (never by direct insert). Rate-limited per page and phone.
CREATE OR REPLACE FUNCTION public.ip_submit_lead(_slug text, _kind text, _name text, _phone text, _message text, _context jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _p public.ip_pages%ROWTYPE; _ph text;
BEGIN
  SELECT * INTO _p FROM public.ip_pages WHERE slug = _slug AND status = 'published';
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'reason', 'page_not_found'); END IF;
  IF _kind NOT IN ('lead','rsvp','order') THEN RETURN jsonb_build_object('ok', false, 'reason', 'bad_kind'); END IF;
  _name := left(trim(coalesce(_name, '')), 80);
  _ph := regexp_replace(coalesce(_phone, ''), '\D', '', 'g');
  IF length(_ph) = 12 AND left(_ph, 2) = '91' THEN _ph := right(_ph, 10); END IF;
  IF length(_ph) = 11 AND left(_ph, 1) = '0' THEN _ph := right(_ph, 10); END IF;
  IF length(_name) < 2 THEN RETURN jsonb_build_object('ok', false, 'reason', 'name'); END IF;
  IF _ph !~ '^[6-9][0-9]{9}$' THEN RETURN jsonb_build_object('ok', false, 'reason', 'phone'); END IF;
  IF coalesce(pg_column_size(_context), 0) > 4000 THEN RETURN jsonb_build_object('ok', false, 'reason', 'too_large'); END IF;
  IF (SELECT count(*) FROM public.ip_leads WHERE page_id = _p.id AND phone = _ph AND created_at > now() - interval '1 day') >= 3
     OR (SELECT count(*) FROM public.ip_leads WHERE page_id = _p.id AND created_at > now() - interval '1 day') >= 300 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'rate_limited');
  END IF;
  INSERT INTO public.ip_leads(page_id, owner_id, kind, name, phone, message, context)
    VALUES (_p.id, _p.owner_id, _kind, _name, _ph, left(nullif(trim(coalesce(_message, '')), ''), 600), coalesce(_context, '{}'::jsonb));
  RETURN jsonb_build_object('ok', true);
END;
$$;
GRANT EXECUTE ON FUNCTION public.ip_submit_lead(text, text, text, text, text, jsonb) TO anon, authenticated;

-- ---------- storage for page photos ----------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('page-media', 'page-media', true, 5242880, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;
CREATE POLICY "page-media: public read" ON storage.objects FOR SELECT USING (bucket_id = 'page-media');
CREATE POLICY "page-media: owners upload to own folder" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'page-media' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "page-media: owners delete own" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'page-media' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ---------- product catalogue (104 products; prices are editable by admins) ----------
INSERT INTO public.ip_products (id, family, category, name, price_inr, is_featured, sort) VALUES
  ('birthday-surprise', 'celebration', 'celebrations', 'Birthday Surprise', 29, true, 1),
  ('anniversary', 'celebration', 'celebrations', 'Anniversary Love Note', 29, true, 2),
  ('valentine', 'celebration', 'celebrations', 'Valentine''s Day', 19, true, 3),
  ('proposal', 'celebration', 'celebrations', 'Will You Marry Me?', 49, false, 4),
  ('friendship', 'celebration', 'celebrations', 'Friendship Day', 19, false, 5),
  ('thank-you', 'celebration', 'celebrations', 'Thank You Card', 19, false, 6),
  ('congratulations', 'celebration', 'celebrations', 'Congratulations', 19, false, 7),
  ('farewell', 'celebration', 'celebrations', 'Farewell Wishes', 29, false, 8),
  ('retirement', 'celebration', 'celebrations', 'Happy Retirement', 29, false, 9),
  ('graduation', 'celebration', 'celebrations', 'Graduation Day', 19, false, 10),
  ('mothers-day', 'celebration', 'celebrations', 'Mother''s Day', 19, false, 11),
  ('fathers-day', 'celebration', 'celebrations', 'Father''s Day', 19, false, 12),
  ('teachers-day', 'celebration', 'celebrations', 'Teacher''s Day', 19, false, 13),
  ('baby-announcement', 'celebration', 'celebrations', 'Baby Announcement', 29, false, 14),
  ('get-well-soon', 'celebration', 'celebrations', 'Get Well Soon', 19, false, 15),
  ('sorry', 'celebration', 'celebrations', 'I''m Sorry', 19, false, 16),
  ('tribute', 'celebration', 'celebrations', 'In Loving Memory', 49, false, 17),
  ('diwali', 'festival', 'festivals', 'Diwali Greeting', 11, true, 18),
  ('holi', 'festival', 'festivals', 'Holi Greeting', 11, true, 19),
  ('raksha-bandhan', 'festival', 'festivals', 'Raksha Bandhan', 11, true, 20),
  ('christmas', 'festival', 'festivals', 'Christmas Card', 11, false, 21),
  ('new-year', 'festival', 'festivals', 'New Year Wishes', 11, true, 22),
  ('eid', 'festival', 'festivals', 'Eid Mubarak', 11, false, 23),
  ('independence-day', 'festival', 'festivals', 'Independence Day', 11, false, 24),
  ('republic-day', 'festival', 'festivals', 'Republic Day', 11, false, 25),
  ('womens-day', 'festival', 'festivals', 'Women''s Day', 11, false, 26),
  ('ganesh-chaturthi', 'festival', 'festivals', 'Ganesh Chaturthi', 11, false, 27),
  ('navratri', 'festival', 'festivals', 'Navratri & Dussehra', 11, false, 28),
  ('makar-sankranti', 'festival', 'festivals', 'Makar Sankranti', 11, false, 29),
  ('pongal-onam', 'festival', 'festivals', 'Pongal & Onam', 11, false, 30),
  ('mahavir-jayanti', 'festival', 'festivals', 'Mahavir Jayanti', 11, false, 31),
  ('kshamavani', 'festival', 'festivals', 'Micchami Dukkadam', 11, false, 32),
  ('gurpurab', 'festival', 'festivals', 'Gurpurab', 11, false, 33),
  ('wedding', 'event', 'events', 'Wedding Invitation', 99, true, 34),
  ('engagement', 'event', 'events', 'Engagement Invite', 79, false, 35),
  ('save-the-date', 'event', 'events', 'Save the Date', 49, false, 36),
  ('birthday-party', 'event', 'events', 'Birthday Party Invite', 49, true, 37),
  ('baby-shower', 'event', 'events', 'Baby Shower / Godh Bharai', 49, false, 38),
  ('naming-ceremony', 'event', 'events', 'Naming Ceremony', 49, false, 39),
  ('housewarming', 'event', 'events', 'Housewarming / Griha Pravesh', 49, false, 40),
  ('puja-invite', 'event', 'events', 'Puja / Religious Event', 49, false, 41),
  ('corporate-event', 'event', 'events', 'Corporate Event', 149, false, 42),
  ('workshop', 'event', 'events', 'Seminar / Workshop', 99, false, 43),
  ('meetup', 'event', 'events', 'Meetup / Community Event', 49, false, 44),
  ('college-fest', 'event', 'events', 'College Fest', 99, false, 45),
  ('store-opening', 'event', 'events', 'Store Opening', 99, false, 46),
  ('product-launch', 'event', 'events', 'Product Launch', 149, false, 47),
  ('conference', 'event', 'events', 'Conference', 199, false, 48),
  ('gym-website', 'business', 'business', 'Gym Website', 299, true, 49),
  ('personal-trainer', 'business', 'business', 'Personal Trainer', 199, false, 50),
  ('yoga-studio', 'business', 'business', 'Yoga Studio', 249, false, 51),
  ('salon', 'business', 'business', 'Salon', 249, true, 52),
  ('spa', 'business', 'business', 'Spa & Wellness', 249, false, 53),
  ('makeup-artist', 'business', 'business', 'Makeup Artist', 199, false, 54),
  ('mehendi-artist', 'business', 'business', 'Mehendi Artist', 149, false, 55),
  ('home-baker', 'business', 'business', 'Home Baker', 199, true, 56),
  ('tutor', 'business', 'business', 'Tutor', 149, true, 57),
  ('coaching-center', 'business', 'business', 'Coaching Center', 299, false, 58),
  ('music-teacher', 'business', 'business', 'Music Teacher', 149, false, 59),
  ('dance-teacher', 'business', 'business', 'Dance Classes', 149, false, 60),
  ('photographer', 'business', 'business', 'Photographer', 249, false, 61),
  ('event-planner', 'business', 'business', 'Event Planner', 249, false, 62),
  ('decorator', 'business', 'business', 'Decorator', 199, false, 63),
  ('florist', 'business', 'business', 'Florist', 199, false, 64),
  ('tailor', 'business', 'business', 'Tailor / Boutique Stitching', 149, false, 65),
  ('boutique', 'business', 'business', 'Boutique', 249, false, 66),
  ('jeweller', 'business', 'business', 'Jewellery Store', 299, false, 67),
  ('electrician', 'business', 'business', 'Electrician', 149, false, 68),
  ('plumber', 'business', 'business', 'Plumber', 149, false, 69),
  ('ac-repair', 'business', 'business', 'AC Repair & Service', 149, false, 70),
  ('car-detailing', 'business', 'business', 'Car Detailing', 199, false, 71),
  ('bike-repair', 'business', 'business', 'Bike Service', 149, false, 72),
  ('interior-designer', 'business', 'business', 'Interior Designer', 299, false, 73),
  ('consultant', 'business', 'business', 'Consultant', 249, false, 74),
  ('real-estate', 'business', 'business', 'Real Estate Agent', 299, false, 75),
  ('travel-agent', 'business', 'business', 'Travel Agent', 249, false, 76),
  ('chartered-accountant', 'business', 'business', 'Chartered Accountant', 249, false, 77),
  ('lawyer', 'business', 'business', 'Lawyer / Advocate', 249, false, 78),
  ('architect', 'business', 'business', 'Architect', 299, false, 79),
  ('clinic', 'business', 'business', 'Doctor / Clinic', 299, false, 80),
  ('freelancer-services', 'business', 'business', 'Freelancer Services', 199, false, 81),
  ('restaurant-menu', 'menu', 'menus', 'Restaurant Menu', 199, true, 82),
  ('cafe-menu', 'menu', 'menus', 'Cafe Menu', 149, false, 83),
  ('bakery-menu', 'menu', 'menus', 'Bakery Menu', 149, false, 84),
  ('cloud-kitchen', 'menu', 'menus', 'Cloud Kitchen', 199, false, 85),
  ('tiffin-service', 'menu', 'menus', 'Tiffin Service', 149, false, 86),
  ('street-food', 'menu', 'menus', 'Street Food Stall', 99, false, 87),
  ('sweet-shop', 'menu', 'menus', 'Sweet Shop', 149, false, 88),
  ('product-catalogue', 'menu', 'menus', 'Product Catalogue', 199, true, 89),
  ('boutique-catalogue', 'menu', 'menus', 'Boutique Catalogue', 199, false, 90),
  ('jewellery-catalogue', 'menu', 'menus', 'Jewellery Catalogue', 249, false, 91),
  ('gift-catalogue', 'menu', 'menus', 'Gift & Hamper Catalogue', 199, false, 92),
  ('salon-rate-card', 'menu', 'menus', 'Salon Rate Card', 99, false, 93),
  ('service-rate-card', 'menu', 'menus', 'Service Rate Card', 99, false, 94),
  ('digital-visiting-card', 'profile', 'profiles', 'Digital Visiting Card', 99, true, 95),
  ('resume', 'profile', 'profiles', 'Online Resume / CV', 99, true, 96),
  ('portfolio', 'profile', 'profiles', 'Portfolio', 149, false, 97),
  ('freelancer-profile', 'profile', 'profiles', 'Freelancer Profile', 99, false, 98),
  ('student-profile', 'profile', 'profiles', 'Student Profile', 49, false, 99),
  ('creator-bio-link', 'profile', 'profiles', 'Creator Bio Link', 49, true, 100),
  ('photographer-portfolio', 'profile', 'profiles', 'Photographer Portfolio', 149, false, 101),
  ('designer-portfolio', 'profile', 'profiles', 'Designer Portfolio', 149, false, 102),
  ('consultant-profile', 'profile', 'profiles', 'Consultant Profile', 149, false, 103),
  ('speaker-profile', 'profile', 'profiles', 'Speaker Profile', 149, false, 104)
ON CONFLICT (id) DO NOTHING;
