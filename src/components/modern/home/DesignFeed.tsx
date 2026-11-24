import { useEffect, useMemo } from "react";
import { useProducts, type Listed } from "@/instant/useProducts";
import { toDesignLite, type DesignLite } from "../designLite";

/** What the home page shows about websites and cards. */
export interface DesignSummary {
  total: number;
  websiteCount: number;
  cardCount: number;
  minWebsiteCredits: number | null;
  minCardCredits: number | null;
  /** Up to six of each, designs with a picture first, then our picks, in the store's order. */
  topWebsites: DesignLite[];
  topCards: DesignLite[];
}

function summarise(list: Listed[]): DesignSummary {
  const all = list.map(toDesignLite);
  const sites = all.filter((d) => d.site);
  const cards = all.filter((d) => !d.site);
  const lead = (xs: DesignLite[]) => [...xs].sort((a, b) => Number(!!b.image) - Number(!!a.image) || Number(b.featured) - Number(a.featured)).slice(0, 6);
  const cheapest = (xs: DesignLite[]) => {
    const paid = xs.map((d) => d.credits).filter((n) => n > 0);
    return paid.length ? Math.min(...paid) : null;
  };
  return {
    total: all.length,
    websiteCount: sites.length,
    cardCount: cards.length,
    minWebsiteCredits: cheapest(sites),
    minCardCredits: cheapest(cards),
    topWebsites: lead(sites),
    topCards: lead(cards),
  };
}

/**
 * Loads the design catalogue (it is large) after the home page's first paint and hands a summary
 * to the page. Renders nothing. `onChange` must be stable (a state setter).
 */
export default function DesignFeed({ onChange }: { onChange: (summary: DesignSummary) => void }) {
  const { list } = useProducts();
  // useProducts builds a new list on every render; only re-summarise when what is shown changes.
  const signature = list.map((l) => `${l.product.id}:${l.credits}:${l.featured ? 1 : 0}`).join("|");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const summary = useMemo(() => summarise(list), [signature]);
  useEffect(() => onChange(summary), [summary, onChange]);
  return null;
}
