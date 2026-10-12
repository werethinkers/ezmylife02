-- Fix the Visitors tab, which never loaded.
--
-- get_visitor_sessions aggregated the session's user with MAX(b.user_id), but
-- user_id is a uuid and PostgreSQL has no max(uuid). Every call raised
--   ERROR: function max(uuid) does not exist
-- so the tab failed for every admin, every time, regardless of date range.
--
-- The intent was "the signed-in user for this session, if any", so take the
-- first non-null user_id instead. Everything else is unchanged.

CREATE OR REPLACE FUNCTION public.get_visitor_sessions(_since timestamp with time zone, _limit integer DEFAULT 500)
RETURNS TABLE(session_id text, ip_hash text, ip_address text, user_id uuid, user_email text,
  first_seen timestamp with time zone, last_seen timestamp with time zone, duration_seconds numeric,
  page_count bigint, is_bounce boolean, entry_path text, exit_path text, country text, city text,
  device_type text, browser text, os text, referrer text, utm_source text, utm_medium text, utm_campaign text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'moderator'::app_role)) THEN
    RAISE EXCEPTION 'access denied';
  END IF;

  RETURN QUERY
  WITH base AS (
    SELECT
      pv.*,
      ROW_NUMBER() OVER (PARTITION BY COALESCE(pv.session_id, pv.ip_hash, pv.id::text) ORDER BY pv.created_at ASC) AS rn_first,
      ROW_NUMBER() OVER (PARTITION BY COALESCE(pv.session_id, pv.ip_hash, pv.id::text) ORDER BY pv.created_at DESC) AS rn_last
    FROM public.page_views pv
    WHERE pv.created_at >= _since
  ),
  agg AS (
    SELECT
      COALESCE(b.session_id, b.ip_hash, b.id::text) AS sid,
      MAX(b.ip_hash) AS ip_hash,
      MAX(b.ip_address) AS ip_address,
      -- uuid has no max(): take the first non-null user for the session.
      (array_agg(b.user_id) FILTER (WHERE b.user_id IS NOT NULL))[1] AS user_id,
      MIN(b.created_at) AS first_seen,
      MAX(b.created_at) AS last_seen,
      COUNT(*) AS page_count,
      MAX(b.country) AS country,
      MAX(b.city) AS city,
      MAX(b.device_type) AS device_type,
      MAX(b.browser) AS browser,
      MAX(b.os) AS os,
      MAX(b.referrer) AS referrer,
      MAX(b.utm_source) AS utm_source,
      MAX(b.utm_medium) AS utm_medium,
      MAX(b.utm_campaign) AS utm_campaign
    FROM base b
    GROUP BY COALESCE(b.session_id, b.ip_hash, b.id::text)
  )
  SELECT
    a.sid AS session_id,
    a.ip_hash,
    a.ip_address,
    a.user_id,
    p.email AS user_email,
    a.first_seen,
    a.last_seen,
    EXTRACT(EPOCH FROM (a.last_seen - a.first_seen))::numeric AS duration_seconds,
    a.page_count,
    (a.page_count = 1) AS is_bounce,
    (SELECT bf.path FROM base bf WHERE COALESCE(bf.session_id, bf.ip_hash, bf.id::text) = a.sid AND bf.rn_first = 1 LIMIT 1) AS entry_path,
    (SELECT bl.path FROM base bl WHERE COALESCE(bl.session_id, bl.ip_hash, bl.id::text) = a.sid AND bl.rn_last = 1 LIMIT 1) AS exit_path,
    a.country, a.city, a.device_type, a.browser, a.os, a.referrer,
    a.utm_source, a.utm_medium, a.utm_campaign
  FROM agg a
  LEFT JOIN public.profiles p ON p.id = a.user_id
  ORDER BY a.last_seen DESC
  LIMIT _limit;
END;
$function$;

-- Keeps the Visitors tab responsive as page_views grows.
CREATE INDEX IF NOT EXISTS page_views_created_at_idx ON public.page_views(created_at DESC);
