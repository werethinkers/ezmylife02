import { useState } from "react";
import { Link } from "react-router-dom";
import { giveGetFor } from "@/data/goals";
import { SHOPS } from "./data";
import { creditsLabel, useDesignData } from "./useDesignData";
import { BazaarHeader, GateBand, TrustStrip } from "./components/BazaarChrome";
import { ShopkeeperSearch } from "./components/ShopkeeperSearch";
import { BigJobsBand } from "./BazaarHome";

/* The Bahi-Khata: a trader's ledger. Cloth cover in the site's coral darkened with ink, ruled cream pages. */
const cover = "color-mix(in srgb, hsl(var(--coral)) 55%, hsl(var(--ink)))";
const ruled = {
  backgroundColor: "hsl(var(--cream))",
  backgroundImage: "linear-gradient(90deg, transparent 52px, hsl(var(--coral)) 52px, hsl(var(--coral)) 54px, transparent 54px), repeating-linear-gradient(transparent 0 35px, hsl(var(--sky) / 0.55) 35px 36px)",
} as const;
const LEAD = 6;

export default function LedgerHome() {
  const { live, shops, costOf } = useDesignData();
  const [more, setMore] = useState<Set<string>>(new Set());
  const toggle = (id: string) => setMore((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  let line = 0;
  return (
    <div className="min-h-screen bg-background">
      <BazaarHeader />
      <section className="mx-auto max-w-5xl px-4 py-10">
        <div className="grid grid-cols-[minmax(0,1fr)] overflow-hidden rounded-2xl border-4 border-ink shadow-block-lg md:grid-cols-[280px_minmax(0,1fr)]" style={{ background: cover }}>
          <div className="flex flex-col justify-between gap-8 p-8 text-center text-sun" style={{ outline: "3px solid hsl(var(--sun))", outlineOffset: "-14px" }}>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em]">Shubh Labh</p>
            <div>
              <h1 className="font-display text-4xl font-extrabold leading-[1.05]">Ezyourlife<br />Bahi-Khata</h1>
              <p className="mt-3 text-lg">Aapke kaam ka hisaab</p>
            </div>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em]">Pehla panna kholiye</p>
          </div>
          <div className="min-w-0 px-4 pb-8 pt-6 md:px-10" style={ruled}>
            <h2 className="pl-10 font-display text-2xl font-bold" style={{ color: cover, lineHeight: "36px" }}>Aaj ka khata</h2>
            <div className="pl-10"><ShopkeeperSearch live={live} costOf={costOf} /></div>
            {SHOPS.map((s) => {
              const apps = shops.get(s.id) ?? [];
              if (!apps.length) return null;
              const open = more.has(s.id);
              const list = open ? apps : apps.slice(0, LEAD);
              return (
                <div key={s.id} className="mt-6">
                  <h3 className="flex items-baseline justify-between gap-3 pl-10 font-display text-lg font-bold" style={{ lineHeight: "36px", color: cover }}>
                    <span className="whitespace-nowrap">{s.name}</span><span className="hidden text-[13px] font-semibold text-muted-foreground sm:inline">{s.line}</span>
                  </h3>
                  <ul>
                    {list.map((t) => {
                      line += 1;
                      return (
                        <li key={t.id}>
                          <Link to={`/promo/${t.id}`} className="grid grid-cols-[40px_1fr_auto] items-baseline gap-x-3 hover:bg-sun/25" style={{ minHeight: 36, lineHeight: "36px" }}>
                            <span className="text-right text-[12px] text-muted-foreground">{line}</span>
                            <span className="min-w-0 truncate text-[17px] font-semibold">{t.name}<span className="hidden text-[14px] font-normal text-muted-foreground md:inline"> · {giveGetFor(t.category, { toolTypes: t.tool_types }).get}</span></span>
                            <span className="font-bold" style={{ color: cover }}>{creditsLabel(costOf(t.id))}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                  {apps.length > LEAD && (
                    <button type="button" onClick={() => toggle(s.id)} className="ml-10 text-[14px] font-bold underline underline-offset-2" style={{ lineHeight: "36px" }}>
                      {open ? "Show fewer" : `Aur ${apps.length - LEAD} entries dekhein`}
                    </button>
                  )}
                </div>
              );
            })}
            <div className="mt-8 flex items-baseline justify-between gap-4 border-t-2 border-ink pl-10 font-display text-lg font-bold" style={{ lineHeight: "40px" }}>
              <span>Pehle 100 credits</span><span>Jama: free</span>
            </div>
          </div>
        </div>
      </section>
      <BigJobsBand />
      <section className="mx-auto max-w-7xl px-4 pb-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Link to="/websites" className="block-card block-lift bg-teal p-5"><p className="font-display text-lg font-bold">Websites</p><p>Pick a design, add your details, go live. Pay once.</p></Link>
          <Link to="/cards" className="block-card block-lift bg-sun p-5"><p className="font-display text-lg font-bold">Cards &amp; invites</p><p>Visiting cards, weddings and festival wishes.</p></Link>
        </div>
      </section>
      <TrustStrip />
      <GateBand />
    </div>
  );
}
