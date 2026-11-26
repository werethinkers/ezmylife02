/* /business: say what your business is, answer five questions, and your one-tab business app is ready. */

import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Check, HardDrive, Search } from "lucide-react";
import { ModernPage } from "@/components/modern/ModernPage";
import { CONTAINER } from "@/components/modern/styles";
import { PageSeo } from "@/components/seo/PageSeo";
import { seoFor } from "@/lib/seo/pages";
import { APP_COUNT_FALLBACK } from "@/lib/appCount";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { BusinessProvider, useBusiness } from "@/business/useBusiness";
import { BIZ_TYPES, type BizType, type SectorId, compositionRateFor, defaultGstMode, labelsFor, modulesFor, searchTypes, SECTORS, sectorOf, sizeOf } from "@/business/catalog";
import { setupWorkspace } from "@/business/engine";
import { STATES, validGstin } from "@/business/gst";
import type { GstMode } from "@/business/types";
import { Choice, Field, Input, selectCls, softBorder, UNBOUNDED } from "./ui";
import { MODULE_NAMES } from "./modules";

export default function BusinessHomePage() {
  return (
    <BusinessProvider>
      <PageSeo {...seoFor("/business", APP_COUNT_FALLBACK)} />
      <ModernPage section="apps">
        <BusinessHome />
      </ModernPage>
    </BusinessProvider>
  );
}

const POPULAR = ["bakery", "kirana-store", "sabzi-thela", "salon", "tiffin-service", "clinic", "mobile-repair-shop", "home-tutor", "boutique", "electrician", "cafe", "app-startup"];
const QUICK_CHIPS: [string, string][] = [["Bakery", "bakery"], ["Kirana", "kirana-store"], ["Salon", "salon"], ["Tiffin", "tiffin-service"], ["Clinic", "clinic"], ["CA", "ca-practice"]];
/** A small, repeating set of accent glows for the dark "Popular to start with" cards — not tied to any one sector, just visual variety. */
const GLOWS = ["#34D399", "#F472D0", "#60A5FA", "#FBBF24", "#A78BFA"];
const glowFor = (sector: SectorId) => GLOWS[Math.abs(SECTORS.findIndex((s) => s.id === sector)) % GLOWS.length];
/** A real photo for the 12 "Popular to start with" cards (public/business-types/<id>.webp); falls back to a plain dark gradient when a type has none. */
const CARD_IMAGE: Partial<Record<string, string>> = Object.fromEntries(POPULAR.map((id) => [id, `/business-types/${id}.webp`]));

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center rounded-full border border-[#111111]/80 bg-[#C8E967] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#111111] dark:border-white/20">{children}</span>;
}

