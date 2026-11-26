import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import {
  Loader2,
  Zap,
  ShieldCheck,
  Globe,
  Wallet,
  Mail,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Check,
  Heart,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToolPricing } from "@/hooks/useToolPricing";
import { useToolsCatalog, type CatalogTool } from "@/hooks/useToolsCatalog";
import { useFavorites, useToggleFavorite } from "@/hooks/useFavorites";
import { resolveToolMedia } from "@/lib/toolMedia";
import { CREDIT_PACKS } from "@/data/creditPacks";
import LoginPromptDialog from "@/components/auth/LoginPromptDialog";
import { SEOHead } from "@/components/SEOHead";
import { AppIcon } from "@/components/store/AppIcon";
import { ToolCard } from "@/components/modern/ToolCard";
import { ModernPage } from "@/components/modern/ModernPage";
import { ModernSteps } from "@/components/modern/ModernSteps";
import { ShareButton } from "@/components/modern/ShareButton";
import { MetricsStrip } from "@/components/modern/MetricsStrip";
import { AboutCard } from "@/components/modern/AboutCard";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { BTN_PRIMARY, BTN_OUTLINE, CARD, CONTAINER, FOCUS_RING } from "@/components/modern/styles";
import { categoryInfo, goalOf, inCategory, KIND_TEXT } from "@/data/goals";
import { appIntroOf, appKindOf, appStepsOf } from "@/data/appKind";
import { STUDIO_IDS } from "@/data/studios";
import { OUTPUT_FORMAT } from "@/data/outputFormat";
import { formatSummary } from "@/apps/output/choice";
import { CATALOG, getProduct } from "@/instant/catalog";
import ProductPromo from "@/pages/instant/ProductPromo";
import { cn } from "@/lib/utils";

/*
 * Promo (landing) page for one item, at /promo/:slug — a tool/business app, a studio, a website
 * design or a card/invite design:
 *  - A tool/studio slug: if an admin has published a curated page in `tool_promo_pages`, its copy
 *    is used; otherwise the page is built from the public `tools_catalog` entry. Every live app
 *    and studio gets a page the moment it goes live, with no separate action needed.
 *  - A website/card slug: there is no curated-page table for designs, so this renders the same
 *    page as /make/:id (ProductPromo) — the one real landing page for that design — at the
 *    /promo/:slug address, with its canonical tag pointing to /make/:id.
 *
 * Ratings, review counts, "loved by" lines and testimonials stored on promo rows were
 * AI-generated, not collected from customers, so they are deliberately never rendered.
 */

interface GalleryImage {
  url: string;
  caption?: string;
  kind?: string;
}

interface PromoRow {
  tool_id: string;
  slug: string;
  hero_eyebrow: string | null;
  hero_title: string | null;
  hero_title_accent: string | null;
  hero_subtitle: string | null;
  hero_image_url: string | null;
  hero_chips: Array<{ label: string }> | null;
  cta_label: string | null;
  features: Array<{ title: string; body: string }> | null;
  how_it_works: Array<{ title: string; body: string }> | null;
  final_cta_title: string | null;
  final_cta_subtitle: string | null;
  trust_logos: Array<{ name: string; url?: string }> | null;
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
  gallery_images: GalleryImage[] | null;
}

interface Step {
  title: string;
  body: string;
}

const promoSlug = (name: string) =>
  name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const GUARANTEES = [
  { Icon: Wallet, title: "Pay per use", body: "Buy credits from ₹10. No lock-in." },
  { Icon: Globe, title: "Nothing to install", body: "Runs right in your browser." },
  { Icon: ShieldCheck, title: "Secure checkout", body: "Payments handled by Razorpay." },
  { Icon: Mail, title: "Need help?", body: "Write to support@ezyourlife.com" },
];

