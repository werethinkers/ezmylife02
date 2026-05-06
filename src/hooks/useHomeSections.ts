import { useMemo } from "react";
import { useToolsCatalog, type CatalogTool } from "./useToolsCatalog";
import { tools as staticTools } from "@/data/tools";

export interface HomeTool {
  id: string;
  name: string;
  description: string;
  category: string;
  isLive: boolean;
  iconUrl?: string | null;
}

export interface HomeSections {
  hot: HomeTool[];
  trending: HomeTool[];
  featured: HomeTool[];
  mostUsed: HomeTool[];
  isLoading: boolean;
}

const SECTION_SIZE = 12;

function toHomeTool(t: CatalogTool): HomeTool {
  return {
    id: t.id,
    name: t.name,
    description: t.description,
    category: t.category,
    isLive: t.is_live,
    iconUrl: t.icon_url ?? null,
  };
}

export function useHomeSections(): HomeSections {
  const { data: catalog = [], isLoading } = useToolsCatalog();

  return useMemo(() => {
    // Pool: catalog (live) + static live tools that aren't in catalog
    const seen = new Set(catalog.map((c) => c.id));
    const staticAsHome: HomeTool[] = staticTools
      .filter((t) => t.isLive && !seen.has(t.toolId))
      .map((t) => ({
        id: t.toolId,
        name: t.title,
        description: t.description,
        category: t.category,
        isLive: t.isLive,
        iconUrl: null,
      }));

    const liveCatalog = catalog.filter((c) => c.is_live).map(toHomeTool);
    const pool = [...liveCatalog, ...staticAsHome];

    // Tagged buckets first
    const tagged = (section: string) =>
      catalog
        .filter((c) => c.is_live && (c as any).home_section === section)
        .map(toHomeTool);

    const hotTagged = tagged("hot");
    const trendingTagged = tagged("trending");
    const featuredTagged = tagged("featured");
    const mostUsedTagged = tagged("most_used");

    // Fallback fillers (deterministic-ish)
    const sortedByOrder = [...pool].sort((a, b) => {
      const ao = catalog.find((c) => c.id === a.id)?.display_order ?? 999999;
      const bo = catalog.find((c) => c.id === b.id)?.display_order ?? 999999;
      return ao - bo;
    });

    const sortedByNewest = [...pool].sort((a, b) => {
      const ad = catalog.find((c) => c.id === a.id)?.created_at ?? "";
      const bd = catalog.find((c) => c.id === b.id)?.created_at ?? "";
      return bd.localeCompare(ad);
    });

    const featuredPool = catalog
      .filter((c) => c.is_live && c.source === "featured")
      .map(toHomeTool);

    const fill = (tagged: HomeTool[], fallback: HomeTool[], offset = 0) => {
      const ids = new Set(tagged.map((t) => t.id));
      const extras = fallback.filter((t) => !ids.has(t.id));
      // rotate offset so different sections show different tools
      const rotated = extras.slice(offset).concat(extras.slice(0, offset));
      return [...tagged, ...rotated].slice(0, SECTION_SIZE);
    };

    return {
      hot: fill(hotTagged, sortedByOrder, 0),
      trending: fill(trendingTagged, sortedByNewest, 0),
      featured: fill(featuredTagged, featuredPool.length ? featuredPool : sortedByOrder, 0),
      mostUsed: fill(mostUsedTagged, sortedByOrder, Math.min(6, pool.length)),
      isLoading,
    };
  }, [catalog, isLoading]);
}
