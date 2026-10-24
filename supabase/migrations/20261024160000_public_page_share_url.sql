-- The public page now says where its own address is (its subdomain once it has one), so
-- ezyourlife.com/p/<slug> can move visitors there and the address they copy shows the page's preview.
CREATE OR REPLACE FUNCTION public.ip_get_public_page(_slug text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'slug', p.slug, 'product_id', p.product_id, 'variant_id', p.published_variant_id,
    'content', p.published_content, 'published_at', p.published_at, 'og_image', p.og_image,
    'share_url', p.share_url)
  FROM public.ip_pages p
  WHERE p.slug = _slug AND p.status = 'published' AND (p.expires_at IS NULL OR p.expires_at > now())
  LIMIT 1;
$$;
