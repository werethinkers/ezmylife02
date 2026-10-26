-- Follow-up to 20261025100000_card_promos.sql
--
-- 1. Apps that cost us no AI (browser-only tools, calculators, file converters, photo presets) are not
--    limited to 3 gift-credit uses: gift credits work on them until the balance runs out.
-- 2. Websites and cards can be paid with credits: ceil(price in rupees x 2.2) credits, taken from gift,
--    then free, then bought credits (the same 2.2 credits per rupee as the 1,000 rupee pack).
--    ip_pay_with_credits() does the whole thing in one transaction: charge, record the order, publish.

CREATE TABLE IF NOT EXISTS public.promo_uncapped_tools (tool_id text PRIMARY KEY);
ALTER TABLE public.promo_uncapped_tools ENABLE ROW LEVEL SECURITY; -- server-side only, no policies
INSERT INTO public.promo_uncapped_tools(tool_id) VALUES
  ('add-logo-image'),
  ('add-name-dob-photo'),
  ('add-text-image'),
  ('age-calculator'),
  ('ai-face-generator'),
  ('ai-id-photo-generator'),
  ('ai-photo-enhancer'),
  ('assignment-tracker'),
  ('beautify-image'),
  ('bibliography-generator'),
  ('black-white'),
  ('blemish-remover'),
  ('blur-background'),
  ('blur-face'),
  ('blur-image'),
  ('break-even-calculator'),
  ('bulk-image-resizer'),
  ('cagr-calculator'),
  ('censor-photo'),
  ('check-dpi'),
  ('circle-crop'),
  ('convert-dpi'),
  ('edit-metadata'),
  ('emi-calculator'),
  ('fd-calculator'),
  ('flip-image'),
  ('freehand-crop'),
  ('gate-photo-signature'),
  ('generate-signature'),
  ('grade-calculator'),
  ('grayscale-image'),
  ('heic-to-jpg'),
  ('image-color-picker'),
  ('image-to-webp'),
  ('increase-image-quality'),
  ('increase-image-size-kb'),
  ('india-evisa-photo'),
  ('instagram-grid'),
  ('instagram-resize'),
  ('join-images'),
  ('jpg-to-pdf'),
  ('loan-prepayment-calculator'),
  ('merge-pdf'),
  ('merge-photo-signature'),
  ('mind-map-maker'),
  ('motion-blur'),
  ('nta-photo-signature'),
  ('oci-photo-signature'),
  ('pan-card-resize'),
  ('passport-photo-maker'),
  ('pdf-chart-image-extractor'),
  ('pdf-to-jpg'),
  ('pdf-to-text'),
  ('percentage-calculator'),
  ('picture-pixel-art'),
  ('pixelate-face'),
  ('pixelate-image'),
  ('png-to-jpg'),
  ('psc-photo-resize'),
  ('rd-calculator'),
  ('reduce-image-size-kb'),
  ('remove-background'),
  ('remove-metadata'),
  ('remove-object-photo'),
  ('resize-2x2-inch'),
  ('resize-35x45mm'),
  ('resize-3x4-inch'),
  ('resize-4x6-inch'),
  ('resize-600x600'),
  ('resize-a4'),
  ('resize-image-3.5x4.5'),
  ('resize-image-cm'),
  ('resize-image-inch'),
  ('resize-image-mm'),
  ('resize-image-pixel'),
  ('resize-sign-6x2'),
  ('resize-signature'),
  ('resize-signature-50x20'),
  ('retouch-image'),
  ('rotate-image'),
  ('rotate-pdf'),
  ('sbi-clerk-photo-signature'),
  ('sip-calculator'),
  ('split-image'),
  ('split-pdf'),
  ('square-crop'),
  ('ssc-photo-resize'),
  ('super-resolution'),
  ('tool-1'),
  ('tool-2'),
  ('tool-3'),
  ('tool-30'),
  ('tool-4'),
  ('unblur-face'),
  ('unblur-image'),
  ('upsc-photo-resize'),
  ('upscale-image-ai'),
  ('us-visa-photo'),
  ('view-metadata'),
  ('watermark-images'),
  ('webp-to-jpg'),
  ('whatsapp-dp'),
  ('youtube-banner'),
  ('zoom-out-image')

ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.promo_available(_uid uuid, _tool_id text)
RETURNS int
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT CASE
    WHEN _tool_id LIKE 'dev-%' THEN 0
    WHEN EXISTS (SELECT 1 FROM public.promo_uncapped_tools x WHERE x.tool_id = _tool_id) THEN GREATEST(0, w.promo_balance)
    WHEN COALESCE(u.uses, 0) >= w.promo_per_app_limit THEN 0
    ELSE GREATEST(0, w.promo_balance)
  END
  FROM public.credit_wallets w
  LEFT JOIN public.promo_app_uses u ON u.user_id = w.user_id AND u.tool_id = _tool_id
  WHERE w.user_id = _uid;
