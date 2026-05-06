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

const TARGET_PER_SECTION = 12;

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

// Deterministic seeded shuffle (mulberry32) so each section gets a stable mix.
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let s = seed >>> 0;
  const rand = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const SECTION_SEEDS: Record<string, number> = {
  hot: 1010,
  trending: 2020,
  featured: 3030,
  most_used: 4040,
};

/**
 * Admin-curated home sections with deterministic auto-fill.
 * Pinned tools come first, then live tools fill the carousel up to 12.
 * Coming-soon (is_live = false) tools are never included.
 */
export function useHomeSections(): HomeSections {
  const { data: catalog = [], isLoading } = useToolsCatalog();

  return useMemo(() => {
    const live = catalog.filter((c) => c.is_live);

    const build = (section: string): HomeTool[] => {
      const pinned = live
        .filter((c) => (c as any).home_section === section)
        .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
        .map(toHomeTool);

      if (pinned.length >= TARGET_PER_SECTION) return pinned.slice(0, TARGET_PER_SECTION);

      const pinnedIds = new Set(pinned.map((p) => p.id));
      const pool = live.filter((c) => !pinnedIds.has(c.id));
      const shuffled = seededShuffle(pool, SECTION_SEEDS[section] ?? 0).map(toHomeTool);
      return [...pinned, ...shuffled].slice(0, TARGET_PER_SECTION);
    };

    return {
      hot: build("hot"),
      trending: build("trending"),
      featured: build("featured"),
      mostUsed: build("most_used"),
      isLoading,
    };
  }, [catalog, isLoading]);
}
