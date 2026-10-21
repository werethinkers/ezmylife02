/*
 * Turns a developer's whole built web app (a folder: index.html plus its JavaScript, CSS, images,
 * fonts and data files) into the one document the store's sandbox runs (HostedFrame loads it with
 * srcdoc, so the app has no address of its own to load other files from).
 *
 * - <link rel="stylesheet">, CSS @import and url() become inline styles and data: addresses.
 * - Classic <script src> is inlined (defer/async ones move to the end of the body).
 * - JavaScript modules (Vite and other modern builds, including code-split chunks) are kept as
 *   modules: each file becomes a data: module and an import map points "@ezyl/<path>" at it, so
 *   static and dynamic imports between the files keep working.
 * - Images, fonts, audio and video named in HTML, CSS or as plain strings in the code become data:
 *   addresses; data files the code fetch()es (json, csv, wasm, models ...) are served from memory.
 *
 * Self-contained on purpose (no imports, no outside names): the connector runs it on files it
 * fetched from GitHub, and dev_get_upload_link ships its source inside the upload script so
 * Claude Code bundles a local folder with exactly the same rules.
 */

export interface BundleResult {
  html: string;
  /** Files that went into the page. */
  used: string[];
  /** Files nothing referred to (left out). */
  unused: string[];
  /** References to files that are not in the folder. */
  missing: string[];
  /** Things the developer's Claude should know or fix. */
  notes: string[];
  modules: number;
}

