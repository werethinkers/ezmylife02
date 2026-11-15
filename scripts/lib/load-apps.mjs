// Loads the app data files (TypeScript, with the "@/…" alias) into Node for the launch scripts.
// Uses Vite's own loader, so nothing extra needs installing.
import { createServer } from "vite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

export async function loadApps() {
  const server = await createServer({
    root: ROOT,
    configFile: false,
    logLevel: "error",
    appType: "custom",
    server: { middlewareMode: true, hmr: false, ws: false },
    optimizeDeps: { noDiscovery: true, include: [] },
    resolve: { alias: { "@": path.join(ROOT, "src") } },
  });
  try {
    const load = (file) => server.ssrLoadModule("/" + file);
    const [registry, prices, specs, db, goals, catalog, seo, placements, detail] = await Promise.all([
      load("src/apps/registry.ts"),
      load("src/apps/prices.ts"),
      load("supabase/functions/_shared/appSpecs.ts"),
      load("src/data/toolsDatabase.ts"),
      load("src/data/goals.ts"),
      load("src/data/catalog/index.ts"),
      load("src/lib/appSeo.ts"),
      load("src/data/placements.ts"),
      load("src/lib/appDetail.ts"),
    ]);
    // Older apps are plain screens listed in one map; read its keys from the file text.
    const native = fs.readFileSync(path.join(ROOT, "src/components/tools/NativeToolRenderer.tsx"), "utf8");
    const block = native.slice(native.indexOf("const nativeTools"), native.indexOf("\n};", native.indexOf("const nativeTools")));
    const nativeIds = new Set([...block.matchAll(/^\s*"([^"]+)":/gm)].map((m) => m[1]));
    return {
      APPS: registry.APPS,
      APP_GROUPS: registry.APP_GROUPS,
      DEFAULT_PRICES: prices.DEFAULT_PRICES,
      PRICE_GROUPS: prices.PRICE_GROUPS,
      BROWSER_ONLY: prices.BROWSER_ONLY,
      USAGE_GATED: prices.USAGE_GATED,
      REMOVED_APPS: prices.REMOVED_APPS,
      priceIdFor: prices.priceIdFor,
      APP_SPECS: specs.APP_SPECS,
      SPEC_GROUPS: specs.SPEC_GROUPS,
      catalogue: db.toolsDatabase,
      CATALOG_GROUPS: catalog.CATALOG_GROUPS,
      CATEGORY_INFO: goals.CATEGORY_INFO,
      GOALS: goals.GOALS,
      KIND_TEXT: goals.KIND_TEXT,
      KIND_BY_ENGINE: goals.KIND_BY_ENGINE,
      categoryInfo: goals.categoryInfo,
      registerCategories: goals.registerCategories,
      giveGetFor: goals.giveGetFor,
      nativeIds,
      seo,
      appDetail: detail.appDetail,
      PLACEMENT_IDS: placements.PLACEMENT_IDS,
    };
  } finally {
    await server.close();
  }
}

/** The price a page shows for an app, in credits, or undefined when the code has no default. */
export function displayPrice(d, id) {
  const p = d.DEFAULT_PRICES[d.priceIdFor(id)] ?? d.DEFAULT_PRICES[id];
  if (p) return p;
  return d.BROWSER_ONLY.has(id) ? 1 : undefined;
}

/** Loads any of the site's TypeScript files into Node, keyed by path. */
export async function loadModules(files) {
  const server = await createServer({
    root: ROOT,
    configFile: false,
    logLevel: "error",
    appType: "custom",
    server: { middlewareMode: true, hmr: false, ws: false },
    optimizeDeps: { noDiscovery: true, include: [] },
    resolve: { alias: { "@": path.join(ROOT, "src") } },
  });
  try {
    const mods = await Promise.all(files.map((f) => server.ssrLoadModule("/" + f)));
    return Object.fromEntries(files.map((f, i) => [f, mods[i]]));
  } finally {
    await server.close();
  }
}
