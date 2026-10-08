import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CREDIT_PACKS } from "@/data/creditPacks";
import { BROWSER_ONLY, defaultPrice, priceIdFor } from "@/apps/prices";

/** Credit cost for every priced app in one request (apps without a row: their default, else free). */
export function usePricingMap() {
  const q = useQuery({
    queryKey: ["tool-pricing-all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tool_pricing").select("tool_id, credit_cost");
      if (error) throw error;
      const map = new Map<string, number>();
      for (const row of data ?? []) map.set(row.tool_id, Math.max(1, row.credit_cost ?? 1));
      try {
        localStorage.setItem("ez.prices.v1", JSON.stringify({ at: Date.now(), rows: [...map] }));
      } catch {
        /* ignore */
      }
      return map;
    },
    initialData: () => {
      try {
        const c = JSON.parse(localStorage.getItem("ez.prices.v1") ?? "null");
        return c ? new Map<string, number>(c.rows) : undefined;
      } catch {
        return undefined;
      }
    },
    initialDataUpdatedAt: () => {
      try {
        return JSON.parse(localStorage.getItem("ez.prices.v1") ?? "null")?.at;
      } catch {
        return undefined;
      }
    },
    staleTime: 10 * 60 * 1000,
  });
  const map = q.data;
  return {
    costOf: (toolId: string) => {
      if (BROWSER_ONLY.has(toolId)) return 0;
      const id = priceIdFor(toolId);
      return map?.get(id) ?? defaultPrice(id) ?? 0;
    },
    isLoading: q.isLoading,
  };
}

/** ₹ per credit at the smallest pack — the most a credit ever costs. */
export const RUPEES_PER_CREDIT_MAX = CREDIT_PACKS[0].inr / CREDIT_PACKS[0].credits;
/** ₹ per credit at the biggest pack — the least a credit costs. */
export const RUPEES_PER_CREDIT_MIN = Math.min(...CREDIT_PACKS.map((p) => p.inr / p.credits));

export const formatRupees = (n: number) =>
  n >= 100 ? `₹${Math.round(n).toLocaleString("en-IN")}` : `₹${n.toFixed(2).replace(/\.00$/, "")}`;
