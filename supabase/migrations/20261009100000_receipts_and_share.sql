-- Payment invoices: one per Razorpay payment, numbered per Indian financial year
-- (EZY/2026-27/000001). Written only by edge functions; customers can read their own.
CREATE TABLE IF NOT EXISTS public.payment_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_no text UNIQUE NOT NULL,
  kind text NOT NULL CHECK (kind IN ('credits','page')),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  customer_name text,
  description text NOT NULL,
  amount_inr numeric(12,2) NOT NULL,
  razorpay_payment_id text UNIQUE NOT NULL,
  razorpay_order_id text,
  emailed_at timestamptz,
  email_error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS payment_invoices_user_idx ON public.payment_invoices(user_id, created_at DESC);
ALTER TABLE public.payment_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payment_invoices: owner reads" ON public.payment_invoices FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.payment_invoice_counters (fy text PRIMARY KEY, last integer NOT NULL DEFAULT 0);
ALTER TABLE public.payment_invoice_counters ENABLE ROW LEVEL SECURITY;

-- Returns the invoice for this payment, creating it (with the next number) the first time.
CREATE OR REPLACE FUNCTION public.issue_payment_invoice(_kind text, _user_id uuid, _email text, _customer text,
  _description text, _amount numeric, _payment_id text, _order_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _inv public.payment_invoices%ROWTYPE; _fy text; _n int; _y int;
BEGIN
  SELECT * INTO _inv FROM public.payment_invoices WHERE razorpay_payment_id = _payment_id;
  IF NOT FOUND THEN
    _y := extract(year FROM now() AT TIME ZONE 'Asia/Kolkata')::int;
    IF extract(month FROM now() AT TIME ZONE 'Asia/Kolkata') < 4 THEN _y := _y - 1; END IF;
    _fy := _y || '-' || lpad(((_y + 1) % 100)::text, 2, '0');
    INSERT INTO public.payment_invoice_counters(fy, last) VALUES (_fy, 1)
      ON CONFLICT (fy) DO UPDATE SET last = payment_invoice_counters.last + 1
      RETURNING last INTO _n;
    INSERT INTO public.payment_invoices(invoice_no, kind, user_id, email, customer_name, description, amount_inr, razorpay_payment_id, razorpay_order_id)
      VALUES ('EZY/' || _fy || '/' || lpad(_n::text, 6, '0'), _kind, _user_id, _email, _customer, _description, _amount, _payment_id, _order_id)
      ON CONFLICT (razorpay_payment_id) DO NOTHING
      RETURNING * INTO _inv;
    IF _inv.id IS NULL THEN SELECT * INTO _inv FROM public.payment_invoices WHERE razorpay_payment_id = _payment_id; END IF;
  END IF;
  RETURN jsonb_build_object('id', _inv.id, 'invoice_no', _inv.invoice_no, 'created_at', _inv.created_at, 'emailed', _inv.emailed_at IS NOT NULL);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.issue_payment_invoice(text, uuid, text, text, text, numeric, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.issue_payment_invoice(text, uuid, text, text, text, numeric, text, text) TO service_role;

-- Link previews: each published page keeps its own share image and its share-page address.
ALTER TABLE public.ip_pages ADD COLUMN IF NOT EXISTS og_image text;
ALTER TABLE public.ip_pages ADD COLUMN IF NOT EXISTS share_url text;

CREATE OR REPLACE FUNCTION public.ip_get_public_page(_slug text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'slug', p.slug, 'product_id', p.product_id, 'variant_id', p.published_variant_id,
    'content', p.published_content, 'published_at', p.published_at, 'og_image', p.og_image)
  FROM public.ip_pages p
  WHERE p.slug = _slug AND p.status = 'published' AND (p.expires_at IS NULL OR p.expires_at > now())
  LIMIT 1;
$$;

-- share_url is written only by the server (like the publish columns).
CREATE OR REPLACE FUNCTION public.ip_pages_guard()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF coalesce(current_setting('ip.trusted', true), '') = 'on' THEN
    NEW.updated_at := now();
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.status := 'draft'; NEW.slug := NULL; NEW.published_content := NULL; NEW.published_variant_id := NULL;
    NEW.published_at := NULL; NEW.expires_at := NULL; NEW.views := 0; NEW.share_url := NULL;
  ELSE
    NEW.owner_id := OLD.owner_id; NEW.product_id := OLD.product_id; NEW.status := OLD.status; NEW.slug := OLD.slug;
    NEW.published_content := OLD.published_content; NEW.published_variant_id := OLD.published_variant_id;
    NEW.published_at := OLD.published_at; NEW.expires_at := OLD.expires_at; NEW.views := OLD.views;
    NEW.created_at := OLD.created_at; NEW.share_url := OLD.share_url;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.ip_set_share_url(_page_id uuid, _url text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM set_config('ip.trusted', 'on', true);
  UPDATE public.ip_pages SET share_url = _url WHERE id = _page_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.ip_set_share_url(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ip_set_share_url(uuid, text) TO service_role;
