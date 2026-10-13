// Gives every public page of the site its own HTML for search engines, and writes the sitemap.
//
// prerender-apps.mjs does this for app pages (/tool/<id>). This does the rest:
// - the fixed pages listed in src/lib/seo/pages.ts (about, prices, websites, the signed-in apps' intros, ...),
// - /ai-tool-for/<job> and /ai-for/<business type> pages, with the apps that match each one,
// - /make/<id> pages for websites, cards and invites.
// Each gets its own title, description, canonical address, structured data and readable text, and the
// real page loads on top of it in a browser. Then dist/sitemap.xml is written from the same list, so the
// sitemap never lists a page that does not exist or misses one that does.
//
// "AI tool for" and "AI for" pages with fewer than MIN_LANDING_APPS matching apps are marked
// noindex and left out of the sitemap: a page with one or no apps on it reads as empty to Google.
//
// Runs inside "vite build" after the app pages. Check without building: npm run check:seo
import fs from "node:fs";
import path from "node:path";
import { loadApps, loadModules, ROOT } from "./lib/load-apps.mjs";
import { pageFor as appPageFor, render } from "./prerender-apps.mjs";

const SITE = "https://ezyourlife.com";
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const enc = (s) => s.split("/").map(encodeURIComponent).join("/");

const shell = (inner) => `
      <main style="max-width:860px;margin:0 auto;padding:32px 20px;font-family:Hind,system-ui,sans-serif;color:#141414;line-height:1.55">
        <nav aria-label="Site" style="font-size:14px"><a href="/">EZYOURLIFE</a> · <a href="/ai-apps">Business apps</a> · <a href="/websites">Websites</a> · <a href="/cards">Cards</a> · <a href="/credits">Prices</a></nav>
${inner}
      </main>`;
const ul = (items) => (items.length ? `<ul>${items.join("")}</ul>` : "");
const li = (href, label, line) => `<li><a href="${esc(href)}">${esc(label)}</a>${line ? ` — ${esc(line)}` : ""}</li>`;
const crumbs = (list) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: list.map(([name, p], i) => ({ "@type": "ListItem", position: i + 1, name, item: `${SITE}${p}` })),
});
const itemList = (name, items) => ({
  "@context": "https://schema.org",
  "@type": "ItemList",
  name,
  numberOfItems: items.length,
  itemListElement: items.map(([label, p], i) => ({ "@type": "ListItem", position: i + 1, name: label, url: `${SITE}${p}` })),
});

