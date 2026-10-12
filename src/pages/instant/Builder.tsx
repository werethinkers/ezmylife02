import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Eye, Loader2, PencilLine, RotateCcw, Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ensureRazorpay } from "@/hooks/useRazorpayScript";
import { LoginPromptDialog } from "@/components/auth/LoginPromptDialog";
import { PageSeo } from "@/components/seo/PageSeo";
import { getProduct } from "@/instant/catalog";
import { ProductRenderer } from "@/instant/renderers";
import { FieldInput } from "@/instant/builder/FieldInput";
import { FieldMemory } from "@/apps/shell/FieldMemory";
import { useProducts } from "@/instant/useProducts";
import { checkout, createPage, getMyPage, republish, savePage, uploadContentImages, publishPrepaid } from "@/instant/api";
import { inr, isMobile, pageUrlFor, titleOf } from "@/instant/util";
import type { Content, Field, Product } from "@/instant/types";
import { cn } from "@/lib/utils";
import { FlowSteps } from "@/components/brand/FlowSteps";
import { WEBSITE_CATEGORIES } from "@/components/brand/nav";

interface Draft { variantId: string; content: Content; pageId?: string }
const SAMPLE_GUARDED = ["reviews", "rating", "reviews_count", "team"];
const draftKey = (id: string) => `ip-draft:${id}`;
const readDraft = (id: string): Draft | null => { try { const s = localStorage.getItem(draftKey(id)); return s ? JSON.parse(s) : null; } catch { return null; } };
const writeDraft = (id: string, d: Draft) => { try { localStorage.setItem(draftKey(id), JSON.stringify(d)); return true; } catch { return false; } };

function validate(p: Product, c: Content): { step: number; errors: Record<string, string> } | null {
  const errors: Record<string, string> = {}; let step = -1;
  p.steps.forEach((s, i) => s.fields.forEach((f: Field) => {
    const v = c[f.id];
    let e = "";
    if (f.required && (v == null || String(v).trim() === "")) e = "Required";
    else if (f.type === "phone" && v && !isMobile(v)) e = "Enter a 10-digit mobile number";
    else if (f.type === "phone" && v && String(v).replace(/\D/g, "").endsWith("9000000000")) e = "Replace the sample number with your own";
    // Example reviews, ratings and people must never go live as if they were real.
    else if (SAMPLE_GUARDED.includes(f.id) && v && JSON.stringify(v) === JSON.stringify(p.sample[f.id]) && (!Array.isArray(v) || v.length > 0))
      e = "This is sample text. Replace it with your real details, or clear it.";
    if (e) { errors[f.id] = e; if (step < 0) step = i; }
  }));
  return step < 0 ? null : { step, errors };
}

export default function Builder() {
  const { productId = "" } = useParams();
  const product = getProduct(productId);
  if (!product) return <NotFoundProduct />;
  return <BuilderInner key={product.id} product={product} />;
}

