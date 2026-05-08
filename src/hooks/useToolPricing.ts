import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ToolPricing {
  tool_id: string;
  cost_inr: number;
  credit_cost: number;
}

async function fetchPricing(toolId: string): Promise<ToolPricing> {
  const { data } = await supabase
    .from("tool_pricing")
    .select("tool_id, cost_inr, credit_cost")
    .eq("tool_id", toolId)
    .maybeSingle();
  return data ?? { tool_id: toolId, cost_inr: 0, credit_cost: 1 };
}

/** Returns the current credit cost for a given tool. Always at least 1. */
export function useToolPricing(toolId: string | undefined) {
  const q = useQuery({
    queryKey: ["tool-pricing", toolId],
    queryFn: () => fetchPricing(toolId!),
    enabled: !!toolId,
    staleTime: 5 * 60 * 1000,
  });
  return {
    creditCost: Math.max(1, q.data?.credit_cost ?? 1),
    costInr: q.data?.cost_inr ?? 0,
    isLoading: q.isLoading,
  };
}
