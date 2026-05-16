import { useEffect } from "react";

interface PageSeoProps {
  title: string;
  description: string;
  path: string;
  keywords?: string;
  jsonLd?: Record<string, any> | Array<Record<string, any>>;
  ogType?: string;
}

const ORIGIN = "https://ezyourlife.com";
const MARK = "data-page-seo";

function upsertMeta(selector: string, attrs: Record<string, string>) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${selector}][${MARK}]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(MARK, "");
    document.head.appendChild(el);
  }
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"][${MARK}]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute(MARK, "");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export function PageSeo({ title, description, path, keywords, jsonLd, ogType = "website" }: PageSeoProps) {
  const url = `${ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;

  useEffect(() => {
    document.title = title;
    upsertMeta('name="description"', { name: "description", content: description });
    if (keywords) upsertMeta('name="keywords"', { name: "keywords", content: keywords });
    upsertLink("canonical", url);
    upsertMeta('property="og:title"', { property: "og:title", content: title });
    upsertMeta('property="og:description"', { property: "og:description", content: description });
    upsertMeta('property="og:url"', { property: "og:url", content: url });
    upsertMeta('property="og:type"', { property: "og:type", content: ogType });
    upsertMeta('name="twitter:card"', { name: "twitter:card", content: "summary_large_image" });
    upsertMeta('name="twitter:title"', { name: "twitter:title", content: title });
    upsertMeta('name="twitter:description"', { name: "twitter:description", content: description });

    // Remove old JSON-LD blocks we own, then add fresh
    document.head.querySelectorAll(`script[type="application/ld+json"][${MARK}]`).forEach((n) => n.remove());
    const schemas = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];
    for (const s of schemas) {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute(MARK, "");
      script.text = JSON.stringify(s);
      document.head.appendChild(script);
    }
  }, [title, description, url, keywords, ogType, JSON.stringify(jsonLd)]);

  return null;
}
