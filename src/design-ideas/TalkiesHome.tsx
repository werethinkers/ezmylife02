import { Link } from "react-router-dom";
import { useMemo } from "react";
import type { CatalogTool } from "@/hooks/useToolsCatalog";
import { giveGetFor } from "@/data/goals";
import { SHOPS, type Shop } from "./data";
import { creditsLabel, useDesignData } from "./useDesignData";
import { BazaarHeader, GateBand, TrustStrip } from "./components/BazaarChrome";
import { ShopkeeperSearch } from "./components/ShopkeeperSearch";
import { BigJobsBand } from "./BazaarHome";

/* The Talkies: a cinema hoarding. "New" means one of the five newest apps in the catalogue, nothing more. */
function Poster({ tool, shop, price, isNew }: { tool: CatalogTool; shop: Shop; price: number; isNew: boolean }) {
  return (
    <Link
      to={`/promo/${tool.id}`}
      className="relative flex min-h-[270px] w-[210px] shrink-0 snap-start flex-col justify-between border-4 border-ink p-4 text-ink shadow-[0_8px_0_0_hsl(var(--ink))] transition-transform hover:-translate-y-1"
      style={{ background: `linear-gradient(160deg, ${shop.color}, color-mix(in srgb, ${shop.color} 55%, hsl(var(--ink))))` }}
    >
      {isNew && <span className="absolute -right-2 -top-3 rotate-6 border-2 border-ink bg-coral px-2 py-0.5 text-[11px] font-black uppercase">New</span>}
      <span className="text-[11px] font-bold uppercase tracking-[0.18em]">{shop.name}</span>
      <span className="font-display break-words text-lg font-black uppercase leading-[1.05]">{tool.name}</span>
      <span className="text-[14px] font-semibold leading-snug">You get {giveGetFor(tool.category, { toolTypes: tool.tool_types }).get}.</span>
      <span className="bg-cream px-2 py-1.5 text-center text-[12px] font-black uppercase tracking-wide">Ticket · {creditsLabel(price)}</span>
    </Link>
  );
}

export default function TalkiesHome() {
  const { live, shops, costOf } = useDesignData();
  const shopOfTool = useMemo(() => {
    const m = new Map<string, Shop>();
    SHOPS.forEach((s) => (shops.get(s.id) ?? []).forEach((t) => m.set(t.id, s)));
    return m;
  }, [shops]);
  const newest = useMemo(() => [...live].filter((t) => shopOfTool.has(t.id)).sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 5), [live, shopOfTool]);
  const newIds = new Set(newest.map((t) => t.id));
  const bulbs = "radial-gradient(circle, hsl(var(--sun)) 0 3px, transparent 4px) 0 0 / 22px 22px";
  return (
    <div className="min-h-screen bg-background">
      <BazaarHeader />
      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="relative rounded-xl border-[10px] border-sun bg-ink p-5 text-background shadow-[0_0_0_4px_hsl(var(--coral))] md:p-8">
          <div aria-hidden className="absolute inset-x-0 -top-[9px] h-2" style={{ background: bulbs }} />
          <div aria-hidden className="absolute inset-x-0 -bottom-[9px] h-2" style={{ background: bulbs }} />
          <p className="text-center text-xs font-black uppercase tracking-[0.35em] text-sun">★ Now showing ★</p>
          <h1 className="mt-2 text-center font-display text-4xl font-black uppercase leading-none md:text-7xl" style={{ textShadow: "0 0 18px hsl(var(--pink)), 3px 3px 0 hsl(var(--coral))" }}>
            Ezyourlife Talkies
          </h1>
          <p className="mt-3 text-center text-lg font-bold italic text-sun">Ticket sirf kaam ke daam. Pehle 100 credits free.</p>
          <h2 className="mb-3 mt-8 font-display text-lg font-bold uppercase text-sun">Latest releases</h2>
          <div className="flex snap-x gap-5 overflow-x-auto px-1 pb-4 pt-3">
            {newest.map((t) => <Poster key={t.id} tool={t} shop={shopOfTool.get(t.id)!} price={costOf(t.id)} isNew />)}
            {newest.length === 0 && <p className="text-background/70">Posters are loading.</p>}
          </div>
        </div>
      </section>
      {SHOPS.map((s) => {
        const apps = (shops.get(s.id) ?? []).slice(0, 10);
        if (!apps.length) return null;
        return (
          <section key={s.id} aria-label={`${s.name} shows`} className="mx-auto max-w-7xl px-4 py-4">
            <div className="mb-2 flex items-end justify-between gap-3">
              <div><h2 className="font-display text-xl font-bold md:text-2xl">{s.name}</h2><p className="text-[15px] text-muted-foreground">{s.line}</p></div>
              <Link to="/ai-apps" className="text-sm font-bold underline underline-offset-2">All apps</Link>
            </div>
            <div className="flex snap-x gap-5 overflow-x-auto px-1 pb-5 pt-3">
              {apps.map((t) => <Poster key={t.id} tool={t} shop={s} price={costOf(t.id)} isNew={newIds.has(t.id)} />)}
            </div>
          </section>
        );
      })}
      <section className="mx-auto max-w-3xl px-4 py-8"><ShopkeeperSearch live={live} costOf={costOf} /></section>
      <BigJobsBand />
      <TrustStrip />
      <GateBand />
    </div>
  );
}
