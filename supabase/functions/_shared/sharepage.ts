// Link-preview pages. WhatsApp, Facebook and Instagram don't run JavaScript, so the app's own
// /p/:slug can't show a page's image in their previews. For each published page we write a tiny
// static HTML file (Open Graph tags + an instant redirect to the real page) to a GitHub Pages
// repo served at share.ezyourlife.com. Crawlers read the tags; people land on the page at once.
//
// Secrets: GITHUB_SHARE_TOKEN (fine-grained token, Contents: read & write on SHARE_REPO).
// Optional: SHARE_REPO (default werethinkers/ezyourlife-share), SHARE_BASE (https://share.ezyourlife.com).
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

export interface ShareMeta { slug: string; title: string; description: string; image?: string | null; indexable: boolean; path?: string; target?: string }

export const shareConfigured = () => !!Deno.env.get("GITHUB_SHARE_TOKEN");
const repo = () => Deno.env.get("SHARE_REPO") ?? "werethinkers/ezyourlife-share";
export const shareBase = () => (Deno.env.get("SHARE_BASE") ?? "https://share.ezyourlife.com").replace(/\/$/, "");
const DEFAULT_IMAGE = "https://storage.googleapis.com/gpt-engineer-file-uploads/xLjGcYZ2lQSzQM113rkSXKf1U352/social-images/social-1784811058771-deck-01.webp";

