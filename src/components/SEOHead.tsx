import { useEffect } from "react";

interface SEOHeadProps {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article" | "product";
  image?: string;
  noindex?: boolean;
  keywords?: string;
  jsonLd?: Record<string, unknown>;
}

const BASE_URL = "https://ezyourlife.com";

export const SEOHead = ({
  title,
  description,
  path,
  type = "website",
  image = `${BASE_URL}/og-image.png`,
  noindex = false,
  keywords,
  jsonLd,
}: SEOHeadProps) => {
  const fullTitle = title.includes("EZYOURLIFE") ? title : `${title} | EZYOURLIFE`;
  const canonicalUrl = `${BASE_URL}${path}`;

  useEffect(() => {
    document.title = fullTitle;

    const setMeta = (attr: string, key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    // Standard meta
    setMeta("name", "description", description);
    setMeta("name", "robots", noindex ? "noindex, nofollow" : "index, follow, max-snippet:-1, max-image-preview:large");
    setMeta("name", "author", "EZYOURLIFE");
    setMeta("name", "application-name", "EZYOURLIFE");

    if (keywords) {
      setMeta("name", "keywords", keywords);
    }

    // Open Graph
    setMeta("property", "og:title", fullTitle);
    setMeta("property", "og:description", description);
    setMeta("property", "og:url", canonicalUrl);
    setMeta("property", "og:type", type);
    setMeta("property", "og:image", image);
    setMeta("property", "og:site_name", "EZYOURLIFE");

    // Twitter
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", fullTitle);
    setMeta("name", "twitter:description", description);
    setMeta("name", "twitter:image", image);

    // Canonical link
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", canonicalUrl);

    // JSON-LD structured data
    const existingLd = document.getElementById("seo-jsonld");
    if (existingLd) existingLd.remove();

    const script = document.createElement("script");
    script.id = "seo-jsonld";
    script.type = "application/ld+json";

    const defaultJsonLd: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": type === "website" ? "WebSite" : "WebPage",
      name: fullTitle,
      description,
      url: canonicalUrl,
      image,
      publisher: {
        "@type": "Organization",
        name: "EZYOURLIFE",
        alternateName: ["ezyourlife", "ez your life"],
        url: BASE_URL,
        logo: {
          "@type": "ImageObject",
          url: `${BASE_URL}/favicon.png`,
        },
      },
    };

    if (path === "/") {
      defaultJsonLd["@type"] = "WebSite";
      defaultJsonLd.potentialAction = {
        "@type": "SearchAction",
        target: `${BASE_URL}/tools?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      };
    }

    script.textContent = JSON.stringify(jsonLd || defaultJsonLd);
    document.head.appendChild(script);

    // Page-specific JSON-LD
    if (jsonLd) {
      const existingPageLd = document.getElementById("seo-page-jsonld");
      if (existingPageLd) existingPageLd.remove();
    }

    return () => {
      const el = document.getElementById("seo-jsonld");
      if (el) el.remove();
    };
  }, [fullTitle, description, canonicalUrl, type, image, noindex, keywords, jsonLd]);

  return null;
};
