import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ToolViewStat {
  tool_id: string;
  view_count: number;
  unique_visitors: number;
  last_viewed: string | null;
}

async function fetchToolViewCounts(toolIds: string[]): Promise<Map<string, ToolViewStat>> {
  if (toolIds.length === 0) return new Map();
  const { data, error } = await supabase.rpc("get_tool_view_counts", {
    _tool_ids: toolIds,
  });
  if (error) throw error;
  const map = new Map<string, ToolViewStat>();
  for (const row of (data as ToolViewStat[]) ?? []) {
    map.set(row.tool_id, row);
  }
  return map;
}

export function useToolViewCounts(toolIds: string[]) {
  // Stable key — sort so order doesn't break cache
  const key = [...toolIds].sort().join(",");
  return useQuery({
    queryKey: ["tool-view-counts", key],
    queryFn: () => fetchToolViewCounts(toolIds),
    enabled: toolIds.length > 0,
    staleTime: 60 * 1000, // 1 min
    gcTime: 5 * 60 * 1000,
  });
}
