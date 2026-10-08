import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { REMOVED_APPS } from "@/apps/prices";

export interface CatalogTool {
  id: string;
  name: string;
  description: string;
  category: string;
  tool_types: string[];
  source: "business" | "featured";
  is_live: boolean;
  is_free?: boolean;
  display_order?: number;
  icon_url?: string | null;
  rating?: number | null;
  review_count?: number | null;
  preview_image_url?: string | null;
  preview_image_fit?: "cover" | "contain" | null;
  icon_fit?: "cover" | "contain" | null;
  /** Admin-set shelf flag, e.g. "hot" for hand-picked apps. */
  home_section?: string | null;
  created_at: string;
  updated_at: string;
}

async function fetchToolsCatalog(): Promise<CatalogTool[]> {
  const { data, error } = await supabase
    .from("tools_catalog")
    // Only the columns the store needs — the long demo texts are fetched by the app page itself.
    .select("id,name,description,category,tool_types,source,is_live,is_free,display_order,icon_url,rating,review_count,preview_image_url,preview_image_fit,icon_fit,home_section,dedicated_route,created_at,updated_at")
    .order("created_at", { ascending: true });

  if (error) throw error;
  const list = ((data as unknown as CatalogTool[]) ?? []).filter((t) => !REMOVED_APPS.has(t.id));
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), list }));
  } catch {
    /* storage full / blocked */
  }
  return list;
}

// Last catalog seen in this browser: pages render instantly on repeat visits while a fresh
// copy loads in the background.
const CACHE_KEY = "ez.catalog.v3";
function cachedCatalog(): { at: number; list: CatalogTool[] } | undefined {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
}

export function useToolsCatalog() {
  return useQuery({
    queryKey: ["tools-catalog"],
    queryFn: fetchToolsCatalog,
    initialData: () => cachedCatalog()?.list,
    initialDataUpdatedAt: () => cachedCatalog()?.at,
    staleTime: 10 * 60 * 1000, // 10 min cache
    gcTime: 30 * 60 * 1000,
  });
}

export function useToolsCatalogStats() {
  const { data: tools = [], isLoading } = useToolsCatalog();
  
  return {
    total: tools.length,
    live: tools.filter(t => t.is_live).length,
    business: tools.filter(t => t.source === "business").length,
    featured: tools.filter(t => t.source === "featured").length,
    isLoading,
  };
}
