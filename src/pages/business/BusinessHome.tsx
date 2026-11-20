/* /business: say what your business is, answer five questions, and your one-tab business app is ready. */

import { useMemo, useState, useRef, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowRight, ArrowLeft, Check, HardDrive, Search, Building2,
  MapPin, IndianRupee, FileText, X, ChevronRight,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import SEOFooter from "@/components/SEOFooter";
import { PageSeo } from "@/components/seo/PageSeo";
import { seoFor } from "@/lib/seo/pages";
import { APP_COUNT_FALLBACK } from "@/lib/appCount";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { BusinessProvider, useBusiness } from "@/business/useBusiness";
import {
  BIZ_TYPES, type BizType, compositionRateFor, defaultGstMode,
  labelsFor, modulesFor, searchTypes, SECTORS, sectorOf, sizeOf,
} from "@/business/catalog";
import { setupWorkspace } from "@/business/engine";
import { STATES, validGstin } from "@/business/gst";
import type { GstMode } from "@/business/types";
import { Choice, Field, selectCls } from "./ui";
import { MODULE_NAMES } from "./modules";
import { ScrollRow } from "@/components/ui/scroll-row";

export default function BusinessHomePage() {
  return (
    <BusinessProvider>
      <PageSeo {...seoFor("/business", APP_COUNT_FALLBACK)} />
      <div className="min-h-screen bg-background">
        <Navbar />
        <BusinessHome />
        <SEOFooter />
      </div>
    </BusinessProvider>
  );
}

const POPULAR = [
  "bakery", "kirana-store", "sabzi-thela", "salon", "tiffin-service",
  "clinic", "mobile-repair-shop", "home-tutor", "boutique", "electrician", "cafe", "app-startup",
];

function BusinessHome() {
  const { ready, workspaces } = useBusiness();
  const [params] = useSearchParams();
  const [picked, setPicked] = useState<BizType | null>(null);
  const fresh = params.get("new") === "1";
  if (picked) return <Setup t={picked} onBack={() => setPicked(null)} />;
  return (
    <main>
      <header className="mx-auto max-w-6xl px-4 pt-8 md:pt-12">
        <div className="rounded-[2rem] border-2 border-ink bg-sun p-6 shadow-block-lg md:p-10">
          <p className="text-sm font-bold uppercase tracking-wider">My Business</p>
          <h1 className="mt-2 max-w-3xl font-display text-3xl font-bold leading-tight tracking-tight md:text-5xl">
            Your whole business, in one tab
          </h1>
          <p className="mt-3 max-w-2xl text-lg">
            Enter an order once. The bill, the advance, stock, your books, GST and the customer's reminders are done by themselves.
            Free to use; no AI setup, no accountant needed to start.
          </p>
          {ready && workspaces.length > 0 && !fresh && (
            <div className="mt-5 flex flex-wrap gap-2">
              <Button asChild size="lg">
                <Link to="/business/app">Open {workspaces[0].name} <ArrowRight /></Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/business?new=1">Add another business</Link>
              </Button>
            </div>
          )}
          <TypeSearch onPick={setPicked} />
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <h2 className="font-display text-2xl font-bold">Popular to start with</h2>
        <ScrollRow size="app" className="mt-4" label="Popular business types">
          {POPULAR.map((id) => BIZ_TYPES.find((t) => t.id === id))
            .filter(Boolean)
            .map((t) => <TypeCard key={t!.id} t={t!} onPick={setPicked} />)}
        </ScrollRow>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-10">
        <h2 className="font-display text-2xl font-bold">What one entry does</h2>
        <ScrollRow size="wide" className="mt-4">
          {[
            ["bg-pink", "Take an order", "Customer saved, order numbered, bill made, advance recorded, flour and butter taken from stock, a pickup reminder set."],
            ["bg-lime", "Deliver it", "Money left to pay goes to dues, with polite WhatsApp reminders ready on day 3 and day 7. Paying stops them."],
            ["bg-sky", "See the month", "Cash book, profit, GST for the quarter or month, best sellers, staff pay, what is running low. Nothing typed twice."],
          ].map(([tone, h, p]) => (
            <div key={h as string} className={cn("rounded-2xl border-2 border-ink p-5 shadow-block-sm", tone)}>
              <h3 className="font-display text-lg font-bold">{h}</h3>
              <p className="mt-1">{p}</p>
            </div>
          ))}
        </ScrollRow>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <h2 className="font-display text-2xl font-bold">All {BIZ_TYPES.length} businesses, by sector</h2>
        <div className="mt-4 space-y-6">
          {SECTORS.map((sec) => {
            const types = BIZ_TYPES.filter((t) => t.sector === sec.id);
            if (!types.length) return null;
            return (
              <div key={sec.id}>
                <h3 className="mb-2 font-bold">{sec.name}</h3>
                <div className="flex flex-wrap gap-2">
                  {types.map((t) => (
                    <button key={t.id} type="button" onClick={() => setPicked(t)}
                      className={cn("rounded-full border-2 border-ink px-3 py-1.5 text-sm font-semibold hover:-translate-y-0.5 transition-transform", sec.colour)}>
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
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [cursor, setCursor] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const hits = useMemo(() => searchTypes(q, 8), [q]);
  const showDropdown = focused && q.trim().length >= 2;

  const pick = (t: BizType) => {
    onPick(t);
    setQ("");
    setOpen(false);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (!showDropdown) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setCursor((c) => Math.min(c + 1, hits.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)); }
    else if (e.key === "Enter" && cursor >= 0 && hits[cursor]) { e.preventDefault(); pick(hits[cursor]); }
    else if (e.key === "Escape") { setQ(""); setOpen(false); }
  };

  useEffect(() => { setCursor(-1); }, [q]);

  return (
    <div className="mt-6 max-w-2xl">
      <label htmlFor="biz-q" className="font-bold">What is your business?</label>
      <div className="relative mt-2">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink/60" />
        <Input
          ref={inputRef}
          id="biz-q"
          className="h-14 rounded-2xl border-2 border-ink pl-12 pr-10 text-lg shadow-block-sm focus-visible:ring-2"
          placeholder="bakery, kirana, salon, tuition, sabzi, CA…"
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => { setFocused(true); setOpen(true); }}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onKeyDown={handleKey}
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={showDropdown && hits.length > 0}
        />
        {q && (
          <button type="button" onClick={() => { setQ(""); inputRef.current?.focus(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-ink/50 hover:text-ink transition-colors">
            <X className="h-4 w-4" />
          </button>
        )}
        {showDropdown && open && (
          <ul ref={listRef} className="absolute z-10 mt-1 w-full overflow-hidden rounded-2xl border-2 border-ink bg-card shadow-block"
            role="listbox" aria-label="Business type suggestions">
            {hits.length ? hits.map((t, i) => (
              <li key={t.id} role="option" aria-selected={i === cursor}>
                <button type="button"
                  onClick={() => pick(t)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors",
                    i === cursor ? "bg-sun" : "hover:bg-sun/60"
                  )}>
                  <span>
                    <b className="font-semibold">{t.name}</b>{" "}
                    <span className="text-sm text-muted-foreground">{t.local}</span>
                    <span className="block text-sm text-muted-foreground">{t.jobs[0]}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              </li>
            )) : (
              <li className="px-4 py-4 text-sm text-muted-foreground">
                No exact match — pick the closest one below; you can rename everything later.
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}

function TypeCard({ t, onPick }: { t: BizType; onPick: (t: BizType) => void }) {
  const sec = sectorOf(t.sector);
  return (
    <button type="button" onClick={() => onPick(t)}
      className={cn(
        "block-lift group rounded-2xl border-2 border-ink p-4 text-left shadow-block-sm transition-all hover:-translate-y-0.5 hover:shadow-block",
        sec.colour
      )}>
      <p className="font-display font-bold group-hover:underline">{t.name}</p>
      <p className="text-sm">{t.local}</p>
      <p className="mt-1 text-xs text-ink/70">{t.jobs[0]}</p>
    </button>
  );
}

/* ─── Setup Wizard ───────────────────────────────────────────────────────────── */

const WIZARD_STEPS = [
  { id: 1, title: "Business",  icon: Building2 },
  { id: 2, title: "Location",  icon: MapPin },
  { id: 3, title: "GST & Pay", icon: IndianRupee },
  { id: 4, title: "Review",    icon: FileText },
] as const;

type WizardStep = typeof WIZARD_STEPS[number]["id"];

const GST_TEXT: Record<GstMode, string> = {
  none: "Not registered for GST. Most small and street businesses.",
  composition: "Composition: you pay a small flat rate on sales every quarter and charge no GST on bills.",
  regular: "Regular GST: GST on every bill, input credit on purchases, monthly returns.",
};

function Setup({ t, onBack }: { t: BizType; onBack: () => void }) {
  const { create } = useBusiness();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<WizardStep>(1);
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
  const sector = sectorOf(t.sector);
  const progress = (step / WIZARD_STEPS.length) * 100;

  const validateStep = (s: WizardStep): string | null => {
    if (s === 1 && !name.trim()) return "Enter your business name.";
    if (s === 3 && gst !== "none" && gstin && !validGstin(gstin)) return "That GSTIN does not look right. Check it or leave it empty for now.";
    return null;
  };

  const next = () => {
    const err = validateStep(step);
    if (err) { toast.error(err); return; }
    setStep((s) => Math.min(s + 1, 4) as WizardStep);
  };

  const back = () => setStep((s) => Math.max(s - 1, 1) as WizardStep);

  const finish = async () => {
    const err = validateStep(3);
    if (err) { toast.error(err); return; }
    setBusy(true);
    try {
      await create(setupWorkspace(t, {
        name, owner_name: owner, phone, city, state,
        gst_mode: gst, gstin: gst === "none" ? undefined : gstin,
        upi_id: upi, with_examples: examples,
      }));
      navigate("/business/app");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create it. Try again.");
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <button type="button" onClick={onBack}
        className="flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-ink transition-colors mb-5">
        <ArrowLeft className="h-4 w-4" /> Pick another business
      </button>

      {/* Business type badge */}
      <div className={cn("rounded-2xl border-2 border-ink p-4 shadow-block-sm mb-5", sector.colour)}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider">{sector.name} · {sizeOf(t.size).name}</p>
            <h1 className="font-display text-xl font-bold mt-0.5">{t.name} <span className="text-base font-normal">{t.local}</span></h1>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {mods.filter((m) => m !== "settings").map((m) => (
            <span key={m} className="inline-flex items-center gap-1 rounded-full border-2 border-ink bg-card/80 px-2.5 py-0.5 text-xs font-semibold">
              <Check className="h-3 w-3" />{names[m]}
            </span>
          ))}
        </div>
      </div>

      {/* Wizard card */}
      <div className="rounded-2xl border-2 border-ink bg-card shadow-block-sm overflow-hidden">
        {/* Progress header */}
        <div className="p-5 pb-4 border-b border-ink/10">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-muted-foreground">Setting up your business</p>
            <Badge variant="secondary">Step {step} of {WIZARD_STEPS.length}</Badge>
          </div>
          <Progress value={progress} className="h-1.5 mb-4" />
          <ol className="flex items-center justify-between">
            {WIZARD_STEPS.map((s) => {
              const active = s.id === step;
              const done = s.id < step;
              const Icon = s.icon;
              return (
                <li key={s.id} className="flex flex-1 justify-center">
                  <button
                    type="button"
                    onClick={() => s.id < step && setStep(s.id as WizardStep)}
                    disabled={s.id > step}
                    className={cn(
                      "flex flex-col items-center gap-1.5 cursor-default transition-opacity",
                      s.id < step && "cursor-pointer hover:opacity-70"
                    )}>
                    <span className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-medium transition-colors",
                      active && "border-ink bg-ink text-cream",
                      done && "border-lime bg-lime/40 text-ink",
                      !active && !done && "border-ink/30 bg-background text-muted-foreground"
                    )}>
                      {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    </span>
                    <span className={cn("text-[10px] font-semibold uppercase tracking-wide", active ? "text-ink" : "text-muted-foreground")}>
                      {s.title}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Step content */}
        <div className="p-5 min-h-[280px]">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="font-display text-lg font-bold">Name your business</h2>
                <p className="text-sm text-muted-foreground mt-0.5">This shows on bills, messages, and your website.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Business name">
                  <Input value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="Sweet Crumbs Bakery" autoFocus
                    className="border-2 border-ink rounded-xl h-11" />
                </Field>
                <Field label="Your name">
                  <Input value={owner} onChange={(e) => setOwner(e.target.value)}
                    placeholder="Your full name"
                    className="border-2 border-ink rounded-xl h-11" />
                </Field>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="font-display text-lg font-bold">Where are you based?</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Printed on bills and used for GST state calculations.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Business phone" hint="Printed on bills and WhatsApp messages">
                  <Input value={phone} inputMode="tel" onChange={(e) => setPhone(e.target.value)}
                    placeholder="10 digit mobile"
                    className="border-2 border-ink rounded-xl h-11" />
                </Field>
                <Field label="City">
                  <Input value={city} onChange={(e) => setCity(e.target.value)}
                    className="border-2 border-ink rounded-xl h-11" />
                </Field>
                <Field label="State">
                  <select className={cn(selectCls, "border-2 border-ink")} value={state} onChange={(e) => setState(e.target.value)}>
                    {STATES.map((x) => <option key={x}>{x}</option>)}
                  </select>
                </Field>
                <Field label="UPI ID (optional)" hint="Adds a pay QR to unpaid bills">
                  <Input value={upi} onChange={(e) => setUpi(e.target.value)}
                    placeholder="name@bank"
                    className="border-2 border-ink rounded-xl h-11" />
                </Field>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h2 className="font-display text-lg font-bold">Tax & setup</h2>
                <p className="text-sm text-muted-foreground mt-0.5">You can change any of this in Settings later.</p>
              </div>
              <Field group label="GST registration">
                <Choice value={gst} onChange={setGst}
                  options={[["none", "Not registered"], ["composition", "Composition"], ["regular", "Regular"]]} />
                <p className="mt-2 text-sm text-muted-foreground">
                  {GST_TEXT[gst]}
                  {gst === "composition" ? ` For a ${t.name.toLowerCase()} the rate is ${compositionRateFor(t)}%.` : ""}
                </p>
              </Field>
              {gst !== "none" && (
                <Field label="GSTIN (can add later)">
                  <Input value={gstin} onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    placeholder="22AAAAA0000A1Z5"
                    className="border-2 border-ink rounded-xl h-11" />
                </Field>
              )}
              <label className="flex items-center gap-3 font-semibold cursor-pointer">
                <Switch checked={examples} onCheckedChange={setExamples} />
                Start with example {labels.products.toLowerCase()} and prices
                <span className="font-normal text-sm text-muted-foreground">(you edit them)</span>
              </label>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h2 className="font-display text-lg font-bold">Ready to launch 🎉</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Check your details before we set everything up.</p>
              </div>
              <div className="rounded-xl border-2 border-ink/20 bg-muted/30 divide-y divide-ink/10 overflow-hidden">
                {[
                  ["Business", name || "—"],
                  ["Owner", owner || "—"],
                  ["Phone", phone || "—"],
                  ["City", `${city}, ${state}`],
                  ["UPI", upi || "Not added"],
                  ["GST", gst === "none" ? "Not registered" : gst === "composition" ? "Composition scheme" : "Regular GST"],
                  ...(gst !== "none" && gstin ? [["GSTIN", gstin]] : []),
                  ["Example data", examples ? "Yes" : "No"],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <span className="text-muted-foreground font-medium">{label}</span>
                    <span className="font-semibold truncate max-w-[55%] text-right">{value}</span>
                  </div>
                ))}
              </div>
              {!user && (
                <p className="flex items-start gap-2 rounded-xl bg-sand border-2 border-ink/20 p-3 text-sm">
                  <HardDrive className="mt-0.5 h-4 w-4 shrink-0 flex-shrink-0" />
                  <span>Not signed in — this will be saved on this device only. <Link to="/auth" state={{ from: "/business" }} className="font-semibold underline">Sign in</Link> to keep it safe and put your website live.</span>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer nav */}
        <div className="p-5 pt-0 flex items-center justify-between gap-3">
          <Button type="button" variant="outline" onClick={back} disabled={step === 1}
            className="border-2 border-ink rounded-xl">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          {step < 4 ? (
            <Button type="button" onClick={next} className="rounded-xl">
              Next <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="button" onClick={() => void finish()} disabled={busy} size="lg" className="rounded-xl">
              {busy ? "Setting up…" : "Open my business"} {!busy && <ArrowRight className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}
