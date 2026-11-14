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
    /* Next.js helpers some picks use: plain img / a stand-ins */
    /* helper files a pick imports from "<slug>-utils/<name>" but the API leaves out:
       use our stand-in in gallery-picks/shims, else our own shadcn ui file of that name */
    b.onResolve({ filter: /^@\/components\/ui\/[^/]+-utils\/[^/]+$/ }, (a) => {
      const name = a.path.split("/").pop();
      for (const p of [path.join(ROOT, "gallery-picks/shims", name + ".tsx"), path.join(ROOT, "src/components/ui", name + ".tsx")]) if (fs.existsSync(p)) return { path: p };
      return undefined;
    });
    /* small npm helpers some picks use, rebuilt here so we don't add packages */
    b.onResolve({ filter: /^react-use-measure$/ }, () => ({ path: "measure", namespace: "measureshim" }));
    b.onLoad({ filter: /.*/, namespace: "measureshim" }, () => ({
      contents: `import * as React from "react";export default function useMeasure(){const[el,setEl]=React.useState(null);const[b,setB]=React.useState({x:0,y:0,width:0,height:0,top:0,left:0,right:0,bottom:0});React.useLayoutEffect(()=>{if(!el)return;const f=()=>{const r=el.getBoundingClientRect();setB({x:r.x,y:r.y,width:r.width,height:r.height,top:r.top,left:r.left,right:r.right,bottom:r.bottom});};f();const ro=new ResizeObserver(f);ro.observe(el);return()=>ro.disconnect();},[el]);return[setEl,b];}`,
      loader: "jsx",
      resolveDir: process.cwd(),
    }));
    b.onResolve({ filter: /^react-wrap-balancer$/ }, () => ({ path: "balancer", namespace: "balancershim" }));
    b.onLoad({ filter: /.*/, namespace: "balancershim" }, () => ({
      contents: `import * as React from "react";export default function Balancer({children}){return React.createElement("span",{style:{textWrap:"balance"}},children);}export const Provider=({children})=>children;`,
      loader: "jsx",
      resolveDir: process.cwd(),
    }));
    /* web-font packages: the page loads its own fonts */
    b.onResolve({ filter: /^@fontsource(-variable)?\// }, () => ({ path: "font", namespace: "emptyshim" }));
    b.onLoad({ filter: /.*/, namespace: "emptyshim" }, () => ({ contents: "", loader: "js" }));
    /* "cn" imported as a package by some picks: our own helper */
    b.onResolve({ filter: /^cn$/ }, () => ({ path: path.join(ROOT, "src/lib/utils.ts") }));
    /* @gsap/react's useGSAP, rebuilt on gsap.context so we don't add a package */
    b.onResolve({ filter: /^@gsap\/react$/ }, () => ({ path: "usegsap", namespace: "gsapshim" }));
    b.onLoad({ filter: /.*/, namespace: "gsapshim" }, () => ({
      contents: `import * as React from "react";import gsap from "gsap";export function useGSAP(cb,cfg){const deps=Array.isArray(cfg)?cfg:(cfg&&cfg.dependencies)||[];const scope=!Array.isArray(cfg)&&cfg?cfg.scope:undefined;const ctxRef=React.useRef(null);React.useLayoutEffect(()=>{const ctx=gsap.context((self)=>{if(cb)cb(self);},scope&&scope.current?scope.current:undefined);ctxRef.current=ctx;return()=>ctx.revert();},deps);return{context:ctxRef.current,contextSafe:(f)=>f};}export default useGSAP;`,
      loader: "jsx",
      resolveDir: process.cwd(),
    }));
    /* newer shadcn "field" helper that our ui folder doesn't have */
    b.onResolve({ filter: /^@\/components\/ui\/field$/ }, () => ({ path: "field", namespace: "fieldshim" }));
    b.onLoad({ filter: /.*/, namespace: "fieldshim" }, () => ({
      contents: `import * as React from "react";const h=(t,c)=>({className,...p})=>React.createElement(t,{className:c+" "+(className||""),...p});
export const Field=h("div","grid gap-2");export const FieldLabel=h("label","text-sm font-medium");export const FieldDescription=h("p","text-sm text-muted-foreground");export const FieldError=h("p","text-sm text-destructive");export const FieldGroup=h("div","grid gap-4");export const FieldSet=h("fieldset","grid gap-4");export const FieldLegend=h("legend","font-medium");export const FieldContent=h("div","grid gap-1");export const FieldTitle=h("div","text-sm font-medium");export const FieldSeparator=h("hr","border-border");`,
      loader: "jsx",
      resolveDir: process.cwd(),
    }));
    b.onResolve({ filter: /^next\/(image|link)$/ }, (a) => ({ path: a.path, namespace: "nextshim" }));
    b.onLoad({ filter: /.*/, namespace: "nextshim" }, (a) => ({
      contents: a.path === "next/image"
        ? `import * as React from "react";export default function Image({src,alt="",fill,priority,quality,placeholder,blurDataURL,loader,unoptimized,style,...p}){const s=typeof src==="object"&&src?src.src:src;return React.createElement("img",{src:s,alt,style:fill?{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",...style}:style,...p});}`
        : `import * as React from "react";export default function Link({href,prefetch,replace,scroll,shallow,legacyBehavior,passHref,...p}){return React.createElement("a",{href:typeof href==="string"?href:"#",...p});}`,
      loader: "jsx",
      resolveDir: process.cwd(),
    }));
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
      b.onResolve({ filter: /^@\/components\/([^/]+\/)?[^/]+$/ }, (a) => {
        if (a.path.endsWith(`/${meta.slug}`)) return { path: path.join(dir, "component.tsx") };
        const helper = path.join(dir, "helpers", a.path.split("/").pop() + ".tsx");
        if (fs.existsSync(helper)) return { path: helper };
        return undefined;
      });
      b.onResolve({ filter: /^\.\.?\/.+$/ }, (a) => (a.importer.startsWith(dir) && (a.path.endsWith(meta.slug) || a.path === "./component") ? { path: path.join(dir, "component.tsx") } : undefined));
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
