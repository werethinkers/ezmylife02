import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { defaultPrice, priceIdFor } from "@/apps/prices";

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
  // No pricing row yet: the default price (the server creates the row, min 1, on first use).
  return data ?? { tool_id: priceId, cost_inr: 0, credit_cost: defaultPrice(priceId) ?? 1 };
}

/** Returns the credit cost per use (minimum 1); re-priced apps read the id they're charged under. */
export function useToolPricing(toolId: string | undefined) {
  const priceId = toolId ? priceIdFor(toolId) : undefined;
  const q = useQuery({
    queryKey: ["tool-pricing", priceId],
    queryFn: () => fetchPricing(priceId!),
    enabled: !!priceId,
    staleTime: 5 * 60 * 1000,
  });
  // Every app costs at least 1 credit per use.
  return {
    creditCost: Math.max(1, q.data?.credit_cost ?? defaultPrice(priceId ?? "") ?? 1),
    costInr: q.data?.cost_inr ?? 0,
    isLoading: q.isLoading,
  };
}
