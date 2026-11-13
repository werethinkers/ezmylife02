import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, ChevronDown, Eye, Loader2, PencilLine, RotateCcw, Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { LoginPromptDialog } from "@/components/auth/LoginPromptDialog";
import { PageSeo } from "@/components/seo/PageSeo";
import { getProduct } from "@/instant/catalog";
import { ProductRenderer } from "@/instant/renderers";
import { DesignRail, styleLabel } from "@/instant/DesignPreview";
import { FieldInput } from "@/instant/builder/FieldInput";
import { clearDraft, readDraft, readFullDraft, writeDraft, type Draft } from "@/instant/draftStore";
import { FieldMemory } from "@/apps/shell/FieldMemory";
import { useProducts } from "@/instant/useProducts";
import { useRefreshWallet, useWallet } from "@/hooks/useWallet";
import { fmtCredits } from "@/lib/creditRate";
import { checkout, createPage, getMyPage, getShop, rememberShop, republish, savePage, tagShopOnce, uploadContentImages, publishPrepaid, payPageWithCredits } from "@/instant/api";
import { nameFromParam } from "@/instant/festLang";
import { isMobile, pageUrlFor, titleOf } from "@/instant/util";
import type { Content, Field, Product } from "@/instant/types";
import { cn } from "@/lib/utils";
import { FlowSteps } from "@/components/brand/FlowSteps";
import { WEBSITE_CATEGORIES } from "@/components/brand/nav";

