// Sets the page's title, description, canonical address, social tags and structured data.
// Shared by <SEOHead> and <PageSeo>. It updates the tags index.html already has instead of adding a
// second copy, so a page never ends up with two descriptions or two canonical links.

export const ORIGIN = "https://ezyourlife.com";
export const DEFAULT_IMAGE =
  "https://storage.googleapis.com/gpt-engineer-file-uploads/xLjGcYZ2lQSzQM113rkSXKf1U352/social-images/social-1784811058771-deck-01.webp";
const OWNED = "data-page-seo";

export interface HeadInput {
  title: string;
  description: string;
  path: string;
  /** The address search engines should list when this page is a second way in to another one. */
  canonicalPath?: string;
  keywords?: string;
  image?: string;
  ogType?: string;
  /** "keep" leaves the robots tag as it is, for a page that decides once its data has loaded. */
  noindex?: boolean | "keep";
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

function meta(attr: "name" | "property", key: string, content: string) {
  const all = document.head.querySelectorAll<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  all.forEach((el, i) => i > 0 && el.remove());
  let el = all[0];
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export function canonicalUrl(path: string) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${ORIGIN}${p === "/" ? "/" : p.replace(/\/+$/, "")}`;
}

export function applyHead(h: HeadInput) {
  const url = canonicalUrl(h.canonicalPath ?? h.path);
  const image = h.image ?? DEFAULT_IMAGE;
  document.title = h.title;
  meta("name", "description", h.description);
  if (h.noindex !== "keep") meta("name", "robots", h.noindex ? "noindex, follow" : "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1");
  if (h.keywords) meta("name", "keywords", h.keywords);
  meta("property", "og:title", h.title);
  meta("property", "og:description", h.description);
  meta("property", "og:url", url);
  meta("property", "og:type", h.ogType ?? "website");
  meta("property", "og:image", image);
  meta("name", "twitter:card", "summary_large_image");
  meta("name", "twitter:title", h.title);
  meta("name", "twitter:description", h.description);
  meta("name", "twitter:image", image);

  const links = document.head.querySelectorAll<HTMLLinkElement>('link[rel="canonical"]');
  links.forEach((el, i) => i > 0 && el.remove());
  let link = links[0];
  if (!link) {
    link = document.createElement("link");
    link.rel = "canonical";
    document.head.appendChild(link);
  }
  link.href = url;

  // Page structured data replaces the previous page's, and the copy a static page was served with.
  document.head
    .querySelectorAll(`script[type="application/ld+json"][${OWNED}], script[type="application/ld+json"][data-static-page]`)
    .forEach((n) => n.remove());
  const blocks = h.jsonLd ? (Array.isArray(h.jsonLd) ? h.jsonLd : [h.jsonLd]) : [];
  for (const b of blocks) {
    const s = document.createElement("script");
    s.type = "application/ld+json";
    s.setAttribute(OWNED, "");
    s.text = JSON.stringify(b);
    document.head.appendChild(s);
  }
}
