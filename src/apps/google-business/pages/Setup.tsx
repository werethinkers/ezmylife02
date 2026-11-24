import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Info,
  MessageSquareText,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { ModernPage } from "@/components/modern/ModernPage";
import { SectionHead } from "@/components/modern/ui";
import { BTN_OUTLINE, BTN_PRIMARY, CARD, CONTAINER, EYEBROW, FOCUS_RING } from "@/components/modern/styles";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRun } from "@/apps/lib/api";
import { cn } from "@/lib/utils";
import { gb, getBusiness, saveBusiness, cleanProducts, emptyLocation } from "../lib/business";
import { matchPreset } from "../lib/industries";
import { copyTextToClipboard } from "../lib/clipboard";

// This server-side spec is independent of "google-business-kit" (which bulk mode also uses) —
// see supabase/functions/_shared/appSpecs/extras.ts.
const AUDIT_TOOL_ID = "google-business-audit";

type Mode = "import" | "manual";
type LocationModel = "storefront" | "sab" | "hybrid";
type PrimaryAction = "call" | "whatsapp" | "website" | "appointment";
type OpeningStatus = "open" | "soon";
type OutputLanguage = "en" | "bilingual";
interface ServiceRow {
  name: string;
  detail: string;
}
interface AuditResult {
  riskScore: number;
  riskFlags: string[];
  description: string;
  primaryCategory: string;
  secondaryCategories: string[];
  services: { name: string; description: string }[];
  whatsappMessage: string;
}

const LOCATION_MODELS: { id: LocationModel; label: string; sub: string }[] = [
  { id: "storefront", label: "Storefront", sub: "Customers visit a physical address with permanent signage" },
  { id: "sab", label: "Service-area business", sub: "You travel or deliver to customers; home address stays hidden" },
  { id: "hybrid", label: "Hybrid", sub: "Both a physical storefront and field service or delivery" },
];
const PRIMARY_ACTIONS: { id: PrimaryAction; label: string }[] = [
  { id: "call", label: "Call" },
  { id: "whatsapp", label: "WhatsApp chat" },
  { id: "website", label: "Visit website" },
  { id: "appointment", label: "Book appointment" },
];
const PAYMENT_METHODS = ["UPI", "Cards", "Bank transfer", "Cash"];

function newServiceRow(): ServiceRow {
  return { name: "", detail: "" };
}

