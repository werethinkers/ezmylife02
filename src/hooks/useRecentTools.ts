import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToolsCatalog, type CatalogTool } from "@/hooks/useToolsCatalog";

const LIMIT = 8;

export function useRecentTools(): { recent: CatalogTool[]; isLoading: boolean } {
  const { user } = useAuth();
  const { data: catalog = [] } = useToolsCatalog();

  const q = useQuery({
    queryKey: ["recent-tool-ids", user?.id ?? "anon"],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async (): Promise<string[]> => {
      if (!user) return [];
      const { data } = await supabase
        .from("activity_logs")
        .select("action_details, created_at")
        .eq("user_id", user.id)
        .eq("action_type", "tool_usage")
        .order("created_at", { ascending: false })
        .limit(60);
      const seen = new Set<string>();
      const ids: string[] = [];
      for (const row of data ?? []) {
        const id = (row.action_details as { tool_id?: string } | null)?.tool_id;
        if (!id || seen.has(id)) continue;
        seen.add(id);
        ids.push(id);
        if (ids.length >= LIMIT) break;
      }
      return ids;
    },
  });

  const ids = q.data ?? [];
  const byId = new Map(catalog.map((t) => [t.id, t]));
  const recent = ids
    .map((id) => byId.get(id))
    .filter((t): t is CatalogTool => !!t && t.is_live);

  return { recent, isLoading: q.isLoading };
}
