import type { Listed } from "@/instant/useProducts";
import { CATEGORIES } from "@/instant/catalog";
import { WEBSITE_CATEGORIES } from "@/components/brand/nav";
import { designPreviewUrl } from "@/data/previewManifest";

/**
 * The few facts a modern design card needs about one website or card design. Cards import only
 * this type, so a page can show them without loading the whole design catalogue; this file (which
 * does load it) is used by the pages that already have the catalogue, and by the home page's
 * lazily loaded design feed.
 */
export interface DesignLite {
  id: string;
  name: string;
  tagline: string;
  /** A website (stays online) rather than a card or invite (sent once). */
  site: boolean;
  categoryName: string;
  seasonal: string | null;
  credits: number;
  featured: boolean;
  /** Phone picture of the real design, when there is one. */
  image: string | null;
  /** For designs without a picture: the design's own colours and sample title. */
  sampleTitle: string;
  theme: { bg: string; tx: string; mu: string; ac: string; on: string; line: string; display: string; body: string } | null;
}

export function toDesignLite(l: Listed): DesignLite {
  const p = l.product;
  const t = p.themes[0];
  return {
    id: p.id,
    name: p.name,
    tagline: p.tagline ?? "",
    site: (WEBSITE_CATEGORIES as readonly string[]).includes(p.category),
    categoryName: CATEGORIES.find((c) => c.id === p.category)?.name ?? "",
    seasonal: p.seasonal ?? null,
    credits: l.credits,
    featured: l.featured || !!p.popular,
    image: designPreviewUrl(p.id),
    sampleTitle: String(p.sample?.[p.titleField] ?? p.name),
    theme: t ? { bg: t.c.bg, tx: t.c.tx, mu: t.c.mu, ac: t.c.ac, on: t.c.on, line: t.c.line, display: t.f.d, body: t.f.b } : null,
  };
}