export default function Setup() {
  const [sp] = useSearchParams();
  const id = sp.get("id") ?? undefined;
  const navigate = useNavigate();
  const { busy, run } = useRun(AUDIT_TOOL_ID);

  const [mode, setMode] = useState<Mode>("manual");

  // Section 1 — Core identity & Google compliance
  const [businessName, setBusinessName] = useState("");
  const [locationModel, setLocationModel] = useState<LocationModel>("storefront");
  const [city, setCity] = useState("");
  const [serviceAreas, setServiceAreas] = useState<string[]>([]);
  const [areaDraft, setAreaDraft] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");

  // Section 2 — Categories & core offerings
  const [primaryCategory, setPrimaryCategory] = useState("");
  const [secondaryCategories, setSecondaryCategories] = useState<string[]>([]);
  const [secondaryDraft, setSecondaryDraft] = useState("");
  const [services, setServices] = useState<ServiceRow[]>([newServiceRow()]);

  // Section 3 — Conversion, trust & language
  const [primaryAction, setPrimaryAction] = useState<PrimaryAction>("whatsapp");
  const [actionDestination, setActionDestination] = useState("");
  const [yearEstablished, setYearEstablished] = useState("");
  const [licenses, setLicenses] = useState<string[]>([]);
  const [licenseDraft, setLicenseDraft] = useState("");
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [openingStatus, setOpeningStatus] = useState<OpeningStatus>("open");
  const [outputLanguage, setOutputLanguage] = useState<OutputLanguage>("en");

  const [result, setResult] = useState<AuditResult | null>(null);
  const [businessId, setBusinessId] = useState<string | undefined>(id);

  // Editing an existing business: prefill what overlaps the old (and still live) data model.
  useEffect(() => {
    if (!id) return;
    const b = getBusiness(id);
    if (!b) return;
    setBusinessName(b.name);
    setPhone(b.phone);
    const loc = b.locations[0];
    if (loc) {
      setCity(loc.city);
      if (loc.area) setServiceAreas([loc.area]);
    }
    if (b.industry === "custom") setPrimaryCategory(b.customIndustry);
    else setPrimaryCategory(b.products[0]?.type || b.customIndustry);
    if (b.products.length) setServices(b.products.map((p) => ({ name: p.name, detail: "" })));
  }, [id]);

  const cleanedServices = useMemo(() => services.filter((s) => s.name.trim()), [services]);
  const canGenerate = businessName.trim() && primaryCategory.trim() && cleanedServices.length > 0 && !busy;

  const addTag = (draft: string, list: string[], set: (v: string[]) => void, max: number) => {
    const parts = draft
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!parts.length) return;
    set(Array.from(new Set([...list, ...parts])).slice(0, max));
  };

  async function generate() {
    if (!canGenerate) {
      toast.error("Add a business name, a primary category and at least one service first.");
      return;
    }
    const inputs: Record<string, string> = {
      "Business name": businessName.trim(),
      "Business location model": LOCATION_MODELS.find((m) => m.id === locationModel)?.label ?? "",
      City: city.trim(),
      "Service areas / PIN codes": serviceAreas.join(", "),
      "Business phone number": phone.trim(),
      "Existing website": website.trim() || "None given — consider recommending an EZYOURLIFE mini-website",
      "Primary category": primaryCategory.trim(),
      "Secondary categories": secondaryCategories.join(", "),
      "Services or products": cleanedServices.map((s) => (s.detail.trim() ? `${s.name.trim()} – ${s.detail.trim()}` : s.name.trim())).join("; "),
      "Primary customer action": PRIMARY_ACTIONS.find((a) => a.id === primaryAction)?.label ?? "",
      "Action destination (number or URL)": actionDestination.trim(),
      "Year established": yearEstablished.trim(),
      "Licenses or certifications": licenses.join(", "),
      "Accepted payment methods": paymentMethods.join(", "),
      "Opening status": openingStatus === "open" ? "Already open" : "Opening soon",
      "Output language": outputLanguage === "bilingual" ? "Bilingual — English plus Hindi/Hinglish for the WhatsApp message" : "English only",
    };

    const out = await run<Partial<AuditResult>>({ inputs, action: "generate" });
    if (!out) return; // insufficient credits / not signed in / error — already handled with a dialog or toast

    // Defensive: the model's JSON can occasionally miss a key or get its type wrong — never let that blank the page.
    setResult({
      riskScore: typeof out.riskScore === "number" ? out.riskScore : 0,
      riskFlags: Array.isArray(out.riskFlags) ? out.riskFlags : [],
      description: typeof out.description === "string" ? out.description : "",
      primaryCategory: typeof out.primaryCategory === "string" && out.primaryCategory ? out.primaryCategory : primaryCategory.trim(),
      secondaryCategories: Array.isArray(out.secondaryCategories) ? out.secondaryCategories : [],
      services: Array.isArray(out.services) ? out.services : [],
      whatsappMessage: typeof out.whatsappMessage === "string" ? out.whatsappMessage : "",
    });

    // The audit call already charged credits; saving the business record is a plain, free write —
    // the same local data layer every other Google Business Kit screen reads from.
    const industry = matchPreset(primaryCategory);
    const biz = saveBusiness({
      id: businessId,
      name: businessName.trim(),
      industry: industry && industry.id !== "other" ? industry.id : "custom",
      customIndustry: industry && industry.id !== "other" ? "" : primaryCategory.trim(),
      phone: phone.trim(),
      locations: [emptyLocation({ code: "LOC-001", city: city.trim(), area: serviceAreas[0] ?? "" })],
      products: cleanProducts(cleanedServices.map((s) => ({ name: s.name.trim(), type: primaryCategory.trim() }))),
      highlights: [],
    });
    setBusinessId(biz.id);
    toast.success("Profile & audit ready");
    requestAnimationFrame(() => document.getElementById("audit-results")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  const waNumber = (primaryAction === "whatsapp" ? actionDestination : phone).replace(/[^\d+]/g, "");
  const waLink = result && waNumber ? `https://wa.me/${waNumber.replace(/^\+/, "")}?text=${encodeURIComponent(result.whatsappMessage)}` : null;

  return (
    <ModernPage section="apps">
      <section className={cn(CONTAINER, "pb-10 pt-8 md:pt-14")}>
        <span className={EYEBROW}>Google Business Kit</span>
        <h1 className="mt-2 font-display text-[1.9rem] font-extrabold leading-[1.1] sm:text-4xl">
          Setup &amp; Audit Co-Pilot
        </h1>
        <p className="mt-3 max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
          Import an existing Google Maps listing, or fill in your details by hand — either way you get the same AI
          audit, description and category suggestions at the end.
        </p>

        {/* Mode switcher */}
        <div className="mt-7 inline-flex flex-wrap gap-2 rounded-2xl border border-zinc-200 bg-white p-1.5 dark:border-zinc-800 dark:bg-zinc-900">
          <button
            type="button"
            onClick={() => setMode("import")}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-bold transition",
              mode === "import" ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950" : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800",
              FOCUS_RING,
            )}
          >
            Audit &amp; improve existing profile
          </button>
          <button
            type="button"
            onClick={() => setMode("manual")}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-bold transition",
              mode === "manual" ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950" : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800",
              FOCUS_RING,
            )}
          >
            Set up new business
          </button>
        </div>

        {mode === "import" && (
          <div className={cn("mt-6 flex flex-col gap-4 p-5 shadow-soft-sm md:p-6", CARD)}>
            <div>
              <h2 className="font-display text-lg font-bold">Import from a Google Maps link</h2>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Paste a Google Maps share link (<code className="text-[13px]">maps.app.goo.gl/…</code>) or a full{" "}
                <code className="text-[13px]">google.com/maps/place/…</code> link.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input disabled placeholder="https://maps.app.goo.gl/…" className="sm:flex-1" />
              <button type="button" disabled className={cn(BTN_PRIMARY, "h-10 shrink-0 px-5 opacity-60")}>
                Fetch profile
              </button>
            </div>
            <div className="flex gap-2.5 rounded-xl border border-orange-200 bg-orange-50 p-4 text-[14px] dark:border-orange-900 dark:bg-orange-950/40">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-orange-600 dark:text-orange-400" aria-hidden />
              <p className="text-zinc-800 dark:text-zinc-200">
                <span className="font-bold">Coming soon.</span> Importing straight from a Maps link needs a Google
                Places API connection that isn't set up yet — nothing is charged for trying. Use{" "}
                <button type="button" onClick={() => setMode("manual")} className="font-bold underline underline-offset-2">
                  manual entry
                </button>{" "}
                for now; it fills in the exact same form below.
              </p>
            </div>
          </div>
        )}
      </section>

      {mode === "manual" && (
        <>
          <section className={cn(CONTAINER, "pb-10")}>
            <SectionHead eyebrow="Section 1 of 3" title="Core identity & Google compliance" />
            <div className={cn("grid gap-5 p-5 shadow-soft-sm md:p-6", CARD)}>
              <Field label="Exact legal / signboard business name" required>
                <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="e.g. Sharma Footwear" />
                <HelperWarning>
                  Enter only your exact signboard/GST name. Adding city names or keywords risks Google profile suspension.
                </HelperWarning>
              </Field>

              <div>
                <Label className="text-sm font-semibold">Business location model</Label>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  {LOCATION_MODELS.map((m) => (
                    <ChipCard key={m.id} active={locationModel === m.id} onClick={() => setLocationModel(m.id)} title={m.label} sub={m.sub} />
                  ))}
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="City">
                  <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Indore" />
                </Field>
                <TagField
                  label="Service areas / target PIN codes"
                  value={serviceAreas}
                  draft={areaDraft}
                  onDraftChange={setAreaDraft}
                  onAdd={() => {
                    addTag(areaDraft, serviceAreas, setServiceAreas, 20);
                    setAreaDraft("");
                  }}
                  onRemove={(v) => setServiceAreas(serviceAreas.filter((x) => x !== v))}
                  placeholder="e.g. Vijay Nagar, 452010"
                  hint="Up to 20 areas or PIN codes, comma-separated."
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Business phone number" optional>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 98260 12345" inputMode="tel" />
                </Field>
                <Field label="Existing website URL" optional>
                  <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" />
                  {!website.trim() && (
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">No website yet — the audit will suggest an EZYOURLIFE mini-website.</p>
                  )}
                </Field>
              </div>
            </div>
          </section>

          <section className={cn(CONTAINER, "pb-10")}>
            <SectionHead eyebrow="Section 2 of 3" title="Categories & core offerings" />
            <div className={cn("grid gap-5 p-5 shadow-soft-sm md:p-6", CARD)}>
              <Field label="Primary business category" required>
                <Input value={primaryCategory} onChange={(e) => setPrimaryCategory(e.target.value)} placeholder="e.g. Shoe store" />
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Your main local ranking driver on Google — be specific.</p>
              </Field>

              <TagField
                label="Secondary categories"
                value={secondaryCategories}
                draft={secondaryDraft}
                onDraftChange={setSecondaryDraft}
                onAdd={() => {
                  addTag(secondaryDraft, secondaryCategories, setSecondaryCategories, 9);
                  setSecondaryDraft("");
                }}
                onRemove={(v) => setSecondaryCategories(secondaryCategories.filter((x) => x !== v))}
                placeholder="e.g. Shoe repair shop, Leather goods store"
                hint="Optional — up to 9 supporting categories."
              />

              <div className="space-y-2.5">
                <div className="flex items-baseline justify-between gap-3">
                  <Label className="text-sm font-semibold">Top services or products (5–10)</Label>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">Name + price or spec</span>
                </div>
                {services.map((s, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                    <Input
                      value={s.name}
                      onChange={(e) => setServices(services.map((x, idx) => (idx === i ? { ...x, name: e.target.value } : x)))}
                      placeholder="e.g. 62.5 KVA Silent Diesel Generator"
                    />
                    <Input
                      value={s.detail}
                      onChange={(e) => setServices(services.map((x, idx) => (idx === i ? { ...x, detail: e.target.value } : x)))}
                      placeholder="e.g. ₹4,50,000"
                    />
                    <button
                      type="button"
                      onClick={() => setServices(services.filter((_, idx) => idx !== i))}
                      aria-label="Remove"
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 text-zinc-500 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {services.length < 10 && (
                  <button type="button" onClick={() => setServices([...services, newServiceRow()])} className={cn(BTN_OUTLINE, "h-9 px-3 text-sm")}>
                    <Plus className="h-4 w-4" aria-hidden /> Add another
                  </button>
                )}
              </div>
            </div>
          </section>

          <section className={cn(CONTAINER, "pb-12")}>
            <SectionHead eyebrow="Section 3 of 3" title="Conversion, trust & language" />
            <div className={cn("grid gap-5 p-5 shadow-soft-sm md:p-6", CARD)}>
              <div>
                <Label className="text-sm font-semibold">Primary customer action</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {PRIMARY_ACTIONS.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setPrimaryAction(a.id)}
                      className={cn(
                        "rounded-full border px-3.5 py-1.5 text-sm font-semibold transition",
                        primaryAction === a.id
                          ? "border-orange-500 bg-orange-50 text-orange-800 dark:border-orange-700 dark:bg-orange-950/50 dark:text-orange-300"
                          : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300",
                        FOCUS_RING,
                      )}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
              <Field label="Action destination (number or URL)" optional>
                <Input
                  value={actionDestination}
                  onChange={(e) => setActionDestination(e.target.value)}
                  placeholder={primaryAction === "website" ? "https://…" : "e.g. 98260 12345"}
                />
              </Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Year established" optional>
                  <Input value={yearEstablished} onChange={(e) => setYearEstablished(e.target.value)} placeholder="e.g. 2014" inputMode="numeric" />
                </Field>
                <div>
                  <Label className="text-sm font-semibold">Opening status</Label>
                  <div className="mt-2 flex gap-2">
                    {(["open", "soon"] as OpeningStatus[]).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setOpeningStatus(s)}
                        className={cn(
                          "rounded-full border px-3.5 py-1.5 text-sm font-semibold transition",
                          openingStatus === s
                            ? "border-orange-500 bg-orange-50 text-orange-800 dark:border-orange-700 dark:bg-orange-950/50 dark:text-orange-300"
                            : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300",
                          FOCUS_RING,
                        )}
                      >
                        {s === "open" ? "Already open" : "Opening soon"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <TagField
                label="Licenses / certifications"
                value={licenses}
                draft={licenseDraft}
                onDraftChange={setLicenseDraft}
                onAdd={() => {
                  addTag(licenseDraft, licenses, setLicenses, 10);
                  setLicenseDraft("");
                }}
                onRemove={(v) => setLicenses(licenses.filter((x) => x !== v))}
                placeholder="e.g. GST, ISO, FSSAI"
                hint="Optional."
              />

              <div>
                <Label className="text-sm font-semibold">Accepted payment methods</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {PAYMENT_METHODS.map((m) => {
                    const on = paymentMethods.includes(m);
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setPaymentMethods(on ? paymentMethods.filter((x) => x !== m) : [...paymentMethods, m])}
                        className={cn(
                          "rounded-full border px-3.5 py-1.5 text-sm font-semibold transition",
                          on
                            ? "border-orange-500 bg-orange-50 text-orange-800 dark:border-orange-700 dark:bg-orange-950/50 dark:text-orange-300"
                            : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300",
                          FOCUS_RING,
                        )}
                      >
                        {on && <Check className="-ml-0.5 mr-1 inline h-3.5 w-3.5" aria-hidden />}
                        {m}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold">Output language</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {([
                    { id: "en" as OutputLanguage, label: "English only" },
                    { id: "bilingual" as OutputLanguage, label: "Bilingual (English + Hindi/Hinglish for WhatsApp)" },
                  ]).map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => setOutputLanguage(o.id)}
                      className={cn(
                        "rounded-full border px-3.5 py-1.5 text-sm font-semibold transition",
                        outputLanguage === o.id
                          ? "border-orange-500 bg-orange-50 text-orange-800 dark:border-orange-700 dark:bg-orange-950/50 dark:text-orange-300"
                          : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300",
                        FOCUS_RING,
                      )}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className={cn(CONTAINER, "pb-12")}>
            <div className="flex flex-col items-start justify-between gap-4 rounded-3xl bg-zinc-950 p-6 text-white shadow-soft-lg dark:bg-zinc-900 sm:flex-row sm:items-center sm:p-8">
              <div className="min-w-0">
                <h2 className="font-display text-xl font-bold">Ready to generate?</h2>
                <p className="mt-1 text-sm text-zinc-300">2 credits, charged only if the audit comes back successfully.</p>
              </div>
              <button type="button" onClick={generate} disabled={!canGenerate} className={cn(BTN_PRIMARY, "h-12 w-full shrink-0 px-6 text-base disabled:opacity-50 sm:w-auto")}>
                {busy ? "Generating…" : "Generate profile & audit"} <Sparkles className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </section>

          {result && (
            <section id="audit-results" className={cn(CONTAINER, "scroll-mt-20 pb-16")}>
              <SectionHead eyebrow="Results" title="Your profile & audit" line="Copy-ready — paste each section straight into Google Business Profile." />
              <div className="grid gap-5 lg:grid-cols-2">
                <RiskScoreCard score={result.riskScore} flags={result.riskFlags} />
                <DescriptionCard text={result.description} />
                <CategoriesCard primary={result.primaryCategory} secondary={result.secondaryCategories} services={result.services} />
                <WhatsAppCard message={result.whatsappMessage} waLink={waLink} />
              </div>

              {businessId && (
                <div className="mt-8 flex flex-col items-start gap-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-soft-sm dark:border-zinc-800 dark:bg-zinc-900 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">Your business is saved. Add more locations, replies and the review QR from its dashboard.</p>
                  <button type="button" onClick={() => navigate(gb(`/b/${businessId}`))} className={cn(BTN_OUTLINE, "h-10 shrink-0 px-4 text-sm")}>
                    Go to dashboard <ArrowRight className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              )}
            </section>
          )}
        </>
      )}
    </ModernPage>
  );
}

function Field({ label, required, optional, children }: { label: string; required?: boolean; optional?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-semibold">
        {label} {optional && <span className="font-normal text-zinc-500 dark:text-zinc-400">(optional)</span>}
        {required && <span className="text-orange-600">*</span>}
      </Label>
      {children}
    </div>
  );
}

function HelperWarning({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-1.5 flex gap-1.5 text-xs text-amber-800 dark:text-amber-400">
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  );
}

function ChipCard({ active, onClick, title, sub }: { active: boolean; onClick: () => void; title: string; sub: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border p-3 text-left transition",
        active ? "border-orange-500 bg-orange-50 dark:border-orange-700 dark:bg-orange-950/50" : "border-zinc-200 bg-white hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900",
        FOCUS_RING,
      )}
    >
      <span className={cn("block text-sm font-bold", active ? "text-orange-900 dark:text-orange-200" : "text-zinc-900 dark:text-zinc-100")}>{title}</span>
      <span className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400">{sub}</span>
    </button>
  );
}

