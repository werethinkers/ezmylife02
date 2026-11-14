/*
 * Bundles every gallery-picks item into public/gallery/picks/<key>.js (an IIFE that mounts the demo into #root)
 * plus one shared runtime.js (React, ReactDOM, framer-motion, lucide-react) and index.json for the gallery page.
 * Items whose imports can't be resolved are listed in index.json under "failed" with the reason.
 */
import fs from "node:fs";
import path from "node:path";
import { build } from "esbuild";

const ROOT = process.cwd();
const ITEMS = path.join(ROOT, "gallery-picks/items");
const OUT = path.join(ROOT, "public/gallery/picks");
fs.mkdirSync(OUT, { recursive: true });
const TMP = path.join(ROOT, "node_modules/.cache/gallery-picks");
fs.mkdirSync(TMP, { recursive: true });

const GLOBALS = {
  react: "React",
  "react-dom": "ReactDOM",
  "react-dom/client": "ReactDOMClient",
  "react/jsx-runtime": "JsxRuntime",
  "framer-motion": "FramerMotion",
  "motion/react": "FramerMotion",
  "lucide-react": "Lucide",
};

/* shared runtime */
fs.writeFileSync(
  path.join(TMP, "runtime-entry.ts"),
  `import * as React from "react";import * as ReactDOM from "react-dom";import * as ReactDOMClient from "react-dom/client";import * as JsxRuntime from "react/jsx-runtime";import * as FramerMotion from "framer-motion";import * as Lucide from "lucide-react";
(window as any).__gx={React,ReactDOM,ReactDOMClient,JsxRuntime,FramerMotion,Lucide};`,
);
await build({ entryPoints: [path.join(TMP, "runtime-entry.ts")], bundle: true, minify: true, format: "iife", outfile: path.join(OUT, "runtime.js"), define: { "process.env.NODE_ENV": '"production"' }, logLevel: "silent", jsx: "automatic" });

const globalsPlugin = {
  name: "globals",
  setup(b) {
    b.onResolve({ filter: /^(react|react-dom|react-dom\/client|react\/jsx-runtime|framer-motion|motion\/react|lucide-react)$/ }, (a) => ({ path: a.path, namespace: "gx" }));
    b.onLoad({ filter: /.*/, namespace: "gx" }, (a) => ({ contents: `module.exports = window.__gx.${GLOBALS[a.path]};`, loader: "js" }));
  },
};

const keys = fs.readdirSync(ITEMS).filter((k) => fs.existsSync(path.join(ITEMS, k, "meta.json")));
const items = [];
const failed = [];
for (const key of keys) {
  const dir = path.join(ITEMS, key);
  const meta = JSON.parse(fs.readFileSync(path.join(dir, "meta.json"), "utf8"));
  if (meta.skip) { failed.push({ key, name: meta.name, reason: meta.skip }); continue; }
  const entry = path.join(TMP, `${key}.entry.tsx`);
  fs.writeFileSync(entry, `import * as React from "react";import {createRoot} from "react-dom/client";import * as M from ${JSON.stringify(path.join(dir, "demo.tsx"))};const Demo:any=(M as any).default||Object.values(M).find((v)=>typeof v==="function");createRoot(document.getElementById("root")!).render(<Demo/>);`);
  const ownPlugin = {
    name: "own",
    setup(b) {
      /* the demo imports the component as @/components/ui/<slug> (or some other path): point it at our copy */
      b.onResolve({ filter: /^@\/components\/(ui\/)?[^/]+$/ }, (a) => {
        if (a.path.endsWith(`/${meta.slug}`)) return { path: path.join(dir, "component.tsx") };
        return undefined;
      });
      b.onResolve({ filter: /^\.\.?\/[^/]+$/ }, (a) => (a.importer.startsWith(dir) && (a.path.endsWith(meta.slug) || a.path === "./component") ? { path: path.join(dir, "component.tsx") } : undefined));
    },
  };
  try {
    await build({
      entryPoints: [entry],
      bundle: true,
      minify: true,
      format: "iife",
      outfile: path.join(OUT, `${key}.js`),
      alias: { "@": path.join(ROOT, "src") },
      plugins: [globalsPlugin, ownPlugin],
      define: { "process.env.NODE_ENV": '"production"' },
      jsx: "automatic",
      loader: { ".css": "empty", ".svg": "dataurl", ".png": "dataurl", ".jpg": "dataurl" },
      logLevel: "silent",
      absWorkingDir: ROOT,
    });
    items.push({ ...meta, bytes: fs.statSync(path.join(OUT, `${key}.js`)).size });
  } catch (e) {
    failed.push({ key, name: meta.name, reason: String(e.errors?.[0]?.text ?? e.message).slice(0, 200) });
  }
}
fs.writeFileSync(path.join(OUT, "index.json"), JSON.stringify({ items, failed }, null, 1));
console.log(`built ${items.length}, failed ${failed.length}`);
for (const f of failed) console.log(" -", f.key, f.reason);
