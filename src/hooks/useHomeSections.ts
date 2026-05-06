import { useMemo } from "react";
import { useToolsCatalog, type CatalogTool } from "@/hooks/useToolsCatalog";

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

/**
 * Strict admin-curated home sections.
 * Only tools whose `home_section` matches show up — no fallbacks.
 * Empty sections will render nothing (carousel hides itself).
 */
export function useHomeSections(): HomeSections {
  const { data: catalog = [], isLoading } = useToolsCatalog();

  return useMemo(() => {
    const pick = (section: string) =>
      catalog
        .filter((c) => c.is_live && (c as any).home_section === section)
        .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
        .map(toHomeTool);

    return {
      hot: pick("hot"),
      trending: pick("trending"),
      featured: pick("featured"),
      mostUsed: pick("most_used"),
      isLoading,
    };
  }, [catalog, isLoading]);
}
