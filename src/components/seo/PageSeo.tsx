import { useEffect } from "react";
import { applyHead } from "@/lib/seo/head";

interface PageSeoProps {
  title: string;
  description: string;
  path: string;
  canonicalPath?: string;
  keywords?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  ogType?: string;
  image?: string;
  noindex?: boolean | "keep";
}

export function PageSeo({ title, description, path, canonicalPath, keywords, jsonLd, ogType = "website", image, noindex = false }: PageSeoProps) {
  const ld = JSON.stringify(jsonLd ?? null);
  useEffect(() => {
    applyHead({ title, description, path, canonicalPath, keywords, jsonLd, ogType, image, noindex });
    // jsonLd is compared by value (ld), so a new object each render does not re-run this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, path, canonicalPath, keywords, ld, ogType, image, noindex]);

  return null;
}
