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

/** Writes (or updates) one share page. Returns its public URL, or null when not configured. */
export async function writeSharePage(m: ShareMeta): Promise<string | null> {
  const token = Deno.env.get("GITHUB_SHARE_TOKEN");
  if (!token) return null;
  const path = `${m.path ?? `p/${m.slug}`}/index.html`;
  const api = `https://api.github.com/repos/${repo()}/contents/${path}`;
  const headers = { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "User-Agent": "ezyourlife-share" };
  const cur = await fetch(api, { headers });
  const sha = cur.ok ? (await cur.json()).sha : undefined;
  const bytes = new TextEncoder().encode(shareHtml(m));
  let bin = ""; bytes.forEach((b) => (bin += String.fromCharCode(b)));
  const res = await fetch(api, {
    method: "PUT", headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ message: `Share page: ${m.path ?? m.slug}`, content: btoa(bin), ...(sha ? { sha } : {}) }),
  });
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return `${shareBase()}/${m.path ?? `p/${m.slug}`}/`;
}
