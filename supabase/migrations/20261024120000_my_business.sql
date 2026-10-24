-- My Business: one tab where an owner runs their whole business (orders, bills, payments, stock,
-- purchases, expenses, GST, staff, reminders, website). See docs/my-business.md.
--
-- Nothing here touches the wallet, prices or credit-charging code. Entering data is free.
--
-- Each business is one row of biz_workspaces. Everything it keeps (customers, orders, bills, payments,
-- stock moves, reminders and the rest) is one row of biz_records with a kind and a jsonb body, so a new
-- field never needs SQL. Only the owner can read or write their rows.
-- The public website (/b/<slug>) reads through biz_public_site and sends orders and enquiries through
-- biz_site_order; both are security definer, return only what a visitor should see, and check input.

CREATE TABLE IF NOT EXISTS public.biz_workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  type_id text NOT NULL CHECK (char_length(type_id) BETWEEN 1 AND 80),
  settings jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (octet_length(settings::text) < 50000),
  slug text CHECK (slug ~ '^[a-z0-9][a-z0-9-]{1,39}$'),
  site_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS biz_workspaces_slug ON public.biz_workspaces (slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS biz_workspaces_user ON public.biz_workspaces (user_id);

CREATE TABLE IF NOT EXISTS public.biz_records (
  id uuid PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.biz_workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('customer', 'lead', 'product', 'material', 'order', 'appointment', 'bill', 'payment', 'supplier',
    'purchase', 'expense', 'stock_move', 'staff', 'attendance', 'reminder', 'campaign', 'licence')),
  data jsonb NOT NULL CHECK (octet_length(data::text) < 100000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS biz_records_ws ON public.biz_records (workspace_id, kind);
CREATE INDEX IF NOT EXISTS biz_records_ws_created ON public.biz_records (workspace_id, created_at);

ALTER TABLE public.biz_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.biz_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own businesses" ON public.biz_workspaces FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Own business records" ON public.biz_records FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.biz_workspaces w WHERE w.id = workspace_id AND w.user_id = auth.uid()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.biz_workspaces, public.biz_records TO authenticated;

-- Saves one action in one go: the records it adds or changes, the ones it removes, and settings.
-- Runs as the caller, so the policies above still decide what may be written.
CREATE OR REPLACE FUNCTION public.biz_apply(p_workspace uuid, p_upsert jsonb, p_remove uuid[], p_settings jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Sign in first'; END IF;
  IF NOT EXISTS (SELECT 1 FROM biz_workspaces WHERE id = p_workspace AND user_id = v_uid) THEN
    RAISE EXCEPTION 'Business not found';
  END IF;
  IF jsonb_typeof(coalesce(p_upsert, '[]'::jsonb)) <> 'array' OR jsonb_array_length(coalesce(p_upsert, '[]'::jsonb)) > 2000 THEN
    RAISE EXCEPTION 'Too many changes at once';
  END IF;

  IF p_remove IS NOT NULL AND array_length(p_remove, 1) > 0 THEN
    DELETE FROM biz_records WHERE workspace_id = p_workspace AND user_id = v_uid AND id = ANY (p_remove);
  END IF;

  INSERT INTO biz_records (id, workspace_id, user_id, kind, data, created_at, updated_at)
  SELECT (r->>'id')::uuid, p_workspace, v_uid, r->>'kind', r->'data',
         coalesce((r->>'created_at')::timestamptz, now()), coalesce((r->>'updated_at')::timestamptz, now())
  FROM jsonb_array_elements(coalesce(p_upsert, '[]'::jsonb)) r
  ON CONFLICT (id) DO UPDATE
    SET data = excluded.data, kind = excluded.kind, updated_at = excluded.updated_at
    WHERE biz_records.workspace_id = p_workspace AND biz_records.user_id = v_uid;

  IF p_settings IS NOT NULL AND p_settings <> '{}'::jsonb THEN
    UPDATE biz_workspaces
      SET settings = settings || p_settings,
          slug = CASE WHEN (settings || p_settings) #>> '{site,slug}' ~ '^[a-z0-9][a-z0-9-]{1,39}$' THEN (settings || p_settings) #>> '{site,slug}' ELSE slug END,
          site_published = coalesce(((settings || p_settings) #>> '{site,published}')::boolean, false),
          updated_at = now()
      WHERE id = p_workspace AND user_id = v_uid;
  END IF;
END;
$$;
GRANT EXECUTE ON FUNCTION public.biz_apply(uuid, jsonb, uuid[], jsonb) TO authenticated;

-- What a visitor sees on /b/<slug>: the business, how to reach it, and the items it shows on its site.
CREATE OR REPLACE FUNCTION public.biz_public_site(p_slug text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'name', w.name,
    'type_id', w.type_id,
    'about', w.settings #>> '{site,about}',
    'colour', coalesce(w.settings #>> '{site,colour}', 'sun'),
    'take_orders', coalesce((w.settings #>> '{site,take_orders}')::boolean, true),
    'city', w.settings ->> 'city',
    'address', w.settings ->> 'address',
    'phone', w.settings ->> 'phone',
    'labels', w.settings -> 'labels',
    'items', coalesce((
      SELECT jsonb_agg(jsonb_build_object('id', r.id, 'name', r.data->>'name', 'price', (r.data->>'price')::numeric,
               'unit', r.data->>'unit', 'type', r.data->>'type') ORDER BY r.data->>'name')
      FROM biz_records r
      WHERE r.workspace_id = w.id AND r.kind = 'product'
        AND coalesce((r.data->>'active')::boolean, true) AND coalesce((r.data->>'on_site')::boolean, true)
    ), '[]'::jsonb)
  )
  FROM biz_workspaces w
  WHERE w.slug = lower(p_slug) AND w.site_published;
$$;
GRANT EXECUTE ON FUNCTION public.biz_public_site(text) TO anon, authenticated;

-- An order or enquiry from the public website. Prices come from the owner's items, never from the visitor.
-- Website orders arrive without a bill; the owner accepts them in the app, which bills them and takes stock.
CREATE OR REPLACE FUNCTION public.biz_site_order(p_slug text, p_kind text, p_name text, p_phone text, p_items jsonb, p_note text, p_due timestamptz)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  w biz_workspaces%ROWTYPE;
  v_name text := btrim(coalesce(p_name, ''));
  v_phone text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  v_note text := left(btrim(coalesce(p_note, '')), 500);
  v_items jsonb := '[]'::jsonb;
  v_it jsonb;
  v_p biz_records%ROWTYPE;
  v_qty numeric;
  v_id uuid := gen_random_uuid();
  v_ref text := 'W-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
  v_now text := to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
BEGIN
  SELECT * INTO w FROM biz_workspaces WHERE slug = lower(p_slug) AND site_published;
  IF NOT FOUND THEN RAISE EXCEPTION 'This website is not live'; END IF;
  IF char_length(v_name) NOT BETWEEN 2 AND 80 THEN RAISE EXCEPTION 'Please enter your name'; END IF;
  IF char_length(v_phone) NOT BETWEEN 10 AND 13 THEN RAISE EXCEPTION 'Please enter a 10 digit phone number'; END IF;
  IF p_kind NOT IN ('order', 'lead') THEN RAISE EXCEPTION 'Unknown request'; END IF;

  IF (SELECT count(*) FROM biz_records WHERE workspace_id = w.id AND created_at > now() - interval '1 hour'
        AND data->>'via' = 'site') >= 40 THEN
    RAISE EXCEPTION 'Too many requests right now, please call the shop';
  END IF;
  IF (SELECT count(*) FROM biz_records WHERE workspace_id = w.id AND created_at > now() - interval '1 hour'
        AND data->>'via' = 'site' AND data->>'phone' = v_phone) >= 3 THEN
    RAISE EXCEPTION 'We already have your request, the shop will reach you soon';
  END IF;

  IF p_kind = 'lead' THEN
    INSERT INTO biz_records (id, workspace_id, user_id, kind, data)
    VALUES (v_id, w.id, w.user_id, 'lead', jsonb_build_object('name', v_name, 'phone', v_phone, 'want', coalesce(nullif(v_note, ''), 'Enquiry from website'),
      'source', 'Website', 'status', 'new', 'via', 'site'));
    INSERT INTO biz_records (id, workspace_id, user_id, kind, data)
    VALUES (gen_random_uuid(), w.id, w.user_id, 'reminder', jsonb_build_object('due_at', v_now, 'kind', 'lead', 'phone', v_phone, 'to_name', v_name,
      'text', 'Hello ' || v_name || ', thank you for your enquiry at ' || w.name || '. ' || CASE WHEN v_note <> '' THEN 'About "' || left(v_note, 120) || '": ' ELSE '' END || 'how can we help?',
      'ref_id', v_id, 'status', 'open', 'via', 'site'));
    RETURN v_ref;
  END IF;

  IF NOT coalesce((w.settings #>> '{site,take_orders}')::boolean, true) THEN RAISE EXCEPTION 'This shop is not taking orders online'; END IF;
  IF jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) NOT BETWEEN 1 AND 30 THEN RAISE EXCEPTION 'Pick at least one item'; END IF;
  FOR v_it IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_qty := (v_it->>'qty')::numeric;
    IF v_qty IS NULL OR v_qty <= 0 OR v_qty > 999 THEN RAISE EXCEPTION 'Check the quantities'; END IF;
    SELECT * INTO v_p FROM biz_records WHERE id = (v_it->>'id')::uuid AND workspace_id = w.id AND kind = 'product'
      AND coalesce((data->>'active')::boolean, true) AND coalesce((data->>'on_site')::boolean, true);
    IF NOT FOUND THEN RAISE EXCEPTION 'An item is no longer available'; END IF;
    v_items := v_items || jsonb_build_array(jsonb_build_object('product_id', v_p.id, 'name', v_p.data->>'name', 'qty', v_qty,
      'unit', v_p.data->>'unit', 'price', (v_p.data->>'price')::numeric, 'gst_rate', coalesce((v_p.data->>'gst_rate')::numeric, 0)));
  END LOOP;

  INSERT INTO biz_records (id, workspace_id, user_id, kind, data)
  VALUES (v_id, w.id, w.user_id, 'order', jsonb_build_object('number', v_ref, 'customer_name', v_name, 'phone', v_phone, 'items', v_items,
    'due_at', CASE WHEN p_due > now() THEN to_char(p_due AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') END,
    'status', 'new', 'source', 'website', 'notes', nullif(v_note, ''), 'advance', 0, 'via', 'site'));
  RETURN v_ref;
END;
$$;
GRANT EXECUTE ON FUNCTION public.biz_site_order(text, text, text, text, jsonb, text, timestamptz) TO anon, authenticated;
