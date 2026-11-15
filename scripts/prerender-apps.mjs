// Gives every app its own page for search engines.
//
// The site is a single-page app, so without this every /tool/<id> address returns the same
// home-page HTML to anything that does not run JavaScript. After the normal build this writes
// dist/tool/<id>/index.html (and dist/tool/<id>.html) for each live app: its own title, description, canonical address,
// structured data and readable text. The real app still loads on top of it in a browser.
//
// Runs inside "vite build" (see vite.config.ts) and by hand: node scripts/prerender-apps.mjs
import fs from "node:fs";
import path from "node:path";
import { loadApps, ROOT } from "./lib/load-apps.mjs";

const SITE = "https://ezyourlife.com";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const slug = (id) => encodeURIComponent(id);

export function pageFor(d, app, byId) {
  const def = d.APPS[app.id];
  const info = d.categoryInfo(app.category);
  const goal = d.GOALS.find((g) => g.id === info.goal);
  const kind = def && def.engine !== "custom" ? d.KIND_BY_ENGINE[def.engine] ?? info.kind : info.kind;
  const how = d.KIND_TEXT[kind];
  // What the app produces, not only what its category usually produces.
  const { give, get } = d.giveGetFor(app.category, { kind });
  const url = `${SITE}/tool/${slug(app.id)}`;

  const { sentence, appSeoTitle, appSeoDescription, appSeoKeywords } = d.seo;
  const intro = sentence(def?.intro ?? app.description);
  const title = appSeoTitle(app.name, app.description);
  const description = appSeoDescription(app.name, def?.intro ?? app.description, give, get);
  const steps = def?.steps?.length ? def.steps : [`Open ${app.name} in your browser. Nothing to install.`, `Give ${give}.`, `Get ${get}.`];
  const related = (def?.related ?? []).map((id) => byId.get(id)).filter((t) => t?.isLive);
  const siblings = [...byId.values()].filter((t) => t.isLive && t.category === app.category && t.id !== app.id && !related.includes(t)).slice(0, 12);
  const detail = d.appDetail(app, def, { categoryLine: info.line, give, get, goalName: goal.name });
  const detailHtml = detail.sections
    .map((s) => `<h2>${esc(s.heading)}</h2>${(s.paragraphs ?? []).map((p) => `<p>${esc(p)}</p>`).join("")}${s.items?.length ? `<ul>${s.items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>` : ""}`)
    .join("\n        ");
  const faqHtml = `<h2>Questions about ${esc(app.name)}</h2>${detail.faqs.map(([q, a]) => `<h3>${esc(q)}</h3><p>${esc(a)}</p>`).join("")}`;
  const link = (t) => `<li><a href="/tool/${slug(t.id)}">${esc(t.name)}</a> — ${esc(t.description)}</li>`;

  const body = `
      <main style="max-width:860px;margin:0 auto;padding:32px 20px;font-family:Hind,system-ui,sans-serif;color:#141414;line-height:1.55">
        <nav aria-label="Breadcrumb" style="font-size:14px"><a href="/">EZYOURLIFE</a> › <a href="/ai-apps">Business apps</a> › <a href="/ai-apps?goal=${esc(goal.id)}">${esc(goal.name)}</a> › <a href="/ai-apps?category=${esc(encodeURIComponent(app.category))}">${esc(app.category)}</a></nav>
        <h1>${esc(app.name)}</h1>
        <p>${esc(intro)}</p>
        ${def?.intro && sentence(app.description) !== intro ? `<p>${esc(sentence(app.description))}</p>` : ""}
        <h2>What you give and what you get</h2>
        <p>You give ${esc(give)}. You get ${esc(get)}. ${esc(how.line)}</p>
        <h2>How ${esc(app.name)} works</h2>
        <ol>${steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>
        ${detailHtml}
        <h2>What it costs</h2>
        <p>You pay in credits, and only when the app gives you a result. New accounts start with 100 free credits, and credit packs start at ₹10. <a href="/credits">See prices</a>.</p>
        ${faqHtml}
        ${related.length ? `<h2>Apps that go well with ${esc(app.name)}</h2><ul>${related.map(link).join("")}</ul>` : ""}
        ${siblings.length ? `<h2>More ${esc(app.category)} apps</h2><ul>${siblings.map(link).join("")}</ul>` : ""}
        <p><a href="/ai-apps">See all apps on EZYOURLIFE</a></p>
      </main>`;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: app.name,
      description: intro,
      url,
      applicationCategory: "BusinessApplication",
      applicationSubCategory: app.category,
      operatingSystem: "Web",
      inLanguage: "en-IN",
      publisher: { "@type": "Organization", name: "EZYOURLIFE", url: SITE },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: detail.faqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "EZYOURLIFE", item: `${SITE}/` },
        { "@type": "ListItem", position: 2, name: "Business apps", item: `${SITE}/ai-apps` },
        { "@type": "ListItem", position: 3, name: app.category, item: `${SITE}/ai-apps?category=${encodeURIComponent(app.category)}` },
        { "@type": "ListItem", position: 4, name: app.name, item: url },
      ],
    },
  ];
  return { title, description, url, body, jsonLd, keywords: appSeoKeywords(app.name, app.category, app.toolType) };
}