export function shareHtml(m: ShareMeta): string {
  const target = m.target ?? `https://ezyourlife.com/p/${encodeURIComponent(m.slug)}`;
  const url = `${shareBase()}/${m.path ?? `p/${m.slug}`}/`;
  const img = m.image || DEFAULT_IMAGE;
  const t = esc(m.title.slice(0, 120)), d = esc(m.description.slice(0, 300));
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${t}</title>
<meta name="description" content="${d}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="EZYOURLIFE">
<meta property="og:title" content="${t}">
<meta property="og:description" content="${d}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(img)}">
<meta property="og:image:secure_url" content="${esc(img)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${t}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${t}">
<meta name="twitter:description" content="${d}">
<meta name="twitter:image" content="${esc(img)}">
<meta name="robots" content="${m.indexable ? "index,follow" : "noindex,nofollow"}">
<link rel="canonical" href="${esc(target)}">
<meta http-equiv="refresh" content="0; url=${esc(target)}">
<script>location.replace(${JSON.stringify(target)})</script>
<style>body{font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;background:#f6f6fb;color:#222}a{color:#6655f2}</style>
</head><body><p>Opening <a href="${esc(target)}">${t}</a>…</p></body></html>`;
}

const ghHeaders = (token: string) => ({ Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "User-Agent": "ezyourlife-share" });
const b64 = (text: string) => { const bytes = new TextEncoder().encode(text); let bin = ""; bytes.forEach((b) => (bin += String.fromCharCode(b))); return btoa(bin); };

/** Creates or replaces one file in a repo (the share repo unless named). create-only skips files that already exist. */
async function putFile(token: string, path: string, content: string, message: string, createOnly = false, inRepo = repo()) {
  const api = `https://api.github.com/repos/${inRepo}/contents/${path}`;
  const cur = await fetch(api, { headers: ghHeaders(token) });
  if (cur.ok && createOnly) return;
  const sha = cur.ok ? (await cur.json()).sha : undefined;
  const res = await fetch(api, {
    method: "PUT", headers: { ...ghHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({ message, content: b64(content), ...(sha ? { sha } : {}) }),
  });
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

// The share site's own files, written once: its domain, a home page that opens ezyourlife.com, and a
// 404 page that forwards any link whose share page isn't built yet to the same page on ezyourlife.com.
let siteReady = false;
async function ensureSiteFiles(token: string) {
  if (siteReady) return;
  const host = new URL(shareBase()).host;
  const forward = (title: string, script: string) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title><meta property="og:title" content="EZYOURLIFE"><meta property="og:image" content="${DEFAULT_IMAGE}"><meta name="robots" content="noindex">
<script>${script}</script></head><body><p><a href="https://ezyourlife.com">Open EZYOURLIFE</a></p></body></html>`;
  await putFile(token, "CNAME", host + "\n", "Share site domain", true);
  await putFile(token, ".nojekyll", "", "Serve files as they are", true);
  await putFile(token, "index.html", forward("EZYOURLIFE", `location.replace("https://ezyourlife.com")`), "Share site home", true);
  await putFile(token, "404.html", forward("Opening…", `location.replace("https://ezyourlife.com" + location.pathname.replace(/\\/+$/, "") + location.search)`), "Forward unknown links", true);
  siteReady = true;
}

// Page sites. With PAGES_ORG set, each published page gets its own GitHub repo, served by GitHub Pages
// at <slug>.ezyourlife.com (a wildcard CNAME at the DNS points there). Its one HTML file carries the
// page's own preview tags and shows the live page from ezyourlife.com full screen, so forms and buttons
// work as on the site. The token then needs Administration, Contents and Pages (read and write) on
// that organisation. Names with their own DNS records are never used. Keep this list in step with
// the DNS at Hostinger.
const PAGE_ROOT = "ezyourlife.com";
const RESERVED = new Set([
  "www", "share", "api", "app", "mail", "email", "ftp", "admin", "blog", "shop", "status", "cdn", "static", "m",
  "abhijay", "tracker", "libertywow", "libertyreview", "linkdeinscraper", "buildtogether", "pimizzhaar", "aeroiq",
  "kalyanerp", "libertypdp", "mailbrain", "kalyan", "sharkcrm", "libertyvmtool", "contentintelligence",
  "harshal-atika-wadrobe", "thankyoudad",
]);
const pagesOrg = () => Deno.env.get("PAGES_ORG") ?? "";
export const pageSiteOk = (slug: string) => !!pagesOrg() && /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(slug) && !RESERVED.has(slug);

export function pageSiteHtml(m: ShareMeta): string {
  const host = `${m.slug}.${PAGE_ROOT}`;
  const frame = `https://${PAGE_ROOT}/p/${encodeURIComponent(m.slug)}?site=1`;
  const img = m.image || DEFAULT_IMAGE;
  const t = esc(m.title.slice(0, 120)), d = esc(m.description.slice(0, 300));
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${t}</title>
<meta name="description" content="${d}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${t}">
<meta property="og:title" content="${t}">
<meta property="og:description" content="${d}">
<meta property="og:url" content="https://${host}/">
<meta property="og:image" content="${esc(img)}">
<meta property="og:image:secure_url" content="${esc(img)}">
<meta property="og:image:alt" content="${t}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${t}">
<meta name="twitter:description" content="${d}">
<meta name="twitter:image" content="${esc(img)}">
<meta name="robots" content="${m.indexable ? "index,follow" : "noindex,nofollow"}">
<link rel="canonical" href="https://${host}/">
<link rel="icon" href="https://${PAGE_ROOT}/favicon.png">
<style>html,body{margin:0;height:100%;background:#fff}iframe{position:fixed;inset:0;width:100%;height:100%;border:0}</style>
</head><body>
<iframe src="${esc(frame)}" title="${t}" allow="clipboard-write; web-share; geolocation; fullscreen"></iframe>
<noscript><p><a href="${esc(frame)}">Open ${t}</a></p></noscript>
</body></html>`;
}

const gh = (token: string, path: string, init: RequestInit = {}) =>
  fetch(`https://api.github.com${path}`, { ...init, headers: { ...ghHeaders(token), "Content-Type": "application/json", ...(init.headers ?? {}) } });

/** Creates the page's repo and GitHub Pages site the first time, then writes its HTML. Returns its address. */
async function writePageSite(token: string, m: ShareMeta): Promise<string> {
  const org = pagesOrg(), name = `page-${m.slug}`, full = `${org}/${name}`, host = `${m.slug}.${PAGE_ROOT}`;
  const exists = await gh(token, `/repos/${full}`);
  if (exists.status === 404) {
    const r = await gh(token, `/orgs/${org}/repos`, { method: "POST", body: JSON.stringify({ name, private: false, auto_init: true, description: `${m.title.slice(0, 80)} · made with EZYOURLIFE`, homepage: `https://${host}/`, has_issues: false, has_wiki: false, has_projects: false }) });
    if (!r.ok && r.status !== 422) throw new Error(`GitHub repo ${r.status}: ${(await r.text()).slice(0, 200)}`);
  } else if (!exists.ok) throw new Error(`GitHub repo ${exists.status}`);
  await putFile(token, "CNAME", host + "\n", "Page domain", true, full);
  await putFile(token, ".nojekyll", "", "Serve files as they are", true, full);
  await putFile(token, "index.html", pageSiteHtml(m), `Page: ${m.slug}`, false, full);
  const pages = await gh(token, `/repos/${full}/pages`);
  if (pages.status === 404) {
    const r = await gh(token, `/repos/${full}/pages`, { method: "POST", body: JSON.stringify({ source: { branch: "main", path: "/" } }) });
    if (!r.ok && r.status !== 409) throw new Error(`GitHub Pages ${r.status}: ${(await r.text()).slice(0, 200)}`);
    await gh(token, `/repos/${full}/pages`, { method: "PUT", body: JSON.stringify({ cname: host }) });
  } else if (pages.ok && !(await pages.json()).https_enforced) {
    // GitHub can only force HTTPS once its certificate for the subdomain is ready (minutes to an hour).
    await gh(token, `/repos/${full}/pages`, { method: "PUT", body: JSON.stringify({ cname: host, https_enforced: true }) });
  }
  return `https://${host}/`;
}

/** Writes (or updates) one share page. Returns its public URL, or null when not configured.
 *  With page sites on, that is the page's own subdomain; if that fails, the share page as before. */
export async function writeSharePage(m: ShareMeta): Promise<string | null> {
  const token = Deno.env.get("GITHUB_SHARE_TOKEN");
  if (!token) return null;
  if (!m.path && pageSiteOk(m.slug)) {
    try { return await writePageSite(token, m); } catch (e) { console.warn("page site", m.slug, e); }
  }
  await ensureSiteFiles(token).catch((e) => console.warn("share site files", e));
  await putFile(token, `${m.path ?? `p/${m.slug}`}/index.html`, shareHtml(m), `Share page: ${m.path ?? m.slug}`);
  return `${shareBase()}/${m.path ?? `p/${m.slug}`}/`;
}
