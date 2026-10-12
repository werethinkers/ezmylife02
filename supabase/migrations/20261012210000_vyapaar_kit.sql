-- The ₹999 kit sold on /kit, and the small parts of it an influencer may edit.
--
-- Three things live here:
--   1. Offer fields on `influencers` (community name, display name, end date, cap)
--      plus a public reader for the landing page and a self-edit function for the
--      influencer. The influencer can never change their own commission or code.
--   2. `kit_entitlements`: the website and the visiting card the kit promises,
--      granted when the kit purchase is paid. They are prepaid, so publishing
--      them costs the buyer nothing.
--   3. `ip_publish_prepaid`, which publishes one of those pages for free.
--
-- No Razorpay or wallet code is touched. Credits still arrive through
-- apply_credit_purchase exactly as for any other pack; the kit is hooked in by a
-- trigger that fires only after that function has marked the purchase paid.

-- ---------- 1. the offer an influencer presents ----------
ALTER TABLE public.influencers
  ADD COLUMN IF NOT EXISTS community_name text,
  ADD COLUMN IF NOT EXISTS display_name  text,
  ADD COLUMN IF NOT EXISTS offer_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS offer_cap     integer;

-- Read by the landing page for any visitor, signed in or not. It deliberately
-- returns nothing commercial: no commission percentage, no earnings, no buyers.
CREATE OR REPLACE FUNCTION public.influencer_offer_public(_code text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.influencers%ROWTYPE; v_claimed integer;
BEGIN
  SELECT * INTO r FROM public.influencers
  WHERE code = lower(trim(coalesce(_code, ''))) AND status = 'active';
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false); END IF;

  SELECT count(*) INTO v_claimed FROM public.influencer_commissions
  WHERE influencer_id = r.id AND status <> 'reversed';

  RETURN jsonb_build_object(
    'ok', true,
    'code', r.code,
    'name', coalesce(nullif(trim(coalesce(r.display_name, '')), ''), r.name),
    'community_name', nullif(trim(coalesce(r.community_name, '')), ''),
    'offer_ends_at', r.offer_ends_at,
    'offer_cap', r.offer_cap,
    'offers_claimed', v_claimed,
    'offers_left', CASE WHEN r.offer_cap IS NULL THEN NULL
                        ELSE greatest(r.offer_cap - v_claimed, 0) END,
    'expired', r.offer_ends_at IS NOT NULL AND r.offer_ends_at < now()
  );
END $$;

