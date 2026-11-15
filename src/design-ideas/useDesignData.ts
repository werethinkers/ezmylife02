import { useMemo } from "react";
import { useToolsCatalog, type CatalogTool } from "@/hooks/useToolsCatalog";
import { usePricingMap } from "@/hooks/usePricingMap";
import { appsByShop, resolveBundles } from "./data";

/** Live apps, their prices and the shop/bundle grouping, for every design idea. */
export function useDesignData() {
  const { data: catalog = [], isLoading } = useToolsCatalog();
  const { costOf } = usePricingMap();
  const live = useMemo<CatalogTool[]>(() => catalog.filter((t) => t.is_live), [catalog]);
  const shops = useMemo(() => appsByShop(live), [live]);
  const bundles = useMemo(() => resolveBundles(live), [live]);
  return { live, shops, bundles, costOf, isLoading };
}

export const creditsLabel = (n: number) => `${n} credit${n === 1 ? "" : "s"}`;