function BusinessHome() {
  const { ready, workspaces } = useBusiness();
  const [params] = useSearchParams();
  const [picked, setPicked] = useState<BizType | null>(null);
  const fresh = params.get("new") === "1";
  if (picked) return <Setup t={picked} onBack={() => setPicked(null)} />;
  return (
    <main className="bg-[#FAF7F2] dark:bg-[#0D0D0F]">
      <header className={cn(CONTAINER, "relative pt-10 md:pt-16")}>
        <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-10 -z-10 h-80 bg-[radial-gradient(ellipse_60%_60%_at_50%_0%,rgba(250,204,21,0.14),rgba(244,114,208,0.08)_45%,transparent_75%)] dark:bg-[radial-gradient(ellipse_60%_60%_at_50%_0%,rgba(250,204,21,0.08),rgba(244,114,208,0.05)_45%,transparent_75%)]" />
        <Eyebrow>My business · Free to start</Eyebrow>
        <h1 style={UNBOUNDED} className="mt-4 max-w-3xl text-3xl font-bold leading-tight tracking-tight text-[#111111] dark:text-white md:text-5xl">
          Your whole business, <span className="bg-gradient-to-r from-[#F472D0] via-[#FB923C] to-[#FACC15] bg-clip-text text-transparent">in one tab.</span>
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-muted-foreground">Enter an order once. The bill, the advance, stock, your books, GST and the customer's reminders are done by themselves. Free to use; no AI setup, no accountant needed to start.</p>

        {ready && workspaces.length > 0 && !fresh && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-[#18181B] to-[#111111] px-5 py-3.5 text-white">
            <p className="text-sm text-white/70">Continue with <span style={UNBOUNDED} className="font-bold text-white">{workspaces[0].name}</span></p>
            <div className="flex flex-wrap gap-2">
              <Link to="/business/app" className="inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-[#111111] bg-[#F472D0] px-4 py-1.5 text-sm font-semibold text-[#111111] transition-transform hover:-translate-y-0.5">
                Open {workspaces[0].name} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/business?new=1" className="inline-flex items-center rounded-full border border-white/25 px-4 py-1.5 text-sm font-semibold text-white/90 transition hover:bg-white/10">+ Add another business</Link>
            </div>
          </div>
        )}

        <TypeSearch onPick={setPicked} />
      </header>

      <section className={cn(CONTAINER, "py-10")}>
        <Eyebrow>Popular to start with</Eyebrow>
        <h2 style={UNBOUNDED} className="mt-3 text-2xl font-bold">Popular to start with</h2>
        <p className="mt-1 text-muted-foreground">Twelve businesses people set up most often.</p>

        <div className="-mx-4 mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 sm:hidden">
          {POPULAR.map((id) => BIZ_TYPES.find((t) => t.id === id)).filter(Boolean).map((t) => (
            <div key={t!.id} className="w-[72vw] shrink-0 snap-start"><TypeCard t={t!} onPick={setPicked} /></div>
          ))}
        </div>
        <div className="mt-4 hidden gap-3 sm:grid sm:grid-cols-3 lg:grid-cols-4">
          {POPULAR.map((id) => BIZ_TYPES.find((t) => t.id === id)).filter(Boolean).map((t) => <TypeCard key={t!.id} t={t!} onPick={setPicked} />)}
        </div>
        <a href="/business-types/CREDITS.md" target="_blank" rel="noreferrer" className="mt-3 inline-block text-xs text-muted-foreground underline-offset-2 hover:underline">Photo credits</a>
      </section>

      <section className={cn(CONTAINER, "pb-10")}>
        <Eyebrow>How it works</Eyebrow>
        <h2 style={UNBOUNDED} className="mt-3 text-2xl font-bold">What one entry does</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-[#111111] p-5 text-white sm:p-6">
            <span className="inline-flex items-center rounded-full bg-[#F472D0] px-2 py-0.5 text-xs font-bold text-[#111111]">01</span>
            <h3 style={UNBOUNDED} className="mt-3 text-lg font-bold">Take an order</h3>
            <p className="mt-1 text-sm text-white/70">Customer saved, order numbered, bill made, advance recorded, flour and butter taken from stock, a pickup reminder set.</p>
          </div>
          <div className={cn("rounded-2xl bg-white p-5 dark:bg-[#16161A] sm:p-6", softBorder)}>
            <span className="inline-flex items-center rounded-full bg-[#C8E967] px-2 py-0.5 text-xs font-bold text-[#111111]">02</span>
            <h3 style={UNBOUNDED} className="mt-3 text-lg font-bold">Deliver it</h3>
            <p className="mt-1 text-sm text-muted-foreground">Money left to pay goes to dues, with polite WhatsApp reminders ready on day 3 and day 7. Paying stops them.</p>
          </div>
          <div className={cn("rounded-2xl bg-white p-5 dark:bg-[#16161A] sm:p-6", softBorder)}>
            <span className="inline-flex items-center rounded-full bg-[#C8E967] px-2 py-0.5 text-xs font-bold text-[#111111]">03</span>
            <h3 style={UNBOUNDED} className="mt-3 text-lg font-bold">See the month</h3>
            <p className="mt-1 text-sm text-muted-foreground">Cash book, profit, GST for the quarter or month, best sellers, staff pay, what is running low. Nothing typed twice.</p>
          </div>
        </div>
      </section>

      <section className={cn(CONTAINER, "pb-24")}>
        <Eyebrow>All {BIZ_TYPES.length} businesses</Eyebrow>
        <h2 style={UNBOUNDED} className="mt-3 text-2xl font-bold">All {BIZ_TYPES.length} businesses, by sector</h2>
        <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {SECTORS.map((sec) => (
            <a key={sec.id} href={`#sector-${sec.id}`} className={cn("shrink-0 rounded-full bg-white px-3.5 py-1.5 text-sm font-semibold transition-colors hover:border-[#111111] dark:bg-[#16161A] dark:hover:border-white/40", softBorder)}>
              {sec.name}
            </a>
          ))}
        </div>
        <div className="mt-4 space-y-4">
          {SECTORS.map((sec) => {
            const types = BIZ_TYPES.filter((t) => t.sector === sec.id);
            if (!types.length) return null;
            return (
              <div key={sec.id} id={`sector-${sec.id}`} className={cn("rounded-2xl bg-white p-4 dark:bg-[#16161A] sm:p-5", softBorder)}>
                <h3 className="mb-3 flex items-center gap-2 font-bold"><span aria-hidden className={cn("h-2 w-2 shrink-0 rounded-full", sec.colour)} />{sec.name}</h3>
                <div className="flex flex-wrap gap-2">
                  {types.map((t) => (
                    <button key={t.id} type="button" onClick={() => setPicked(t)} className="rounded-full border border-black/12 bg-white px-3.5 py-1.5 text-sm transition-colors hover:border-[#111111] hover:bg-[#111111] hover:text-white dark:border-white/12 dark:bg-[#16161A] dark:hover:border-white dark:hover:bg-white dark:hover:text-[#111111]">
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}

function TypeSearch({ onPick }: { onPick: (t: BizType) => void }) {
  const [q, setQ] = useState("");
  const hits = useMemo(() => searchTypes(q, 8), [q]);
  return (
    <div className="mt-6 max-w-2xl">
      <label htmlFor="biz-q" className="font-bold">What is your business?</label>
      <div className="relative mt-2">
        <div className={cn("flex items-center gap-1.5 rounded-full bg-white p-1.5 dark:bg-[#16161A]", "border-[1.5px] border-[#111111] shadow-[4px_4px_0_#111111] dark:border-white/80")}>
          <Search className="ml-2.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
          <input
            id="biz-q"
            className="min-w-0 flex-1 bg-transparent px-1 py-2.5 text-base placeholder:text-muted-foreground focus:outline-none"
            placeholder="bakery, kirana, salon, tuition, sabzi, CA…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoComplete="off"
          />
          <button type="button" onClick={() => { if (hits[0]) onPick(hits[0]); }} className="shrink-0 rounded-full bg-[#F472D0] px-5 py-2 text-sm font-semibold text-[#111111] transition hover:brightness-95">Find</button>
        </div>
        {q.trim().length >= 3 && (
          <ul className={cn("absolute z-20 mt-1 w-full overflow-hidden rounded-2xl bg-white shadow-lg dark:bg-[#16161A]", softBorder)}>
            {hits.length ? hits.map((t) => (
              <li key={t.id}><button type="button" onClick={() => onPick(t)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-black/[0.04] dark:hover:bg-white/5">
                <span><b>{t.name}</b> <span className="text-sm text-muted-foreground">{t.local}</span><span className="block text-sm text-muted-foreground">{t.jobs[0]}</span></span><ArrowRight className="h-5 w-5 shrink-0" />
              </button></li>
            )) : <li className="px-4 py-3 text-sm">No match. Pick the closest one below; you can rename everything later.</li>}
          </ul>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">Quick search:</span>
        {QUICK_CHIPS.map(([label, id]) => (
          <button key={id} type="button" onClick={() => { const t = BIZ_TYPES.find((x) => x.id === id); if (t) onPick(t); }} className={cn("rounded-full bg-white px-3 py-1 text-xs font-semibold transition-colors hover:border-[#111111] dark:bg-[#16161A] dark:hover:border-white/40", softBorder)}>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function TypeCard({ t, onPick }: { t: BizType; onPick: (t: BizType) => void }) {
  const sector = sectorOf(t.sector);
  const image = CARD_IMAGE[t.id];
  return (
    <button type="button" onClick={() => onPick(t)} className="group relative flex aspect-[4/3] w-full flex-col justify-end overflow-hidden rounded-2xl p-4 text-left text-white transition-transform hover:-translate-y-0.5">
      {image ? (
        <img src={image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
      ) : (
        <>
          <span aria-hidden className="absolute inset-0 bg-gradient-to-br from-[#1A1A1F] to-[#111111]" />
          <span aria-hidden className="pointer-events-none absolute -right-6 -top-10 h-28 w-28 rounded-full opacity-25 blur-2xl transition-opacity group-hover:opacity-40" style={{ background: glowFor(t.sector) }} />
        </>
      )}
      <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/5" />
      <span className="relative inline-flex w-fit items-center rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/80 backdrop-blur-sm">{sector.name}</span>
      <p style={UNBOUNDED} className="relative mt-2.5 text-base font-bold leading-snug">{t.name}</p>
      <p className="relative text-xs text-white/60">{t.local}</p>
      <p className="relative mt-1.5 line-clamp-1 text-xs text-white/80">{t.jobs[0]}</p>
      <span className="relative mt-3 inline-flex w-fit items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#111111] transition-transform group-hover:translate-x-0.5">Start <ArrowRight className="h-3 w-3" /></span>
    </button>
  );
}

const GST_TEXT: Record<GstMode, string> = {
  none: "Not registered for GST. Most small and street businesses.",
  composition: "Composition: you pay a small flat rate on sales every quarter and charge no GST on bills.",
  regular: "Regular GST: GST on every bill, input credit on purchases, monthly returns.",
};

function Setup({ t, onBack }: { t: BizType; onBack: () => void }) {
  const { create } = useBusiness();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [owner, setOwner] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("Indore");
  const [state, setState] = useState("Madhya Pradesh");
  const [gst, setGst] = useState<GstMode>(defaultGstMode(t));
  const [gstin, setGstin] = useState("");
  const [upi, setUpi] = useState("");
  const [examples, setExamples] = useState(true);
  const [busy, setBusy] = useState(false);
  const labels = labelsFor(t);
  const names = MODULE_NAMES({ labels } as never);
  const mods = modulesFor(t);
  const go = async () => {
    if (!name.trim()) return void toast.error("Enter your business name.");
    if (gst !== "none" && gstin && !validGstin(gstin)) return void toast.error("That GSTIN does not look right. Check it or leave it empty for now.");
    setBusy(true);
    try {
      await create(setupWorkspace(t, { name, owner_name: owner, phone, city, state, gst_mode: gst, gstin: gst === "none" ? undefined : gstin, upi_id: upi, with_examples: examples }));
      navigate("/business/app");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create it. Try again.");
      setBusy(false);
    }
  };
  return (
    <main className="mx-auto max-w-3xl bg-[#FAF7F2] px-4 py-8 pb-24 dark:bg-[#0D0D0F]">
      <button type="button" onClick={onBack} className={cn("rounded-full bg-white px-4 py-1.5 text-sm font-semibold transition-colors hover:border-[#111111] dark:bg-[#16161A] dark:hover:border-white/40", softBorder)}>← Pick another business</button>

      <div className="mt-4 rounded-2xl bg-gradient-to-br from-[#18181B] via-[#111111] to-[#1F1523] p-6 text-white">
        <span className="inline-flex items-center rounded-full bg-[#C8E967] px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-[#111111]">{sectorOf(t.sector).name} · {sizeOf(t.size).name}</span>
        <h1 style={UNBOUNDED} className="mt-3 text-2xl font-bold">{t.name} <span className="text-lg font-normal text-white/60">{t.local}</span></h1>
        <p className="mt-3 text-sm font-semibold text-white/80">Ready for you:</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {mods.filter((m) => m !== "settings").map((m) => (
            <span key={m} className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/90"><Check className="h-3 w-3 text-[#C8E967]" />{names[m]}</span>
          ))}
        </div>
      </div>

      <form className="mt-6 space-y-5 rounded-2xl border-[1.5px] border-[#111111] bg-white p-5 shadow-[4px_4px_0_#111111] dark:bg-[#16161A] sm:p-8" onSubmit={(e) => { e.preventDefault(); void go(); }}>
        <h2 style={UNBOUNDED} className="text-xl font-bold">A few details</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Business name"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Sweet Crumbs Bakery" autoFocus /></Field>
          <Field label="Your name"><Input value={owner} onChange={(e) => setOwner(e.target.value)} /></Field>
          <Field label="Business phone" hint="Printed on bills and messages"><Input value={phone} inputMode="tel" onChange={(e) => setPhone(e.target.value)} /></Field>
          <Field label="City"><Input value={city} onChange={(e) => setCity(e.target.value)} /></Field>
          <Field label="State"><select className={selectCls} value={state} onChange={(e) => setState(e.target.value)}>{STATES.map((x) => <option key={x}>{x}</option>)}</select></Field>
          <Field label="UPI ID (optional)" hint="Adds a pay QR to unpaid bills"><Input value={upi} onChange={(e) => setUpi(e.target.value)} placeholder="name@bank" /></Field>
        </div>
        <Field group label="GST">
          <Choice value={gst} onChange={setGst} options={[["none", "Not registered"], ["composition", "Composition"], ["regular", "Regular"]]} />
          <p className="mt-2 text-sm">{GST_TEXT[gst]}{gst === "composition" ? ` For a ${t.name.toLowerCase()} the rate is ${compositionRateFor(t)}%.` : ""} Not sure? Keep the suggestion; you can change it in Settings.</p>
        </Field>
        {gst !== "none" && <Field label="GSTIN (can add later)"><Input value={gstin} onChange={(e) => setGstin(e.target.value.toUpperCase())} /></Field>}
        <label className="flex items-center gap-3 font-semibold">
          <Switch checked={examples} onCheckedChange={setExamples} className="data-[state=checked]:bg-[#F472D0]" /> Start with example {labels.products.toLowerCase()} and prices (you edit them)
        </label>
        {!user && (
          <p className="flex items-start gap-2 rounded-xl border border-dashed border-black/15 bg-[#FAF7F2] p-3.5 text-sm dark:border-white/15 dark:bg-white/5">
            <HardDrive className="mt-0.5 h-4 w-4 shrink-0" /><span>You are not signed in, so this is saved on this device only. <Link to="/auth" state={{ from: "/business" }} className="font-semibold underline">Sign in</Link> to keep it safe, use it on any phone, and put your website live. You can move it to your account later.</span>
          </p>
        )}
        <button type="submit" disabled={busy} className="inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-[#111111] bg-[#F472D0] px-6 py-3 text-base font-semibold text-[#111111] shadow-[3px_3px_0_#111111] transition-transform hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-50">
          {busy ? "Setting up…" : "Open my business"} <ArrowRight className="h-4 w-4" />
        </button>
      </form>
    </main>
  );
}
