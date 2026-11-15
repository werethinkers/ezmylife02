import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import type { CatalogTool } from "@/hooks/useToolsCatalog";
import { giveGetFor } from "@/data/goals";
import { creditsLabel } from "../useDesignData";
import type { Shop } from "../data";

/** Inside a shop: the apps hang on the wall as price tags. */
export function ShopInside({ shop, apps, costOf }: { shop: Shop; apps: CatalogTool[]; costOf: (id: string) => number }) {
  const shown = apps.slice(0, 12);
  return (
    <section id="shop-inside" aria-label={`Inside ${shop.name}`} className="mx-auto mt-10 max-w-7xl scroll-mt-24 px-4">
      <div className="block-card p-5 md:p-8" style={{ background: `color-mix(in srgb, ${shop.color} 22%, hsl(var(--card)))` }}>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Inside</p>
            <h2 className="font-display text-2xl font-bold md:text-3xl">{shop.name}</h2>
            <p className="mt-1 text-[16px] text-muted-foreground">{shop.line}</p>
          </div>
          <Link to="/ai-apps" className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-card px-4 py-2 text-sm font-semibold hover:bg-secondary">
            All {apps.length} apps <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {shown.map((t) => (
            <li key={t.id}>
              <Link to={`/promo/${t.id}`} className="block-card block-lift relative flex h-full flex-col gap-2 p-4 pt-6">
                <span aria-hidden className="absolute left-1/2 top-2 h-2.5 w-2.5 -translate-x-1/2 rounded-full border-2 border-ink bg-background" />
                <span className="font-display text-[15px] font-bold leading-tight">{t.name}</span>
                <span className="text-[14px] leading-snug text-muted-foreground">You get {giveGetFor(t.category, { toolTypes: t.tool_types }).get}.</span>
                <span className="mt-auto inline-flex w-fit rounded-full border-2 border-ink px-2.5 py-0.5 text-[12px] font-semibold" style={{ background: shop.color }}>
                  {creditsLabel(costOf(t.id))}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        {apps.length === 0 && <p className="text-muted-foreground">Apps for this shop are loading.</p>}
      </div>
    </section>
  );
}
