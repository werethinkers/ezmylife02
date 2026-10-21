// ezyourlife-upload.mjs: packs a built app folder (index.html and its files) and sends it to EzYourLife with a one-time upload key.
// Usage: node ezyourlife-upload.mjs <build-folder> <key> <supabase-url> <publishable-key>   (Node 18.17+)
import { readFile, readdir } from "node:fs/promises";
import { join, relative, sep } from "node:path";
const [dir, key, url, anon] = process.argv.slice(2);
if (!dir || !key || !url || !anon) { console.error("Usage: node ezyourlife-upload.mjs <build-folder> <key> <supabase-url> <publishable-key>"); process.exit(1); }
const bundleProject = (function bundleProject(files, entry = "index.html") {
  const MIME = {
    js: "text/javascript",
    mjs: "text/javascript",
    css: "text/css",
    html: "text/html",
    json: "application/json",
    svg: "image/svg+xml",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    avif: "image/avif",
    ico: "image/x-icon",
    bmp: "image/bmp",
    woff: "font/woff",
    woff2: "font/woff2",
    ttf: "font/ttf",
    otf: "font/otf",
    eot: "application/vnd.ms-fontobject",
    mp3: "audio/mpeg",
    wav: "audio/wav",
    ogg: "audio/ogg",
    m4a: "audio/mp4",
    mp4: "video/mp4",
    webm: "video/webm",
    txt: "text/plain",
    csv: "text/csv",
    tsv: "text/tab-separated-values",
    xml: "application/xml",
    md: "text/markdown",
    wasm: "application/wasm",
    glb: "model/gltf-binary",
    gltf: "model/gltf+json",
    bin: "application/octet-stream",
    pdf: "application/pdf",
    webmanifest: "application/manifest+json"
  };
  const DATA = /\.(json|txt|csv|tsv|xml|md|wasm|glb|gltf|bin|svg|png|jpe?g|gif|webp|mp3|wav|ogg|m4a|mp4|webm|pdf)$/i;
  const SHIM_LIMIT = 4e6;
  const dec = new TextDecoder("utf-8");
  const enc = new TextEncoder();
  const textOf = (p) => dec.decode(files[p]).replace(/^\uFEFF/, "");
  const extOf = (p) => (/\.([a-z0-9]+)$/i.exec(p)?.[1] ?? "").toLowerCase();
  const mimeOf = (p) => MIME[extOf(p)] ?? "application/octet-stream";
  const b64 = (bytes) => {
    let s = "";
    for (let i = 0; i < bytes.length; i += 32768) s += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + 32768)));
    return btoa(s);
  };
  const uriCache = {};
  const dataUri = (p) => uriCache[p] ??= `data:${mimeOf(p)};base64,${b64(files[p])}`;
  const used = /* @__PURE__ */ new Set([entry]);
  const missing = /* @__PURE__ */ new Set();
  const notes = [];
  const dirOf = (p) => p.includes("/") ? p.slice(0, p.lastIndexOf("/") + 1) : "";
  const external = (ref) => /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(ref);
  const resolve = (ref, from, report = true) => {
    ref = ref.trim();
    if (!ref || external(ref) || ref.includes("${")) return null;
    let clean = ref.split("#")[0].split("?")[0];
    try {
      clean = decodeURIComponent(clean);
    } catch {
    }
    if (!clean) return null;
    const out = [];
    for (const part of (clean.startsWith("/") ? clean.slice(1) : dirOf(from) + clean).split("/")) {
      if (part === "" || part === ".") continue;
      if (part === "..") out.pop();
      else out.push(part);
    }
    const p = out.join("/");
    if (p in files) return p;
    if (report) missing.add(ref);
    return null;
  };
  const css = (text2, from, depth = 0) => {
    text2 = text2.replace(/@import\s+(?:url\(\s*)?(["']?)([^"')\s;]+)\1\s*\)?([^;]*);/gi, (m, _q, ref, media) => {
      const p = depth < 8 ? resolve(ref, from) : null;
      if (!p) return m;
      used.add(p);
      const inner = css(textOf(p), p, depth + 1);
      return media.trim() ? `@media ${media.trim()}{${inner}}` : inner;
    });
    return text2.replace(/url\(\s*(["']?)([^"')]+?)\1\s*\)/gi, (m, _q, ref) => {
      if (/^(data|blob):/i.test(ref.trim())) return m;
      const p = resolve(ref, from);
      if (!p) return m;
      used.add(p);
      return `url("${dataUri(p)}")`;
    });
  };
  const assetStrings = (code, from) => code.replace(/(["'`])((?:\.{1,2}\/|\/)?[\w@~.%/-]{1,280}\.(?:svg|png|jpe?g|gif|webp|avif|ico|bmp|woff2?|ttf|otf|eot|mp3|wav|ogg|m4a|mp4|webm|pdf|wasm|glb|gltf|bin))\1/gi, (m, q, ref) => {
    const p = resolve(ref, from, false) ?? (!ref.startsWith(".") ? resolve("/" + ref.replace(/^\/+/, ""), from, false) : null);
    if (!p) return m;
    used.add(p);
    return q + dataUri(p) + q;
  });
  const modules = /* @__PURE__ */ new Map();
  const bare = /* @__PURE__ */ new Set();
  const addModule = (p) => {
    if (modules.has(p)) return;
    modules.set(p, "");
    used.add(p);
    modules.set(p, rewriteImports(textOf(p), p));
  };
  const rewriteImports = (code, from) => assetStrings(
    code.replace(/(\bimport\s*\(\s*|\bfrom\s*|\bimport\s*)(["'])([^"'\n]+)\2/g, (m, pre, q, ref) => {
      if (/^(\.{1,2}\/|\/)/.test(ref)) {
        const p = resolve(ref, from);
        if (!p || !/\.(m?js)$/i.test(p)) return m;
        addModule(p);
        return `${pre}${q}@ezyl/${p}${q}`;
      }
      if (!external(ref) && !ref.startsWith("@ezyl/") && /^[@a-z]/i.test(ref)) bare.add(ref);
      return m;
    }),
    from
  );
  const noClose = (s, tag) => s.replace(new RegExp(`</(${tag})`, "gi"), "<\\/$1");
  const attr = (attrs, name) => new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i").exec(attrs);
  const attrValue = (attrs, name) => {
    const m = attr(attrs, name);
    return m ? m[1] ?? m[2] ?? m[3] ?? "" : null;
  };
  const dropAttr = (attrs, name) => attrs.replace(new RegExp(`\\s*\\b${name}(\\s*=\\s*(?:"[^"]*"|'[^']*'|[^\\s>]+))?`, "i"), "");
  if (!(entry in files)) {
    throw new Error(`There is no ${entry} in the folder. Import the built app (the folder with index.html, for example dist/), not the source.`);
  }
  if (Object.keys(files).length < 2) {
    throw new Error("The folder holds only index.html. EzYourLife takes whole app projects, not a single HTML file: send the full build folder with its scripts, styles and pictures.");
  }
  let html = textOf(entry);
  if (/<script[^>]+src=["']?\/?src\/[^"'>]+\.(tsx?|jsx)["'\s>]/i.test(html)) {
    throw new Error("This index.html loads the source code (src/main.tsx or similar). Build the app first (npm run build) and import the build folder, usually dist/.");
  }
  const kept = [];
  const keep = (s) => `\uE000${kept.push(s) - 1}\uE001`;
  const tail = [];
  const cssLinks = [];
  html = html.replace(/<script\b[\s\S]*?<\/script\s*>|<!--[\s\S]*?-->/gi, (m) => m.startsWith("<!--") ? "" : m);
  html = html.replace(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi, (m, attrs, body) => {
    const src = attrValue(attrs, "src");
    const type = (attrValue(attrs, "type") ?? "").toLowerCase();
    const isModule = type === "module";
    if (type === "importmap") {
      notes.push("The page had its own import map; it was replaced. Imports of outside packages by name will not load.");
      return "";
    }
    if (src) {
      const p = resolve(src, entry);
      if (!p) return external(src) ? keep(m) : "";
      if (isModule) {
        addModule(p);
        return keep(`<script type="module">import "@ezyl/${p}";</script>`);
      }
      used.add(p);
      const out = `<script${dropAttr(dropAttr(dropAttr(attrs, "src"), "defer"), "async")}>${noClose(assetStrings(textOf(p), p), "script")}</script>`;
      if (/\b(defer|async)\b/i.test(attrs)) {
        tail.push(out);
        return "";
      }
      return keep(out);
    }
    if (isModule) return keep(`<script${attrs}>${noClose(rewriteImports(body, entry), "script")}</script>`);
    if (!type || /javascript|ecmascript/.test(type)) return keep(`<script${attrs}>${assetStrings(body, entry)}</script>`);
    return keep(m);
  });
  html = html.replace(/<style\b([^>]*)>([\s\S]*?)<\/style\s*>/gi, (_m, attrs, body) => keep(`<style${attrs}>${noClose(css(body, entry), "style")}</style>`));
  html = html.replace(/<link\b([^>]*?)\/?>/gi, (m, attrs) => {
    const rel = (attrValue(attrs, "rel") ?? "").toLowerCase();
    const href = attrValue(attrs, "href");
    if (!href || external(href)) return m;
    if (/\b(modulepreload|preload|prefetch|manifest)\b/.test(rel)) {
      const p2 = resolve(href, entry, false);
      if (p2 && /\.m?js$/i.test(p2) && rel.includes("modulepreload")) addModule(p2);
      return "";
    }
    const p = resolve(href, entry);
    if (!p) return "";
    used.add(p);
    if (rel.includes("stylesheet")) {
      cssLinks.push(p);
      const media = attrValue(attrs, "media");
      return keep(`<style${media ? ` media="${media}"` : ""}>${noClose(css(textOf(p), p), "style")}</style>`);
    }
    return m.replace(href, dataUri(p));
  });
  html = html.replace(
    /<(img|source|video|audio|track|input|image|use|embed|object|iframe)\b[^>]*>/gi,
    (tag) => tag.replace(/\b(src|poster|data|href|xlink:href)\s*=\s*(["'])([^"']+)\2/gi, (m, name, q, ref) => {
      if (/^iframe$/i.test(tag.slice(1, 7)) && !/\.html?$/i.test(ref)) return m;
      const p = resolve(ref, entry);
      if (!p) return m;
      used.add(p);
      return `${name}=${q}${dataUri(p)}${q}`;
    }).replace(/\bsrcset\s*=\s*(["'])([^"']+)\1/gi, (_m, q, set) => {
      const first = set.split(",")[0].trim().split(/\s+/)[0];
      const p = first ? resolve(first, entry) : null;
      if (!p) return "";
      used.add(p);
      return `srcset=${q}${dataUri(p)}${q}`;
    })
  );
  html = html.replace(/\bstyle\s*=\s*(["'])([^"']*url\([^"']*)\1/gi, (_m, q, body) => `style=${q}${css(body, entry).replace(/"/g, "'")}${q}`);
  const allCode = Array.from(modules.values()).join("\n") + kept.join("\n");
  const extraCss = [];
  for (const p of Object.keys(files)) {
    if (!/\.css$/i.test(p) || cssLinks.includes(p)) continue;
    if (allCode.includes(p)) {
      used.add(p);
      extraCss.push(`<style>${noClose(css(textOf(p), p), "style")}</style>`);
      cssLinks.push(p);
    }
  }
  const standIns = cssLinks.map((p) => `<link rel="stylesheet" href="/${p}" disabled>`).join("");
  const shimFiles = {};
  let shimBytes = 0;
  for (const p of Object.keys(files).sort()) {
    if (used.has(p) || !DATA.test(p) || !allCode.includes(p.split("/").pop())) continue;
    if (shimBytes + files[p].length > SHIM_LIMIT) {
      notes.push(`${p} was left out: data files the code loads are limited to 4 MB in all.`);
      continue;
    }
    shimBytes += files[p].length;
    shimFiles["/" + p] = [mimeOf(p), b64(files[p])];
    used.add(p);
  }
  let head2 = "";
  if (modules.size) {
    const imports = {};
    for (const [p, code] of modules) imports[`@ezyl/${p}`] = `data:text/javascript;base64,${b64(enc.encode(code))}`;
    head2 += `<script type="importmap">${JSON.stringify({ imports })}</script>`;
  }
  if (Object.keys(shimFiles).length) {
    head2 += `<script>(function(){var F=${JSON.stringify(shimFiles)};var f0=window.fetch;window.fetch=function(i,o){try{var u=typeof i==="string"?i:(i&&i.url)||"";var b=(location.href||"").split(/[?#]/)[0].replace(/[^/]*$/,"");if(b&&u.indexOf(b)===0)u="/"+u.slice(b.length);var k=u.split(/[?#]/)[0].replace(/^\\.\\//,"/");if(k.charAt(0)!=="/")k="/"+k;var e=F[k];if(e){var s=atob(e[1]),a=new Uint8Array(s.length);for(var n=0;n<s.length;n++)a[n]=s.charCodeAt(n);return Promise.resolve(new Response(a,{status:200,headers:{"Content-Type":e[0]}}))}}catch(x){}return f0.apply(this,arguments)}})();</script>`;
  }
  head2 += extraCss.join("") + standIns;
  if (/<head\b[^>]*>/i.test(html)) html = html.replace(/<head\b[^>]*>/i, (m) => m + head2);
  else if (/<html\b[^>]*>/i.test(html)) html = html.replace(/<html\b[^>]*>/i, (m) => `${m}<head>${head2}</head>`);
  else html = head2 + html;
  if (tail.length) html = /<\/body\s*>/i.test(html) ? html.replace(/<\/body\s*>(?![\s\S]*<\/body)/i, tail.join("") + "</body>") : html + tail.join("");
  html = html.replace(/\uE000(\d+)\uE001/g, (_m, n) => kept[Number(n)]);
  if (!/<meta[^>]+name=["']?viewport/i.test(html)) notes.push('Add <meta name="viewport" content="width=device-width, initial-scale=1"> to index.html; the checks need it.');
  if (bare.size) {
    notes.push(
      `The code imports ${Array.from(bare).slice(0, 5).join(", ")} by package name. Those are not in the folder and will not load: import the built output, where packages are bundled in.`
    );
  }
  const unused = Object.keys(files).filter((p) => !used.has(p) && !/\.map$/i.test(p)).sort();
  return { html, used: Array.from(used).sort(), unused, missing: Array.from(missing).sort(), notes, modules: modules.size };
});
const SKIP = /(^|\/)(\.git|node_modules|\.DS_Store|Thumbs\.db)(\/|$)|\.map$/i;
const files = {};
let total = 0;
for (const e of await readdir(dir, { recursive: true, withFileTypes: true })) {
  if (!e.isFile()) continue;
  const full = join(e.parentPath ?? e.path, e.name);
  const rel = relative(dir, full).split(sep).join("/");
  if (SKIP.test(rel)) continue;
  files[rel] = new Uint8Array(await readFile(full));
  total += files[rel].length;
  if (Object.keys(files).length > 600 || total > 30000000) { console.error("The folder is too big: at most 600 files and 30 MB. Point at the build folder (for example dist), not the project."); process.exit(1); }
}
let packed;
try { packed = bundleProject(files); } catch (err) { console.error(err.message); process.exit(1); }
const text = packed.html;
const bytes = Buffer.byteLength(text, "utf8");
if (bytes > 10000000) { console.error("Packed, the app is " + (bytes / 1e6).toFixed(1) + " MB; the limit is 10 MB."); process.exit(1); }
const parts = [];
for (let i = 0; i < text.length; ) {
  let end = Math.min(i + 300000, text.length);
  const c = text.charCodeAt(end - 1);
  if (end < text.length && c >= 0xd800 && c <= 0xdbff) end -= 1;
  parts.push(text.slice(i, end)); i = end;
}
const call = async (fn, body) => {
  const r = await fetch(url + "/rest/v1/rpc/" + fn, { method: "POST", headers: { apikey: anon, Authorization: "Bearer " + anon, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => null);
  if (!r.ok) throw new Error((j && j.message) || "HTTP " + r.status);
  return j;
};
for (let n = 0; n < parts.length; n++) { await call("dev_keyed_upload_part", { _key: key, _part_no: n + 1, _data: parts[n] }); console.log("part " + (n + 1) + "/" + parts.length); }
const done = await call("dev_keyed_upload_finish", { _key: key, _bytes: bytes, _parts: parts.length });
console.log("Packed " + packed.used.length + " files (" + Math.round(bytes / 1024) + " KB) as version " + done.version_no + ".");
if (packed.missing.length) console.log("Not in the folder, so they will not load: " + packed.missing.slice(0, 10).join(", "));
for (const n of packed.notes) console.log(n);
console.log("Next: run the checks (dev_run_checks).");
