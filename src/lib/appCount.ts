import { useToolsCatalog } from "@/hooks/useToolsCatalog";

/**
 * How many apps are live, rounded down to the nearest 5 ("150+").
 * Static copy (index.html, llms.txt, MCP text) uses APP_COUNT_FALLBACK; update it
 * when the catalogue grows. React pages use the live hook so they never overstate.
 */
export const APP_COUNT_FALLBACK = "240+";

export function useAppCountLabel(): string {
  const { data = [] } = useToolsCatalog();
  const live = data.filter((t) => t.is_live).length;
  return live > 0 ? `${Math.floor(live / 5) * 5}+` : APP_COUNT_FALLBACK;
}
