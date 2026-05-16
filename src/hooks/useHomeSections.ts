import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToolsCatalog, type CatalogTool } from "@/hooks/useToolsCatalog";

export interface HomeTool {
  id: string;
  name: string;
  description: string;
  category: string;
  isLive: boolean;
  iconUrl?: string | null;
}

export interface HomeSection {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  tools: HomeTool[];
}

export interface HomeSectionsResult {
  sections: HomeSection[];
  isLoading: boolean;
  // Legacy named slots for existing Home.tsx consumers — populated from matching slugs.
  hot: HomeTool[];
  trending: HomeTool[];
  featured: HomeTool[];
  mostUsed: HomeTool[];
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

interface SectionRow { id: string; slug: string; title: string; subtitle: string | null; display_order: number; is_active: boolean }
interface AssignmentRow { tool_id: string; section_id: string; position: number }

export function useHomeSections(): HomeSectionsResult {
  const { data: catalog = [], isLoading: catalogLoading } = useToolsCatalog();

  const { data: sections = [], isLoading: secLoading } = useQuery({
    queryKey: ["home-sections-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("home_sections")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return (data ?? []) as SectionRow[];
    },
    staleTime: 60_000,
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["home-sections-assignments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tool_section_assignments")
        .select("tool_id, section_id, position");
      if (error) throw error;
      return (data ?? []) as AssignmentRow[];
    },
    staleTime: 60_000,
  });

  return useMemo(() => {
    const live = catalog.filter((c) => c.is_live);
    const byId = new Map(live.map((t) => [t.id, t]));

    const built: HomeSection[] = sections.map((s) => {
      const pinned = assignments
        .filter((a) => a.section_id === s.id)
        .sort((a, b) => a.position - b.position)
        .map((a) => byId.get(a.tool_id))
        .filter((t): t is CatalogTool => !!t)
        .map(toHomeTool);

      let tools = pinned;
      if (tools.length < TARGET_PER_SECTION) {
        const pinnedIds = new Set(pinned.map((p) => p.id));
        const pool = live.filter((c) => !pinnedIds.has(c.id));
        const seed = Array.from(s.slug).reduce((acc, ch) => acc + ch.charCodeAt(0), 0) * 31;
        tools = [...pinned, ...seededShuffle(pool, seed).map(toHomeTool)].slice(0, TARGET_PER_SECTION);
      } else {
        tools = tools.slice(0, TARGET_PER_SECTION);
      }

      return { id: s.id, slug: s.slug, title: s.title, subtitle: s.subtitle, tools };
    });

    const bySlug = (slug: string) => built.find((b) => b.slug === slug)?.tools ?? [];

    return {
      sections: built,
      isLoading: catalogLoading || secLoading,
      hot: bySlug("hot"),
      trending: bySlug("trending"),
      featured: bySlug("editors_pick").length ? bySlug("editors_pick") : bySlug("featured"),
      mostUsed: bySlug("most_used"),
    };
  }, [catalog, sections, assignments, catalogLoading, secLoading]);
}