export function bundleProject(files: Record<string, Uint8Array>, entry = "index.html"): BundleResult {
  const MIME: Record<string, string> = {
    js: "text/javascript", mjs: "text/javascript", css: "text/css", html: "text/html", json: "application/json",
    svg: "image/svg+xml", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", webp: "image/webp",
    avif: "image/avif", ico: "image/x-icon", bmp: "image/bmp", woff: "font/woff", woff2: "font/woff2", ttf: "font/ttf",
    otf: "font/otf", eot: "application/vnd.ms-fontobject", mp3: "audio/mpeg", wav: "audio/wav", ogg: "audio/ogg",
    m4a: "audio/mp4", mp4: "video/mp4", webm: "video/webm", txt: "text/plain", csv: "text/csv", tsv: "text/tab-separated-values",
    xml: "application/xml", md: "text/markdown", wasm: "application/wasm", glb: "model/gltf-binary", gltf: "model/gltf+json",
    bin: "application/octet-stream", pdf: "application/pdf", webmanifest: "application/manifest+json",
  };
  const DATA = /\.(json|txt|csv|tsv|xml|md|wasm|glb|gltf|bin|svg|png|jpe?g|gif|webp|mp3|wav|ogg|m4a|mp4|webm|pdf)$/i;
  const SHIM_LIMIT = 4_000_000;

  const dec = new TextDecoder("utf-8");
  const enc = new TextEncoder();
  const textOf = (p: string) => dec.decode(files[p]).replace(/^\uFEFF/, "");
  const extOf = (p: string) => (/\.([a-z0-9]+)$/i.exec(p)?.[1] ?? "").toLowerCase();
  const mimeOf = (p: string) => MIME[extOf(p)] ?? "application/octet-stream";
  const b64 = (bytes: Uint8Array) => {
    let s = "";
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + 0x8000)));
    return btoa(s);
  };
  const uriCache: Record<string, string> = {};
  const dataUri = (p: string) => (uriCache[p] ??= `data:${mimeOf(p)};base64,${b64(files[p])}`);

  const used = new Set<string>([entry]);
  const missing = new Set<string>();
  const notes: string[] = [];
  const dirOf = (p: string) => (p.includes("/") ? p.slice(0, p.lastIndexOf("/") + 1) : "");
  const external = (ref: string) => /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(ref);

  /** A reference from file `from` to a file in the folder, or null. Root-absolute ("/x") means the folder root. */
  const resolve = (ref: string, from: string, report = true): string | null => {
    ref = ref.trim();
    if (!ref || external(ref) || ref.includes("${")) return null;
    let clean = ref.split("#")[0].split("?")[0];
    try {
      clean = decodeURIComponent(clean);
    } catch {
      /* keep as written */
    }
    if (!clean) return null;
    const out: string[] = [];
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

  const css = (text: string, from: string, depth = 0): string => {
    text = text.replace(/@import\s+(?:url\(\s*)?(["']?)([^"')\s;]+)\1\s*\)?([^;]*);/gi, (m, _q, ref, media) => {
      const p = depth < 8 ? resolve(ref, from) : null;
      if (!p) return m;
      used.add(p);
      const inner = css(textOf(p), p, depth + 1);
      return media.trim() ? `@media ${media.trim()}{${inner}}` : inner;
    });
    return text.replace(/url\(\s*(["']?)([^"')]+?)\1\s*\)/gi, (m, _q, ref) => {
      if (/^(data|blob):/i.test(ref.trim())) return m;
      const p = resolve(ref, from);
      if (!p) return m;
      used.add(p);
      return `url("${dataUri(p)}")`;
    });
  };

  /** Plain strings in code that name an image, font, media or binary file become data: addresses. */
  const assetStrings = (code: string, from: string) =>
    code.replace(/(["'`])((?:\.{1,2}\/|\/)?[\w@~.%/-]{1,280}\.(?:svg|png|jpe?g|gif|webp|avif|ico|bmp|woff2?|ttf|otf|eot|mp3|wav|ogg|m4a|mp4|webm|pdf|wasm|glb|gltf|bin))\1/gi, (m, q, ref) => {
      const p = resolve(ref, from, false) ?? (!ref.startsWith(".") ? resolve("/" + ref.replace(/^\/+/, ""), from, false) : null);
      if (!p) return m;
      used.add(p);
      return q + dataUri(p) + q;
    });

  const modules = new Map<string, string>();
  const bare = new Set<string>();
  const addModule = (p: string) => {
    if (modules.has(p)) return;
    modules.set(p, "");
    used.add(p);
    modules.set(p, rewriteImports(textOf(p), p));
  };
  const rewriteImports = (code: string, from: string) =>
    assetStrings(
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
      from,
    );

  const noClose = (s: string, tag: string) => s.replace(new RegExp(`</(${tag})`, "gi"), "<\\/$1");
  const attr = (attrs: string, name: string) => new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i").exec(attrs);
  const attrValue = (attrs: string, name: string) => {
    const m = attr(attrs, name);
    return m ? (m[1] ?? m[2] ?? m[3] ?? "") : null;
  };
  const dropAttr = (attrs: string, name: string) => attrs.replace(new RegExp(`\\s*\\b${name}(\\s*=\\s*(?:"[^"]*"|'[^']*'|[^\\s>]+))?`, "i"), "");

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

  // Set inline scripts and styles aside so their contents are not mistaken for tags.
  const kept: string[] = [];
  const keep = (s: string) => `\uE000${kept.push(s) - 1}\uE001`;
  const tail: string[] = [];
  const cssLinks: string[] = [];

  // Drop comments (a commented-out <script src> must not be inlined), but not "<!--" inside a script.
  html = html.replace(/<script\b[\s\S]*?<\/script\s*>|<!--[\s\S]*?-->/gi, (m) => (m.startsWith("<!--") ? "" : m));

  html = html.replace(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi, (m, attrs: string, body: string) => {
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

  html = html.replace(/<link\b([^>]*?)\/?>/gi, (m, attrs: string) => {
    const rel = (attrValue(attrs, "rel") ?? "").toLowerCase();
    const href = attrValue(attrs, "href");
    if (!href || external(href)) return m;
    if (/\b(modulepreload|preload|prefetch|manifest)\b/.test(rel)) {
      const p = resolve(href, entry, false);
      if (p && /\.m?js$/i.test(p) && rel.includes("modulepreload")) addModule(p);
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

  // Images, media and other tags that name a file.
  html = html.replace(/<(img|source|video|audio|track|input|image|use|embed|object|iframe)\b[^>]*>/gi, (tag) =>
    tag
      .replace(/\b(src|poster|data|href|xlink:href)\s*=\s*(["'])([^"']+)\2/gi, (m, name, q, ref) => {
        if (/^iframe$/i.test(tag.slice(1, 7)) && !/\.html?$/i.test(ref)) return m;
        const p = resolve(ref, entry);
        if (!p) return m;
        used.add(p);
        return `${name}=${q}${dataUri(p)}${q}`;
      })
      .replace(/\bsrcset\s*=\s*(["'])([^"']+)\1/gi, (_m, q, set: string) => {
        const first = set.split(",")[0].trim().split(/\s+/)[0];
        const p = first ? resolve(first, entry) : null;
        if (!p) return "";
        used.add(p);
        return `srcset=${q}${dataUri(p)}${q}`;
      }),
  );
  html = html.replace(/\bstyle\s*=\s*(["'])([^"']*url\([^"']*)\1/gi, (_m, q, body) => `style=${q}${css(body, entry).replace(/"/g, "'")}${q}`);

  // CSS files only the code loads (code-split pages): add them up front, plus a stand-in <link>
  // for each so Vite's loader sees the sheet as already there instead of failing to fetch it.
  const allCode = Array.from(modules.values()).join("\n") + kept.join("\n");
  const extraCss: string[] = [];
  for (const p of Object.keys(files)) {
    if (!/\.css$/i.test(p) || cssLinks.includes(p)) continue;
    if (allCode.includes(p)) {
      used.add(p);
      extraCss.push(`<style>${noClose(css(textOf(p), p), "style")}</style>`);
      cssLinks.push(p);
    }
  }
  const standIns = cssLinks.map((p) => `<link rel="stylesheet" href="/${p}" disabled>`).join("");

  // Data files the code may fetch() by address: served from memory.
  const shimFiles: Record<string, [string, string]> = {};
  let shimBytes = 0;
  for (const p of Object.keys(files).sort()) {
    if (used.has(p) || !DATA.test(p) || !allCode.includes(p.split("/").pop()!)) continue;
    if (shimBytes + files[p].length > SHIM_LIMIT) {
      notes.push(`${p} was left out: data files the code loads are limited to 4 MB in all.`);
      continue;
    }
    shimBytes += files[p].length;
    shimFiles["/" + p] = [mimeOf(p), b64(files[p])];
    used.add(p);
  }

  let head = "";
  if (modules.size) {
    const imports: Record<string, string> = {};
    for (const [p, code] of modules) imports[`@ezyl/${p}`] = `data:text/javascript;base64,${b64(enc.encode(code))}`;
    head += `<script type="importmap">${JSON.stringify({ imports })}</script>`;
  }
  if (Object.keys(shimFiles).length) {
    head +=
      `<script>(function(){var F=${JSON.stringify(shimFiles)};var f0=window.fetch;window.fetch=function(i,o){try{` +
      `var u=typeof i==="string"?i:(i&&i.url)||"";var b=(location.href||"").split(/[?#]/)[0].replace(/[^/]*$/,"");` +
      `if(b&&u.indexOf(b)===0)u="/"+u.slice(b.length);var k=u.split(/[?#]/)[0].replace(/^\\.\\//,"/");if(k.charAt(0)!=="/")k="/"+k;var e=F[k];` +
      `if(e){var s=atob(e[1]),a=new Uint8Array(s.length);for(var n=0;n<s.length;n++)a[n]=s.charCodeAt(n);` +
      `return Promise.resolve(new Response(a,{status:200,headers:{"Content-Type":e[0]}}))}}catch(x){}return f0.apply(this,arguments)}})();</script>`;
  }
  head += extraCss.join("") + standIns;

  if (/<head\b[^>]*>/i.test(html)) html = html.replace(/<head\b[^>]*>/i, (m) => m + head);
  else if (/<html\b[^>]*>/i.test(html)) html = html.replace(/<html\b[^>]*>/i, (m) => `${m}<head>${head}</head>`);
  else html = head + html;
  if (tail.length) html = /<\/body\s*>/i.test(html) ? html.replace(/<\/body\s*>(?![\s\S]*<\/body)/i, tail.join("") + "</body>") : html + tail.join("");
  html = html.replace(/\uE000(\d+)\uE001/g, (_m, n) => kept[Number(n)]);

  if (!/<meta[^>]+name=["']?viewport/i.test(html)) notes.push('Add <meta name="viewport" content="width=device-width, initial-scale=1"> to index.html; the checks need it.');
  if (bare.size) {
    notes.push(
      `The code imports ${Array.from(bare).slice(0, 5).join(", ")} by package name. Those are not in the folder and will not load: import the built output, where packages are bundled in.`,
    );
  }
  const unused = Object.keys(files).filter((p) => !used.has(p) && !/\.map$/i.test(p)).sort();
  return { html, used: Array.from(used).sort(), unused, missing: Array.from(missing).sort(), notes, modules: modules.size };
}