function TagField({
  label,
  value,
  draft,
  onDraftChange,
  onAdd,
  onRemove,
  placeholder,
  hint,
}: {
  label: string;
  value: string[];
  draft: string;
  onDraftChange: (v: string) => void;
  onAdd: () => void;
  onRemove: (v: string) => void;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-semibold">{label}</Label>
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAdd();
            }
          }}
          placeholder={placeholder}
        />
        <button type="button" onClick={onAdd} className={cn(BTN_OUTLINE, "h-10 shrink-0 px-3 text-sm")}>
          Add
        </button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {value.map((v) => (
            <span key={v} className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-800 dark:bg-orange-950/50 dark:text-orange-300">
              {v}
              <button type="button" onClick={() => onRemove(v)} aria-label={`Remove ${v}`}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      {hint && <p className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>}
    </div>
  );
}

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  return (
    <button
      type="button"
      onClick={async () => {
        const ok = await copyTextToClipboard(text);
        toast[ok ? "success" : "error"](ok ? "Copied" : "Couldn't copy — select and copy manually");
      }}
      className={cn(BTN_OUTLINE, "h-8 px-3 text-xs")}
    >
      <Copy className="h-3.5 w-3.5" aria-hidden /> {label}
    </button>
  );
}

function RiskScoreCard({ score, flags }: { score: number; flags: string[] }) {
  const tone = score >= 80 ? "emerald" : score >= 50 ? "amber" : "rose";
  const toneClasses: Record<string, string> = {
    emerald: "text-emerald-600 dark:text-emerald-400",
    amber: "text-amber-600 dark:text-amber-400",
    rose: "text-rose-600 dark:text-rose-400",
  };
  return (
    <div className={cn("flex flex-col gap-3 p-5 shadow-soft-sm md:p-6", CARD)}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-display text-lg font-bold">Profile health & suspension risk</h3>
        <span className={cn("font-display text-3xl font-extrabold", toneClasses[tone])}>{score}<span className="text-base font-bold text-zinc-400">/100</span></span>
      </div>
      {flags.length === 0 ? (
        <p className="flex items-center gap-2 text-[15px] text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden /> No issues found in what you gave us.
        </p>
      ) : (
        <ul className="space-y-2">
          {flags.map((f, i) => (
            <li key={i} className="flex gap-2 text-[14px] text-zinc-700 dark:text-zinc-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DescriptionCard({ text }: { text: string }) {
  return (
    <div className={cn("flex flex-col gap-3 p-5 shadow-soft-sm md:p-6", CARD)}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-display text-lg font-bold">SEO business description</h3>
        <CopyButton text={text} />
      </div>
      <p className="text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300">{text}</p>
      <p className={cn("text-xs font-semibold", text.length > 750 ? "text-rose-600 dark:text-rose-400" : "text-zinc-500 dark:text-zinc-400")}>
        {text.length} / 750 characters
      </p>
    </div>
  );
}

function CategoriesCard({ primary, secondary, services }: { primary: string; secondary: string[]; services: { name: string; description: string }[] }) {
  const all = [`Primary: ${primary}`, ...secondary.map((s) => `Secondary: ${s}`), ...services.map((s) => `${s.name} — ${s.description}`)].join("\n");
  return (
    <div className={cn("flex flex-col gap-3 p-5 shadow-soft-sm md:p-6", CARD)}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-display text-lg font-bold">Categories & services</h3>
        <CopyButton text={all} />
      </div>
      <div className="flex flex-wrap gap-1.5">
        <span className="rounded-full bg-zinc-950 px-2.5 py-1 text-xs font-bold text-white dark:bg-white dark:text-zinc-950">{primary}</span>
        {secondary.map((s) => (
          <span key={s} className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            {s}
          </span>
        ))}
      </div>
      <ul className="space-y-2.5">
        {services.map((s, i) => (
          <li key={i}>
            <p className="text-[14px] font-bold text-zinc-900 dark:text-zinc-100">{s.name}</p>
            <p className="text-[14px] text-zinc-600 dark:text-zinc-400">{s.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function WhatsAppCard({ message, waLink }: { message: string; waLink: string | null }) {
  return (
    <div className={cn("flex flex-col gap-3 p-5 shadow-soft-sm md:p-6", CARD)}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-display text-lg font-bold">
          <MessageSquareText className="h-4 w-4 text-orange-600 dark:text-orange-400" aria-hidden /> Click-to-WhatsApp lead link
        </h3>
        <CopyButton text={waLink ?? message} label={waLink ? "Copy link" : "Copy message"} />
      </div>
      <p className="text-[15px] text-zinc-700 dark:text-zinc-300">{message}</p>
      {waLink ? (
        <>
          <a href={waLink} target="_blank" rel="noopener noreferrer" className={cn(BTN_PRIMARY, "h-10 w-full justify-center text-sm")}>
            Open WhatsApp link
          </a>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Paste this link in Google Business Profile → Messages/WhatsApp, or in posts, so new leads land in WhatsApp pre-filled with this message.
          </p>
        </>
      ) : (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Add a WhatsApp number (as the primary action, or as your phone number) to get a ready link.</p>
      )}
    </div>
  );
}
