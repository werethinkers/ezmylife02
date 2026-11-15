import { useState } from "react";
import { SHOPS, type Shop } from "./data";
import { creditsLabel, useDesignData } from "./useDesignData";
import { BazaarHeader, GateBand, TrustStrip } from "./components/BazaarChrome";
import { ShopInside } from "./components/ShopInside";
import { ShopkeeperSearch } from "./components/ShopkeeperSearch";
import { BigJobsBand } from "./BazaarHome";
import { Link } from "react-router-dom";

/* The Truck: loud road-art look. Colours are the site's own; the rhyming lines are design copy. */
const LINES: Record<string, string> = {
  "bill-ghar": "Bill banao, tension hatao.",
  "photo-studio": "Ek click, photo ready.",
  "vakeel-sahab": "Agreement likho, chakkar chhodo.",
  "munim-ji": "Hisaab saaf, dil khush.",
  "grahak-gali": "Post likho, customer bulao.",
  sahayak: "Poochho, padho, samjho.",
};

function Garland() {
  return (
    <div
      aria-hidden
      className="h-7 w-full"
      style={{ background: "radial-gradient(circle at 14px 14px, hsl(var(--coral)) 0 11px, transparent 12px) 0 0 / 28px 28px, radial-gradient(circle at 28px 14px, hsl(var(--sun)) 0 11px, transparent 12px) 0 0 / 28px 28px" }}
    />
  );
}

function Panel({ shop, count, from, active, onOpen }: { shop: Shop; count: number; from: number | null; active: boolean; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-pressed={active}
      className="group relative flex min-h-[190px] w-full flex-col justify-between rounded-lg border-4 border-ink p-5 text-left text-ink shadow-[6px_6px_0_0_hsl(var(--sun))] transition-transform hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      style={{ background: shop.color, outline: "3px dashed hsl(var(--ink))", outlineOffset: "-12px" }}
    >
      <span className="font-display text-2xl font-extrabold uppercase leading-none md:text-3xl">{shop.name}</span>
      <span className="my-3 block text-lg font-bold italic leading-snug">{LINES[shop.id]}</span>
      <span className="text-[12px] font-bold uppercase tracking-wider">
        {count > 0 ? `${count} apps${from ? ` · from ${creditsLabel(from)}` : ""}` : "Opening soon"}
      </span>
    </button>
  );
}

export default function TruckHome() {
  const { live, shops, costOf } = useDesignData();
  const [open, setOpen] = useState<string | null>(null);
  const shop = SHOPS.find((s) => s.id === open);
  const pick = (id: string) => {
    setOpen(id);
    requestAnimationFrame(() => document.getElementById("shop-inside")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };
  return (
    <div className="min-h-screen bg-background">
      <BazaarHeader />
      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="overflow-hidden rounded-xl border-[6px] border-ink bg-ink text-background shadow-block-lg">
          <Garland />
          <div className="flex justify-between gap-3 px-5 pt-4 text-[11px] font-bold uppercase tracking-[0.25em] text-sun md:px-8">
            <span>Horn OK please</span>
            <span className="hidden sm:inline">Ezyourlife · India</span>
            <span>Mera Bharat, mera kaam</span>
          </div>
          <div className="px-5 pb-8 pt-4 md:px-8">
            <h1 className="font-display text-5xl font-black uppercase leading-[0.95] md:text-8xl" style={{ textShadow: "4px 4px 0 hsl(var(--coral)), 8px 8px 0 hsl(var(--sky))" }}>
              Bill OK<br />please!
            </h1>
            <p className="mt-6 text-xl font-bold italic text-sun md:text-2xl">Har kaam ka ek shop, har shop ki ek shayari.</p>
            <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {SHOPS.map((s) => {
                const apps = shops.get(s.id) ?? [];
                const prices = apps.map((a) => costOf(a.id));
                return (
                  <li key={s.id}>
                    <Panel shop={s} count={apps.length} from={prices.length ? Math.min(...prices) : null} active={open === s.id} onOpen={() => pick(s.id)} />
                  </li>
                );
              })}
            </ul>
          </div>
          <Garland />
        </div>
      </section>
      {shop && <ShopInside shop={shop} apps={shops.get(shop.id) ?? []} costOf={costOf} />}
      <section className="mx-auto grid max-w-7xl items-start gap-6 px-4 py-10 md:grid-cols-2">
        <div>
          <h2 className="font-display text-2xl font-bold md:text-3xl">Not sure? Just ask.</h2>
          <p className="mt-2 text-muted-foreground">Type the job in your own words. We will point you to the right app.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link to="/websites" className="rounded-full border-2 border-ink bg-teal px-5 py-2 font-bold shadow-block-sm">Websites</Link>
            <Link to="/cards" className="rounded-full border-2 border-ink bg-sun px-5 py-2 font-bold shadow-block-sm">Cards &amp; invites</Link>
          </div>
        </div>
        <ShopkeeperSearch live={live} costOf={costOf} />
      </section>
      <BigJobsBand />
      <TrustStrip />
      <GateBand />
    </div>
  );
}
