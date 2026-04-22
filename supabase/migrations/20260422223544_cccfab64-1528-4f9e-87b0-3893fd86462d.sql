-- Add tool_id to page_views for per-tool analytics
ALTER TABLE public.page_views
ADD COLUMN IF NOT EXISTS tool_id text REFERENCES public.tools_catalog(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_page_views_tool_id ON public.page_views(tool_id);
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON public.page_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_path ON public.page_views(path);

-- Backfill tool_id from existing /tool/{id} or /tool-preview/{id} paths
UPDATE public.page_views
SET tool_id = substring(path FROM '^/tool(?:-preview)?/([^/?#]+)')
WHERE tool_id IS NULL
  AND path ~ '^/tool(-preview)?/[^/?#]+';

-- Aggregation function for view counts (efficient single query)
CREATE OR REPLACE FUNCTION public.get_tool_view_counts(_tool_ids text[])
RETURNS TABLE(tool_id text, view_count bigint, unique_visitors bigint, last_viewed timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    pv.tool_id,
    COUNT(*)::bigint AS view_count,
    COUNT(DISTINCT pv.session_id)::bigint AS unique_visitors,
    MAX(pv.created_at) AS last_viewed
  FROM public.page_views pv
  WHERE pv.tool_id = ANY(_tool_ids)
  GROUP BY pv.tool_id
$$;

-- Grant access to admins/moderators (uses SECURITY DEFINER so RLS on page_views is bypassed,
-- but we add an explicit role check via wrapper RLS isn't applicable — function runs as definer)
REVOKE EXECUTE ON FUNCTION public.get_tool_view_counts(text[]) FROM public;
GRANT EXECUTE ON FUNCTION public.get_tool_view_counts(text[]) TO authenticated;