/*
 * Turns one saved 21st.dev get_component result (JSON file) into gallery-picks/items/<author>__<slug>/.
 * Usage: node scripts/gallery-picks-ingest.mjs <result.json> <author>/<slug> [kind]
 * The licence line goes inside component.tsx; the gallery page text never shows it.
 */
import fs from "node:fs";
import path from "node:path";

const [file, ref, kind = ""] = process.argv.slice(2);
if (!file || !ref) throw new Error("usage: ingest <result.json> <author>/<slug> [kind]");
const [author, slug] = ref.split("/");
const c = JSON.parse(fs.readFileSync(file, "utf8")).component;
if (!c?.componentCode) throw new Error(`no code in ${file}`);

const dir = path.join("gallery-picks", "items", `${author}__${slug}`);
fs.mkdirSync(dir, { recursive: true });
const url = `https://21st.dev/@${author}/components/${slug}`;
const header = `/*
 * ${c.name}
 * Author: @${author}   Source: ${url}   21st.dev id: ${c.id}
 * Licence: covered by the paid 21st.dev plan Ezyourlife bought on 14 Nov 2026 (the API returns no
 * per-component licence text, so the author's own terms were not checked line by line).
 * Kept as published; only this header was added.
 */
// @ts-nocheck
/* eslint-disable */
`;
fs.writeFileSync(path.join(dir, "component.tsx"), header + c.componentCode);
fs.writeFileSync(path.join(dir, "demo.tsx"), "// @ts-nocheck\n/* eslint-disable */\n" + (c.demoCode ?? ""));
const deps = Object.keys(c.registryDependencies?.npmDependencies ?? {});
const meta = { id: c.id, key: `${author}__${slug}`, author, slug, name: c.name, description: c.description ?? "", url, preview: c.previewUrl ?? "", kind, deps };
fs.writeFileSync(path.join(dir, "meta.json"), JSON.stringify(meta, null, 2));
fs.writeFileSync(
  path.join(dir, "prompt.md"),
  `# Build: ${c.name}\n\n${c.description ?? ""}\n\nThe working code is in gallery-picks/items/${meta.key}/component.tsx (demo: demo.tsx). Rebuild it inside the Ezyourlife repo in its own style (docs/design.md): cream page, white cards, thick ink outlines (border-2 border-ink) with hard block shadows (shadow-block-sm / shadow-block), Unbounded headings (font-display), Hind body text, solid brand colours (bg-pink, bg-sun, bg-teal, bg-sky, bg-lime), plain words. Use our shadcn parts from src/components/ui where they fit. Keep the behaviour, keyboard and reduced-motion handling.\n`,
);
console.log("ok", meta.key, c.componentCode.length);
