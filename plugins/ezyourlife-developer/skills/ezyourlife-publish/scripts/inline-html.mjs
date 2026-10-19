#!/usr/bin/env node
// inline-html.mjs: turns a built web app folder into ONE self-contained HTML file for EzYourLife.
// Usage: node inline-html.mjs <build-folder> [entry.html=index.html] [out.html=ezyourlife-app.html]   (Node 18+, no dependencies)
//
// Inlines local stylesheets (and the fonts/images their url(...) points to), local scripts, and
// local <img>/<link rel=icon> files as data URIs. Leaves http(s) links (CDNs) untouched.
// Warns when a script still imports other local files (code splitting): those need a single-bundle build.
import { readFile, writeFile, stat } from "node:fs/promises";
import path from "node:path";

const [dir, entry = "index.html", out = "ezyourlife-app.html"] = process.argv.slice(2);
if (!dir) {
  console.error("Usage: node inline-html.mjs <build-folder> [entry.html] [out.html]");
  process.exit(1);
}

const root = path.resolve(dir);
const MIME = {
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".webp": "image/webp",
  ".svg": "image/svg+xml", ".ico": "image/x-icon", ".avif": "image/avif", ".woff": "font/woff", ".woff2": "font/woff2",
  ".ttf": "font/ttf", ".otf": "font/otf", ".json": "application/json", ".mp3": "audio/mpeg", ".wav": "audio/wav",
};
const warnings = [];
const isRemote = (u) => /^(https?:)?\/\//i.test(u) || /^(data|blob|mailto|tel|#):?/i.test(u);

// Resolve a reference from a file inside the build folder; "/x" means the folder's root.
function resolveRef(ref, fromFile) {
  const clean = decodeURIComponent(ref.split(/[?#]/)[0]);
  const p = clean.startsWith("/") ? path.join(root, clean) : path.resolve(path.dirname(fromFile), clean);
  if (!p.startsWith(root)) throw new Error(`Refusing to read outside the build folder: ${ref}`);
  return p;
}

async function exists(p) {
  try {
    return (await stat(p)).isFile();
  } catch {
    return false;
  }
}

async function dataUri(file) {
  const ext = path.extname(file).toLowerCase();
  const type = MIME[ext] || "application/octet-stream";
  const buf = await readFile(file);
  return `data:${type};base64,${buf.toString("base64")}`;
}

async function inlineCssUrls(css, cssFile) {
  const refs = [...css.matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g)];
  for (const m of refs) {
    const ref = m[2].trim();
    if (isRemote(ref)) continue;
    const f = resolveRef(ref, cssFile);
    if (await exists(f)) css = css.split(m[0]).join(`url("${await dataUri(f)}")`);
    else warnings.push(`CSS refers to a missing file: ${ref}`);
  }
  return css;
}

const entryFile = path.join(root, entry);
let html = await readFile(entryFile, "utf8");

// Applies fn only to markup, never to the contents of <script> and <style> blocks.
async function inMarkup(text, fn) {
  const parts = text.split(/(<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>)/gi);
  for (let i = 0; i < parts.length; i += 2) parts[i] = await fn(parts[i]);
  return parts.join("");
}

// Images and icons in the page's own markup (first, before any code is inlined)
html = await inMarkup(html, async (markup) => {
  for (const m of [...markup.matchAll(/<(img|link)\b[^>]*>/gi)]) {
    const tag = m[0];
    if (m[1].toLowerCase() === "link" && !/rel=["']?(icon|shortcut icon|apple-touch-icon)/i.test(tag)) continue;
    const attr = m[1].toLowerCase() === "img" ? "src" : "href";
    const ref = (tag.match(new RegExp(`\\b${attr}=["']([^"']+)["']`, "i")) || [])[1];
    if (!ref || isRemote(ref) || ref.includes("${")) continue;
    const f = resolveRef(ref, entryFile);
    if (!(await exists(f))) { warnings.push(`Missing file: ${ref}`); continue; }
    markup = markup.split(tag).join(tag.replace(ref, await dataUri(f)));
  }
  return markup;
});

// Stylesheets
for (const m of [...html.matchAll(/<link\b[^>]*rel=["']?stylesheet["']?[^>]*>/gi)]) {
  const href = (m[0].match(/href=["']([^"']+)["']/i) || [])[1];
  if (!href || isRemote(href)) continue;
  const f = resolveRef(href, entryFile);
  if (!(await exists(f))) { warnings.push(`Missing stylesheet: ${href}`); continue; }
  const css = await inlineCssUrls(await readFile(f, "utf8"), f);
  html = html.split(m[0]).join(`<style>\n${css.replace(/<\/style/gi, "<\\/style")}\n</style>`);
}

// Scripts with a local src
for (const m of [...html.matchAll(/<script\b([^>]*)\bsrc=["']([^"']+)["']([^>]*)>\s*<\/script>/gi)]) {
  const src = m[2];
  if (isRemote(src)) continue;
  const f = resolveRef(src, entryFile);
  if (!(await exists(f))) { warnings.push(`Missing script: ${src}`); continue; }
  const js = await readFile(f, "utf8");
  if (/\bimport\s*\(\s*["'`]\.{0,2}\//.test(js) || /\bfrom\s*["']\.{0,2}\/[^"']+\.m?js["']/.test(js)) {
    warnings.push(`${src} imports other local files (code splitting). Rebuild as one bundle, or those parts will not load.`);
  }
  const attrs = `${m[1]} ${m[3]}`.replace(/\s*\b(crossorigin|integrity=["'][^"']*["']|defer|async)\b/gi, "").replace(/\s+/g, " ").trim();
  html = html.split(m[0]).join(`<script${attrs ? " " + attrs : ""}>\n${js.replace(/<\/script/gi, "<\\/script")}\n</script>`);
}

// Modulepreload links point at chunks that are now inline or unused
html = html.replace(/<link\b[^>]*rel=["']?modulepreload["']?[^>]*>\s*/gi, "");

if (!/<meta[^>]+name=["']?viewport/i.test(html)) {
  html = html.replace(/<head[^>]*>/i, (h) => `${h}\n<meta name="viewport" content="width=device-width, initial-scale=1">`);
  warnings.push("Added a viewport tag so the app fits phones.");
}

await writeFile(out, html);
const bytes = Buffer.byteLength(html, "utf8");
console.log(`Wrote ${out}: ${(bytes / 1024).toFixed(0)} KB${bytes > 10_000_000 ? " (OVER the 10 MB limit)" : bytes > 2_000_000 ? " (over 2 MB: will load slowly on phones)" : ""}`);
for (const w of warnings) console.log("Note: " + w);
if (bytes > 10_000_000) process.exit(2);
