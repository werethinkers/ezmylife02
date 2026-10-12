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
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToolPricing } from "@/hooks/useToolPricing";
import { useToolsCatalog, type CatalogTool } from "@/hooks/useToolsCatalog";
import { resolveToolMedia } from "@/lib/toolMedia";
import { CREDIT_PACKS } from "@/data/creditPacks";
import LoginPromptDialog from "@/components/auth/LoginPromptDialog";
import { Navbar } from "@/components/Navbar";
import { SEOHead } from "@/components/SEOHead";
import { AppIcon } from "@/components/store/AppIcon";
import { FlowSteps } from "@/components/brand/FlowSteps";
import { GiveGet } from "@/components/brand/GiveGet";
import { categoryInfo, goalOf, inCategory, KIND_TEXT } from "@/data/goals";
import { appIntroOf, appKindOf, appStepsOf } from "@/data/appKind";
import SEOFooter from "@/components/SEOFooter";

/*
 * Promo (landing) page for an AI app, at /promo/:slug.
 *
 * Every live app gets a page automatically:
 *  - If an admin has published a curated page in `tool_promo_pages`, its copy is used.
 *  - Otherwise the page is built from the public `tools_catalog` entry, so no app is left
 *    without one and new apps get a page the moment they go live.
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

  const toolId = row?.tool_id ?? tool?.id;
  const pageSlug = row?.slug ?? slug;
  const { creditCost } = useToolPricing(toolId);
  const creditLabel = `${creditCost} credit${creditCost === 1 ? "" : "s"}`;

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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Loading" />
      </div>
    );
  }

  if (!row && !tool) {
    return (
      <div className="min-h-screen bg-background">
        <SEOHead title="App not found — EZYOURLIFE" description="This app page could not be found." path={`/promo/${slug}`} noindex />
        <Navbar />
        <div className="container mx-auto flex flex-col items-center px-4 py-24 text-center">
          <h1 className="text-3xl font-bold">We couldn't find that app</h1>
          <p className="mt-3 max-w-md text-muted-foreground">It may have been renamed. Browse the store to find it.</p>
          <Button asChild className="mt-6 rounded-xl">
            <Link to="/ai-apps">Browse AI apps</Link>
          </Button>
        </div>
      </div>
    );
  }

  const name = tool?.name ?? row?.hero_title ?? "AI App";
  const category = tool?.category ?? "";
  const media = resolveToolMedia(toolId ?? "", category, tool ?? null);

  const title = row?.hero_title ?? name;
  const titleAccent = row?.hero_title_accent ?? null;
  const subtitle = row?.hero_subtitle ?? tool?.description ?? "";
  const eyebrow = row?.hero_eyebrow ?? category;
  const chips = (row?.hero_chips ?? []).map((c) => c?.label).filter(Boolean) as string[];
  const ctaLabel = row?.cta_label ?? `Try ${name}`;
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
    .slice(0, 4);

  const minPack = CREDIT_PACKS[0];
  const scrollToHow = () => howRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const tryButton = (className = "") => (
    <Button
      size="lg"
      onClick={handleUseIt}
      className={`group h-auto min-h-12 px-6 py-2.5 text-base ${className}`}
    >
      <Zap className="mr-2 h-5 w-5" />
      <span className="text-left leading-tight">
        <span className="block font-semibold">{ctaLabel}</span>
        <span className="block text-xs font-semibold opacity-80">{creditCost > 0 ? `${creditLabel} per result` : "Free to use"}</span>
      </span>
    </Button>
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
      <div className="min-h-screen bg-background">
        <SEOHead
          title={row?.seo_title ?? `${name} — AI app on EZYOURLIFE`}
          description={row?.seo_description ?? subtitle.slice(0, 160)}
          image={row?.og_image_url ?? row?.hero_image_url ?? media.previewImageUrl ?? undefined}
          path={`/promo/${pageSlug}`}
          noindex
        />
        <Navbar />

        {/* ───────── Hero ───────── */}
        <section className="mx-auto max-w-7xl px-4 pb-10 pt-6 md:pt-8">
          <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <Link to="/ai-apps" className="underline underline-offset-4 hover:text-ink">Business apps</Link>
            {category && (
              <>
                <span aria-hidden>›</span>
                <Link to={`/ai-apps?goal=${goal.id}`} className="underline underline-offset-4 hover:text-ink">{goal.name}</Link>
                <span aria-hidden>›</span>
                <Link to={`/ai-apps?category=${encodeURIComponent(category)}`} className="underline underline-offset-4 hover:text-ink">{category}</Link>
              </>
            )}
          </nav>
          <FlowSteps flow="app" step={1} className="mb-8 max-w-3xl" />

          <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-14">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="min-w-0 space-y-5">
              <div className="flex items-center gap-4">
                <AppIcon toolId={toolId ?? ""} category={category} name={name} size="lg" className="shadow-block" />
                <div className="min-w-0">
                  <span className="inline-flex rounded-full border-2 border-ink px-2.5 py-0.5 text-xs font-bold" style={{ background: goal.color }}>
                    {goal.name}
                  </span>
                  {eyebrow && eyebrow !== category && <p className="mt-1 text-sm font-semibold text-muted-foreground">{eyebrow}</p>}
                </div>
              </div>

              <h1 className="text-[2rem] font-extrabold leading-[1.08] sm:text-5xl xl:text-[3.4rem]">
                {title}
                {titleAccent && (
                  <>
                    {" "}
                    <span className="marker">{titleAccent}</span>
                  </>
                )}
              </h1>

              {intro && <p className="max-w-xl whitespace-pre-line text-lg leading-relaxed text-muted-foreground">{intro}</p>}

              <GiveGet give={info.give} get={info.get} />

              <div className="border-l-[6px] border-ink pl-3">
                <p className="font-bold">{kind.title}</p>
                <p className="text-[15px] text-muted-foreground">{kind.line}</p>
              </div>

              {chips.length > 0 && (
                <ul className="flex flex-wrap gap-2">
                  {chips.slice(0, 6).map((c) => (
                    <li key={c} className="rounded-full border-2 border-ink bg-card px-3 py-1 text-sm font-semibold">
                      {c}
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
                {tryButton("w-full sm:w-auto")}
                <Button variant="outline" size="lg" className="h-12 px-5" onClick={scrollToHow}>
                  How it works
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">Opening the app is free. Credits are used only when it gives you a result.</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.05 }} className="min-w-0">
              {slides.length > 0 ? (
                <HeroCarousel slides={slides} altBase={name} />
              ) : (
                <IconHero name={name} toolId={toolId ?? ""} category={category} color={goal.color} get={info.get} />
              )}
            </motion.div>
          </div>
        </section>

        {/* ───────── Trust logos (only when real logos are added in admin) ───────── */}
        {trustLogos.length > 0 && (
          <section className="mx-auto max-w-7xl px-4 pt-4">
            <p className="mb-4 text-center text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Used by</p>
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
              {trustLogos.map((l) =>
                l.url ? (
                  <img key={l.name} src={l.url} alt={l.name} className="h-7 object-contain" loading="lazy" />
                ) : (
                  <span key={l.name} className="font-semibold text-muted-foreground">{l.name}</span>
                ),
              )}
            </div>
          </section>
        )}

        {/* ───────── Features (curated pages) ───────── */}
        {features.length > 0 && (
          <section className="mx-auto max-w-7xl px-4 py-12 md:py-16">
            <h2 className="mb-6 text-2xl font-bold md:text-[2rem]">What you get</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {features.slice(0, 8).map((f, i) => (
                <motion.div key={f.title} {...fadeUp} transition={{ ...fadeUp.transition, delay: (i % 4) * 0.05 }} className="block-card p-5">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border-2 border-ink" style={{ background: goal.color }}>
                    <Check className="h-5 w-5" />
                  </div>
                  <h3 className="font-body text-[17px] font-bold">{f.title}</h3>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-muted-foreground">{f.body}</p>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* ───────── How it works + price ───────── */}
        <section ref={howRef} id="how-it-works" className="scroll-mt-20 py-12 md:py-16">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 lg:grid-cols-3">
            <div className="block-card min-w-0 p-6 md:p-8 lg:col-span-2">
              <h2 className="text-2xl font-bold md:text-3xl">How it works</h2>
              <ol className="mt-6 grid gap-5 sm:grid-cols-3">
                {howSteps.map((s, i) => (
                  <li key={s.title + i} className="flex gap-4 sm:flex-col sm:gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-sun font-display text-lg font-extrabold">{i + 1}</span>
                    <div>
                      <h3 className="font-body text-[17px] font-bold leading-snug">{s.title}</h3>
                      <p className="mt-1 text-[15px] leading-relaxed text-muted-foreground">{s.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="flex min-w-0 flex-col rounded-2xl border-2 border-ink bg-ink p-6 text-cream shadow-block md:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-sun">Price</p>
              <p className="mt-3 font-display text-5xl font-extrabold tracking-tight">
                {creditCost}
                <span className="ml-2 text-xl font-bold text-cream/85">credit{creditCost === 1 ? "" : "s"}</span>
              </p>
              <p className="mt-2 text-[15px] text-cream/90">each time {name} gives you a result. If it fails, you are not charged.</p>
              <p className="mt-3 text-[15px] text-cream/90">
                Credit packs start at ₹{minPack.inr} for {minPack.credits} credits. New accounts get 100 free credits.
              </p>
              <div className="mt-6 space-y-2.5 lg:mt-auto lg:pt-6">
                <Button size="lg" onClick={handleUseIt} className="h-12 w-full">
                  Try it now <ArrowRight className="h-4 w-4" />
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 w-full">
                  <Link to="/credits">See credit packs</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* ───────── Related apps ───────── */}
        {related.length > 0 && (
          <section className="border-y-2 border-ink bg-sand py-12 md:py-16">
            <div className="mx-auto max-w-7xl px-4">
              <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold md:text-3xl">Use it with</h2>
                  <p className="mt-1 text-[15px] text-muted-foreground">More {category} apps people use alongside this one.</p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link to={`/ai-apps?category=${encodeURIComponent(category)}`}>
                    See all <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {related.map((t) => (
                  <Link
                    key={t.id}
                    to={`/promo/${promoSlug(t.name)}`}
                    className="block-card block-lift flex gap-3 p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <AppIcon toolId={t.id} category={t.category} name={t.name} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate font-bold">{t.name}</p>
                      <p className="line-clamp-2 text-sm text-muted-foreground">You get {categoryInfo(t.category).get}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ───────── Final CTA + guarantees ───────── */}
        <section className="py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-4">
            <div className="flex flex-col items-start justify-between gap-6 rounded-3xl border-2 border-ink p-6 shadow-block-lg md:flex-row md:items-center md:p-10" style={{ background: goal.color }}>
              <div className="min-w-0">
                <h2 className="text-2xl font-extrabold md:text-3xl">{row?.final_cta_title ?? `Ready to try ${name}?`}</h2>
                <p className="mt-2 text-ink/85">
                  {row?.final_cta_subtitle ?? (creditCost > 0 ? `Pay only for results: ${creditLabel} each. Failed runs are never charged.` : "Free to use.")}
                </p>
              </div>
              {tryButton("w-full md:w-auto")}
            </div>

            <ul className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {GUARANTEES.map(({ Icon, title: t, body }) => (
                <li key={t} className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-ink bg-card">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold">{t}</p>
                    <p className="text-[15px] text-muted-foreground">{body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Phone: keep the main action in reach */}
        <div className="sticky bottom-[76px] z-30 mb-4 ml-4 mr-[72px] flex items-center justify-between gap-3 rounded-2xl border-2 border-ink bg-card p-2.5 pl-4 shadow-block md:hidden">
          <span className="min-w-0 truncate font-bold">{name}</span>
          <Button size="sm" onClick={handleUseIt} className="h-10 shrink-0">
            Try it <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <SEOFooter />

        <LoginPromptDialog open={loginOpen} onOpenChange={setLoginOpen} returnTo={`/promo/${pageSlug}?launch=1`} />
      </div>
    </MotionConfig>
  );
}

// Shown when an app has no screenshots yet: its icon on the colour of its goal.
function IconHero({ name, toolId, category, color, get }: { name: string; toolId: string; category: string; color: string; get: string }) {
  return (
    <div className="relative mx-auto flex aspect-[4/3] w-full max-w-xl flex-col items-center justify-center overflow-hidden rounded-3xl border-2 border-ink p-8 text-center shadow-block-lg" style={{ background: color }}>
      <div aria-hidden className="absolute -right-10 -top-10 h-40 w-40 rounded-full border-2 border-ink bg-card/60" />
      <div aria-hidden className="absolute -bottom-12 -left-8 h-36 w-36 rounded-full border-2 border-ink bg-card/40" />
      <AppIcon toolId={toolId} category={category} name={name} size="xl" className="relative shadow-block" />
      <p className="relative mt-6 font-display text-2xl font-extrabold md:text-3xl">{name}</p>
      <p className="relative mt-2 rounded-full border-2 border-ink bg-card px-3 py-1 text-sm font-bold">You get {get}</p>
    </div>
  );
}

// App Store-style carousel: auto-advances, arrows, dots and swipe.
function HeroCarousel({ slides, altBase }: { slides: GalleryImage[]; altBase: string }) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);
  const count = slides.length;

  useEffect(() => {
    if (count <= 1 || paused) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % count), 4500);
    return () => clearInterval(t);
  }, [count, paused]);

  const go = (next: number) => setIdx(((next % count) + count) % count);
  const current = slides[idx];

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
      <div className="overflow-hidden rounded-3xl border-2 border-ink bg-card p-2.5 shadow-block-lg">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border-2 border-ink bg-sand">
          <AnimatePresence mode="wait" initial={false}>
            <motion.img
              key={current.url + idx}
              src={current.url}
              alt={current.caption ? `${altBase} — ${current.caption}` : `${altBase} — image ${idx + 1}`}
              className="absolute inset-0 h-full w-full object-cover"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
            />
          </AnimatePresence>

          {current.caption && (
            <div className="absolute bottom-3 left-3 z-10 rounded-full border-2 border-ink bg-card px-3 py-1 text-xs font-bold">
              {current.caption}
            </div>
          )}

          {count > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous image"
                onClick={() => go(idx - 1)}
                className="absolute left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border-2 border-ink bg-card transition hover:bg-sun"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                aria-label="Next image"
                onClick={() => go(idx + 1)}
                className="absolute right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border-2 border-ink bg-card transition hover:bg-sun"
              >
                <ChevronRight className="h-5 w-5" />
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
                  className={`block h-1.5 rounded-full transition-all ${
                    i === idx ? "w-6 bg-ink" : "w-1.5 bg-ink/30 hover:bg-ink/60"
                  }`}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
