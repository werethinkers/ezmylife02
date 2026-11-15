import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { findApp } from "./data";
import { creditsLabel, useDesignData } from "./useDesignData";
import { BazaarHeader, GateBand, TrustStrip } from "./components/BazaarChrome";
import { ShopkeeperSearch } from "./components/ShopkeeperSearch";
import { FeaturePanel, type Feature } from "./FeaturePanel";

/* Kya hua aaj: problem-first home. The troubles and steps are design copy; the apps are found in the live catalogue. */
type Trouble = { id: string; text: string; color: string; rot: number; steps: string[]; apps: RegExp[] };
const TROUBLES: Trouble[] = [
  { id: "paise", text: "Customer ne paise nahi diye", color: "hsl(var(--coral))", rot: -1.5, steps: ["Make a bill with the right amount and date.", "Send it to the customer.", "Keep a copy for your records."], apps: [/invoice/i, /quotation|estimate/i] },
  { id: "photo", text: "Form mein passport photo chahiye", color: "hsl(var(--teal))", rot: 1, steps: ["Take a selfie in front of a plain wall.", "Cut it to the exact size the form asks for.", "Print several on one sheet."], apps: [/passport/i, /background/i] },
  { id: "agreement", text: "Makaan malik ne agreement maanga", color: "hsl(var(--lime))", rot: -1, steps: ["Add names, rent and dates.", "Read the terms once.", "Download the agreement as a PDF."], apps: [/rent/i, /legal notice|notice/i] },
  { id: "salary", text: "Staff ki salary banani hai", color: "hsl(var(--sun))", rot: 1.5, steps: ["Add each person and their days.", "See the pay for the month.", "Make a salary slip for each."], apps: [/payroll|salary/i, /attendance/i] },
  { id: "website", text: "Dukaan ka koi website nahi", color: "hsl(var(--sky))", rot: -1, steps: ["Pick a design that looks like your shop.", "Add your name, area and WhatsApp.", "Go live. You pay once."], apps: [] },
  { id: "plan", text: "Bank ko business plan chahiye", color: "hsl(var(--pink))", rot: 1, steps: ["Answer a few questions about your shop.", "See the plan with real numbers.", "Edit it and download."], apps: [/business plan/i, /startup analy/i] },
];

const FEATURES: Feature[] = [
  { title: "One trouble a day on Instagram", line: "Each trouble becomes a post with its plan. The same words open the same plan on the site.", needs: "Design only" },
  { title: "Troubles that change with the season", line: "Diwali stock, GST dates, admission season, rent rush: the top row follows the calendar.", needs: "Needs new content" },
  { title: "Speak the trouble", line: "A microphone button for people who would rather say it in Hindi than type it.", needs: "Design only" },
  { title: "Say it in your own words", line: "A free line that matches what someone types to the nearest trouble, then to the nearest app.", needs: "Needs new content" },
  { title: "Real plans per trouble", line: "Each plan gets checked steps and the right app pre-filled with what the person already told us.", needs: "Needs new content" },
  { title: "Most tapped troubles", line: "The order of the cards follows what real visitors tap most. Counted without names.", needs: "Needs a database change" },
];

export default function KyaHua() {
  const { live, costOf } = useDesignData();
  const [id, setId] = useState<string | null>(null);
  const t = TROUBLES.find((x) => x.id === id);
  const found = useMemo(() => (t ? t.apps.map((re) => findApp(live, re)).filter(Boolean) : []), [t, live]);
  return (
    <div className="min-h-screen bg-background">
      <BazaarHeader />
      <section className="mx-auto max-w-5xl px-4 pb-6 pt-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">For small businesses in India</p>
        <h1 className="mt-2 font-display text-4xl font-extrabold leading-[1.05] md:text-6xl">Kya hua <span className="marker">aaj?</span></h1>
        <p className="mt-3 max-w-xl text-[18px] text-muted-foreground">Tell us what went wrong. We will show you what to do, step by step, with the right app.</p>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TROUBLES.map((x) => (
            <li key={x.id}>
              <button
                type="button"
                onClick={() => { setId(x.id); requestAnimationFrame(() => document.getElementById("plan")?.scrollIntoView({ behavior: "smooth", block: "nearest" })); }}
                aria-pressed={id === x.id}
                className="h-full w-full rounded-2xl border-[3px] border-ink p-5 text-left font-display text-[17px] font-bold leading-snug shadow-block transition-transform hover:!rotate-0 hover:-translate-y-1"
                style={{ background: x.color, transform: `rotate(${x.rot}deg)` }}
              >
                {x.text}
              </button>
            </li>
          ))}
        </ul>
        {t && (
          <div id="plan" className="block-card mt-8 scroll-mt-24 bg-card p-5 md:p-7">
            <h2 className="font-display text-xl font-bold md:text-2xl">{t.text}? Yeh karein.</h2>
            <ol className="mt-4 list-decimal space-y-2 pl-6 text-[17px]">{t.steps.map((s) => <li key={s}>{s}</li>)}</ol>
            <div className="mt-5 flex flex-wrap gap-3">
              {found.map((a) => (
                <Link key={a!.id} to={`/promo/${a!.id}`} className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-sun px-5 py-2 font-bold shadow-block-sm">
                  {a!.name} <span className="text-[13px] font-semibold">{creditsLabel(costOf(a!.id))}</span>
                </Link>
              ))}
              {t.apps.length === 0 && <Link to="/websites" className="rounded-full border-2 border-ink bg-teal px-5 py-2 font-bold shadow-block-sm">Pick a website design</Link>}
            </div>
          </div>
        )}
      </section>
      <section className="mx-auto max-w-3xl px-4 py-6">
        <h2 className="mb-3 font-display text-lg font-bold">Something else happened?</h2>
        <ShopkeeperSearch live={live} costOf={costOf} />
      </section>
      <FeaturePanel title="Kya hua aaj" features={FEATURES} />
      <TrustStrip />
      <GateBand />
    </div>
  );
}
