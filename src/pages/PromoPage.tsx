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
  MousePointerClick,
  Upload,
  Download,
  Sparkles,
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

const STEP_ICONS = [MousePointerClick, Upload, Download];

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
  const [entering, setEntering] = useState(false);
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
    if (entering) return;
    setEntering(true);
    try {
      const { data: startData, error: startErr } = await supabase.functions.invoke("tool-charge", {
        body: { action: "start", tool_id: toolId },
      });
      if (startErr) throw startErr;
      if (!startData?.ok) {
        if (startData?.reason === "insufficient") {
          const need = startData?.credits_required ?? creditCost;
          const bal = startData?.balance ?? 0;
          const { toast } = await import("sonner");
          toast.error(`Not enough credits. Need ${need}, you have ${bal}.`);
          navigate("/credits");
          return;
        }
        throw new Error(startData?.reason ?? "start_failed");
      }
      const runId = startData?.run_id;
      if (runId && !startData?.free_tool) {
        await supabase.functions.invoke("tool-charge", {
          body: { action: "complete", run_id: runId, success: true },
        });
      }
      navigate(`/tool/${toolId}`);
    } catch (e: unknown) {
      const { toast } = await import("sonner");
      toast.error(e instanceof Error ? e.message : "Could not open the app");
    } finally {
      setEntering(false);
    }
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
    .filter((t) => t.is_live && t.category === category && t.id !== toolId)
    .slice(0, 4);

  const minPack = CREDIT_PACKS[0];
  const scrollToHow = () => howRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const tryButton = (className = "") => (
    <Button
      size="lg"
      onClick={handleUseIt}
      disabled={entering}
      className={`group h-auto min-h-12 rounded-xl px-6 py-3 text-base shadow-lg shadow-primary/25 ${className}`}
    >
      {entering ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Zap className="mr-2 h-5 w-5" />}
      <span className="text-left leading-tight">
        <span className="block font-semibold">{ctaLabel}</span>
        <span className="block text-xs font-normal opacity-90">{creditLabel} to start</span>
      </span>
    </Button>
  );

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
        <section className="relative overflow-hidden border-b border-border/40">
          <div aria-hidden className="absolute inset-0 bg-mesh" />
          <div className="relative container mx-auto grid items-center gap-10 px-4 py-10 md:py-16 lg:grid-cols-2 lg:gap-14 lg:py-20">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="min-w-0">
              <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                <Link to="/ai-apps" className="hover:text-foreground">AI Apps</Link>
                {category && (
                  <>
                    <span aria-hidden>/</span>
                    <Link to={`/ai-apps?category=${encodeURIComponent(category)}`} className="hover:text-foreground">
                      {category}
                    </Link>
                  </>
                )}
              </nav>

              {eyebrow && (
                <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  {eyebrow}
                </span>
              )}

              <h1 className="text-3xl font-bold leading-[1.1] tracking-tight sm:text-4xl lg:text-5xl xl:text-6xl">
                {title}
                {titleAccent && (
                  <>
                    {" "}
                    <span className="text-gradient">{titleAccent}</span>
                  </>
                )}
              </h1>

              {subtitle && (
                <p className="mt-4 max-w-xl whitespace-pre-line text-base leading-relaxed text-muted-foreground md:text-lg">
                  {subtitle}
                </p>
              )}

              {chips.length > 0 && (
                <ul className="mt-5 flex flex-wrap gap-2">
                  {chips.slice(0, 6).map((c) => (
                    <li key={c} className="rounded-full border border-border/60 bg-card/70 px-3 py-1.5 text-xs font-medium backdrop-blur">
                      {c}
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                {tryButton("w-full sm:w-auto")}
                <Button variant="outline" size="lg" className="h-12 rounded-xl px-5" onClick={scrollToHow}>
                  See how it works
                </Button>
              </div>

              <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                {["Pay per use", "Runs in your browser", "Secure checkout"].map((t) => (
                  <li key={t} className="flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-primary" />
                    {t}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }} className="min-w-0">
              {slides.length > 0 ? (
                <HeroCarousel slides={slides} altBase={name} />
              ) : (
                <IconHero name={name} iconUrl={media.iconUrl} category={category} />
              )}
            </motion.div>
          </div>
        </section>

        {/* ───────── Trust logos (only when real logos are added in admin) ───────── */}
        {trustLogos.length > 0 && (
          <section className="container mx-auto px-4 pt-10">
            <p className="mb-4 text-center text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Used by</p>
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 opacity-80">
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
          <section className="container mx-auto px-4 py-16 md:py-20">
            <motion.div {...fadeUp} className="mx-auto mb-10 max-w-2xl text-center">
              <h2 className="text-2xl font-bold md:text-4xl">What you get</h2>
            </motion.div>
            <div className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {features.slice(0, 8).map((f, i) => (
                <motion.div
                  key={f.title}
                  {...fadeUp}
                  transition={{ ...fadeUp.transition, delay: (i % 4) * 0.05 }}
                  className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm"
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold">{f.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* ───────── How it works + price ───────── */}
        <section
          ref={howRef}
          id="how-it-works"
          className={`scroll-mt-20 ${features.length > 0 ? "pb-16 md:pb-20" : "py-16 md:py-20"}`}
        >
          <div className="container mx-auto px-4">
            <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-3">
              <motion.div {...fadeUp} className="min-w-0 rounded-3xl border border-border/60 bg-card p-6 shadow-sm md:p-8 lg:col-span-2">
                <h2 className="text-2xl font-bold md:text-3xl">
                  How it <span className="text-gradient">works</span>
                </h2>
                <ol className="mt-6 grid gap-5 sm:grid-cols-3">
                  {steps.map((s, i) => {
                    const Icon = STEP_ICONS[i] ?? Sparkles;
                    return (
                      <li key={s.title} className="flex gap-4 sm:flex-col sm:gap-3">
                        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
                          <Icon className="h-5 w-5" />
                          <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-background text-[11px] font-bold text-foreground">
                            {i + 1}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold">{s.title}</h3>
                          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </motion.div>

              <motion.div
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: 0.08 }}
                className="relative flex min-w-0 flex-col overflow-hidden rounded-3xl bg-gradient-hero p-6 text-white shadow-xl md:p-8"
              >
                <div aria-hidden className="absolute inset-0 bg-black/10" />
                <div aria-hidden className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/15 blur-3xl" />
                <div className="relative flex h-full flex-col">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/85">Price</p>
                  <p className="mt-3 font-display text-5xl font-bold tracking-tight">
                    {creditCost}
                    <span className="ml-2 text-xl font-semibold text-white/85">credit{creditCost === 1 ? "" : "s"}</span>
                  </p>
                  <p className="mt-1 text-sm text-white/90">to start using {name}</p>
                  <p className="mt-4 text-sm text-white/90">
                    Credit packs start at ₹{minPack.inr} for {minPack.credits} credits.
                  </p>
                  <div className="mt-6 space-y-2 lg:mt-auto lg:pt-6">
                    <Button
                      size="lg"
                      variant="secondary"
                      onClick={handleUseIt}
                      disabled={entering}
                      className="h-12 w-full rounded-xl font-semibold"
                    >
                      Start now
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <Button
                      asChild
                      size="lg"
                      variant="outline"
                      className="h-12 w-full rounded-xl border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                    >
                      <Link to="/credits">See credit packs</Link>
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ───────── Related apps ───────── */}
        {related.length > 0 && (
          <section className="border-t border-border/40 bg-muted/30 py-16 md:py-20">
            <div className="container mx-auto px-4">
              <div className="mx-auto max-w-6xl">
                <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                  <h2 className="text-2xl font-bold md:text-3xl">More {category} apps</h2>
                  <Link
                    to={`/ai-apps?category=${encodeURIComponent(category)}`}
                    className="inline-flex items-center text-sm font-semibold text-primary hover:underline"
                  >
                    View all <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {related.map((t) => {
                    const m = resolveToolMedia(t.id, t.category, t);
                    return (
                      <Link
                        key={t.id}
                        to={`/promo/${promoSlug(t.name)}`}
                        className="group flex gap-3 rounded-2xl border border-border/60 bg-card p-4 transition-all hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/15 to-accent/15">
                          {m.iconUrl ? (
                            <img src={m.iconUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                          ) : (
                            <Sparkles className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{t.name}</p>
                          <p className="line-clamp-2 text-xs text-muted-foreground">{t.description}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ───────── Final CTA + guarantees ───────── */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4">
            <motion.div
              {...fadeUp}
              className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-accent/10 p-6 md:flex-row md:items-center md:p-10"
            >
              <div className="min-w-0">
                <h2 className="text-2xl font-bold md:text-3xl">{row?.final_cta_title ?? `Ready to try ${name}?`}</h2>
                <p className="mt-2 text-muted-foreground">
                  {row?.final_cta_subtitle ?? `Pay only when you use it: ${creditLabel} to start.`}
                </p>
              </div>
              {tryButton("w-full md:w-auto")}
            </motion.div>

            <ul className="mx-auto mt-10 grid max-w-6xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {GUARANTEES.map(({ Icon, title: t, body }) => (
                <li key={t} className="flex items-start gap-3 rounded-2xl p-2">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t}</p>
                    <p className="text-sm text-muted-foreground">{body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <SEOFooter />

        <LoginPromptDialog open={loginOpen} onOpenChange={setLoginOpen} returnTo={`/promo/${pageSlug}?launch=1`} />
      </div>
    </MotionConfig>
  );
}

// Shown when an app has no screenshots yet: its icon on a branded card.
function IconHero({ name, iconUrl, category }: { name: string; iconUrl: string | null; category: string }) {
  return (
    <div className="relative mx-auto aspect-[4/3] w-full max-w-xl overflow-hidden rounded-3xl bg-gradient-hero p-8 shadow-2xl shadow-primary/20">
      <div aria-hidden className="absolute inset-0 bg-black/10" />
      <div aria-hidden className="absolute -left-10 -top-10 h-56 w-56 rounded-full bg-white/15 blur-3xl" />
      <div aria-hidden className="absolute -bottom-16 -right-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      <div className="relative flex h-full flex-col items-center justify-center text-center text-white">
        <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-[1.75rem] border border-white/30 bg-white/15 shadow-xl backdrop-blur md:h-36 md:w-36">
          {iconUrl ? (
            <img src={iconUrl} alt={`${name} icon`} className="h-full w-full object-cover" />
          ) : (
            <Sparkles className="h-14 w-14" />
          )}
        </div>
        <p className="mt-6 font-display text-2xl font-bold md:text-3xl">{name}</p>
        {category && <p className="mt-1 text-sm text-white/85">{category}</p>}
      </div>
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
      <div className="overflow-hidden rounded-3xl border border-border/60 bg-card/60 p-2.5 shadow-2xl shadow-primary/10 backdrop-blur-sm">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-muted/40">
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
            <div className="absolute bottom-3 left-3 z-10 rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs font-medium backdrop-blur">
              {current.caption}
            </div>
          )}

          {count > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous image"
                onClick={() => go(idx - 1)}
                className="absolute left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border/60 bg-background/80 backdrop-blur transition hover:bg-background"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                aria-label="Next image"
                onClick={() => go(idx + 1)}
                className="absolute right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border/60 bg-background/80 backdrop-blur transition hover:bg-background"
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
                    i === idx ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/40 hover:bg-muted-foreground/70"
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