-- The influencer edits only these four fields, only on their own row.
-- Found by auth.uid(), so there is no way to pass someone else's id.
CREATE OR REPLACE FUNCTION public.influencer_update_offer(
  _community_name text, _display_name text, _offer_ends_at timestamptz, _offer_cap integer
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  SELECT id INTO v_id FROM public.influencers WHERE user_id = auth.uid();
  IF v_id IS NULL THEN RAISE EXCEPTION 'no_influencer_for_this_login'; END IF;

  IF _offer_cap IS NOT NULL AND (_offer_cap < 1 OR _offer_cap > 5000) THEN
    RAISE EXCEPTION 'Number of offers must be between 1 and 5000';
  END IF;
  IF _offer_ends_at IS NOT NULL AND _offer_ends_at > now() + interval '1 year' THEN
    RAISE EXCEPTION 'The end date cannot be more than a year away';
  END IF;
  IF length(coalesce(_community_name, '')) > 60 OR length(coalesce(_display_name, '')) > 60 THEN
    RAISE EXCEPTION 'Keep names under 60 characters';
  END IF;

  UPDATE public.influencers SET
    community_name = nullif(trim(coalesce(_community_name, '')), ''),
    display_name   = nullif(trim(coalesce(_display_name, '')), ''),
    offer_ends_at  = _offer_ends_at,
    offer_cap      = _offer_cap
  WHERE id = v_id;

  RETURN jsonb_build_object('ok', true);
END $$;

-- ---------- 2. what the kit hands over ----------
-- One row per promised item. 'scope' says what it may be spent on:
--   'business' — any one business-family website
--   'card'     — the digital visiting card
CREATE TABLE IF NOT EXISTS public.kit_entitlements (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  purchase_id uuid NOT NULL REFERENCES public.credit_purchases(id) ON DELETE CASCADE,
  scope       text NOT NULL CHECK (scope IN ('business', 'card')),
  page_id     uuid REFERENCES public.ip_pages(id) ON DELETE SET NULL,
  used_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);
-- Makes granting idempotent: the webhook and the browser both settle the same
-- purchase, and only one of them may create the rows.
CREATE UNIQUE INDEX IF NOT EXISTS kit_entitlements_purchase_scope_idx
  ON public.kit_entitlements(purchase_id, scope);
CREATE INDEX IF NOT EXISTS kit_entitlements_user_idx ON public.kit_entitlements(user_id);

ALTER TABLE public.kit_entitlements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "kit_entitlements: owner reads" ON public.kit_entitlements;
CREATE POLICY "kit_entitlements: owner reads" ON public.kit_entitlements
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Granted by trigger, after apply_credit_purchase has marked the purchase paid.
-- It only inserts entitlement rows; it never moves money or credits.
CREATE OR REPLACE FUNCTION public.kit_grant_on_paid()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.kit_entitlements (user_id, purchase_id, scope)
  VALUES (NEW.user_id, NEW.id, 'business'), (NEW.user_id, NEW.id, 'card')
  ON CONFLICT (purchase_id, scope) DO NOTHING;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS kit_grant_after_paid ON public.credit_purchases;
CREATE TRIGGER kit_grant_after_paid
  AFTER UPDATE OF status ON public.credit_purchases
  FOR EACH ROW
  WHEN (NEW.status = 'paid' AND OLD.status IS DISTINCT FROM 'paid' AND NEW.pack_id = 'kit999')
  EXECUTE FUNCTION public.kit_grant_on_paid();

-- What the buyer still has to spend, for /my-pages and the thank-you panel.
CREATE OR REPLACE FUNCTION public.kit_my_entitlements()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN coalesce((
    SELECT jsonb_agg(jsonb_build_object(
      'id', e.id, 'scope', e.scope, 'used', e.used_at IS NOT NULL,
      'page_id', e.page_id, 'bought_at', e.created_at
    ) ORDER BY e.created_at DESC, e.scope)
    FROM public.kit_entitlements e WHERE e.user_id = auth.uid()
  ), '[]'::jsonb);
END $$;

-- ---------- 3. publishing a prepaid page ----------
-- Publishes one page the kit already paid for. The entitlement is the receipt:
-- it is claimed in the same statement that reads it, so a page cannot be
-- published twice on one entitlement even if the button is pressed twice.
CREATE OR REPLACE FUNCTION public.ip_publish_prepaid(_page_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _p public.ip_pages%ROWTYPE;
  _prod public.ip_products%ROWTYPE;
  _scope text;
  _ent_id uuid;
  _r jsonb;
BEGIN
  SELECT * INTO _p FROM public.ip_pages WHERE id = _page_id FOR UPDATE;
  IF NOT FOUND OR _p.owner_id <> auth.uid() THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_found');
  END IF;
  IF _p.status = 'published' THEN
    RETURN jsonb_build_object('ok', true, 'noop', true, 'slug', _p.slug);
  END IF;
  IF _p.status NOT IN ('draft', 'pending_payment') THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'wrong_status');
  END IF;

  SELECT * INTO _prod FROM public.ip_products WHERE id = _p.product_id AND is_active;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'reason', 'product_unavailable'); END IF;

  _scope := CASE WHEN _p.product_id = 'digital-visiting-card' THEN 'card'
                 WHEN _prod.family = 'business' THEN 'business' END;
  IF _scope IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_covered');
  END IF;

  UPDATE public.kit_entitlements SET used_at = now(), page_id = _page_id
  WHERE id = (
    SELECT e.id FROM public.kit_entitlements e
    WHERE e.user_id = auth.uid() AND e.scope = _scope AND e.used_at IS NULL
    ORDER BY e.created_at LIMIT 1 FOR UPDATE SKIP LOCKED
  )
  RETURNING id INTO _ent_id;
  IF _ent_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'no_entitlement');
  END IF;

  INSERT INTO public.ip_orders (user_id, page_id, product_id, inr_amount, status, paid_at)
  VALUES (auth.uid(), _page_id, _p.product_id, 0, 'free', now());

  _r := public.ip_publish_page(_page_id);
  IF coalesce((_r->>'ok')::boolean, false) IS NOT TRUE THEN
    -- Hand the entitlement back rather than swallowing it.
    RAISE EXCEPTION 'could not publish: %', coalesce(_r->>'reason', 'unknown');
  END IF;
  RETURN _r || jsonb_build_object('prepaid', true);
END $$;

REVOKE ALL ON FUNCTION public.influencer_update_offer(text, text, timestamptz, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.kit_my_entitlements() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.ip_publish_prepaid(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.influencer_offer_public(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.influencer_update_offer(text, text, timestamptz, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.kit_my_entitlements() TO authenticated;
GRANT EXECUTE ON FUNCTION public.ip_publish_prepaid(uuid) TO authenticated;
