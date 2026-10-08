import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BROWSER_ONLY, defaultPrice, priceIdFor } from "@/apps/prices";

export interface ToolPricing {
  tool_id: string;
  cost_inr: number;
  credit_cost: number;
}

async function fetchPricing(priceId: string): Promise<ToolPricing> {
  const { data } = await supabase
    .from("tool_pricing")
    .select("tool_id, cost_inr, credit_cost")
    .eq("tool_id", priceId)
    .maybeSingle();
  // No pricing row yet: new engine apps show their default price; anything else is free
  // (the server charges nothing for an app without a price).
  return data ?? { tool_id: priceId, cost_inr: 0, credit_cost: defaultPrice(priceId) ?? 0 };
}

/**
 * Returns the current credit cost for a given tool (0 = free). Browser-only apps are free;
 * re-priced apps read the price id they are actually charged under.
 */
export function useToolPricing(toolId: string | undefined) {
  const priceId = toolId ? priceIdFor(toolId) : undefined;
  const q = useQuery({
    queryKey: ["tool-pricing", priceId],
    queryFn: () => fetchPricing(priceId!),
    enabled: !!priceId && !BROWSER_ONLY.has(toolId!),
    staleTime: 5 * 60 * 1000,
  });
  const free = !!toolId && BROWSER_ONLY.has(toolId);
  return {
    creditCost: free ? 0 : Math.max(0, q.data?.credit_cost ?? defaultPrice(priceId ?? "") ?? 0),
    costInr: free ? 0 : q.data?.cost_inr ?? 0,
    isLoading: free ? false : q.isLoading,
  };
}
