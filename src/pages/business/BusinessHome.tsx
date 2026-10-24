/* /business: say what your business is, answer five questions, and your one-tab business app is ready. */

import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Check, HardDrive, Search } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import SEOFooter from "@/components/SEOFooter";
import { PageSeo } from "@/components/seo/PageSeo";
import { seoFor } from "@/lib/seo/pages";
import { APP_COUNT_FALLBACK } from "@/lib/appCount";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { BusinessProvider, useBusiness } from "@/business/useBusiness";
import { BIZ_TYPES, type BizType, compositionRateFor, defaultGstMode, labelsFor, modulesFor, searchTypes, SECTORS, sectorOf, sizeOf } from "@/business/catalog";
import { setupWorkspace } from "@/business/engine";
import { STATES, validGstin } from "@/business/gst";
import type { GstMode } from "@/business/types";
import { Choice, Field, selectCls } from "./ui";
import { MODULE_NAMES } from "./modules";

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

const POPULAR = ["bakery", "kirana-store", "sabzi-thela", "salon", "tiffin-service", "clinic", "mobile-repair-shop", "home-tutor", "boutique", "electrician", "cafe", "app-startup"];

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
          <h1 className="mt-2 max-w-3xl font-display text-3xl font-bold leading-tight tracking-tight md:text-5xl">Your whole business, in one tab</h1>
          <p className="mt-3 max-w-2xl text-lg">Enter an order once. The bill, the advance, stock, your books, GST and the customer's reminders are done by themselves. Free to use; no AI setup, no accountant needed to start.</p>
          {ready && workspaces.length > 0 && !fresh && (
            <div className="mt-5 flex flex-wrap gap-2">
              <Button asChild size="lg"><Link to="/business/app">Open {workspaces[0].name} <ArrowRight /></Link></Button>
              <Button asChild size="lg" variant="outline"><Link to="/business?new=1">Add another business</Link></Button>
            </div>
          )}
          <TypeSearch onPick={setPicked} />
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <h2 className="font-display text-2xl font-bold">Popular to start with</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {POPULAR.map((id) => BIZ_TYPES.find((t) => t.id === id)).filter(Boolean).map((t) => <TypeCard key={t!.id} t={t!} onPick={setPicked} />)}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-10">
        <h2 className="font-display text-2xl font-bold">What one entry does</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[
            ["bg-pink", "Take an order", "Customer saved, order numbered, bill made, advance recorded, flour and butter taken from stock, a pickup reminder set."],
            ["bg-lime", "Deliver it", "Money left to pay goes to dues, with polite WhatsApp reminders ready on day 3 and day 7. Paying stops them."],
            ["bg-sky", "See the month", "Cash book, profit, GST for the quarter or month, best sellers, staff pay, what is running low. Nothing typed twice."],
          ].map(([tone, h, p]) => (
            <div key={h} className={cn("rounded-2xl border-2 border-ink p-5 shadow-block-sm", tone)}><h3 className="font-display text-lg font-bold">{h}</h3><p className="mt-1">{p}</p></div>
          ))}
        </div>
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
                  {types.map((t) => <button key={t.id} type="button" onClick={() => setPicked(t)} className={cn("rounded-full border-2 border-ink px-3 py-1.5 text-sm font-semibold hover:-translate-y-0.5", sec.colour)}>{t.name}</button>)}
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
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2" />
        <Input id="biz-q" className="h-14 rounded-2xl pl-12 text-lg" placeholder="bakery, kirana, salon, tuition, sabzi, CA…" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
      </div>
      {q.trim().length >= 3 && (
        <ul className="mt-2 overflow-hidden rounded-2xl border-2 border-ink bg-card">
          {hits.length ? hits.map((t) => (
            <li key={t.id}><button type="button" onClick={() => onPick(t)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-sun">
              <span><b>{t.name}</b> <span className="text-sm text-muted-foreground">{t.local}</span><span className="block text-sm">{t.jobs[0]}</span></span><ArrowRight className="h-5 w-5 shrink-0" />
            </button></li>
          )) : <li className="px-4 py-3 text-sm">No match. Pick the closest one below; you can rename everything later.</li>}
        </ul>
      )}
    </div>
  );
}

function TypeCard({ t, onPick }: { t: BizType; onPick: (t: BizType) => void }) {
  return (
    <button type="button" onClick={() => onPick(t)} className={cn("block-lift rounded-2xl border-2 border-ink p-4 text-left shadow-block-sm", sectorOf(t.sector).colour)}>
      <p className="font-display font-bold">{t.name}</p>
      <p className="text-sm">{t.local}</p>
      <p className="mt-1 text-xs">{t.jobs[0]}</p>
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
    <main className="mx-auto max-w-3xl px-4 py-8">
      <button type="button" onClick={onBack} className="text-sm font-semibold underline">← Pick another business</button>
      <div className={cn("mt-3 rounded-2xl border-2 border-ink p-5 shadow-block-sm", sectorOf(t.sector).colour)}>
        <p className="text-xs font-bold uppercase tracking-wider">{sectorOf(t.sector).name} · {sizeOf(t.size).name}</p>
        <h1 className="font-display text-2xl font-bold">{t.name} <span className="text-lg font-normal">{t.local}</span></h1>
        <p className="mt-2 text-sm font-semibold">Ready for you:</p>
        <div className="mt-1 flex flex-wrap gap-1.5">{mods.filter((m) => m !== "settings").map((m) => <span key={m} className="inline-flex items-center gap-1 rounded-full border-2 border-ink bg-card px-2.5 py-0.5 text-xs font-semibold"><Check className="h-3 w-3" />{names[m]}</span>)}</div>
      </div>

      <form className="mt-6 space-y-5 rounded-2xl border-2 border-ink bg-card p-5 shadow-block-sm" onSubmit={(e) => { e.preventDefault(); void go(); }}>
        <h2 className="font-display text-xl font-bold">A few details</h2>
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
        <label className="flex items-center gap-3 font-semibold"><Switch checked={examples} onCheckedChange={setExamples} /> Start with example {labels.products.toLowerCase()} and prices (you edit them)</label>
        {!user && <p className="flex items-start gap-2 rounded-xl bg-sand p-3 text-sm"><HardDrive className="mt-0.5 h-4 w-4 shrink-0" /><span>You are not signed in, so this is saved on this device only. <Link to="/auth" state={{ from: "/business" }} className="font-semibold underline">Sign in</Link> to keep it safe, use it on any phone, and put your website live. You can move it to your account later.</span></p>}
        <Button type="submit" size="lg" disabled={busy}>{busy ? "Setting up…" : "Open my business"} <ArrowRight /></Button>
      </form>
    </main>
  );
}
