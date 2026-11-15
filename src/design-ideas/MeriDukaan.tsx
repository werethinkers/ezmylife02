import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { findApp } from "./data";
import { creditsLabel, useDesignData } from "./useDesignData";
import { BazaarHeader, GateBand } from "./components/BazaarChrome";
import { FeaturePanel, type Feature } from "./FeaturePanel";

/* Meri Dukaan: one small shop that fills up as you add parts. Here you tick the parts yourself;
 * in the real version the parts would be switched on by the apps a person has really used. */
type PartId = "sign" | "counter" | "photo" | "register" | "board" | "cab";
const KEY = "ez-design-meri-dukaan";

const PARTS: { id: PartId; name: string; hint: string; color: string; re: RegExp | null; to?: string }[] = [
  { id: "sign", name: "Signboard", hint: "Your website, so people can find you", color: "hsl(var(--lime))", re: null, to: "/websites" },
  { id: "counter", name: "Counter", hint: "Bills for your customers", color: "hsl(var(--sun))", re: /invoice/i },
  { id: "photo", name: "Photos on the wall", hint: "Photos that forms accept", color: "hsl(var(--teal))", re: /passport/i },
  { id: "register", name: "Register", hint: "Staff and stock in one book", color: "hsl(var(--coral))", re: /attendance|stock/i },
  { id: "board", name: "Notice board", hint: "Posts that bring customers", color: "hsl(var(--pink))", re: /social post|post generator/i },
  { id: "cab", name: "Papers cabinet", hint: "Agreements and legal papers", color: "hsl(var(--sky))", re: /rent|agreement/i },
];