/** Swaps the home page's head tags and body text for one app's. Throws if the template changed shape. */
export function render(template, page) {
  let html = template;
  const swap = (re, to, what) => {
    if (!re.test(html)) throw new Error(`index.html no longer has ${what}; update scripts/prerender-apps.mjs`);
    html = html.replace(re, () => to);
  };
  swap(/<title>[\s\S]*?<\/title>/, `<title>${esc(page.title)}</title>\n    <link rel="canonical" href="${esc(page.url)}" />`, "a <title>");
  swap(/<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${esc(page.description)}" />`, "a description tag");
  swap(/<meta name="keywords" content="[^"]*"\s*\/?>/, `<meta name="keywords" content="${esc(page.keywords ?? "")}" />`, "a keywords tag");
  if (page.noindex) swap(/<meta name="robots" content="[^"]*"\s*\/?>/, `<meta name="robots" content="noindex, follow" />`, "a robots tag");
  swap(/<meta property="og:url" content="[^"]*"\s*\/?>/, `<meta property="og:url" content="${esc(page.url)}" />`, "an og:url tag");
  swap(/<meta property="og:title" content="[^"]*"\s*\/?>/, `<meta property="og:title" content="${esc(page.title)}">`, "an og:title tag");
  swap(/<meta name="twitter:title" content="[^"]*"\s*\/?>/, `<meta name="twitter:title" content="${esc(page.title)}">`, "a twitter:title tag");
  swap(/<meta property="og:description" content="[^"]*"\s*\/?>/, `<meta property="og:description" content="${esc(page.description)}">`, "an og:description tag");
  swap(/<meta name="twitter:description" content="[^"]*"\s*\/?>/, `<meta name="twitter:description" content="${esc(page.description)}">`, "a twitter:description tag");
  // Keep the site-wide Organization and WebSite data; the home-page FAQ, lists and breadcrumbs do not belong on an app page.
  let kept = 0;
  html = html.replace(/[ \t]*(?:<!--[^>]*-->\s*)?<script type="application\/ld\+json">([\s\S]*?)<\/script>\n?/g, (block, json) => {
    const type = /"@type":\s*"([^"]+)"/.exec(json)?.[1];
    if (type === "Organization" || type === "WebSite") { kept++; return block; }
    return "";
  });
  if (!kept) throw new Error("index.html no longer has its Organization data; update scripts/prerender-apps.mjs");
  const ld = page.jsonLd.map((o) => `    <script type="application/ld+json" data-static-page>${JSON.stringify(o).replace(/</g, "\\u003c")}</script>`).join("\n");
  swap(/<\/head>/, `${ld}\n  </head>`, "a </head>");
  swap(/<div id="root"><\/div>/, `<div id="root">${page.body}\n    </div>`, 'an empty <div id="root">');
  html = html.replace(/\s*<!-- Noscript fallback[^>]*-->\s*<noscript>[\s\S]*?<\/noscript>/, "");
  return html;
}

export async function prerenderApps({ dist = path.join(ROOT, "dist"), log = console.log } = {}) {
  const templateFile = path.join(dist, "index.html");
  if (!fs.existsSync(templateFile)) throw new Error(`${templateFile} not found — run the build first`);
  const template = fs.readFileSync(templateFile, "utf8");
  const d = await loadApps();
  const live = d.catalogue.filter((t) => t.isLive && !d.REMOVED_APPS.has(t.id));
  const byId = new Map(live.map((t) => [t.id, t]));
  const titles = new Map();
  let n = 0;
  for (const app of live) {
    const page = pageFor(d, app, byId);
    if (titles.has(page.title)) throw new Error(`"${app.id}" and "${titles.get(page.title)}" would get the same page title`);
    titles.set(page.title, app.id);
    // Two copies, because static hosts differ in which one they serve for /tool/<id>.
    const html = render(template, page);
    const dir = path.join(dist, "tool", app.id);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "index.html"), html);
    fs.writeFileSync(path.join(dist, "tool", `${app.id}.html`), html);
    n++;
  }
  log(`App pages for search: wrote ${n} pages to ${path.relative(ROOT, path.join(dist, "tool"))}/`);
  return n;
}

/** Vite plugin: write the app pages, the other public pages and the sitemap at the end of every build. A failure here never blocks a publish. */
export function appPages() {
  let outDir = "dist";
  return {
    name: "ezyourlife-app-pages",
    apply: "build",
    configResolved(config) { outDir = path.resolve(config.root, config.build.outDir); },
    async closeBundle() {
      try {
        await prerenderApps({ dist: outDir });
      } catch (e) {
        console.warn(`\nApp pages for search were NOT written: ${e.message}\nThe site itself is fine; app addresses fall back to the shared page.\n`);
      }
      // Then every other public page and the sitemap (scripts/prerender-pages.mjs).
      try {
        const { prerenderPages } = await import("./prerender-pages.mjs");
        await prerenderPages({ dist: outDir });
      } catch (e) {
        console.warn(`\nPages for search and the sitemap were NOT written: ${e.message}\nThe site itself is fine; those addresses fall back to the shared page and public/sitemap.xml.\n`);
      }
    },
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(ROOT, "scripts/prerender-apps.mjs")) {
  await prerenderApps();
}
