import { useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { STUDIO_IDS } from "@/data/studios";
import { SHOPS } from "./data";
import { useDesignData } from "./useDesignData";
import { BazaarHeader, GateBand, TrustStrip } from "./components/BazaarChrome";
import { Lane } from "./components/Lane";
import { ShopInside } from "./components/ShopInside";
import { ShopkeeperSearch } from "./components/ShopkeeperSearch";
import { ThaliSection } from "./components/Thali";
import { DeparturesBoard } from "./components/DeparturesBoard";

/** The Bazaar home page, built from the same parts the other ideas use. */
export function BazaarHero() {
  const { live, costOf } = useDesignData();
  return (
    <section className="mx-auto grid max-w-7xl items-center gap-8 px-4 pb-10 pt-10 md:grid-cols-[1.15fr_1fr] md:pt-14">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">For small businesses in India</p>
        <h1 className="mt-3 font-display text-4xl font-extrabold leading-[1.05] md:text-6xl">
          One street.<br />Every shop <span className="marker">your business needs.</span>
        </h1>
        <p className="mt-4 max-w-xl text-[18px] text-muted-foreground">Bills, photos, agreements, websites and more. Pick a shop, step in, and get a finished result you can use today.</p>
      </div>
      <ShopkeeperSearch live={live} costOf={costOf} />
    </section>
  );
}

export function BazaarLane() {
  const { shops, costOf } = useDesignData();
  const [open, setOpen] = useState<string | null>(null);
  const shop = SHOPS.find((s) => s.id === open);
  const pick = (id: string) => {
    setOpen(id);
    requestAnimationFrame(() => document.getElementById("shop-inside")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };
  return (
    <>
      <Lane shops={shops} activeId={open} onOpen={pick} />
      {shop && <ShopInside shop={shop} apps={shops.get(shop.id) ?? []} costOf={costOf} />}
    </>
  );
}

export function BigJobsBand() {
  const n = STUDIO_IDS.size;
  return (
    <section className="mx-auto max-w-7xl px-4 py-6">
      <Link to="/studios" className="block-card block-lift flex flex-wrap items-center justify-between gap-4 bg-sun p-5 md:p-6">
        <div className="flex items-center gap-3">
          <Sparkles className="h-7 w-7 shrink-0" aria-hidden />
          <div>
            <p className="font-display text-xl font-bold">Got a big job? Visit the Studios</p>
            <p className="text-[15px]">{Math.floor(n / 10) * 10}+ guided apps that finish a whole job step by step: a business plan, a catalogue, a resume.</p>
          </div>
        </div>
        <span className="rounded-full border-2 border-ink bg-card px-4 py-2 text-sm font-bold">See the Studios</span>
      </Link>
    </section>
  );
}

export function BazaarThali() {
  const { bundles, costOf } = useDesignData();
  return <ThaliSection bundles={bundles} costOf={costOf} />;
}

export function BazaarBoard() {
  const { live, costOf } = useDesignData();
  return <DeparturesBoard live={live} costOf={costOf} />;
}

export default function BazaarHome() {
  return (
    <div className="min-h-screen bg-background">
      <BazaarHeader />
      <BazaarHero />
      <BazaarLane />
      <BigJobsBand />
      <BazaarThali />
      <BazaarBoard />
      <TrustStrip />
      <GateBand />
    </div>
  );
}
