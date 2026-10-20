import type { CatalogTool } from "@/hooks/useToolsCatalog";

/*
 * Where an app is shown, beyond its own category. An app lists its places in `placements`
 * (catalogue file in src/data/catalog/, or the tools_catalog.placements column), and every
 * place below picks it up by itself: nothing else to edit when a new app is added.
 *
 * Adding a new place: one entry here, then read it with placedIn() where it is shown.
 */
export const PLACEMENTS = {
  "home-start": "Home page, “Most useful to start” shelf",
  "home-strip": "Home page, the moving strip of app names",
  "home-new": "Home page, front of “New in the store”",
  creators: "/creators, apps your followers' businesses get",
  builders: "/list-your-app, apps listed by builders",
} as const;

export type PlacementId = keyof typeof PLACEMENTS;

export const PLACEMENT_IDS = Object.keys(PLACEMENTS) as PlacementId[];

/** Older admin flag that means the same as "home-start". */
const LEGACY: Partial<Record<string, PlacementId>> = { hot: "home-start" };

/** True when the app asks to be shown in this place. */
export function isPlacedIn(t: CatalogTool, place: PlacementId): boolean {
  if (t.placements?.includes(place)) return true;
  if (t.home_section && LEGACY[t.home_section] === place) return true;
  // Apps from outside builders always show on the builders page.
  return place === "builders" && t.id.startsWith("dev-");
}

/**
 * Live apps placed here, in a steady order: display order first (lower first), then newest first,
 * so a freshly added app shows near the front without anyone moving it.
 */
export function placedIn(apps: CatalogTool[], place: PlacementId, limit?: number): CatalogTool[] {
  const list = apps
    .filter((t) => t.is_live && isPlacedIn(t, place))
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0) || b.created_at.localeCompare(a.created_at));
  return limit ? list.slice(0, limit) : list;
}
