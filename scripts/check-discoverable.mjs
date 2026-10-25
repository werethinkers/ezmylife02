// npm run check:discoverable — fails when an app, website or card could not be found from the
// category lists or the search box. Every item must (1) sit in a category that belongs to a goal
// (otherwise the home list drops it) and (2) carry words the search can match.
import { loadApps } from "./lib/load-apps.mjs";
import { createServer } from "vite";
import path from "node:path";
import { ROOT } from "./lib/load-apps.mjs";

const d = await loadApps();
const server = await createServer({
  root: ROOT, configFile: false, logLevel: "error", appType: "custom",
  server: { middlewareMode: true, hmr: false, ws: false },
  optimizeDeps: { noDiscovery: true, include: [] },
  resolve: { alias: { "@": path.join(ROOT, "src") } },
});
let instant;
try {
  instant = await server.ssrLoadModule("/src/instant/catalog/index.ts");
} finally {
  await server.close();
}

const problems = [];
const goalIds = new Set(d.GOALS.map((g) => g.id));

// Apps: every category the app is listed in must have a goal, or that list never shows it.
for (const t of d.catalogue) {
  const cats = [t.category, ...(t.extra_categories ?? t.alsoIn ?? [])].filter(Boolean);
  if (!cats.length) problems.push(`App "${t.id}" has no category`);
  if (!cats.some((c) => goalIds.has(d.categoryInfo(c).goal) && d.CATEGORY_INFO[c]))
    problems.push(`App "${t.id}" (category "${t.category}") is in no category with a goal, so the home list leaves it out`);
  if (!`${t.name} ${t.description ?? ""}`.trim()) problems.push(`App "${t.id}" has no name or description for search to match`);
}

// Websites, cards and invitations: category must be one the gallery lists; search needs words.
const designCats = new Set(instant.CATEGORIES.map((c) => c.id));
for (const p of instant.CATALOG) {
  if (!designCats.has(p.category)) problems.push(`Design "${p.id}" has category "${p.category}", which the gallery and home list do not show`);
  if (!p.name?.trim()) problems.push(`Design "${p.id}" has no name`);
  if (!p.tagline?.trim()) problems.push(`Design "${p.id}" has no tagline, so search can only match its name`);
}

if (problems.length) {
  console.error(`✖ ${problems.length} thing(s) people could not find:\n` + problems.map((p) => "  - " + p).join("\n"));
  process.exit(1);
}
console.log(`✔ ${d.catalogue.length} apps and ${instant.CATALOG.length} designs are all reachable from a category and from search.`);
