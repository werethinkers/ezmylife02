-- The influencer chooses which website design and which card design their
-- audience is offered in the kit, within the kit's price range
-- (website up to Rs 299, card up to Rs 99). The default stays the shop-style
-- business website and the digital visiting card when nothing is chosen.
--
-- No Razorpay, wallet or credit code is touched. This only stores a choice,
-- shows it on /kit, and lets the free publish accept any card in range.

ALTER TABLE public.influencers
  ADD COLUMN IF NOT EXISTS kit_site_product text,
  ADD COLUMN IF NOT EXISTS kit_site_theme   text,
  ADD COLUMN IF NOT EXISTS kit_card_product text,
  ADD COLUMN IF NOT EXISTS kit_card_theme   text;

ALTER TABLE public.kit_entitlements
  ADD COLUMN IF NOT EXISTS pick_product text,
  ADD COLUMN IF NOT EXISTS pick_theme   text;

-- Which products a kit may cover. One place, used by the picker's check and by
-- the free publish below.
CREATE OR REPLACE FUNCTION public.kit_product_scope(_product_id text)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE
    WHEN p.family = 'business' AND p.price_inr <= 299 THEN 'business'
    WHEN p.family = 'profile'  AND p.price_inr <= 99  THEN 'card'
  END
  FROM public.ip_products p WHERE p.id = _product_id AND p.is_active
$$;

-- The influencer sets or clears their two picks. Found by auth.uid().
CREATE OR REPLACE FUNCTION public.influencer_update_kit_picks(
  _site_product text, _site_theme text, _card_product text, _card_theme text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  SELECT id INTO v_id FROM public.influencers WHERE user_id = auth.uid();
  IF v_id IS NULL THEN RAISE EXCEPTION 'no_influencer_for_this_login'; END IF;

  IF nullif(trim(coalesce(_site_product, '')), '') IS NOT NULL
     AND public.kit_product_scope(_site_product) IS DISTINCT FROM 'business' THEN
    RAISE EXCEPTION 'That website is outside the kit price range';
  END IF;
  IF nullif(trim(coalesce(_card_product, '')), '') IS NOT NULL
     AND public.kit_product_scope(_card_product) IS DISTINCT FROM 'card' THEN
    RAISE EXCEPTION 'That card is outside the kit price range';
  END IF;
  IF coalesce(_site_theme, '') !~ '^[a-z0-9-]{0,30}$' OR coalesce(_card_theme, '') !~ '^[a-z0-9-]{0,30}$' THEN
    RAISE EXCEPTION 'Invalid design';
  END IF;

  UPDATE public.influencers SET
    kit_site_product = nullif(trim(coalesce(_site_product, '')), ''),
    kit_site_theme   = CASE WHEN nullif(trim(coalesce(_site_product, '')), '') IS NULL THEN NULL ELSE nullif(_site_theme, '') END,
    kit_card_product = nullif(trim(coalesce(_card_product, '')), ''),
    kit_card_theme   = CASE WHEN nullif(trim(coalesce(_card_product, '')), '') IS NULL THEN NULL ELSE nullif(_card_theme, '') END
  WHERE id = v_id;
  RETURN jsonb_build_object('ok', true);
END $$;

CREATE OR REPLACE FUNCTION public.influencer_my_kit_picks()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce((
    SELECT jsonb_build_object('site_product', kit_site_product, 'site_theme', kit_site_theme,
                              'card_product', kit_card_product, 'card_theme', kit_card_theme)
    FROM public.influencers WHERE user_id = auth.uid()
  ), '{}'::jsonb)
$$;

-- /kit reads the picks along with the rest of the public offer.
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
    'expired', r.offer_ends_at IS NOT NULL AND r.offer_ends_at < now(),
    'site_product', r.kit_site_product, 'site_theme', r.kit_site_theme,
    'card_product', r.kit_card_product, 'card_theme', r.kit_card_theme
  );
END $$;

-- At grant time, remember the influencer's picks on the buyer's two items so
-- "Make it now" opens the design the buyer was shown. Insert only.
CREATE OR REPLACE FUNCTION public.kit_grant_on_paid()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE i public.influencers%ROWTYPE;
BEGIN
  SELECT * INTO i FROM public.influencers
  WHERE code = lower(trim(coalesce(NEW.ref_code, ''))) LIMIT 1;

  INSERT INTO public.kit_entitlements (user_id, purchase_id, scope, pick_product, pick_theme)
  VALUES (NEW.user_id, NEW.id, 'business', i.kit_site_product, i.kit_site_theme),
         (NEW.user_id, NEW.id, 'card',     i.kit_card_product, i.kit_card_theme)
  ON CONFLICT (purchase_id, scope) DO NOTHING;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.kit_my_entitlements()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN coalesce((
    SELECT jsonb_agg(jsonb_build_object(
      'id', e.id, 'scope', e.scope, 'used', e.used_at IS NOT NULL,
      'page_id', e.page_id, 'bought_at', e.created_at,
      'pick_product', e.pick_product, 'pick_theme', e.pick_theme
    ) ORDER BY e.created_at DESC, e.scope)
    FROM public.kit_entitlements e WHERE e.user_id = auth.uid()
  ), '[]'::jsonb);
END $$;

-- Free publish: the card entitlement now covers any card in the price range,
-- not only the digital visiting card. The website entitlement is limited to
-- the same range as the picker.
CREATE OR REPLACE FUNCTION public.ip_publish_prepaid(_page_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _p public.ip_pages%ROWTYPE;
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

  _scope := public.kit_product_scope(_p.product_id);
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
    RAISE EXCEPTION 'could not publish: %', coalesce(_r->>'reason', 'unknown');
  END IF;
  RETURN _r || jsonb_build_object('prepaid', true);
END $$;

REVOKE ALL ON FUNCTION public.influencer_update_kit_picks(text, text, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.influencer_my_kit_picks() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.kit_product_scope(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.influencer_update_kit_picks(text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.influencer_my_kit_picks() TO authenticated;
GRANT EXECUTE ON FUNCTION public.kit_product_scope(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.influencer_offer_public(text) TO anon, authenticated;
