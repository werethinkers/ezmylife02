import { Link } from "react-router-dom";
import { Globe, Mail } from "lucide-react";
import { SHOPS } from "../data";
import { ShopFront } from "./ShopFront";
import type { CatalogTool } from "@/hooks/useToolsCatalog";

/** The street: all shops side by side, then the cloth-and-road line under them. */
export function Lane({ shops, activeId, onOpen }: { shops: Map<string, CatalogTool[]>; activeId: string | null; onOpen: (id: string) => void }) {
  return (
    <section aria-label="The shops" className="mx-auto max-w-7xl px-4">
      <ul className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
        {SHOPS.map((s) => {
          const apps = shops.get(s.id) ?? [];
          return (
            <li key={s.id} className="flex">
              <ShopFront shop={s} count={apps.length} samples={apps.slice(0, 3).map((a) => a.name)} active={activeId === s.id} onOpen={() => onOpen(s.id)} />
            </li>
          );
        })}
        <li className="col-span-2 grid grid-cols-2 gap-4 md:col-span-3 lg:col-span-2">
          <Link to="/websites" className="block-card block-lift flex flex-col gap-2 bg-teal p-4">
            <Globe className="h-6 w-6" aria-hidden />
            <span className="font-display text-[15px] font-bold">Websites</span>
            <span className="text-[14px] leading-snug">Pick a design, add your details, go live. Pay once.</span>
          </Link>
          <Link to="/cards" className="block-card block-lift flex flex-col gap-2 bg-sun p-4">
            <Mail className="h-6 w-6" aria-hidden />
            <span className="font-display text-[15px] font-bold">Cards &amp; invites</span>
            <span className="text-[14px] leading-snug">Visiting cards, weddings and festival wishes.</span>
          </Link>
        </li>
      </ul>
      <div aria-hidden className="mt-8 flex h-9 items-center justify-center border-y-2 border-ink bg-ink text-[11px] font-semibold uppercase tracking-[0.3em] text-background">
        · · · Walk in, every shop is open · · ·
      </div>
    </section>
  );
}