const SAMPLE_GUARDED = ["reviews", "rating", "reviews_count", "team", "stats"];

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
  // Websites and cards are paid in credits only. Short of credits, the person buys a pack and comes back.
  const listed = list.find((l) => l.product.id === product.id);
  const { total: balance } = useWallet();
  const refreshWallet = useRefreshWallet();
  const needCredits = listed?.credits ?? 0;
  const canPayCredits = !!user && needCredits > 0 && balance >= needCredits;
  // ?design=<theme id> opens a specific design (used by the kit links), unless a saved page is being edited.
  const wantedDesign = params.get("design");
  const initial = useMemo<Draft>(() => {
    const base = readDraft(product.id) ?? { variantId: product.themes[0].id, content: { ...product.sample } };
    const withDesign = wantedDesign && !editId && product.themes.some((t) => t.id === wantedDesign) ? { ...base, variantId: wantedDesign } : base;
    if (editId) return withDesign;
    // From a card ("make your own"): ?sender=<their name>. From a shop's QR: ?shop=<shop slug>, which puts the shop's offer on the card.
    const sender = nameFromParam(params.get("sender"));
    const shop = params.get("shop");
    const hasSender = product.steps.some((st) => st.fields.some((f) => f.id === "sender"));
    const extra: Content = {};
    if (sender && hasSender) extra.sender = sender;
    if (shop && /^[a-z0-9][a-z0-9-]{1,40}$/.test(shop) && product.family === "festival") extra.shop = shop;
    return Object.keys(extra).length ? { ...withDesign, content: { ...withDesign.content, ...extra } } : withDesign;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product]);
  const [variantId, setVariantId] = useState(initial.variantId);
  const [content, setContent] = useState<Content>(initial.content);
  const [pageId, setPageId] = useState<string | undefined>(editId ?? initial.pageId);
  const [published, setPublished] = useState<{ slug: string } | null>(null);
  // -1: every step closed (how the form starts).
  const [step, setStep] = useState(-1);
  // Which step has its "More details" fold open (it closes when another step opens).
  const [moreOpen, setMoreOpen] = useState(-1);
  // Open one step and bring it into view (opening it closes the one that was open).
  const openStep = useCallback((i: number) => {
    setStep(i);
    setMoreOpen(-1);
    if (i >= 0) requestAnimationFrame(() => document.getElementById(`step-${i}`)?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }, []);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [busy, setBusy] = useState<string | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const theme = product.themes.find((t) => t.id === variantId) ?? product.themes[0];

  // A shop QR: remember the shop for this person, and show its name so they can keep or remove the offer.
  const shopSlug = typeof content.shop === "string" ? content.shop : null;
  const [shopName, setShopName] = useState<string | null>(null);
  useEffect(() => {
    const qs = params.get("shop");
    if (qs && /^[a-z0-9][a-z0-9-]{1,40}$/.test(qs)) rememberShop(qs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { if (user) tagShopOnce(); }, [user]);
  useEffect(() => {
    if (!shopSlug) { setShopName(null); return; }
    getShop(shopSlug).then((s) => setShopName(s?.name ?? null), () => setShopName(null));
  }, [shopSlug]);

  // A draft with many photos lives in IndexedDB; bring its photos back once it has loaded.
  useEffect(() => {
    if (editId || !readDraft(product.id)?.idb) return;
    readFullDraft(product.id).then((d) => { if (d) { setContent(d.content); setVariantId(wantedDesign && product.themes.some((t) => t.id === wantedDesign) ? wantedDesign : d.variantId); } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id, editId]);

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
    const t = setTimeout(() => { void writeDraft(product.id, { variantId, content, pageId }); }, 400);
    return () => clearTimeout(t);
  }, [product.id, variantId, content, pageId, editId]);

  const set = (id: string, v: unknown) => { setContent((c) => ({ ...c, [id]: v })); if (errors[id]) setErrors((e) => { const n = { ...e }; delete n[id]; return n; }); };

  const publish = useCallback(async (free = false) => {
    const bad = validate(product, content);
    if (bad) { setErrors(bad.errors); openStep(bad.step); setTab("edit"); toast({ title: "A few details are missing", description: "Fill the highlighted fields to publish." }); return; }
    if (!user) {
      await writeDraft(product.id, { variantId, content, pageId });
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
      void writeDraft(product.id, { variantId, content: uploaded, pageId: id });

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
        clearDraft(product.id);
        toast({ title: "Published with your kit", description: "This one was already paid for." });
        navigate(`/create/done/${id}`); return;
      }

      if (needCredits > 0 && !free) {
        if (!canPayCredits) {
          // Not enough credits: the page and draft are saved, so after buying it opens here and publishes.
          setBusy(null);
          toast({ title: `This needs ${fmtCredits(needCredits)}`, description: `You have ${fmtCredits(balance)}. Buy credits and you'll come straight back to publish.` });
          navigate(`/credits?next=${encodeURIComponent(`/create/${product.id}?publish=1`)}`); return; // the saved draft carries the page id
        }
        setBusy("Paying with credits…");
        try {
          const paid = await payPageWithCredits(id);
          if (paid.published) {
            clearDraft(product.id);
            refreshWallet();
            toast({ title: paid.charged ? `${fmtCredits(paid.charged)} used` : "Your page is live", description: paid.charged ? "Your page is live." : undefined });
            navigate(`/create/done/${id}`); return;
          }
        } catch (e) {
          // Paying with credits is one database transaction (charge, order, publish), so a failure means
          // nothing was charged. If it did go through and only the answer was lost, a retry sees the page is live.
          refreshWallet();
          throw e;
        }
      }

      // Free products, and admins testing with "Publish free".
      setBusy("Publishing…");
      const order = await checkout({ action: "create", page_id: id, free });
      if (order.published) { clearDraft(product.id); refreshWallet(); navigate(`/create/done/${id}`); return; }
      throw new Error("Couldn't publish. Please try again.");
    } catch (e) {
      setBusy(null);
      toast({ title: "Couldn't publish", description: e instanceof Error ? e.message : "Please try again.", variant: "destructive" });
    }
  }, [product, content, user, variantId, pageId, published, navigate, toast, canPayCredits, needCredits, balance, refreshWallet, openStep]);

  // Coming back from sign-in with ?publish=1 continues straight to checkout.
  useEffect(() => {
    if (params.get("publish") === "1" && user && !busy) { params.delete("publish"); setParams(params, { replace: true }); publish(); }
  }, [params, user, busy, publish, setParams]);

  const isSite = (WEBSITE_CATEGORIES as readonly string[]).includes(product.category);
  const cta = published ? "Update live page" : needCredits ? `Use ${fmtCredits(needCredits)} and publish` : "Publish free";
  // The phone's bottom bar is narrow, so it gets a shorter label.
  const ctaShort = published ? "Update live page" : needCredits ? `Publish · ${fmtCredits(needCredits)}` : "Publish free";

  return (
    <div className="min-h-screen bg-background">
      <PageSeo title={`Create a ${product.name} | EZYOURLIFE`} description={product.description} path={`/create/${product.id}`} />
      <header className="sticky top-0 z-40 border-b-2 border-ink bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center gap-3">
          <Link to={`/make/${product.id}`} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-ink bg-card shadow-[2px_2px_0_0_hsl(var(--ink))] hover:bg-sun" aria-label="Back to the design"><ArrowLeft className="h-5 w-5" /></Link>
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold">{product.glyph} {product.name}</p>
            <p className="truncate text-xs text-muted-foreground">{published ? `Live at ${pageUrlFor(published.slug).replace("https://", "")}` : `${needCredits ? `${fmtCredits(needCredits)}, paid once${user ? ` · you have ${fmtCredits(balance)}` : ""}` : "Free"} · online for a year`}</p>
          </div>
          <Button className="hidden h-11 md:inline-flex" disabled={!!busy} onClick={() => publish()}>{busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}{busy ?? cta}</Button>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 pt-5">
        <FlowSteps flow={isSite ? "website" : "card"} step={2} className="max-w-3xl" />
      </div>

      {/* grid-cols-1 on the section is what keeps it phone-wide: without it the column grows to its widest
          child's minimum width and the whole page ends up wider than the screen. overflow-x-clip is the safety net. */}
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 overflow-x-clip px-4 py-6 pb-32 md:grid-cols-[minmax(0,1fr)_420px] md:pb-10">
        <section className={cn("grid grid-cols-1 gap-6 content-start min-w-0", tab === "preview" && "hidden md:grid")} aria-label="Edit">
          <div className="grid gap-2">
            <h1 className="font-display text-2xl font-extrabold md:text-3xl">{product.name}</h1>
            <p className="text-[16px] text-muted-foreground">{product.description}</p>
            <p className="text-sm font-semibold">
              <span className="md:hidden">Open each step to fill it, then tap Preview to see your {isSite ? "website" : "card"}.</span>
              <span className="hidden md:inline">Open a step on the left to fill it. Your {isSite ? "website" : "card"} changes on the right as you type.</span>
            </p>
          </div>

          {shopSlug && shopName && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-ink bg-sun px-4 py-3">
              <p className="text-sm font-semibold">Your card will carry {shopName}'s Diwali offer at the bottom.</p>
              <Button type="button" variant="outline" size="sm" className="border-2 border-ink bg-card" onClick={() => setContent((c) => { const n = { ...c }; delete n.shop; return n; })}>Remove offer</Button>
            </div>
          )}

          <div className="grid gap-2">
            <p className="text-sm font-bold">Choose a design <span className="font-semibold text-muted-foreground">· {theme.name}, {styleLabel(theme).toLowerCase()} ({product.themes.findIndex((t) => t.id === theme.id) + 1} of {product.themes.length})</span></p>
            <DesignRail product={product} value={theme.id} onChange={setVariantId} />
          </div>

          {/* The steps are an accordion: all closed at first so the form never feels long, one open at a time,
              Next opens the following step, and a missing field opens the step it is in. */}
          <FieldMemory className="grid grid-cols-1 gap-3">
            <p className="text-sm font-bold">{product.steps.length} steps <span className="font-semibold text-muted-foreground">· tap a step to fill it</span></p>
            {product.steps.map((st, i) => {
              const isOpen = i === step;
              const errs = st.fields.filter((f) => errors[f.id]).length;
              const filled = st.fields.filter((f) => { const v = content[f.id]; return Array.isArray(v) ? v.length > 0 : v != null && String(v).trim() !== ""; }).length;
              const isLast = i === product.steps.length - 1;
              return (
                <div key={st.title} id={`step-${i}`} className={cn("scroll-mt-24 rounded-3xl border-2 bg-card transition-shadow", errs ? "border-destructive" : "border-ink", isOpen ? "shadow-block" : "shadow-[2px_2px_0_0_hsl(var(--ink))]")}>
                  <button type="button" aria-expanded={isOpen} aria-controls={`step-body-${i}`} onClick={() => openStep(isOpen ? -1 : i)}
                    className="flex w-full items-center gap-3 rounded-3xl px-4 py-4 text-left md:px-5">
                    <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-ink text-sm font-bold tabular-nums", errs ? "bg-destructive text-white" : isOpen ? "bg-ink text-cream" : filled === st.fields.length && filled > 0 ? "bg-lime" : "bg-card")}>
                      {errs ? "!" : filled === st.fields.length && filled > 0 && !isOpen ? <Check className="h-4 w-4" /> : i + 1}
                    </span>
                    <span className="grid min-w-0 flex-1">
                      <span className="truncate font-bold">{st.title}</span>
                      <span className={cn("truncate text-xs font-semibold", errs ? "text-destructive" : "text-muted-foreground")}>{errs ? `${errs} to fix` : `${filled} of ${st.fields.length} filled`}</span>
                    </span>
                    <ChevronDown className={cn("h-5 w-5 shrink-0 transition-transform", isOpen && "rotate-180")} aria-hidden="true" />
                  </button>
                  {isOpen && (
                    <div id={`step-body-${i}`} className="grid grid-cols-1 gap-5 border-t-2 border-ink/15 px-4 pb-5 pt-4 md:px-5">
                      {st.hint && <p className="-mt-1 text-sm text-muted-foreground">{st.hint}</p>}
                      {(() => {
                        // A long step shows its first fields and anything required or wrong; the other optional
                        // fields sit in one "More details" fold, so the step never feels like a long form.
                        const long = st.fields.length > 5;
                        const main = st.fields.filter((f, k) => !long || k < 4 || f.required || errors[f.id]);
                        const more = st.fields.filter((f) => !main.includes(f));
                        const input = (f: Field) => <FieldInput key={f.id} field={f} value={content[f.id]} onChange={(v) => set(f.id, v)} error={errors[f.id]} />;
                        return (
                          <>
                            {main.map(input)}
                            {more.length > 0 && (
                              <details className="group rounded-2xl border bg-muted/20" onToggle={(e) => { const o = (e.currentTarget as HTMLDetailsElement).open; setMoreOpen((m) => (o ? i : m === i ? -1 : m)); }} open={moreOpen === i}>
                                <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
                                  <span className="grid min-w-0 flex-1">
                                    <span className="text-sm font-bold">More details <span className="font-semibold text-muted-foreground">· optional</span></span>
                                    <span className="truncate text-xs text-muted-foreground">{more.map((f) => f.label).join(", ")}</span>
                                  </span>
                                  <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
                                </summary>
                                <div className="grid gap-5 border-t px-4 pb-4 pt-4">{more.map(input)}</div>
                              </details>
                            )}
                          </>
                        );
                      })()}
                      <div className="flex items-center justify-between gap-3 pt-1">
                        <Button variant="outline" className="h-11 shrink-0" onClick={() => openStep(-1)}>Close</Button>
                        {isLast ? (
                          // On a phone the bottom bar already carries the publish button, so it isn't repeated here.
                          <>
                            <Button className="hidden h-11 md:inline-flex" disabled={!!busy} onClick={() => publish()}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}{busy ?? cta}</Button>
                            <p className="min-w-0 text-right text-sm font-semibold text-muted-foreground md:hidden">All set. Check Preview, then publish below.</p>
                          </>
                        ) : (
                          <Button className="h-11" onClick={() => openStep(i + 1)}>Next step <ArrowRight className="h-4 w-4" /></Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </FieldMemory>

          <div className="flex flex-wrap gap-2 text-sm">
            <Button variant="ghost" size="sm" onClick={() => { setContent(blank(product)); openStep(0); }}><Eraser className="h-4 w-4" /> Clear the example text</Button>
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

      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t-2 border-ink bg-card px-4 pb-[calc(12px+env(safe-area-inset-bottom,0px))] pt-3 md:hidden">
        <div className="flex shrink-0 rounded-xl border-2 border-ink bg-sand p-1">
          <button type="button" onClick={() => setTab("edit")} aria-pressed={tab === "edit"} className={cn("inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-sm font-bold", tab === "edit" && "bg-ink text-cream")}><PencilLine className="h-4 w-4" /> Edit</button>
          <button type="button" onClick={() => setTab("preview")} aria-pressed={tab === "preview"} className={cn("inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-sm font-bold", tab === "preview" && "bg-ink text-cream")}><Eye className="h-4 w-4" /> Preview</button>
        </div>
        <Button className="h-12 min-w-0 flex-1 px-3" disabled={!!busy} onClick={() => publish()}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}<span className="truncate">{busy ? "Working…" : ctaShort}</span></Button>
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
