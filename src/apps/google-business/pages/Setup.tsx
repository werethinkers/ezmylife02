import { Link, NavLink, Outlet, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { gb } from "../lib/business";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, ClipboardPaste, Plus, Trash2 } from "lucide-react";
import { AppHeader } from "../components/AppHeader";
import { useCredits } from "@/hooks/useCredits";
import { BuyCreditsDialog } from "@/components/wallet/BuyCreditsDialog";
import LoginPromptDialog from "@/components/auth/LoginPromptDialog";
import { TOOL_ID } from "../lib/business";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  getBusiness,
  parseProductLines,
  saveBusiness,
  cleanProducts,
  emptyLocation,
  type Location,
  type Product,
} from "../lib/business";
import { INDUSTRIES, matchPreset, resolveIndustry } from "../lib/industries";
import { cn } from "@/lib/utils";

type Search = { id?: string };


const STEPS = ["Business", "Products", "Location & Google"];

export default function Setup() {
  const [sp] = useSearchParams();
  const id = sp.get("id") ?? undefined;
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const { chargeLocal, dialogProps, loginDialogProps } = useCredits(TOOL_ID);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [customIndustry, setCustomIndustry] = useState("");
  const [typeText, setTypeText] = useState("");
  const [phone, setPhone] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([emptyLocation({ code: "LOC-001" })]);
  const [highlights, setHighlights] = useState<string[]>([]);
  const [paste, setPaste] = useState("");
  const [showPaste, setShowPaste] = useState(false);

  useEffect(() => {
    if (!id) return;
    const b = getBusiness(id);
    if (!b) return;
    setName(b.name);
    setIndustry(b.industry);
    setCustomIndustry(b.customIndustry);
    setTypeText(b.industry === "custom" ? b.customIndustry : INDUSTRIES.find((i) => i.id === b.industry)?.label ?? "");
    setPhone(b.phone);
    setProducts(b.products);
    setLocations(b.locations);
    setHighlights(b.highlights);
  }, [id]);

  const ind = useMemo(() => resolveIndustry({ industry, customIndustry, products }), [industry, customIndustry, products]);
  const loc = locations[0];
  const setLoc = (patch: Partial<Location>) => setLocations([{ ...loc, ...patch }, ...locations.slice(1)]);

  function chooseType(text: string) {
    setTypeText(text);
    const preset = INDUSTRIES.find((i) => i.label === text) ?? matchPreset(text);
    if (preset && preset.id !== "other") {
      setIndustry(preset.id);
      setCustomIndustry("");
    } else {
      setIndustry(text.trim() ? "custom" : "");
      setCustomIndustry(text.trim());
    }
  }
  const types = useMemo(() => Array.from(new Set([...ind.types, ...products.map((p) => p.type).filter(Boolean)])), [ind, products]);

  const canNext = step === 0 ? name.trim() && industry : step === 1 ? cleanProducts(products).length > 0 : true;

  function toggleType(t: string) {
    const has = products.some((p) => p.type === t);
    setProducts(has ? products.filter((p) => p.type !== t) : [...products, { name: t, type: t }]);
  }

  function addPasted() {
    const parsed = parseProductLines(paste);
    if (!parsed.length) return;
    setProducts(cleanProducts([...products, ...parsed]));
    setPaste("");
    setShowPaste(false);
    toast.success(`Added ${parsed.length} items`);
  }

  async function finish() {
    const save = async () =>
      saveBusiness({
        id,
        name: name.trim(),
        industry,
        customIndustry,
        phone: phone.trim(),
        locations,
        products,
        highlights: highlights.length ? highlights : ind.praise,
      });
    setSaving(true);
    try {
      // Building a new kit is one use of the app (charged once); editing an existing business is free.
      const b = id ? await save() : await chargeLocal(save);
      if (!b) return;
      toast.success(id ? "Saved" : "Your Google kit is ready");
      navigate(gb(`/b/${b.id}`));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <AppHeader />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <ol className="mb-6 flex items-center gap-2 text-sm">
          {STEPS.map((s, i) => (
            <li key={s} className="flex items-center gap-2">
              <span
                className={cn(
                  "grid h-6 w-6 place-items-center rounded-full text-xs font-semibold",
                  i < step ? "bg-primary text-primary-foreground" : i === step ? "border-2 border-primary text-primary" : "border text-muted-foreground",
                )}
              >
                {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span className={i === step ? "font-medium" : "text-muted-foreground"}>{s}</span>
              {i < STEPS.length - 1 && <span className="mx-1 h-px w-6 bg-border" />}
            </li>
          ))}
        </ol>

        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          {step === 0 && (
            <div className="space-y-5">
              <h1 className="text-xl font-semibold">Tell us about your business</h1>
              <Field label="Business name">
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sharma Footwear" autoFocus />
              </Field>
              <Field label="What kind of business is it?">
                <Input
                  value={typeText}
                  onChange={(e) => chooseType(e.target.value)}
                  placeholder="Type anything — bakery, CA firm, pet grooming, coaching…"
                />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {INDUSTRIES.filter((i) => i.id !== "other").map((i) => (
                    <button
                      key={i.id}
                      type="button"
                      onClick={() => chooseType(i.label)}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-xs transition",
                        industry === i.id ? "border-primary bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:border-primary/40",
                      )}
                    >
                      {i.label}
                    </button>
                  ))}
                </div>
                {industry === "custom" && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Got it — we'll build keywords and content for a <b>{customIndustry}</b> from the products you add next.
                  </p>
                )}
              </Field>
              <Field label="Phone / WhatsApp" optional>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 98260 12345" inputMode="tel" />
              </Field>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h1 className="text-xl font-semibold">What do you sell or offer?</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {ind.types.length && industry !== "custom" ? "Tap the types you offer, then add" : "Add"} your products or services with a type for each — e.g. "Black forest cake" → "Cakes".
                </p>
              </div>

              {types.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {types.map((t) => {
                    const on = products.some((p) => p.type === t);
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => toggleType(t)}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-sm transition",
                          on ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary/50",
                        )}
                      >
                        {on && <Check className="-ml-0.5 mr-1 inline h-3.5 w-3.5" />}
                        {t}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="space-y-2">
                <div className="grid grid-cols-[1fr_1fr_auto] gap-2 text-xs font-medium text-muted-foreground">
                  <span>Product / service</span>
                  <span>Type</span>
                  <span className="w-9" />
                </div>
                {products.map((p, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                    <Input
                      value={p.name}
                      onChange={(e) => setProducts(products.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x)))}
                      placeholder="e.g. Leather loafers"
                    />
                    <Input
                      value={p.type}
                      list="type-options"
                      onChange={(e) => setProducts(products.map((x, i) => (i === idx ? { ...x, type: e.target.value } : x)))}
                      placeholder="e.g. Formal shoes"
                    />
                    <Button variant="ghost" size="icon" onClick={() => setProducts(products.filter((_, i) => i !== idx))} aria-label="Remove">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <datalist id="type-options">
                  {types.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button variant="outline" size="sm" onClick={() => setProducts([...products, { name: "", type: "" }])}>
                    <Plus className="mr-1 h-4 w-4" /> Add product
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowPaste((v) => !v)}>
                    <ClipboardPaste className="mr-1 h-4 w-4" /> Paste a list
                  </Button>
                </div>
                {showPaste && (
                  <div className="space-y-2 rounded-lg border bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">One per line: <code>product, type</code> — copy straight from Excel or WhatsApp.</p>
                    <Textarea rows={5} value={paste} onChange={(e) => setPaste(e.target.value)} placeholder={"Oxford shoes, Formal shoes\nRunning shoes, Sports shoes"} />
                    <Button size="sm" onClick={addPasted}>Add these</Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h1 className="text-xl font-semibold">{id ? "Main location & Google" : "Your first location"}</h1>
              <p className="-mt-3 text-sm text-muted-foreground">More branches can be added later from the Locations page.</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="City">
                  <Input value={loc.city} onChange={(e) => setLoc({ city: e.target.value })} placeholder="e.g. Indore" />
                </Field>
                <Field label="Area / locality" optional>
                  <Input value={loc.area} onChange={(e) => setLoc({ area: e.target.value })} placeholder="e.g. Vijay Nagar" />
                </Field>
              </div>
              <Field label="Address" optional>
                <Input value={loc.address} onChange={(e) => setLoc({ address: e.target.value })} placeholder="Shop no., street, landmark" />
              </Field>
              <Field label="Google review link" optional>
                <Input value={loc.reviewLink} onChange={(e) => setLoc({ reviewLink: e.target.value })} placeholder="https://g.page/r/.../review" />
              </Field>
              <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Where to find it</p>
                Search your business on Google while signed in → <b>Ask for reviews</b> → copy the link. A Place ID also works. Skip if you
                don't have a Google profile yet.
              </div>
              <Field label="What should customers be able to praise?">
                <div className="flex flex-wrap gap-2">
                  {Array.from(new Set([...ind.praise, ...highlights])).map((h) => {
                    const active = highlights.length ? highlights.includes(h) : true;
                    return (
                      <button
                        key={h}
                        type="button"
                        onClick={() => {
                          const base = highlights.length ? highlights : ind.praise;
                          setHighlights(base.includes(h) ? base.filter((x) => x !== h) : [...base, h]);
                        }}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-sm",
                          active ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground",
                        )}
                      >
                        {h}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">These appear as tap options on the customer's review page. Customers can also write their own words.</p>
              </Field>
            </div>
          )}

          <div className="mt-8 flex justify-between">
            <Button variant="ghost" onClick={() => (step === 0 ? history.back() : setStep(step - 1))}>
              <ArrowLeft className="mr-1 h-4 w-4" /> Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button disabled={!canNext} onClick={() => setStep(step + 1)}>
                Next <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={finish} disabled={saving}>
                {id ? "Save changes" : "Build my Google kit"} <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </main>
      <BuyCreditsDialog {...dialogProps} />
      <LoginPromptDialog {...loginDialogProps} />
    </div>
  );
}

function Field({ label, optional, children }: { label: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label} {optional && <span className="font-normal text-muted-foreground">(optional)</span>}
      </Label>
      {children}
    </div>
  );
}