// Below md: a single-row snap-scroll strip so cards peek in from the right; at md+ this is a plain grid.
const ROW_CLASS = "flex overflow-x-auto snap-x snap-mandatory items-stretch gap-3.5 pb-3 -mx-4 px-4 scroll-px-4 no-scrollbar md:grid md:gap-4 md:pb-0 md:mx-0 md:px-0";
// A width (not just a min-width) so the card's own text wraps instead of stretching the card to fit it unwrapped.
const CARD_ITEM = "w-[82vw] max-w-[320px] shrink-0 snap-start whitespace-normal break-words md:w-auto md:max-w-none md:min-w-0 self-stretch";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
} as const;

export default function PromoPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const { data: catalog = [], isLoading: catalogLoading } = useToolsCatalog();

  const [row, setRow] = useState<PromoRow | null>(null);
  const [rowLoaded, setRowLoaded] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const howRef = useRef<HTMLElement | null>(null);

  // Curated page, if an admin has published one (RLS only returns published rows to visitors).
  useEffect(() => {
    let cancelled = false;
    setRowLoaded(false);
    (async () => {
      const { data } = await supabase.from("tool_promo_pages").select("*").eq("slug", slug).maybeSingle();
      if (cancelled) return;
      setRow((data as unknown as PromoRow) ?? null);
      setRowLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const tool: CatalogTool | undefined = useMemo(() => {
    if (row) return catalog.find((t) => t.id === row.tool_id);
    return catalog.find((t) => t.is_live && (promoSlug(t.name) === slug || t.id === slug));
  }, [row, catalog, slug]);

  // Not a tool and not a curated row: a website or card slug, if the store has one by this id or name.
  const product = useMemo(() => {
    if (tool || row) return undefined;
    return getProduct(slug) ?? CATALOG.find((p) => promoSlug(p.name) === slug);
  }, [tool, row, slug]);

  const toolId = row?.tool_id ?? tool?.id;
  const pageSlug = row?.slug ?? slug;
  const isStudio = !!toolId && STUDIO_IDS.has(toolId);
  const { creditCost } = useToolPricing(toolId);
  const creditLabel = `${creditCost} credit${creditCost === 1 ? "" : "s"}`;
  const { favorites } = useFavorites();
  const { toggle: toggleFavorite, loginOpen: favLoginOpen, setLoginOpen: setFavLoginOpen } = useToggleFavorite();
  const isFav = !!toolId && favorites.has(toolId);

  // Auto-launch after login if ?launch=1 is present.
  useEffect(() => {
    if (!authLoading && user && toolId && searchParams.get("launch") === "1") {
      navigate(`/tool/${toolId}`, { replace: true });
    }
  }, [authLoading, user, toolId, searchParams, navigate]);

  const handleUseIt = async () => {
    if (!toolId) return;
    if (!user) {
      try {
        localStorage.setItem("auth_redirect_to", `/promo/${pageSlug}?launch=1`);
      } catch {
        /* storage unavailable */
      }
      setLoginOpen(true);
      return;
    }
    // Opening an app is free; credits are only used when the app produces a result.
    navigate(`/tool/${toolId}`);
  };

  if (!rowLoaded || (catalogLoading && !row)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F6F2] dark:bg-[#0F1115]">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600 dark:text-orange-400" aria-label="Loading" />
      </div>
    );
  }

  if (!row && !tool) {
    // A website or card: the one real landing page for it already exists at /make/:id — show that,
    // at this address, rather than a second copy of it.
    if (product) return <ProductPromo productIdOverride={product.id} pathOverride={`/promo/${slug}`} />;

    return (
      <ModernPage>
        <SEOHead title="Not found — EZYOURLIFE" description="This page could not be found." path={`/promo/${slug}`} noindex />
        <div className={cn(CONTAINER, "flex flex-col items-center py-24 text-center")}>
          <h1 className="font-display text-3xl font-bold">We couldn't find that</h1>
          <p className="mt-3 max-w-md text-zinc-600 dark:text-zinc-400">It may have been renamed. Browse the store to find it.</p>
          <Link to="/ai-apps" className={cn(BTN_PRIMARY, "mt-6")}>
            Browse AI apps
          </Link>
        </div>
      </ModernPage>
    );
  }

  const name = tool?.name ?? row?.hero_title ?? "AI App";
  const category = tool?.category ?? "";
  const media = resolveToolMedia(toolId ?? "", category, tool ?? null);

  const title = row?.hero_title ?? name;
  const titleAccent = row?.hero_title_accent ?? null;
  const subtitle = row?.hero_subtitle ?? tool?.description ?? "";
  const customEyebrow = row?.hero_eyebrow ?? null;
  const chips = (row?.hero_chips ?? []).map((c) => c?.label).filter(Boolean) as string[];
  const typeLabel = isStudio ? "Studio" : "Business app";
  const ctaLabel = row?.cta_label ?? (isStudio ? "Launch Studio" : `Open ${name}`);
  const features = (row?.features ?? []).filter((f) => f?.title);
  const steps: Step[] =
    row?.how_it_works && row.how_it_works.length >= 3
      ? row.how_it_works.slice(0, 3)
      : [
          { title: "Open the app", body: `Sign in and open ${name} in your browser. Nothing to install.` },
          { title: "Add your input", body: "Type your details or upload your file." },
          { title: "Get your result", body: "Review it, then copy or download the output." },
        ];
  const trustLogos = (row?.trust_logos ?? []).filter((l) => l?.name);

  // Gallery: catalog preview → app UI → output → promotional, then any leftovers (max 4).
  const gallery = (row?.gallery_images ?? []).filter((g) => g?.url);
  const byKind = (kinds: string[]) => gallery.find((g) => kinds.includes((g.kind ?? "").toLowerCase()));
  const ordered: Array<GalleryImage | null> = [
    media.previewImageUrl ? { url: media.previewImageUrl, caption: "Preview" } : null,
    byKind(["screenshot", "input", "app", "interface"]) ?? null,
    byKind(["output", "result", "results"]) ?? null,
    byKind(["promotional", "promo", "hero", "compare"]) ??
      (row?.hero_image_url ? { url: row.hero_image_url, caption: "In action" } : null),
  ];
  const used = new Set(ordered.filter(Boolean).map((s) => s!.url));
  const leftovers = gallery.filter((g) => !used.has(g.url));
  const slides = ordered.map((s) => s ?? leftovers.shift() ?? null).filter(Boolean).slice(0, 4) as GalleryImage[];

  const related = catalog
    .filter((t) => t.is_live && inCategory(t, category) && t.id !== toolId)
    .slice(0, 6);

  const minPack = CREDIT_PACKS[0];
  const scrollToHow = () => howRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const tryButton = (className = "") => (
    <button type="button" onClick={handleUseIt} className={cn(BTN_PRIMARY, "h-auto min-h-12 px-6 py-2.5 text-base", className)}>
      <Zap className="mr-2 h-5 w-5" aria-hidden />
      <span className="text-left leading-tight">
        <span className="block font-semibold">{ctaLabel}</span>
        <span className="block text-xs font-semibold opacity-80">{creditCost > 0 ? `${creditLabel} per result` : "Free to use"}</span>
      </span>
    </button>
  );

  const goal = goalOf(category);
  const info = categoryInfo(category);
  const kind = KIND_TEXT[appKindOf(toolId, category)];
  const intro = row?.hero_subtitle ?? appIntroOf(toolId) ?? tool?.description ?? "";
  const engineSteps = appStepsOf(toolId);
  const howSteps: Step[] =
    row?.how_it_works && row.how_it_works.length >= 3
      ? steps
      : engineSteps && engineSteps.length >= 3
        ? engineSteps.slice(0, 3).map((t, i) => ({ title: t, body: [`Give ${info.give}.`, "The app does the work in seconds.", `Get ${info.get}.`][i] }))
        : [
            { title: "Open the app", body: `${name} opens in your browser. Nothing to install.` },
            { title: `Give ${info.give}`, body: "Type it in or upload a file. Examples are filled in for you." },
            { title: `Get ${info.get}`, body: "Check it, then copy, download or send it on WhatsApp." },
          ];

  return (
    <MotionConfig reducedMotion="user">
      <ModernPage section={isStudio ? "studios" : "apps"}>
        <SEOHead
          title={row?.seo_title ?? `${name} — ${typeLabel} on EZYOURLIFE`}
          description={row?.seo_description ?? subtitle.slice(0, 160)}
          image={row?.og_image_url ?? row?.hero_image_url ?? media.previewImageUrl ?? undefined}
          path={`/promo/${pageSlug}`}
          canonicalPath={toolId ? `/tool/${toolId}` : undefined}
        />

        {/* ───────── Hero ───────── */}
        <section className={cn(CONTAINER, "pb-10 pt-6 md:pt-8")}>
          <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1.5 text-sm font-medium text-zinc-500 dark:text-zinc-400">
            <Link to={isStudio ? "/studios" : "/ai-apps"} className={cn("underline underline-offset-4 hover:text-zinc-900 dark:hover:text-white", FOCUS_RING)}>
              {isStudio ? "Studios" : "Business apps"}
            </Link>
            {category && !isStudio && (
              <>
                <span aria-hidden>›</span>
                <Link to={`/ai-apps?goal=${goal.id}`} className={cn("underline underline-offset-4 hover:text-zinc-900 dark:hover:text-white", FOCUS_RING)}>{goal.name}</Link>
                <span aria-hidden>›</span>
                <Link to={`/ai-apps?category=${encodeURIComponent(category)}`} className={cn("underline underline-offset-4 hover:text-zinc-900 dark:hover:text-white", FOCUS_RING)}>{category}</Link>
              </>
            )}
          </nav>
          <ModernSteps flow="app" step={1} className="mb-8 max-w-3xl" />

          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between md:gap-10">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="min-w-0 flex-1 space-y-5 md:max-w-2xl">
              <div className="flex items-center gap-4">
                <AppIcon toolId={toolId ?? ""} category={category} name={name} size="lg" className="border-zinc-200 shadow-soft-sm dark:border-zinc-800 md:h-24 md:w-24" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center whitespace-nowrap rounded-full border-[1.5px] border-foreground bg-primary px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary-foreground">
                      {typeLabel}
                    </span>
                    <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500">By EZYOURLIFE</span>
                  </div>
                  {customEyebrow && <p className="mt-1 text-sm font-semibold text-zinc-500 dark:text-zinc-400">{customEyebrow}</p>}
                </div>
              </div>

              <h1 className="font-display text-[2rem] font-extrabold leading-[1.08] sm:text-5xl md:text-4xl md:leading-tight xl:text-[3.4rem]">
                {title}
                {titleAccent && (
                  <>
                    {" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-amber-500 to-rose-500">{titleAccent}</span>
                  </>
                )}
              </h1>

              {intro && <p className="max-w-xl whitespace-pre-line text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">{intro}</p>}

              <MetricsStrip
                className="max-w-lg"
                cells={[
                  { value: creditCost > 0 ? creditLabel : "Free", label: creditCost > 0 ? "Pay per result" : "No cost" },
                  { value: formatSummary(toolId) ?? OUTPUT_FORMAT[appKindOf(toolId, category)], label: "Format" },
                  { value: "100 Free", label: "Starter credits", accent: true },
                ]}
              />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }} className="flex shrink-0 flex-col items-stretch gap-3 md:items-end">
              <div className="flex flex-col gap-2.5 sm:flex-row md:gap-4">
                {tryButton("w-full sm:w-auto")}
                <button
                  type="button"
                  onClick={() => document.getElementById("preview-carousel")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  className={cn(BTN_OUTLINE, "h-12 px-5")}
                >
                  Preview sample
                </button>
              </div>
              <div className="flex items-center gap-3 md:self-end">
                <button
                  type="button"
                  onClick={() => toolId && toggleFavorite(toolId, isFav)}
                  aria-pressed={isFav}
                  aria-label={isFav ? "Remove from saved" : "Save for later"}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                >
                  <Heart className={cn("h-4 w-4", isFav && "fill-rose-500 text-rose-500")} aria-hidden />
                </button>
                <ShareButton path={`/promo/${pageSlug}`} />
              </div>
              <p className="max-w-[280px] text-sm text-zinc-500 dark:text-zinc-400 md:text-right">
                {user
                  ? `Opening ${isStudio ? "a studio" : "an app"} is free. Credits are used only when it gives you a result.`
                  : "Try with 100 free credits — no card needed."}
              </p>
            </motion.div>
          </div>

          <motion.div
            id="preview-carousel"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="mt-10 min-w-0 scroll-mt-20"
          >
            <h2 className="mb-4 font-display text-xl font-bold md:text-2xl">Preview &amp; sample outputs</h2>
            {slides.length > 0 ? (
              <PreviewGallery slides={slides} altBase={name} />
            ) : (
              <IconHero name={name} toolId={toolId ?? ""} category={category} get={info.get} />
            )}
          </motion.div>
        </section>

        {/* ───────── About this app/studio ───────── */}
        <section className={cn(CONTAINER, "pb-12 md:pb-16")}>
          <AboutCard
            title={`About this ${isStudio ? "studio" : "app"}`}
            description={intro}
            giveItems={[info.give]}
            getItems={[info.get, kind.line, creditCost > 0 ? `${creditLabel} each time it gives you a result — nothing charged if it fails` : "Free to use, every time"]}
            tags={[category, goal.name, isStudio ? "Guided studio" : "No install needed", ...chips].filter(Boolean).slice(0, 6)}
          />
        </section>

        {/* ───────── Trust logos (only when real logos are added in admin) ───────── */}
        {trustLogos.length > 0 && (
          <section className={cn(CONTAINER, "pt-4")}>
            <p className="mb-4 text-center text-xs font-bold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">Used by</p>
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
              {trustLogos.map((l) => <TrustLogo key={l.name} name={l.name} url={l.url} />)}
            </div>
          </section>
        )}

        {/* ───────── Features (curated pages) ───────── */}
        {features.length > 0 && (
          <section className={cn(CONTAINER, "py-12 md:py-16")}>
            <h2 className="mb-6 font-display text-2xl font-bold md:text-[2rem]">What you get</h2>
            <div className={cn(ROW_CLASS, "md:grid-cols-3 md:gap-5")}>
              {features.slice(0, 8).map((f) => (
                <div key={f.title} className={cn("flex flex-col gap-2 p-5", CARD, CARD_ITEM)}>
                  <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 dark:bg-orange-950">
                    <Check className="h-5 w-5 text-orange-700 dark:text-orange-300" aria-hidden />
                  </div>
                  <h3 className="text-[18px] font-bold leading-snug">{f.title}</h3>
                  <p className="text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-400">{f.body}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ───────── How it works + price ───────── */}
        <section ref={howRef} id="how-it-works" className="scroll-mt-20 py-12 md:py-16">
          <div className={cn(CONTAINER, "grid gap-6 lg:grid-cols-3")}>
            <div className={cn("min-w-0 p-6 md:p-8 lg:col-span-2", CARD)}>
              <h2 className="font-display text-2xl font-bold md:text-3xl">How it works</h2>
              <div className={cn(ROW_CLASS, "mt-5 md:grid-cols-3 md:gap-5")}>
                {howSteps.map((s, i) => (
                  <div key={s.title + i} className={cn("flex flex-col gap-2.5 rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800", CARD_ITEM)}>
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-100 font-display text-lg font-extrabold text-orange-700 dark:bg-orange-950 dark:text-orange-300">{i + 1}</span>
                    <h3 className="text-[17px] font-bold leading-snug">{s.title}</h3>
                    <p className="text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-400">{s.body}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex min-w-0 flex-col rounded-2xl bg-zinc-950 p-6 text-white shadow-soft-lg dark:bg-zinc-900 md:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-400">Price</p>
              <p className="mt-3 font-display text-5xl font-extrabold tracking-tight">
                {creditCost}
                <span className="ml-2 text-xl font-bold text-white/85">credit{creditCost === 1 ? "" : "s"}</span>
              </p>
              <p className="mt-2 text-[15px] text-white/90">each time {name} gives you a result. If it fails, you are not charged.</p>
              <p className="mt-3 text-[15px] text-white/90">
                Credit packs start at ₹{minPack.inr} for {minPack.credits} credits. New accounts get 100 free credits.
              </p>
              <div className="mt-6 space-y-2.5 lg:mt-auto lg:pt-6">
                <button type="button" onClick={handleUseIt} className={cn(BTN_PRIMARY, "h-12 w-full")}>
                  Try it now <ArrowRight className="h-4 w-4" aria-hidden />
                </button>
                <Link to="/credits" className={cn(BTN_OUTLINE, "h-12 w-full border-white/25 bg-transparent text-white hover:bg-white/10")}>
                  See credit packs
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ───────── Related ───────── */}
        {related.length > 0 && (
          <section className="border-y border-zinc-200 bg-zinc-50 py-12 dark:border-zinc-800 dark:bg-zinc-950/40 md:py-16">
            <div className={CONTAINER}>
              <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl font-bold md:text-3xl">Use it with</h2>
                  <p className="mt-1 text-[15px] text-zinc-600 dark:text-zinc-400">More {category} {isStudio ? "studios" : "apps"} people use alongside this one.</p>
                </div>
                <Link to={isStudio ? "/studios" : `/ai-apps?category=${encodeURIComponent(category)}`} className={cn(BTN_OUTLINE, "h-9 px-3 text-sm")}>
                  See all <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
              <div className={cn(ROW_CLASS, "md:grid-cols-3 lg:grid-cols-6")}>
                {related.map((t) => (
                  <ToolCard key={t.id} tool={t} size="md" className={CARD_ITEM} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ───────── Final CTA + guarantees ───────── */}
        <section className="py-12 md:py-16">
          <div className={CONTAINER}>
            <div className="flex flex-col items-start justify-between gap-6 rounded-3xl border-[1.5px] border-foreground bg-primary p-6 text-primary-foreground shadow-soft-lg md:flex-row md:items-center md:p-10">
              <div className="min-w-0">
                <h2 className="font-display text-2xl font-extrabold md:text-3xl">{row?.final_cta_title ?? `Ready to try ${name}?`}</h2>
                <p className="mt-2 text-foreground/80">
                  {row?.final_cta_subtitle ?? (creditCost > 0 ? `Pay only for results: ${creditLabel} each. Failed runs are never charged.` : "Free to use.")}
                </p>
              </div>
              {tryButton("w-full border-foreground bg-foreground text-background hover:opacity-90 md:w-auto")}
            </div>

            <div className={cn(ROW_CLASS, "mt-10 md:grid-cols-4 md:gap-5")}>
              {GUARANTEES.map(({ Icon, title: t, body }) => (
                <div key={t} className={cn("flex items-start gap-3 p-4", CARD, CARD_ITEM)}>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-950">
                    <Icon className="h-5 w-5 text-orange-700 dark:text-orange-300" aria-hidden />
                  </div>
                  <div>
                    <p className="font-bold">{t}</p>
                    <p className="text-[15px] text-zinc-600 dark:text-zinc-400">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Phone: keep the main action in reach, offset above the modern tab bar */}
        <div className="sticky bottom-[76px] z-30 mx-4 mb-4 flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-[#F7F6F2]/95 p-2.5 pl-4 shadow-soft backdrop-blur-[14px] dark:border-zinc-800 dark:bg-[#0F1115]/95 md:hidden">
          <span className="min-w-0 truncate font-bold">{name}</span>
          <button type="button" onClick={handleUseIt} className={cn(BTN_PRIMARY, "h-10 shrink-0 px-4 text-sm")}>
            {isStudio ? "Launch" : "Try it"} <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <LoginPromptDialog open={loginOpen} onOpenChange={setLoginOpen} returnTo={`/promo/${pageSlug}?launch=1`} />
        <LoginPromptDialog open={favLoginOpen} onOpenChange={setFavLoginOpen} returnTo={`/promo/${pageSlug}`} />
      </ModernPage>
    </MotionConfig>
  );
}

// A trust-logo image that falls back to the company's name if its URL 404s.
function TrustLogo({ name, url }: { name: string; url?: string }) {
  const [broken, setBroken] = useState(false);
  if (!url || broken) {
    return <span className="font-semibold text-zinc-500 dark:text-zinc-400">{name}</span>;
  }
  return <img src={url} alt={name} className="h-7 object-contain" loading="lazy" onError={() => setBroken(true)} />;
}

// Shown when an app has no screenshots yet: its icon on the colour of its goal.
function IconHero({ name, toolId, category, get }: { name: string; toolId: string; category: string; get: string }) {
  return (
    <div className="relative mx-auto flex aspect-[4/3] w-full max-w-xl flex-col items-center justify-center overflow-hidden rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-soft-lg dark:border-zinc-800 dark:bg-zinc-900">
      <div aria-hidden className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-orange-100 dark:bg-orange-950/60" />
      <div aria-hidden className="absolute -bottom-12 -left-8 h-36 w-36 rounded-full bg-amber-100 dark:bg-amber-950/40" />
      <AppIcon toolId={toolId} category={category} name={name} size="xl" className="relative border-zinc-200 shadow-soft-sm dark:border-zinc-800" />
      <p className="relative mt-6 font-display text-2xl font-extrabold md:text-3xl">{name}</p>
      <p className={cn("relative mt-2 rounded-full px-3 py-1 text-sm font-bold", CARD)}>You get {get}</p>
    </div>
  );
}

// A sample/preview image that falls back to a gradient card instead of a broken <img> if its URL 404s.
function SafePreviewImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [broken, setBroken] = useState(false);
  if (broken) {
    return (
      <div className={cn("flex items-center justify-center bg-gradient-to-br from-orange-100 to-amber-100 p-4 text-center text-sm font-bold text-orange-700 dark:from-orange-950 dark:to-amber-950 dark:text-orange-300", className)}>
        {alt}
      </div>
    );
  }
  return <img src={src} alt={alt} loading="lazy" onError={() => setBroken(true)} className={className} />;
}

// Phones keep the single-image swipe carousel; desktop shows every sample at once in a grid —
// the full Play Store "Preview & sample outputs" section, not one image at a time.
function PreviewGallery({ slides, altBase }: { slides: GalleryImage[]; altBase: string }) {
  const isMobile = useIsMobile();
  return isMobile ? <HeroCarousel slides={slides} altBase={altBase} /> : <PreviewGrid slides={slides} altBase={altBase} />;
}

function PreviewGrid({ slides, altBase }: { slides: GalleryImage[]; altBase: string }) {
  const [zoomIdx, setZoomIdx] = useState<number | null>(null);
  const zoomed = zoomIdx !== null ? slides[zoomIdx] : null;
  return (
    <>
      <div className="grid gap-5 md:grid-cols-3">
        {slides.map((s, i) => (
          <button
            key={s.url + i}
            type="button"
            onClick={() => setZoomIdx(i)}
            className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-2 text-left shadow-soft-sm transition hover:shadow-soft-lg dark:border-zinc-800 dark:bg-zinc-900 md:min-h-[240px]"
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
              <SafePreviewImage
                src={s.url}
                alt={s.caption ? `${altBase} — ${s.caption}` : `${altBase} — sample ${i + 1}`}
                className="absolute inset-0 h-full w-full cursor-zoom-in object-cover transition group-hover:scale-[1.03]"
              />
            </div>
            {s.caption && (
              <span className={cn("absolute bottom-3 left-3 z-10 rounded-full px-3 py-1 text-xs font-bold", CARD)}>{s.caption}</span>
            )}
          </button>
        ))}
      </div>

      <Dialog open={!!zoomed} onOpenChange={(v) => !v && setZoomIdx(null)}>
        <DialogContent className="max-w-2xl border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-900">
          {zoomed && (
            <>
              <SafePreviewImage
                src={zoomed.url}
                alt={zoomed.caption ? `${altBase} — ${zoomed.caption}` : `${altBase} — sample ${(zoomIdx ?? 0) + 1}`}
                className="max-h-[75vh] w-full rounded-2xl object-contain"
              />
              {zoomed.caption && <p className="px-1 pb-1 text-sm font-semibold text-zinc-600 dark:text-zinc-400">{zoomed.caption}</p>}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// App Store-style carousel: auto-advances, arrows, dots and swipe.
function HeroCarousel({ slides, altBase }: { slides: GalleryImage[]; altBase: string }) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [brokenUrls, setBrokenUrls] = useState<Set<string>>(new Set());
  const touchX = useRef<number | null>(null);
  const count = slides.length;

  useEffect(() => {
    if (count <= 1 || paused) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % count), 4500);
    return () => clearInterval(t);
  }, [count, paused]);

  const go = (next: number) => setIdx(((next % count) + count) % count);
  const current = slides[idx];
  const markBroken = (url: string) => setBrokenUrls((prev) => new Set(prev).add(url));
  const currentAlt = current.caption ? `${altBase} — ${current.caption}` : `${altBase} — image ${idx + 1}`;

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX;
        setPaused(true);
      }}
      onTouchEnd={(e) => {
        if (touchX.current == null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 40) go(idx + (dx < 0 ? 1 : -1));
        touchX.current = null;
      }}
    >
      <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white p-2.5 shadow-soft-lg dark:border-zinc-800 dark:bg-zinc-900">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800">
          <AnimatePresence mode="wait" initial={false}>
            {brokenUrls.has(current.url) ? (
              <motion.div
                key={current.url + idx}
                className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-orange-100 to-amber-100 p-4 text-center text-sm font-bold text-orange-700 dark:from-orange-950 dark:to-amber-950 dark:text-orange-300"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                {currentAlt}
              </motion.div>
            ) : (
              <motion.img
                key={current.url + idx}
                src={current.url}
                alt={currentAlt}
                onClick={() => setZoomed(true)}
                onError={() => markBroken(current.url)}
                className="absolute inset-0 h-full w-full cursor-zoom-in object-cover"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
              />
            )}
          </AnimatePresence>

          {current.caption && (
            <div className={cn("absolute bottom-3 left-3 z-10 rounded-full px-3 py-1 text-xs font-bold", CARD)}>
              {current.caption}
            </div>
          )}

          <Dialog open={zoomed} onOpenChange={setZoomed}>
            <DialogContent className="max-w-2xl border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-900">
              <SafePreviewImage src={current.url} alt={currentAlt} className="max-h-[75vh] w-full rounded-2xl object-contain" />
              {current.caption && <p className="px-1 pb-1 text-sm font-semibold text-zinc-600 dark:text-zinc-400">{current.caption}</p>}
            </DialogContent>
          </Dialog>

          {count > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous image"
                onClick={() => go(idx - 1)}
                className={cn("absolute left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full transition hover:bg-orange-100 dark:hover:bg-orange-950", CARD)}
              >
                <ChevronLeft className="h-5 w-5" aria-hidden />
              </button>
              <button
                type="button"
                aria-label="Next image"
                onClick={() => go(idx + 1)}
                className={cn("absolute right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full transition hover:bg-orange-100 dark:hover:bg-orange-950", CARD)}
              >
                <ChevronRight className="h-5 w-5" aria-hidden />
              </button>
            </>
          )}
        </div>

        {count > 1 && (
          <div className="mt-2.5 flex items-center justify-center gap-1">
            {slides.map((s, i) => (
              <button
                key={s.url + i}
                type="button"
                aria-label={`Show image ${i + 1}`}
                aria-current={i === idx}
                onClick={() => setIdx(i)}
                className="flex h-6 items-center px-1"
              >
                <span
                  className={cn(
                    "block h-1.5 rounded-full transition-all",
                    i === idx ? "w-6 bg-orange-600" : "w-1.5 bg-zinc-300 hover:bg-zinc-400 dark:bg-zinc-700 dark:hover:bg-zinc-600",
                  )}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