$$;

CREATE OR REPLACE FUNCTION public.promo_runs_affordable(_uid uuid, _tool_id text, _per int)
RETURNS int
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE((
    SELECT CASE
      WHEN _tool_id LIKE 'dev-%' THEN 0
      WHEN EXISTS (SELECT 1 FROM public.promo_uncapped_tools x WHERE x.tool_id = _tool_id) THEN GREATEST(0, w.promo_balance / GREATEST(1, _per))
      ELSE GREATEST(0, LEAST(w.promo_per_app_limit - COALESCE(u.uses, 0), w.promo_balance / GREATEST(1, _per)))
    END
    FROM public.credit_wallets w
    LEFT JOIN public.promo_app_uses u ON u.user_id = w.user_id AND u.tool_id = _tool_id
    WHERE w.user_id = _uid
  ), 0);
$$;

-- Orders paid with credits.
ALTER TABLE public.ip_orders DROP CONSTRAINT IF EXISTS ip_orders_status_check;
ALTER TABLE public.ip_orders ADD CONSTRAINT ip_orders_status_check CHECK (status IN ('created','paid','failed','free','credits'));
ALTER TABLE public.ip_orders ADD COLUMN IF NOT EXISTS credits_charged int;

-- Credits a website or card costs: 2.2 credits per rupee, rounded up.
CREATE OR REPLACE FUNCTION public.ip_credits_for_inr(_inr int)
RETURNS int LANGUAGE sql IMMUTABLE AS $$ SELECT ceil(GREATEST(0, _inr) * 2.2)::int $$;

CREATE OR REPLACE FUNCTION public.ip_pay_with_credits(_uid uuid, _page_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _p public.ip_pages%ROWTYPE; _prod public.ip_products%ROWTYPE; _w public.credit_wallets%ROWTYPE;
  _need int; _use_promo int; _use_free int; _use_paid int; _pub jsonb; _order uuid;
BEGIN
  SELECT * INTO _p FROM public.ip_pages WHERE id = _page_id FOR UPDATE;
  IF NOT FOUND OR _p.owner_id <> _uid THEN RETURN jsonb_build_object('ok', false, 'reason', 'not_found'); END IF;
  IF _p.status = 'published' THEN RETURN jsonb_build_object('ok', true, 'slug', _p.slug, 'noop', true); END IF;
  SELECT * INTO _prod FROM public.ip_products WHERE id = _p.product_id;
  IF NOT FOUND OR NOT _prod.is_active THEN RETURN jsonb_build_object('ok', false, 'reason', 'unavailable'); END IF;
  IF _prod.price_inr <= 0 THEN RETURN jsonb_build_object('ok', false, 'reason', 'free'); END IF;

  PERFORM public.ensure_wallet(_uid);
  SELECT * INTO _w FROM public.credit_wallets WHERE user_id = _uid FOR UPDATE;
  _need := public.ip_credits_for_inr(_prod.price_inr);
  IF GREATEST(0, _w.promo_balance) + _w.free_balance + _w.paid_balance < _need THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'insufficient', 'credits_required', _need,
                              'balance', GREATEST(0, _w.promo_balance) + _w.free_balance + _w.paid_balance);
  END IF;
  _use_promo := LEAST(GREATEST(0, _w.promo_balance), _need);
  _use_free := LEAST(_w.free_balance, _need - _use_promo);
  _use_paid := _need - _use_promo - _use_free;

  UPDATE public.credit_wallets
    SET promo_balance = promo_balance - _use_promo, free_balance = free_balance - _use_free,
        paid_balance = paid_balance - _use_paid, updated_at = now()
    WHERE user_id = _uid;

  INSERT INTO public.ip_orders(user_id, page_id, product_id, inr_amount, status, paid_at, credits_charged)
    VALUES (_uid, _p.id, _prod.id, _prod.price_inr, 'credits', now(), _need) RETURNING id INTO _order;

  INSERT INTO public.credit_ledger(user_id, delta, promo_delta, free_delta, paid_delta, reason, tool_id, metadata)
    VALUES (_uid, -_need, -_use_promo, -_use_free, -_use_paid, 'tool_run', 'page-' || _prod.id,
            jsonb_build_object('page_id', _p.id, 'order_id', _order, 'inr', _prod.price_inr));

  _pub := public.ip_publish_page(_p.id);
  IF NOT COALESCE((_pub->>'ok')::boolean, false) THEN
    RAISE EXCEPTION 'publish failed: %', COALESCE(_pub->>'reason', 'unknown'); -- rolls the charge back
  END IF;
  RETURN jsonb_build_object('ok', true, 'slug', _pub->>'slug', 'charged', _need, 'promo_used', _use_promo, 'free_used', _use_free, 'paid_used', _use_paid);
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.ip_pay_with_credits(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.promo_available(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.promo_runs_affordable(uuid, text, int) FROM PUBLIC, anon, authenticated;
