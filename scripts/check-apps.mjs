// npm run check:apps — fails when the app data files disagree with each other.
// Every app needs the same id in four places: catalogue row, app definition, server
// instructions, and price. This script is the gate before a batch is merged.
import { loadApps } from "./lib/load-apps.mjs";

const d = await loadApps();
const errors = [];
const notes = [];
const err = (m) => errors.push(m);

const dupes = (list) => [...new Set(list.filter((x, i) => list.indexOf(x) !== i))];
const acrossGroups = (groups, what, keysOf = Object.keys) => {
  const seen = new Map();
  for (const [group, value] of Object.entries(groups)) {
    for (const id of keysOf(value)) {
      if (seen.has(id)) err(`${what}: "${id}" is in both ${seen.get(id)} and ${group}`);
      else seen.set(id, group);
    }
  }
};

// 1. Ids are unique, in every kind of file.
const catIds = d.catalogue.map((t) => t.id);
for (const id of dupes(catIds)) err(`Catalogue: id "${id}" appears twice`);
acrossGroups(d.APP_GROUPS, "App definition");
acrossGroups(d.SPEC_GROUPS, "Server instructions");
acrossGroups(d.PRICE_GROUPS, "Price");
acrossGroups(d.CATALOG_GROUPS, "Catalogue", (rows) => rows.map((r) => r.id));
const catalogue = new Map(d.catalogue.map((t) => [t.id, t]));
const launchIds = new Set(Object.values(d.CATALOG_GROUPS).flat().map((r) => r.id));

// 2. No two apps share a name.
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const names = d.catalogue.map((t) => norm(t.name));
for (const n of dupes(names)) err(`Catalogue: two apps are named "${n}" (${d.catalogue.filter((t) => norm(t.name) === n).map((t) => t.id).join(", ")})`);

// 3. Every category sits under a home-page goal.
for (const c of new Set(d.catalogue.map((t) => t.category))) {
  if (!d.CATEGORY_INFO[c]) err(`Category "${c}" is not in CATEGORY_INFO (src/data/goals.ts), so its apps fall into "More apps"`);
}

// 4. Every app definition has a catalogue row, a whole-number price, and (unless it has its own screen) server instructions.
const KIND_FOR_ENGINE = { doc: ["doc"], tracker: ["doc"], chat: ["chat"], vision: ["vision"], image: ["image"] };
for (const [id, def] of Object.entries(d.APPS)) {
  if (!catalogue.has(id)) err(`App "${id}" has a definition but no catalogue row`);
  const price = d.DEFAULT_PRICES[id];
  if (!Number.isInteger(price) || price < 1) err(`App "${id}" has no price of at least 1 credit in src/apps/prices/`);
  else if (def.credits !== price) err(`App "${id}": definition says ${def.credits} credits, price file says ${price}`);
  const spec = d.APP_SPECS[id];
  if (def.engine !== "custom") {
    if (!spec) err(`App "${id}" (${def.engine}) has no server instructions in supabase/functions/_shared/appSpecs/`);
    else if (!KIND_FOR_ENGINE[def.engine].includes(spec.kind)) err(`App "${id}": engine "${def.engine}" does not match server kind "${spec.kind}"`);
  }
  for (const r of def.related ?? []) if (!catalogue.has(r)) err(`App "${id}" lists related app "${r}", which is not in the catalogue`);
  if (!def.intro?.trim()) err(`App "${id}" has no intro line`);
}

// 5. The price a page shows equals the price the server charges.
for (const [id, spec] of Object.entries(d.APP_SPECS)) {
  const priceId = spec.chargeId ?? id;
  const shown = d.DEFAULT_PRICES[priceId];
  if (!Number.isInteger(spec.credits) || spec.credits < 1) err(`Server instructions "${id}": credits must be a whole number of at least 1`);
  if (shown === undefined) err(`Server instructions "${id}" has no price in src/apps/prices/ (looked for "${priceId}")`);
  else if (shown !== spec.credits) err(`Price mismatch for "${id}": server charges ${spec.credits}, page shows ${shown}`);
  if ((spec.kind !== "image") && !spec.system?.trim()) err(`Server instructions "${id}" has an empty system text`);
}
for (const [id, price] of Object.entries(d.DEFAULT_PRICES)) {
  if (!Number.isInteger(price) || price < 1) err(`Price "${id}" must be a whole number of at least 1`);
}

// 6. Every catalogue row opens something.
for (const t of d.catalogue) {
  const opens = t.id in d.APPS || d.nativeIds.has(t.id) || Boolean(t.dedicatedRoute);
  if (t.isLive && !opens) err(`Catalogue row "${t.id}" is live but has no app definition, screen or own page`);
  if (d.REMOVED_APPS.has(t.id)) err(`Catalogue row "${t.id}" is on the removed list`);
}

// 7. Stricter rules for rows added by the launch (src/data/catalog/).
const descs = new Map();
for (const [group, rows] of Object.entries(d.CATALOG_GROUPS)) {
  for (const t of rows) {
    const where = `${group}: "${t.id}"`;
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(t.id)) err(`${where}: id must be lower-case words joined by hyphens`);
    if (t.name.length < 3 || t.name.length > 60) err(`${where}: name must be 3 to 60 characters`);
    if (t.description.length < 20 || t.description.length > 160) err(`${where}: description must be 20 to 160 characters (it is the search-result text)`);
    if (!t.toolType?.length) err(`${where}: needs at least one tool type`);
    const def = d.APPS[t.id];
    if (!def && !t.dedicatedRoute) err(`${where}: has no app definition in src/apps/defs/`);
    if (def && !d.APP_SPECS[t.id] && !d.USAGE_GATED.has(t.id)) err(`${where}: runs without the server, so it must be in USAGE_GATED (src/apps/prices.ts) to be charged`);
    const key = norm(t.description);
    if (descs.has(key)) err(`${where}: same description as "${descs.get(key)}" — two apps must differ in something real`);
    else descs.set(key, t.id);
  }
}

// Things worth knowing that do not block a merge.
const orphanSpecs = Object.keys(d.APP_SPECS).filter((id) => !catalogue.has(id) && !(id in (d.SPEC_GROUPS.extras ?? {})));
if (orphanSpecs.length) notes.push(`Server instructions without a catalogue row: ${orphanSpecs.join(", ")}`);
const sharedScreens = d.catalogue.filter((t) => launchIds.has(t.id) === false && !(t.id in d.APPS) && d.nativeIds.has(t.id)).length;

const live = d.catalogue.filter((t) => t.isLive).length;
console.log(`Catalogue: ${d.catalogue.length} apps (${live} live), ${launchIds.size} added by the launch.`);
console.log(`App definitions: ${Object.keys(d.APPS).length} · server instructions: ${Object.keys(d.APP_SPECS).length} · prices: ${Object.keys(d.DEFAULT_PRICES).length} · older screens: ${sharedScreens}`);
for (const n of notes) console.log(`Note: ${n}`);
if (errors.length) {
  console.error(`\n${errors.length} problem${errors.length === 1 ? "" : "s"}:`);
  for (const e of errors) console.error(` - ${e}`);
  process.exit(1);
}
console.log("All checks passed.");