const ink = "hsl(var(--ink))";
function Shop({ on }: { on: Record<PartId, boolean> }) {
  const it = (id: PartId) => cn("transition-all duration-500 ease-out", on[id] ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0");
  const ph = (id: PartId) => cn("transition-opacity", on[id] ? "opacity-0" : "opacity-50");
  const sw = { stroke: ink, strokeWidth: 3 };
  return (
    <svg viewBox="0 0 320 210" role="img" aria-label="A small shop that fills up as you add parts" className="block h-auto w-full">
      <rect width="320" height="210" fill="hsl(var(--sky) / 0.45)" />
      <rect y="170" width="320" height="40" fill="hsl(var(--lime))" />
      <circle cx="285" cy="30" r="16" fill="hsl(var(--sun))" {...sw} />
      <rect x="30" y="52" width="260" height="120" fill="hsl(var(--cream))" {...sw} />
      <path d="M24 52h272l-14-26H38z" fill="hsl(var(--card))" {...sw} />
      <g fill="hsl(var(--coral))">
        {[40, 84, 128, 172, 216].map((x) => <path key={x} d={`M${x} 28h22l-3 24H${x - 4}z`} />)}
      </g>
      <rect x="40" y="62" width="240" height="30" fill="none" stroke={ink} strokeWidth="2" strokeDasharray="6 5" className={ph("sign")} />
      <g className={it("sign")}><rect x="40" y="62" width="240" height="30" fill="hsl(var(--lime))" {...sw} /><text x="160" y="83" textAnchor="middle" fontFamily="Unbounded, sans-serif" fontWeight="800" fontSize="15" fill={ink}>AAPKI DUKAAN</text></g>
      <rect x="46" y="104" width="52" height="34" fill="none" stroke={ink} strokeWidth="2" strokeDasharray="6 5" className={ph("photo")} />
      <g className={it("photo")}><rect x="46" y="104" width="24" height="30" fill="hsl(var(--teal))" {...sw} /><circle cx="58" cy="116" r="5" fill="hsl(var(--cream))" /><rect x="74" y="108" width="24" height="30" fill="hsl(var(--sky))" {...sw} /><circle cx="86" cy="120" r="5" fill="hsl(var(--cream))" /></g>
      <rect x="110" y="130" width="112" height="40" fill="none" stroke={ink} strokeWidth="2" strokeDasharray="6 5" className={ph("counter")} />
      <g className={it("counter")}><rect x="108" y="130" width="114" height="42" fill="hsl(var(--sun))" {...sw} /><rect x="132" y="118" width="30" height="14" fill="hsl(var(--card))" stroke={ink} strokeWidth="2" /><path d="M137 123h20M137 127h14" stroke={ink} strokeWidth="2" /></g>
      <rect x="228" y="102" width="52" height="36" fill="none" stroke={ink} strokeWidth="2" strokeDasharray="6 5" className={ph("board")} />
      <g className={it("board")}><rect x="228" y="102" width="54" height="38" fill="hsl(var(--pink))" {...sw} /><circle cx="240" cy="114" r="3" fill={ink} /><circle cx="262" cy="112" r="3" fill={ink} /><path d="M236 126h38" stroke={ink} strokeWidth="3" /></g>
      <rect x="230" y="146" width="48" height="24" fill="none" stroke={ink} strokeWidth="2" strokeDasharray="6 5" className={ph("register")} />
      <g className={it("register")}><rect x="230" y="148" width="48" height="22" fill="hsl(var(--coral))" {...sw} /><path d="M238 148v22" stroke="hsl(var(--sun))" strokeWidth="3" /></g>
      <rect x="46" y="140" width="44" height="30" fill="none" stroke={ink} strokeWidth="2" strokeDasharray="6 5" className={ph("cab")} />
      <g className={it("cab")}><rect x="46" y="138" width="46" height="34" fill="hsl(var(--sand))" {...sw} /><path d="M69 138v34" stroke={ink} strokeWidth="2" /><circle cx="64" cy="156" r="2.5" fill={ink} /><circle cx="74" cy="156" r="2.5" fill={ink} /></g>
    </svg>
  );
}

const FEATURES: Feature[] = [
  { title: "Parts switch on by themselves", line: "Using an app for the first time lights up its part in the shop, so nobody ticks anything. Reads the person's own run history.", needs: "Needs sign-in data" },
  { title: "Real name on the signboard", line: "The signboard shows the person's own business name once they add it, and links to their live website.", needs: "Needs sign-in data" },
  { title: "More parts as the shop grows", line: "Shutter, fan, shelves, a second counter: each is an app or a set of apps, so the picture can keep growing.", needs: "Needs new content" },
  { title: "Next-part nudge", line: "A line under the shop says what to add next and which app builds it, in the order small shops usually grow.", needs: "Design only" },
  { title: "Share a picture of my shop", line: "One tap makes a picture of the finished shop to post on WhatsApp or Instagram.", needs: "Design only" },
  { title: "Saved across phones", line: "The shop is kept with the account so it looks the same on every device.", needs: "Needs a database change" },
];

export default function MeriDukaan() {
  const { live, costOf } = useDesignData();
  const [on, setOn] = useState<Record<PartId, boolean>>({ sign: false, counter: false, photo: false, register: false, board: false, cab: false });
  useEffect(() => {
    try { const s = JSON.parse(localStorage.getItem(KEY) ?? "null"); if (s) setOn((o) => ({ ...o, ...s })); } catch { /* ignore */ }
  }, []);
  const toggle = (id: PartId) => setOn((o) => { const n = { ...o, [id]: !o[id] }; try { localStorage.setItem(KEY, JSON.stringify(n)); } catch { /* ignore */ } return n; });
  const count = Object.values(on).filter(Boolean).length;
  const apps = useMemo(() => Object.fromEntries(PARTS.map((p) => [p.id, p.re ? findApp(live, p.re) : undefined])), [live]);
  const next = PARTS.find((p) => !on[p.id]);
  return (
    <div className="min-h-screen bg-background">
      <BazaarHeader />
      <section className="mx-auto grid max-w-6xl items-start gap-8 px-4 py-10 md:grid-cols-[1.1fr_1fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Meri dukaan</p>
          <h1 className="mt-2 font-display text-4xl font-extrabold leading-[1.05] md:text-5xl">Build your shop,<br /><span className="marker">one app at a time.</span></h1>
          <p className="mt-4 max-w-lg text-[18px] text-muted-foreground">Every app you use adds something to your shop. Add a counter for bills, photos on the wall, a signboard for your website. Fill all six and your shop is ready.</p>
          <div className="block-card mt-6 overflow-hidden bg-card">
            <div className="flex items-center justify-between border-b-2 border-ink px-4 py-2.5 font-display text-sm font-bold"><span>Meri dukaan</span><span className="text-[12px] font-semibold text-muted-foreground">{count} of 6 ready</span></div>
            <Shop on={on} />
            <div className="mx-4 my-3 h-4 overflow-hidden rounded-full border-2 border-ink bg-card"><div className="h-full bg-lime transition-all duration-500" style={{ width: `${(count / 6) * 100}%` }} /></div>
            <p className="px-4 pb-4 text-[15px] font-semibold" aria-live="polite">
              {count === 6 ? "Poori dukaan taiyaar. Shubh labh!" : next ? `Next: ${next.name.toLowerCase()}. ${next.hint}.` : ""}
            </p>
          </div>
        </div>
        <div>
          <h2 className="font-display text-lg font-bold">What is in your shop?</h2>
          <p className="text-[15px] text-muted-foreground">Tick a part to add it. (In the real version, using the app does this for you.)</p>
          <ul className="mt-4 grid gap-3">
            {PARTS.map((p) => {
              const app = apps[p.id];
              return (
                <li key={p.id} className="flex items-stretch gap-2">
                  <button type="button" onClick={() => toggle(p.id)} aria-pressed={on[p.id]} className="flex flex-1 items-center gap-3 rounded-xl border-2 border-ink p-3 text-left" style={{ background: on[p.id] ? p.color : "hsl(var(--card))", boxShadow: on[p.id] ? "var(--shadow-block-sm)" : undefined }}>
                    <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-ink", on[p.id] ? "bg-card" : "bg-background")}>{on[p.id] && <Check className="h-4 w-4" aria-hidden />}</span>
                    <span><span className="block font-display text-[15px] font-bold">{p.name}</span><span className="block text-[14px] text-muted-foreground">{p.hint}</span></span>
                  </button>
                  <Link to={p.to ?? (app ? `/promo/${app.id}` : "/ai-apps")} className="flex w-[118px] shrink-0 flex-col justify-center rounded-xl border-2 border-ink bg-background px-2 text-center text-[12px] font-semibold hover:bg-secondary">
                    <span className="line-clamp-2">{app ? app.name : "Websites"}</span>
                    <span className="text-muted-foreground">{app ? creditsLabel(costOf(app.id)) : "Pay once"}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
      <FeaturePanel title="Meri Dukaan" features={FEATURES} />
      <GateBand />
    </div>
  );
}
