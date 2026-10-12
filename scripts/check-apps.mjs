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
const KIND_FOR_ENGINE = { doc: ["doc"], tracker: ["doc"], chat: ["chat"], vision: ["vision"], image: ["image"], calc: ["doc"], interview: ["doc"], analyse: ["doc"], plan: ["doc"], pack: ["doc"], coach: ["chat"], studio: ["image"] };
// Engines that run wholly in the browser: no server instructions, but they must be charged per use.
const BROWSER_ENGINES = new Set(["convert", "preset"]);
for (const [id, def] of Object.entries(d.APPS)) {
  if (!catalogue.has(id)) err(`App "${id}" has a definition but no catalogue row`);
  const price = d.DEFAULT_PRICES[id];
  if (!Number.isInteger(price) || price < 1) err(`App "${id}" has no price of at least 1 credit in src/apps/prices/`);
  else if (def.credits !== price) err(`App "${id}": definition says ${def.credits} credits, price file says ${price}`);
  const spec = d.APP_SPECS[id];
  if (BROWSER_ENGINES.has(def.engine)) {
    if (!d.USAGE_GATED.has(id)) err(`App "${id}" (${def.engine}) runs in the browser, so it must be in USAGE_GATED (src/apps/prices.ts) to be charged`);
  } else if (def.engine !== "custom") {
    if (!spec) err(`App "${id}" (${def.engine}) has no server instructions in supabase/functions/_shared/appSpecs/`);
    else if (!KIND_FOR_ENGINE[def.engine].includes(spec.kind)) err(`App "${id}": engine "${def.engine}" does not match server kind "${spec.kind}"`);
  }
  for (const r of def.related ?? []) if (!catalogue.has(r)) err(`App "${id}" lists related app "${r}", which is not in the catalogue`);
  if (!def.intro?.trim()) err(`App "${id}" has no intro line`);
  if (def.engine === "calc" && !d.USAGE_GATED.has(id)) err(`Calculator "${id}" must be in USAGE_GATED, or its sums could be used without paying`);

  // Facts from outside (exam rules, rates, legal limits) need an official page beside them.
  const sources = def.sources ?? [];
  if (def.engine === "preset" && !sources.length) err(`App "${id}": exam and ID presets need at least one official source`);
  for (const s of sources) {
    if (!/^https:\/\//.test(s.url ?? "")) err(`App "${id}": source "${s.label}" needs an https address`);
    if (!s.checked?.trim()) err(`App "${id}": source "${s.label}" needs the date it was checked`);
  }
  for (const it of def.engine === "preset" ? def.items : []) {
    const where = `App "${id}" ${it.key}`;
    if (it.minKB !== undefined && it.maxKB !== undefined && !(it.maxKB > it.minKB)) err(`${where}: the KB range must have a maximum above the minimum`);
    const exact = it.width && it.height;
    const ranged = it.minW || it.maxW || it.minH || it.maxH;
    if (!exact && !ranged && !(it.outW && it.outH)) err(`${where}: give the exact pixel size, the pixel range, or our own output size (outW/outH)`);
    if (!exact && !it.aspect) err(`${where}: without an exact size, give the shape (aspect) to crop to`);
    if (it.aspect && it.aspectRule && (it.aspect < it.aspectRule[0] || it.aspect > it.aspectRule[1])) err(`${where}: aspect ${it.aspect} is outside the allowed shape ${it.aspectRule.join("–")}`);
  }
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

    // Extra categories must exist and differ from the main one, or the app would list twice or nowhere.
    for (const c of t.alsoIn ?? []) {
      if (!d.CATEGORY_INFO[c]) err(`${where}: also-in category "${c}" is not in CATEGORY_INFO (src/data/goals.ts)`);
      if (c === t.category) err(`${where}: also-in category "${c}" is the same as its main category`);
    }
    if (new Set(t.alsoIn ?? []).size !== (t.alsoIn ?? []).length) err(`${where}: also-in lists a category twice`);

    // A launch app has to be usable on sight: an example to fill in, steps, and apps to go to next.
    if (def) {
      if ((def.steps ?? []).length < 2) err(`${where}: needs at least 2 "how it works" steps`);
      if ((def.related ?? []).length < 2) err(`${where}: needs at least 2 related apps`);
      const filled = (v) => (typeof v === "string" ? v.trim().length > 0 : Array.isArray(v) && v.length > 0);
      for (const f of def.fields ?? []) {
        // Dates are exempt: a fixed example date goes stale, and the field has a picker.
        if (!f.required || f.type === "date") continue;
        if (!filled(def.sample?.[f.key]) && !filled(f.default)) {
          err(`${where}: required field "${f.key}" has no sample value, so "Fill in an example" and the Bulk mode template are incomplete`);
        }
      }
    }
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
