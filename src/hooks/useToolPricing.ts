import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { defaultPrice } from "@/apps/prices";

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
  // No pricing row yet: new engine apps show their default price; anything else is free
  // (the server charges nothing for an app without a price).
  return data ?? { tool_id: toolId, cost_inr: 0, credit_cost: defaultPrice(toolId) ?? 0 };
}

/** Returns the current credit cost for a given tool (0 = free). */
export function useToolPricing(toolId: string | undefined) {
  const q = useQuery({
    queryKey: ["tool-pricing", toolId],
    queryFn: () => fetchPricing(toolId!),
    enabled: !!toolId,
    staleTime: 5 * 60 * 1000,
  });
  return {
    creditCost: Math.max(0, q.data?.credit_cost ?? defaultPrice(toolId ?? "") ?? 0),
    costInr: q.data?.cost_inr ?? 0,
    isLoading: q.isLoading,
  };
}
