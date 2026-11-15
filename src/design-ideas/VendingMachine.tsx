import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { SHOPS } from "./data";
import { creditsLabel, useDesignData } from "./useDesignData";
import { BazaarHeader, GateBand } from "./components/BazaarChrome";
import { FeaturePanel, type Feature } from "./FeaturePanel";
import type { CatalogTool } from "@/hooks/useToolsCatalog";

/* The Vending Machine. Coins here are pretend: pressing a slot never touches real credits. */
const START = 100;

const FEATURES: Feature[] = [
  { title: "Real credits as coins", line: "The display shows the person's real credit balance, and a press opens the app and charges it the same way as today.", needs: "Needs sign-in data" },
  { title: "Insert more coins", line: "A coin slot beside the display opens the credit packs, so topping up feels like feeding the machine.", needs: "Design only" },
  { title: "Type a code", line: "A keypad: press B3 and that slot drops. Quick for people who already know the app.", needs: "Design only" },
  { title: "Fresh stock every week", line: "The machine refills with new apps and a sold-out label on ones that are paused.", needs: "Needs new content" },
  { title: "Machine video", line: "A short loop of the machine dropping an invoice for one coin, made for Instagram.", needs: "Design only" },
  { title: "Gift a coin", line: "Send someone 5 free coins by link so they can press their first slot.", needs: "Needs a database change" },
];

export default function VendingMachine() {
  const { shops, costOf } = useDesignData();
  const [coins, setCoins] = useState(START);
  const [dropping, setDropping] = useState<string | null>(null);
  const [got, setGot] = useState<CatalogTool | null>(null);
  const [msg, setMsg] = useState("Tray is empty. Press a slot.");
  const timer = useRef<number>();
  // 12 slots: two apps from each shop, so the machine shows a bit of everything.
  const slots = useMemo(() => SHOPS.flatMap((s) => (shops.get(s.id) ?? []).slice(0, 2).map((t) => ({ t, shop: s }))), [shops]);
  const rows = [slots.slice(0, 4), slots.slice(4, 8), slots.slice(8, 12)];
  const press = (t: CatalogTool) => {
    if (dropping) return;
    const cost = costOf(t.id);
    if (coins < cost) { setGot(null); setMsg("Not enough coins left. Real credits start from ₹10."); return; }
    setCoins((c) => c - cost);
    setDropping(t.id);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => { setGot(t); setMsg(`${t.name} aa gaya!`); setDropping(null); }, 700);
  };
  return (
    <div className="min-h-screen bg-background">
      <BazaarHeader />
      <section className="mx-auto grid max-w-6xl items-start gap-8 px-4 py-10 md:grid-cols-[1fr_minmax(0,480px)]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Ezy-matic</p>
          <h1 className="mt-2 font-display text-4xl font-extrabold leading-[1.05] md:text-5xl">Press a slot.<br /><span className="marker">Get your result.</span></h1>
          <p className="mt-4 max-w-md text-[18px] text-muted-foreground">Every app is a slot with its price on it. You see what it costs before it drops, and nothing else. Try the machine: you start with {START} pretend coins.</p>
          <button type="button" onClick={() => { setCoins(START); setGot(null); setMsg("Tray is empty. Press a slot."); }} className="mt-5 rounded-full border-2 border-ink bg-card px-4 py-1.5 text-sm font-bold shadow-block-sm">Refill my coins</button>
        </div>
        <div className="rounded-2xl border-[3px] border-ink bg-[hsl(var(--ink))] p-4 text-background shadow-block-lg">
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="font-display text-sm font-extrabold">EZY-MATIC</span>
            <span className="rounded-md border-2 border-black bg-[#0b2b1d] px-3 py-1 font-mono text-sm font-semibold text-[#5dffa0]" aria-live="polite">COINS {coins}</span>
          </div>
          <div className="grid gap-3 rounded-xl border-[3px] border-black bg-[hsl(var(--sky)/0.35)] p-3">
            {rows.map((row, r) => (
              <div key={r} className="grid grid-cols-4 gap-2 border-b-[5px] border-ink/50 pb-3 last:border-b-0 last:pb-0">
                {row.map(({ t, shop }, c) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => press(t)}
                    aria-label={`${t.name}, ${creditsLabel(costOf(t.id))}, code ${"ABC"[r]}${c + 1}`}
                    className={cn("flex min-h-[92px] flex-col justify-between rounded-lg border-2 border-black p-1.5 text-center text-[11.5px] font-bold leading-tight text-ink transition-all duration-700 ease-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", dropping === t.id && "translate-y-[180px] rotate-6 opacity-0")}
                    style={{ background: shop.color }}
                  >
                    <span className="self-center rounded border border-black bg-card px-1 font-mono text-[10px]">{"ABC"[r]}{c + 1}</span>
                    <span className="line-clamp-3">{t.name}</span>
                    <span className="font-mono text-[10.5px]">{costOf(t.id)} coin{costOf(t.id) > 1 ? "s" : ""}</span>
                  </button>
                ))}
              </div>
            ))}
            {slots.length === 0 && <p className="p-6 text-center text-sm">The machine is loading its stock.</p>}
          </div>
          <div className="mt-3 flex min-h-[72px] items-center justify-between gap-3 rounded-lg bg-black p-3 text-[14.5px]" aria-live="polite">
            <span className={cn(!got && "opacity-70")}>{msg}</span>
            {got && <Link to={`/promo/${got.id}`} className="shrink-0 rounded-full border-2 border-background bg-sun px-4 py-1.5 font-bold text-ink">Open</Link>}
          </div>
        </div>
      </section>
      <FeaturePanel title="the Vending Machine" features={FEATURES} />
      <GateBand />
    </div>
  );
}
