import { useEffect } from "react";
import { applyHead, canonicalUrl } from "@/lib/seo/head";

interface SEOHeadProps {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article" | "product";
  image?: string;
  noindex?: boolean;
  keywords?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

export const SEOHead = ({ title, description, path, type = "website", image, noindex = false, keywords, jsonLd }: SEOHeadProps) => {
  const fullTitle = title.includes("EZYOURLIFE") ? title : `${title} | EZYOURLIFE`;
  const ld = JSON.stringify(jsonLd ?? null);

  useEffect(() => {
    // The home page's WebSite and Organization data is already in index.html.
    const fallback =
      path === "/"
        ? undefined
        : { "@context": "https://schema.org", "@type": "WebPage", name: fullTitle, description, url: canonicalUrl(path), isPartOf: { "@type": "WebSite", name: "EZYOURLIFE", url: "https://ezyourlife.com/" } };
    applyHead({ title: fullTitle, description, path, keywords, image, ogType: type, noindex, jsonLd: jsonLd ?? fallback });
    // jsonLd is compared by value (ld).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullTitle, description, path, type, image, noindex, keywords, ld]);

  return null;
};
