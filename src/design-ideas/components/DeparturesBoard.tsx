import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { CatalogTool } from "@/hooks/useToolsCatalog";
import { KIND_TEXT, categoryInfo } from "@/data/goals";
import { SHOPS, shopOf } from "../data";
import { creditsLabel } from "../useDesignData";
import { cn } from "@/lib/utils";

const PAGE = 15;

/** A station departures board: every app is one row. Columns are only things we know: shop, how it opens, price. */
export function DeparturesBoard({ live, costOf }: { live: CatalogTool[]; costOf: (id: string) => number }) {
  const [shopId, setShopId] = useState<string | null>(null);
  const [shown, setShown] = useState(PAGE);
  const rows = useMemo(
    () => live.map((t) => ({ t, shop: shopOf(t) })).filter((r) => r.shop && (!shopId || r.shop.id === shopId)),
    [live, shopId],
  );
  const chip = (on: boolean) => cn("rounded-full border-2 border-ink px-3 py-1.5 text-[13px] font-semibold whitespace-nowrap text-ink", on ? "bg-sun" : "bg-card hover:bg-secondary");
  return (
    <section aria-label="All apps board" className="mx-auto max-w-7xl px-4 py-12">
      <div className="overflow-hidden rounded-2xl border-2 border-ink bg-ink text-background shadow-block">
        <div className="flex items-center justify-between gap-3 border-b-4 border-sun bg-sun px-5 py-3 text-ink">
          <h2 className="font-display text-lg font-bold md:text-2xl">All apps board</h2>
          <span className="text-xs font-semibold uppercase tracking-widest">{rows.length} apps</span>
        </div>
        <div className="flex gap-2 overflow-x-auto px-5 py-3">
          <button type="button" className={chip(!shopId)} onClick={() => { setShopId(null); setShown(PAGE); }}>All shops</button>
          {SHOPS.map((s) => (
            <button key={s.id} type="button" className={chip(shopId === s.id)} onClick={() => { setShopId(s.id); setShown(PAGE); }}>
              {s.name}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[15px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-[0.18em] text-background/60">
                <th className="px-5 py-2 font-semibold">App</th>
                <th className="hidden px-3 py-2 font-semibold sm:table-cell">Shop</th>
                <th className="hidden px-3 py-2 font-semibold md:table-cell">Opens as</th>
                <th className="px-5 py-2 text-right font-semibold">Price</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, shown).map(({ t, shop }, i) => (
                <tr key={t.id} className={cn("border-t border-background/15", i % 2 && "bg-background/5")}>
                  <td className="px-5 py-2.5">
                    <Link to={`/promo/${t.id}`} className="font-semibold text-sun hover:underline">{t.name}</Link>
                    <span className="block text-[12px] text-background/60 sm:hidden">{shop!.name}</span>
                  </td>
                  <td className="hidden px-3 py-2.5 sm:table-cell"><span className="inline-block h-2.5 w-2.5 rounded-full align-middle" style={{ background: shop!.color }} /> <span className="ml-1.5">{shop!.name}</span></td>
                  <td className="hidden px-3 py-2.5 text-background/70 md:table-cell">{KIND_TEXT[categoryInfo(t.category).kind].title}</td>
                  <td className="px-5 py-2.5 text-right font-semibold">{creditsLabel(costOf(t.id))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {shown < rows.length && (
          <button type="button" onClick={() => setShown((n) => n + PAGE)} className="w-full border-t border-background/15 px-5 py-3 text-sm font-semibold text-sun hover:bg-background/5">
            Show {Math.min(PAGE, rows.length - shown)} more
          </button>
        )}
      </div>
    </section>
  );
}