function BuilderInner({ product }: { product: Product }) {
  const [params, setParams] = useSearchParams();
  const editId = params.get("page");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { list } = useProducts();
  const price = list.find((l) => l.product.id === product.id)?.price ?? product.price;
  // ?design=<theme id> opens a specific design (used by the kit links), unless a saved page is being edited.
  const wantedDesign = params.get("design");
  const initial = useMemo<Draft>(() => {
    const base = readDraft(product.id) ?? { variantId: product.themes[0].id, content: { ...product.sample } };
    return wantedDesign && !editId && product.themes.some((t) => t.id === wantedDesign) ? { ...base, variantId: wantedDesign } : base;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product]);
  const [variantId, setVariantId] = useState(initial.variantId);
  const [content, setContent] = useState<Content>(initial.content);
  const [pageId, setPageId] = useState<string | undefined>(editId ?? initial.pageId);
  const [published, setPublished] = useState<{ slug: string } | null>(null);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [busy, setBusy] = useState<string | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const theme = product.themes.find((t) => t.id === variantId) ?? product.themes[0];

  // Editing an existing page: load it from the database.
  useEffect(() => {
    if (!editId || !user) return;
    getMyPage(editId).then((row) => {
      if (!row || row.product_id !== product.id) return;
      setContent(row.content); setVariantId(row.variant_id); setPageId(row.id);
      if (row.status === "published" && row.slug) setPublished({ slug: row.slug });
    }).catch(() => toast({ title: "Couldn't open that page", variant: "destructive" }));
  }, [editId, user, product.id, toast]);

  useEffect(() => {
    if (!user) return;
    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => setIsAdmin(!!data));
  }, [user]);

  // Autosave the draft on this device.
  useEffect(() => {
    if (editId) return;
    const t = setTimeout(() => writeDraft(product.id, { variantId, content, pageId }), 400);
    return () => clearTimeout(t);
  }, [product.id, variantId, content, pageId, editId]);

  const set = (id: string, v: unknown) => { setContent((c) => ({ ...c, [id]: v })); if (errors[id]) setErrors((e) => { const n = { ...e }; delete n[id]; return n; }); };

  const publish = useCallback(async (free = false) => {
    const bad = validate(product, content);
    if (bad) { setErrors(bad.errors); setStep(bad.step); setTab("edit"); toast({ title: "A few details are missing", description: "Fill the highlighted fields to publish." }); return; }
    if (!user) {
      writeDraft(product.id, { variantId, content, pageId });
      try { localStorage.setItem("auth_redirect_to", `/create/${product.id}?publish=1`); } catch { /* ignore */ }
      setLoginOpen(true); return;
    }
    try {
      setBusy("Saving your page…");
      let id = pageId;
      const title = titleOf(product, content);
      if (!id) { const row = await createPage(user.id, product.id, variantId, title, {}); id = row.id; setPageId(id); }
      setBusy("Uploading photos…");
      const uploaded = await uploadContentImages(user.id, id, content);
      setContent(uploaded);
      await savePage(id, variantId, title, uploaded);
      writeDraft(product.id, { variantId, content: uploaded, pageId: id });

      if (published) {
        setBusy("Updating your live page…");
        const r = await republish(id);
        if (!r.ok) throw new Error("Couldn't update the live page.");
        checkout({ action: "updated", page_id: id }).catch(() => undefined); // WhatsApp + email confirmation
        toast({ title: "Live page updated" });
        navigate(`/create/done/${id}`); return;
      }

      // The ₹999 kit prepays one business website and one visiting card. If this
      // page is covered by an unused one, it publishes free and no payment opens.
      setBusy("Checking your kit…");
      const prepaid = await publishPrepaid(id);
      if (prepaid?.ok) {
        try { localStorage.removeItem(draftKey(product.id)); } catch { /* ignore */ }
        toast({ title: "Published with your kit", description: "This one was already paid for." });
        navigate(`/create/done/${id}`); return;
      }

      setBusy("Starting checkout…");
      const order = await checkout({ action: "create", page_id: id, free });
      if (order.published) { try { localStorage.removeItem(draftKey(product.id)); } catch { /* ignore */ } navigate(`/create/done/${id}`); return; }
      if (!(await ensureRazorpay())) throw new Error("Couldn't load the payment window. Check your connection and try again.");
      const pid = id;
      const rzp = new (window as unknown as { Razorpay: new (o: unknown) => { open: () => void; on: (e: string, cb: (r: { error?: { description?: string } }) => void) => void } }).Razorpay({
        key: order.key_id, amount: order.amount, currency: order.currency, order_id: order.order_id,
        name: "EZYOURLIFE", description: order.description, prefill: { email: order.user_email }, theme: { color: theme.c.ac },
        handler: async (resp: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          setBusy("Confirming payment…");
          try {
            await checkout({ action: "verify", ...resp });
            try { localStorage.removeItem(draftKey(product.id)); } catch { /* ignore */ }
          } catch { /* the webhook will still publish it; the done page waits for it */ }
          navigate(`/create/done/${pid}`);
        },
        modal: { ondismiss: () => { setBusy(null); toast({ title: "Payment not completed", description: "Your page is saved. Publish it any time from My websites and cards." }); } },
      });
      rzp.on("payment.failed", (r) => toast({ title: "Payment failed", description: r.error?.description || "Try again or use another UPI app.", variant: "destructive" }));
      rzp.open();
    } catch (e) {
      setBusy(null);
      toast({ title: "Couldn't publish", description: e instanceof Error ? e.message : "Please try again.", variant: "destructive" });
    }
  }, [product, content, user, variantId, pageId, published, navigate, toast, theme.c.ac]);

  // Coming back from sign-in with ?publish=1 continues straight to checkout.
  useEffect(() => {
    if (params.get("publish") === "1" && user && !busy) { params.delete("publish"); setParams(params, { replace: true }); publish(); }
  }, [params, user, busy, publish, setParams]);

  const s = product.steps[step];
  const last = step === product.steps.length - 1;
  const isSite = (WEBSITE_CATEGORIES as readonly string[]).includes(product.category);
  const cta = published ? "Update live page" : price ? `Pay ${inr(price)} and publish` : "Publish free";

  return (
    <div className="min-h-screen bg-background">
      <PageSeo title={`Create a ${product.name} | EZYOURLIFE`} description={product.description} path={`/create/${product.id}`} />
      <header className="sticky top-0 z-40 border-b-2 border-ink bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center gap-3">
          <Link to={`/make/${product.id}`} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-ink bg-card shadow-[2px_2px_0_0_hsl(var(--ink))] hover:bg-sun" aria-label="Back to the design"><ArrowLeft className="h-5 w-5" /></Link>
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold">{product.glyph} {product.name}</p>
            <p className="truncate text-xs text-muted-foreground">{published ? `Live at ${pageUrlFor(published.slug).replace("https://", "")}` : `${price ? `${inr(price)}, paid once` : "Free"} · online for a year`}</p>
          </div>
          <Button className="hidden h-11 md:inline-flex" disabled={!!busy} onClick={() => publish()}>{busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}{busy ?? cta}</Button>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 pt-5">
        <FlowSteps flow={isSite ? "website" : "card"} step={2} className="max-w-3xl" />
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-6 pb-32 md:grid-cols-[minmax(0,1fr)_420px] md:pb-10">
        <section className={cn("grid gap-6 content-start min-w-0", tab === "preview" && "hidden md:grid")} aria-label="Edit">
          <div className="grid gap-2">
            <h1 className="font-display text-2xl font-extrabold md:text-3xl">{product.name}</h1>
            <p className="text-[16px] text-muted-foreground">{product.description}</p>
            <p className="text-sm font-semibold">Fill the steps on the left. Your {isSite ? "website" : "card"} changes on the right as you type.</p>
          </div>

          <div className="grid gap-2">
            <p className="text-sm font-bold">Choose a style</p>
            <div className="flex flex-wrap gap-2">
              {product.themes.map((t) => (
                <button key={t.id} type="button" onClick={() => setVariantId(t.id)} aria-pressed={t.id === theme.id}
                  className={cn("flex items-center gap-2 rounded-full border-2 py-1.5 pl-1.5 pr-4 text-sm font-semibold", t.id === theme.id ? "border-ink bg-sun" : "border-ink/30 bg-card hover:border-ink")}>
                  <span className="h-7 w-7 rounded-full border-2 border-ink" style={{ background: `conic-gradient(${t.c.bg} 0 50%, ${t.c.ac} 50% 75%, ${t.c.ac2} 75%)` }} aria-hidden="true" />{t.name}
                </button>
              ))}
            </div>
          </div>

          <ol className="flex gap-2 overflow-x-auto pb-1" aria-label="Steps">
            {product.steps.map((st, i) => {
              const hasErr = st.fields.some((f) => errors[f.id]);
              return (
                <li key={st.title} className="shrink-0">
                  <button type="button" onClick={() => setStep(i)} aria-current={i === step ? "step" : undefined}
                    className={cn("flex items-center gap-2 rounded-full border-2 px-3 py-1.5 text-sm font-semibold", i === step ? "border-ink bg-ink text-cream" : "border-ink/30 bg-card hover:border-ink", hasErr && "border-destructive text-destructive")}>
                    <span className="tabular-nums font-semibold">{i + 1}</span>{st.title}
                  </button>
                </li>
              );
            })}
          </ol>

          <FieldMemory className="grid gap-5 rounded-3xl border-2 border-ink bg-card p-5 shadow-block md:p-7">
            <div>
              <h2 className="text-xl font-bold">{s.title}</h2>
              {s.hint && <p className="text-sm text-muted-foreground mt-1">{s.hint}</p>}
            </div>
            {s.fields.map((f) => <FieldInput key={f.id} field={f} value={content[f.id]} onChange={(v) => set(f.id, v)} error={errors[f.id]} />)}
            <div className="flex items-center justify-between gap-3 pt-2">
              <Button variant="outline" className="h-11" disabled={step === 0} onClick={() => setStep(step - 1)}><ArrowLeft className="h-4 w-4 mr-2" /> Back</Button>
              {last ? (
                <Button className="h-11" disabled={!!busy} onClick={() => publish()}>{busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}{busy ?? cta}</Button>
              ) : (
                <Button className="h-11" onClick={() => setStep(step + 1)}>Next step <ArrowRight className="h-4 w-4" /></Button>
              )}
            </div>
          </FieldMemory>

          <div className="flex flex-wrap gap-2 text-sm">
            <Button variant="ghost" size="sm" onClick={() => { setContent(blank(product)); setStep(0); }}><Eraser className="h-4 w-4" /> Clear the example text</Button>
            <Button variant="ghost" size="sm" onClick={() => { setContent({ ...product.sample }); setErrors({}); }}><RotateCcw className="h-4 w-4" /> Bring back the example</Button>
            {isAdmin && !published && <Button variant="outline" size="sm" disabled={!!busy} onClick={() => publish(true)}>Publish free (admin test)</Button>}
          </div>
        </section>

        <aside className={cn("md:sticky md:top-24 self-start", tab === "edit" && "hidden md:block")} aria-label="Live preview">
          <p className="mb-3 hidden items-center gap-2 text-sm font-bold md:flex"><Eye className="h-4 w-4" /> Live preview · this is what people will see</p>
          <div className="mx-auto w-full max-w-[400px] overflow-hidden rounded-[2.4rem] border-[10px] border-ink bg-ink shadow-block-lg">
            {/* The transform makes this box the containing block for the page's fixed bars and sheets;
                it must not scroll itself, or they would scroll away with the content. */}
            <div className="ip-frame relative h-[calc(100svh-220px)] md:h-[720px] overflow-hidden bg-background" style={{ transform: "translateZ(0)", ["--ip-vh" as string]: "640px" }}>
              <div className="h-full overflow-y-auto overflow-x-hidden">
                <ProductRenderer product={product} theme={theme} content={content} mode="preview" pageUrl={pageUrlFor(published?.slug)} />
              </div>
            </div>
          </div>
        </aside>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-[auto_1fr] gap-3 border-t-2 border-ink bg-card px-4 pb-[calc(12px+env(safe-area-inset-bottom,0px))] pt-3 md:hidden">
        <div className="grid grid-cols-2 rounded-xl border-2 border-ink bg-sand p-1">
          <button type="button" onClick={() => setTab("edit")} aria-pressed={tab === "edit"} className={cn("flex items-center gap-1.5 rounded-lg px-3 text-sm font-bold", tab === "edit" && "bg-ink text-cream")}><PencilLine className="h-4 w-4" /> Edit</button>
          <button type="button" onClick={() => setTab("preview")} aria-pressed={tab === "preview"} className={cn("flex items-center gap-1.5 rounded-lg px-3 text-sm font-bold", tab === "preview" && "bg-ink text-cream")}><Eye className="h-4 w-4" /> Preview</button>
        </div>
        <Button className="h-12" disabled={!!busy} onClick={() => publish()}>{busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}{busy ? "Working…" : cta}</Button>
      </nav>

      <LoginPromptDialog open={loginOpen} onOpenChange={setLoginOpen} returnTo={`/create/${product.id}?publish=1`} />
    </div>
  );
}

function blank(p: Product): Content {
  const c: Content = {};
  p.steps.forEach((s) => s.fields.forEach((f) => { if (f.type === "toggle") c[f.id] = p.sample[f.id] ?? true; if (f.type === "days") c[f.id] = p.sample[f.id]; if (f.type === "time") c[f.id] = p.sample[f.id]; }));
  return c;
}

function NotFoundProduct() {
  return (
    <div className="min-h-screen grid place-items-center px-4 text-center">
      <div className="grid gap-4">
        <h1 className="text-2xl font-bold">That product isn't available</h1>
        <p className="text-muted-foreground">It may have been renamed or retired.</p>
        <Button asChild><Link to="/create">See all products</Link></Button>
      </div>
    </div>
  );
}