/** Every page this script owns, as { path, title, description, keywords?, body, jsonLd, noindex? }. */
export async function sitePages({ d } = {}) {
  d ??= await loadApps();
  const m = await loadModules(["src/lib/seo/pages.ts", "src/lib/seoData.ts", "src/instant/catalog/index.ts", "src/instant/promo.ts"]);
  const { SITE_PAGES, seoFor, withCount, MIN_LANDING_APPS } = m["src/lib/seo/pages.ts"];
  const seo = m["src/lib/seoData.ts"];
  const { CATALOG, CATEGORIES } = m["src/instant/catalog/index.ts"];
  const { promoFor, promoSeo } = m["src/instant/promo.ts"];

  const live = d.catalogue.filter((t) => t.isLive && !d.REMOVED_APPS.has(t.id));
  const count = `${Math.floor(live.length / 5) * 5}+`;
  const appLi = (t) => li(`/tool/${encodeURIComponent(t.id)}`, t.name, t.description);
  const WEBSITE_CATS = ["business", "menus", "profiles"];
  const productsFor = (cats) => CATALOG.filter((p) => cats.includes(p.category));
  const productLi = (p) => li(`/make/${encodeURIComponent(p.id)}`, p.name, p.tagline);

  const pages = [];

  // "AI tool for <job>" and "AI for <business type>".
  const landings = [];
  for (const [kind, seeds, base, limit] of [
    ["use", seo.USE_CASE_SEEDS, "/ai-tool-for", 36],
    ["industry", seo.INDUSTRY_SEEDS, "/ai-for", 60],
  ]) {
    for (const slug of [...new Set(seeds)]) {
      const matches = seo.landingMatches(slug, live).slice(0, limit);
      const human = seo.humanize(slug);
      const s = kind === "use" ? seo.useCaseSeo(slug, matches.length) : seo.industrySeo(slug);
      const p = `${base}/${slug}`;
      const heading = kind === "use" ? `${human} made easy` : `Apps for ${human.toLowerCase()}`;
      const line =
        kind === "use"
          ? `Apps that help with ${human.toLowerCase()}. Open one, fill in a few details, and pay only when it gives you a result.`
          : `Apps that ${human.toLowerCase()} businesses use for bills, customers, staff and content. Open any app and pay only for results.`;
      const page = {
        path: p,
        ...s,
        noindex: matches.length < MIN_LANDING_APPS,
        body: shell(`        <h1>${esc(heading)}</h1>
        <p>${esc(line)}</p>
        ${matches.length ? `<h2>${matches.length} apps for ${esc(human.toLowerCase())}</h2>${ul(matches.map(appLi))}` : ""}
        <h2>What it costs</h2>
        <p>New accounts get 100 free credits to try any app. After that, credit packs start at ₹10 and an app uses credits only when it gives you a result. <a href="/credits">See prices</a>.</p>
        <p><a href="/explore">Find apps for another job or business type</a></p>`),
        jsonLd: [
          { "@context": "https://schema.org", "@type": "CollectionPage", name: s.title, description: s.description, url: `${SITE}${p}` },
          ...(matches.length ? [itemList(heading, matches.map((t) => [t.name, `/tool/${encodeURIComponent(t.id)}`]))] : []),
          crumbs([["EZYOURLIFE", "/"], ["Explore", "/explore"], [human, p]]),
        ],
      };
      pages.push(page);
      landings.push(page);
    }
  }

  // "See what it does" page for every live app, at /promo/<name> (the address the store links to).
  // Same slug rule as src/pages/PromoPage.tsx. Title and text differ from the /tool/<id> page, which is the app itself.
  const promoSlugOf = (name) => name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const seenPromo = new Set();
  for (const app of live) {
    const slug = promoSlugOf(app.name);
    if (!slug || seenPromo.has(slug)) continue; // two apps with one name: the first keeps the address
    seenPromo.add(slug);
    const def = d.APPS[app.id];
    const info = d.categoryInfo(app.category);
    const kind = def && def.engine !== "custom" ? d.KIND_BY_ENGINE[def.engine] ?? info.kind : info.kind;
    const { give, get } = d.giveGetFor(app.category, { kind });
    const intro = d.seo.sentence(def?.intro ?? app.description);
    const p = `/promo/${slug}`;
    const title = `${app.name}: what it does and how it works`;
    const description = `${intro} See what ${app.name} gives you, how it works and what it costs before you try it.`.slice(0, 170);
    pages.push({
      path: p,
      title,
      description,
      keywords: d.seo.appSeoKeywords(app.name, app.category, app.toolType),
      body: shell(`        <h1>${esc(app.name)}</h1>
        <p>${esc(intro)}</p>
        <h2>What you give and what you get</h2>
        <p>You give ${esc(give)}. You get ${esc(get)}.</p>
        <h2>What it costs</h2>
        <p>New accounts get 100 free credits. An app uses credits only when it gives you a result. <a href="/credits">See prices</a>.</p>
        <p><a href="/tool/${esc(encodeURIComponent(app.id))}">Open ${esc(app.name)}</a> · <a href="/ai-apps">See all apps</a></p>`),
      jsonLd: [crumbs([["EZYOURLIFE", "/"], ["Business apps", "/ai-apps"], [app.name, p]])],
    });
  }

  // Websites, cards and invites.
  for (const p of CATALOG) {
    const promo = promoFor(p);
    const isSite = WEBSITE_CATS.includes(p.category);
    const home = isSite ? ["Websites", "/websites"] : ["Cards and invites", "/cards"];
    const s = promoSeo(p);
    const related = CATALOG.filter((x) => x.category === p.category && x.id !== p.id).slice(0, 8);
    pages.push({
      path: `/make/${p.id}`,
      ...s,
      body: shell(`        <h1>${esc(p.name)}</h1>
        <p>${esc(p.tagline)}</p>
        <p>${esc(promo.pitch)}</p>
        <h2>How it works</h2>
        <ol>${promo.steps.map(([a, b]) => `<li><strong>${esc(a)}</strong> ${esc(b)}</li>`).join("")}</ol>
        ${promo.features?.length ? `<h2>What you get</h2>${ul(promo.features.map((f) => `<li><strong>${esc(f.title)}</strong> — ${esc(f.text)}</li>`))}` : ""}
        <h2>Questions</h2>
        ${promo.faqs.map(([q, a]) => `<h3>${esc(q)}</h3><p>${esc(a)}</p>`).join("\n        ")}
        <p><a href="/create/${esc(encodeURIComponent(p.id))}">Make your ${esc(p.name.toLowerCase())}</a></p>
        ${related.length ? `<h2>More like this</h2>${ul(related.map(productLi))}` : ""}`),
      jsonLd: [
        { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: promo.faqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
        crumbs([["EZYOURLIFE", "/"], home, [p.name, `/make/${p.id}`]]),
      ],
    });
  }

  // Fixed pages. Some get a list of what they lead to, so every page on the site is linked from somewhere.
  const extra = {
    "/ai-apps": () => {
      const cats = [...new Set(live.map((t) => t.category))];
      return cats.map((c) => `<h2>${esc(c)}</h2>${ul(live.filter((t) => t.category === c).map(appLi))}`).join("\n        ");
    },
    "/explore": () =>
      `<h2>By job to do</h2>${ul(landings.filter((l) => !l.noindex && l.path.startsWith("/ai-tool-for/")).map((l) => li(l.path, seo.humanize(l.path.split("/").pop()))))}
        <h2>By business type</h2>${ul(landings.filter((l) => !l.noindex && l.path.startsWith("/ai-for/")).map((l) => li(l.path, seo.humanize(l.path.split("/").pop()))))}`,
    "/websites": () => CATEGORIES.filter((c) => WEBSITE_CATS.includes(c.id)).map((c) => `<h2>${esc(c.name)}</h2><p>${esc(c.blurb)}</p>${ul(productsFor([c.id]).map(productLi))}`).join("\n        "),
    "/cards": () => CATEGORIES.filter((c) => !WEBSITE_CATS.includes(c.id)).map((c) => `<h2>${esc(c.name)}</h2><p>${esc(c.blurb)}</p>${ul(productsFor([c.id]).map(productLi))}`).join("\n        "),
    "/create": () => CATEGORIES.map((c) => `<h2>${esc(c.name)}</h2><p>${esc(c.blurb)}</p>${ul(productsFor([c.id]).map(productLi))}`).join("\n        "),
  };
  for (const sp of SITE_PAGES) {
    const s = seoFor(sp.path, count);
    const text = sp.text.map((t) => `<p>${esc(withCount(t, count))}</p>`).join("\n        ");
    const signIn = sp.signedIn ? `<p>New accounts start with 100 free credits. <a href="/auth?mode=signup">Sign up free</a> or <a href="/auth">sign in</a> to use it.</p>` : "";
    const links = sp.links?.length ? `<h2>On EZYOURLIFE</h2>${ul(sp.links.map(([l, h]) => li(h, l)))}` : "";
    pages.push({
      path: sp.path,
      ...s,
      body: shell(`        <h1>${esc(sp.h1)}</h1>
        ${text}
        ${signIn}
        ${extra[sp.path]?.() ?? ""}
        ${links}`),
      jsonLd: [
        sp.signedIn
          ? { "@context": "https://schema.org", "@type": "SoftwareApplication", name: sp.h1, description: s.description, url: `${SITE}${sp.path}`, applicationCategory: "BusinessApplication", operatingSystem: "Web", publisher: { "@type": "Organization", name: "EZYOURLIFE", url: SITE } }
          : { "@context": "https://schema.org", "@type": sp.path === "/about" ? "AboutPage" : "WebPage", name: s.title, description: s.description, url: `${SITE}${sp.path === "/" ? "/" : sp.path}` },
      ],
    });
  }
  return { pages, live, count };
}

/** Problems a search engine would mind, plus Abhi's rule that internal app labels never go public. */
export async function checkPages(pages, appPages) {
  const { INTERNAL_WORDS } = (await loadModules(["src/lib/seo/pages.ts"]))["src/lib/seo/pages.ts"];
  const errors = [];
  const warnings = [];
  const seenTitle = new Map();
  const seenDesc = new Map();
  for (const p of [...pages, ...appPages]) {
    if (p.noindex) continue;
    for (const [field, seen] of [["title", seenTitle], ["description", seenDesc]]) {
      const v = p[field];
      if (!v) errors.push(`${p.path}: no ${field}`);
      else if (seen.has(v)) (field === "title" ? errors : warnings).push(`${p.path} and ${seen.get(v)} have the same ${field}`);
      else seen.set(v, p.path);
    }
    if (p.title?.length > 70) warnings.push(`${p.path}: title is ${p.title.length} characters; Google shows about 60`);
    if (p.description && (p.description.length < 70 || p.description.length > 170)) warnings.push(`${p.path}: description is ${p.description.length} characters; aim for 120 to 160`);
  }
  for (const p of [...pages, ...appPages]) {
    const hit = INTERNAL_WORDS.exec(`${p.title}\n${p.description}\n${p.body}`);
    if (hit) errors.push(`${p.path}: public text uses the internal word "${hit[0]}"`);
  }
  return { errors, warnings };
}

export function sitemapXml(urls, lastmod = new Date().toISOString().slice(0, 10)) {
  // lastmod is the build date: the sitemap is rewritten on every build, so Google sees it change and re-reads it.
  return `<?xml version="1.0" encoding="UTF-8"?>
<!-- Written by scripts/prerender-pages.mjs at every build. Do not edit by hand. -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${esc(u)}</loc><lastmod>${lastmod}</lastmod></url>`).join("\n")}
</urlset>
`;
}

export async function prerenderPages({ dist = path.join(ROOT, "dist"), log = console.log, write = true } = {}) {
  const templateFile = write ? path.join(dist, "index.html") : path.join(ROOT, "index.html");
  if (!fs.existsSync(templateFile)) throw new Error(`${templateFile} not found — run the build first`);
  const template = fs.readFileSync(templateFile, "utf8");
  const d = await loadApps();
  const { pages, live } = await sitePages({ d });
  const byId = new Map(live.map((t) => [t.id, t]));
  const appPages = live.map((app) => ({ path: `/tool/${app.id}`, ...appPageFor(d, app, byId) }));

  const { errors, warnings } = await checkPages(pages, appPages);
  for (const w of warnings) log(`SEO warning: ${w}`);
  if (errors.length) throw new Error(`SEO problems:\n- ${errors.join("\n- ")}`);

  let n = 0;
  for (const page of pages) {
    const url = `${SITE}${page.path === "/" ? "/" : enc(page.path)}`;
    const html = render(template, { ...page, url });
    if (!write) continue;
    if (page.path === "/") continue; // the home page is index.html itself, done last
    const file = path.join(dist, ...page.path.slice(1).split("/"));
    fs.mkdirSync(file, { recursive: true });
    fs.writeFileSync(path.join(file, "index.html"), html);
    fs.writeFileSync(`${file}.html`, html);
    n++;
  }

  // Fixed pages first, then apps, then websites and cards, then the "AI tool for" pages.
  const rank = (p) => (p.startsWith("/ai-tool-for/") || p.startsWith("/ai-for/") ? 3 : p.startsWith("/make/") ? 2 : p.startsWith("/promo/") ? 4 : 0);
  const listed = pages.filter((p) => !p.noindex).map((p) => p.path);
  const indexable = [
    ...listed.filter((p) => rank(p) === 0),
    ...live.map((t) => `/tool/${t.id}`),
    ...listed.filter((p) => rank(p) === 2),
    ...listed.filter((p) => rank(p) === 4),
    ...listed.filter((p) => rank(p) === 3),
  ].map((p) => `${SITE}${p === "/" ? "/" : enc(p)}`);
  const urls = [`${SITE}/`, ...[...new Set(indexable)].filter((u) => u !== `${SITE}/`)];
  const xml = sitemapXml(urls);

  if (write) {
    fs.writeFileSync(path.join(dist, "sitemap.xml"), xml);
    // The home page keeps index.html as it is (it is also what any other address falls back to), with
    // the title and description from src/lib/seo/pages.ts so both say the same.
    const home = pages.find((p) => p.path === "/");
    let html = template;
    const set = (re, to) => (html = html.replace(re, () => to));
    set(/<title>[\s\S]*?<\/title>/, `<title>${esc(home.title)}</title>`);
    set(/<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${esc(home.description)}" />`);
    set(/<meta property="og:title" content="[^"]*"\s*\/?>/, `<meta property="og:title" content="${esc(home.title)}">`);
    set(/<meta name="twitter:title" content="[^"]*"\s*\/?>/, `<meta name="twitter:title" content="${esc(home.title)}">`);
    set(/<meta property="og:description" content="[^"]*"\s*\/?>/, `<meta property="og:description" content="${esc(home.description)}">`);
    set(/<meta name="twitter:description" content="[^"]*"\s*\/?>/, `<meta name="twitter:description" content="${esc(home.description)}">`);
    fs.writeFileSync(templateFile, html);
  }
  const hidden = pages.filter((p) => p.noindex).length;
  log(`Pages for search: ${write ? `wrote ${n} pages, ` : ""}sitemap has ${urls.length} addresses; ${hidden} thin "AI tool for" pages kept out of search.`);
  return { pages, urls, xml, warnings };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(ROOT, "scripts/prerender-pages.mjs")) {
  const check = process.argv.includes("--check");
  const { xml } = await prerenderPages({ write: !check });
  if (process.argv.includes("--sitemap")) fs.writeFileSync(path.join(ROOT, "public/sitemap.xml"), xml);
}
