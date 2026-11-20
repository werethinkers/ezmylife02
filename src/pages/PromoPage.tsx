import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ChevronDown, Globe, Heart, Loader2, Mail, Play, Share2, ShieldCheck, Wallet, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useToolPricing } from "@/hooks/useToolPricing";
import { useToolsCatalog, type CatalogTool } from "@/hooks/useToolsCatalog";
import { RUPEES_PER_CREDIT_MAX, formatRupees } from "@/hooks/usePricingMap";
import { resolveToolMedia } from "@/lib/toolMedia";
import { appPagePath, promoSlug } from "@/lib/appLink";
import { CREDIT_PACKS } from "@/data/creditPacks";
import LoginPromptDialog from "@/components/auth/LoginPromptDialog";
import { Navbar } from "@/components/Navbar";
import { SEOHead } from "@/components/SEOHead";
import { AppIcon } from "@/components/store/AppIcon";
import { Shelf } from "@/components/store/Shelf";
import { GiveGet } from "@/components/brand/GiveGet";
import { NumberTicker } from "@/components/ui/number-ticker";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { useFavorites, useToggleFavorite } from "@/hooks/useFavorites";
import { appDemo, appExtraPreviews, appScreenshots } from "@/data/screenshotManifest";
import { categoriesOf, categoryInfo, goalOf, inCategory, KIND_TEXT } from "@/data/goals";
import { appIntroOf, appKindOf, appStepsOf } from "@/data/appKind";
import SEOFooter from "@/components/SEOFooter";
import { cn } from "@/lib/utils";

/*
 * An app's store page, at /promo/:slug, laid out like a Google Play listing in the brand's look.
 * Apps with a trailer (public/app-demos or a video in tool_media) get the dark trailer header;
 * the rest get the plain header with the big icon, and the screenshots lead the page.
 *
 * Every live app gets a page automatically: an admin-published row in `tool_promo_pages` supplies
 * the copy when there is one, otherwise the page is built from the `tools_catalog` entry.
 *
 * Ratings, review counts and testimonials stored on promo rows were AI-generated, not collected
 * from customers, so they are never rendered. The stats strip shows only facts.
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

const SAFETY = [
  { Icon: Globe, title: "Opens in your browser", body: "Nothing to install on your phone or computer." },
  { Icon: Wallet, title: "Pay only for results", body: "Credits are used only when the app gives you a result. Failed runs are free." },
  { Icon: ShieldCheck, title: "Secure payments", body: "Packs from ₹10 through Razorpay, by UPI or card. We never see your card." },
  { Icon: Mail, title: "Help when you need it", body: "Write to support@ezyourlife.com." },
];

const dateLabel = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : null;

export default function PromoPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const { data: catalog = [], isLoading: catalogLoading } = useToolsCatalog();

  const [row, setRow] = useState<PromoRow | null>(null);
  const [rowLoaded, setRowLoaded] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [shot, setShot] = useState<number | null>(null);
  const { favorites } = useFavorites();
  const { toggle } = useToggleFavorite();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

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

  // A real video saved for the app beats the generated trailer.
  const { data: savedVideo = null } = useQuery({
    queryKey: ["tool-media-video", toolId],
    enabled: !!toolId,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase.from("tool_media").select("url, poster_url").eq("tool_id", toolId!).eq("kind", "video").order("sort_order").limit(1);
      return data?.[0]?.url ? { url: data[0].url as string, poster: (data[0].poster_url as string | null) ?? null } : null;
    },
  });

  // Auto-launch after login if ?launch=1 is present.
  useEffect(() => {
    if (!authLoading && user && toolId && searchParams.get("launch") === "1") {
      navigate(`/tool/${toolId}`, { replace: true });
    }
  }, [authLoading, user, toolId, searchParams, navigate]);

  const gallery = useMemo(() => (row?.gallery_images ?? []).filter((g) => g?.url), [row]);
  const category = tool?.category ?? "";
  const media = resolveToolMedia(toolId ?? "", category, tool ?? null);
  const shots = useMemo(() => {
    if (!toolId) return [];
    const all = [...appScreenshots(toolId), ...gallery.map((g) => g.url), media.previewImageUrl, ...appExtraPreviews(toolId)].filter(Boolean) as string[];
    return Array.from(new Set(all)).slice(0, 10);
  }, [toolId, gallery, media.previewImageUrl]);

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

  const id = toolId ?? "";
  const name = tool?.name ?? row?.hero_title ?? "AI App";
  const tagline = row?.hero_title ? [row.hero_title, row.hero_title_accent].filter(Boolean).join(" ") : null;
  const subtitle = row?.hero_subtitle ?? tool?.description ?? "";
  const chips = (row?.hero_chips ?? []).map((c) => c?.label).filter(Boolean) as string[];
  const features = (row?.features ?? []).filter((f) => f?.title);
  const goal = goalOf(category);
  const info = categoryInfo(category);
  const kind = KIND_TEXT[appKindOf(id, category)];
  const intro = row?.hero_subtitle ?? appIntroOf(id) ?? tool?.description ?? "";
  const engineSteps = appStepsOf(id);
  const howSteps: Step[] =
    row?.how_it_works && row.how_it_works.length >= 3
      ? row.how_it_works.slice(0, 3)
      : engineSteps && engineSteps.length >= 3
        ? engineSteps.slice(0, 3).map((t, i) => ({ title: t, body: [`Give ${info.give}.`, "The app does the work in seconds.", `Get ${info.get}.`][i] }))
        : [
            { title: "Open the app", body: `${name} opens in your browser. Nothing to install.` },
            { title: `Give ${info.give}`, body: "Type it in or upload a file. Examples are filled in for you." },
            { title: `Get ${info.get}`, body: "Check it, then copy, download or send it on WhatsApp." },
          ];
  const tags = Array.from(new Set([...(tool ? categoriesOf(tool) : [category]), ...(tool?.tool_types ?? []), ...chips])).filter(Boolean).slice(0, 10);
  const isFav = favorites.has(id);
  const perResult = formatRupees(Math.max(1, creditCost) * RUPEES_PER_CREDIT_MAX);
  const updated = dateLabel(tool?.updated_at ?? tool?.created_at);

  const demo = appDemo(id);
  const trailer = savedVideo
    ? { kind: "video" as const, src: savedVideo.url, poster: savedVideo.poster ?? demo?.poster ?? media.previewImageUrl ?? shots[0] ?? null }
    : demo
      ? { kind: "image" as const, src: demo.src, poster: demo.poster }
      : null;

  const related = catalog.filter((t) => t.is_live && inCategory(t, category) && t.id !== id).slice(0, 8);
  const sameGoal = catalog.filter((t) => t.is_live && t.id !== id && !inCategory(t, category) && goalOf(t.category).id === goal.id).slice(0, 8);

  const handleUseIt = () => {
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

  const share = async () => {
    const url = `${window.location.origin}/promo/${pageSlug}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: name, text: subtitle.slice(0, 120), url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied", description: "Paste it anywhere to share this app." });
    } catch {
      /* the person closed the share sheet */
    }
  };

  /* ───────── Header pieces, shared by both header styles ───────── */
  const dark = !!trailer;
  const stats = (
    <ul
      className={cn(
        "-mx-4 flex items-stretch overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden",
        dark ? "divide-x divide-cream/20" : "divide-x divide-ink/15",
      )}
    >
      <li className="hidden shrink-0 items-center pr-5 lg:flex">
        <AppIcon toolId={id} category={category} name={name} size="sm" className={cn(dark && "border-cream/60")} />
      </li>
      {[
        { top: <span>{Math.max(1, creditCost)}</span>, icon: <Zap className="h-3.5 w-3.5" />, label: creditCost === 1 ? "credit / result" : "credits / result" },
        { top: <span>{perResult}</span>, label: "about, per result" },
        { top: <span>₹0</span>, label: "if it fails" },
        { top: <span className="max-w-[9rem] truncate">{goal.name}</span>, label: "category" },
        { top: <Globe className="h-5 w-5" />, label: "in your browser" },
      ].map((s, i) => (
        <li key={i} className={cn("flex min-w-[96px] shrink-0 flex-col items-center justify-center px-4 py-1 text-center first:pl-0 lg:first:pl-5", i === 0 && "pl-0")}>
          <span className="flex items-center gap-1 font-display text-[15px] font-bold leading-tight">
            {s.top}
            {s.icon}
          </span>
          <span className={cn("mt-0.5 whitespace-nowrap text-[11px] font-semibold", dark ? "text-cream/70" : "text-muted-foreground")}>{s.label}</span>
        </li>
      ))}
    </ul>
  );

  const actions = (
    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3">
      <Button size="lg" onClick={handleUseIt} className="h-12 w-full px-8 text-base sm:w-auto">
        Open the app <ArrowRight className="h-4 w-4" />
      </Button>
      <Button
        size="lg"
        variant="outline"
        onClick={() => toggle(id, isFav)}
        aria-pressed={isFav}
        className={cn("h-12 w-full sm:w-auto", dark && "border-cream bg-transparent text-cream hover:bg-cream/10")}
      >
        <Heart className={cn("h-4 w-4", isFav && "fill-coral text-coral")} /> {isFav ? "Saved to my apps" : "Save to my apps"}
      </Button>
      <button
        type="button"
        onClick={share}
        className={cn("inline-flex h-11 items-center justify-center gap-2 rounded-xl px-3 font-bold underline-offset-4 hover:underline", dark ? "text-sun" : "text-ink")}
      >
        <Share2 className="h-4 w-4" /> Share
      </button>
    </div>
  );

  const titleBlock = (
    <div className="flex items-start gap-4">
      <AppIcon toolId={id} category={category} name={name} size="lg" className={cn("shadow-block-sm lg:hidden", dark && "border-cream/70")} />
      <div className="min-w-0">
        <nav aria-label="Breadcrumb" className={cn("mb-1.5 hidden flex-wrap items-center gap-1 text-xs font-semibold sm:flex", dark ? "text-cream/60" : "text-muted-foreground")}>
          <Link to="/ai-apps" className="hover:underline">
            Apps
          </Link>
          <span aria-hidden>›</span>
          <Link to={`/ai-apps?goal=${goal.id}`} className="hover:underline">
            {goal.name}
          </Link>
        </nav>
        <h1 className="font-display text-[26px] font-extrabold leading-[1.1] sm:text-4xl lg:text-5xl">{name}</h1>
        <p className={cn("mt-1.5 font-bold", dark ? "text-sun" : "text-teal-700 dark:text-teal")}>EZYOURLIFE</p>
        <p className={cn("text-xs font-medium", dark ? "text-cream/70" : "text-muted-foreground")}>Pay per result · No subscription</p>
      </div>
    </div>
  );

  /* ───────── Screenshots ───────── */
  const lightboxImages = [
    ...(trailer && trailer.kind === "image" ? [{ src: trailer.src, alt: `${name} trailer` }] : []),
    ...shots.map((src, i) => ({ src, alt: `${name} screenshot ${i + 1}` })),
  ];
  const shotOffset = trailer && trailer.kind === "image" ? 1 : 0;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={row?.seo_title ?? `${name} — AI app on EZYOURLIFE`}
        description={row?.seo_description ?? subtitle.slice(0, 160)}
        image={row?.og_image_url ?? row?.hero_image_url ?? media.previewImageUrl ?? undefined}
        path={`/promo/${pageSlug}`}
        canonicalPath={toolId ? `/tool/${toolId}` : undefined}
      />
      <Navbar />

      <main>
        {trailer ? (
          /* ───────── Trailer header (apps with a video) ───────── */
          <section className="relative overflow-hidden border-b-2 border-ink bg-ink text-cream">
            <div className="relative aspect-video w-full lg:absolute lg:inset-0 lg:aspect-auto">
              {trailer.poster && <img src={trailer.poster} alt="" className="h-full w-full object-cover lg:ml-auto lg:w-[68%]" />}
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent lg:bg-gradient-to-r lg:from-ink lg:via-ink/85 lg:to-ink/0" />
              <button
                type="button"
                onClick={() => setTrailerOpen(true)}
                className="absolute left-1/2 top-1/2 inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full border-2 border-cream/80 bg-ink/70 px-5 py-2.5 font-bold text-cream backdrop-blur transition hover:bg-sun hover:text-ink lg:bottom-10 lg:left-auto lg:right-10 lg:top-auto lg:translate-x-0 lg:translate-y-0"
              >
                <Play className="h-4 w-4 fill-current" /> Trailer
              </button>
            </div>
            <div className="relative mx-auto flex max-w-7xl flex-col gap-5 px-4 pb-7 pt-2 lg:min-h-[500px] lg:justify-end lg:pb-12">
              <div className="lg:max-w-[52%]">{titleBlock}</div>
              <div className="lg:max-w-[60%]">{stats}</div>
              {actions}
            </div>
          </section>
        ) : (
          /* ───────── Plain header (apps without a video) ───────── */
          <section className="border-b-2 border-ink/10 bg-background">
            <div className="mx-auto grid max-w-7xl items-center gap-6 px-4 py-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:py-12">
              <div className="flex min-w-0 flex-col gap-5">
                {titleBlock}
                {stats}
                {actions}
              </div>
              <AppIcon toolId={id} category={category} name={name} size="xl" className="hidden !h-52 !w-52 rounded-[2rem] shadow-block lg:block [&>div]:text-5xl" />
            </div>
          </section>
        )}

        <div className="mx-auto max-w-7xl px-4 py-6 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-14 lg:py-10">
          <div className="min-w-0 space-y-10">
            {/* Screenshots: one row that scrolls sideways, trailer first */}
            {(shots.length > 0 || trailer) && (
              <Shelf className="-mt-2">
                {trailer && (
                  <button
                    type="button"
                    onClick={() => setTrailerOpen(true)}
                    className="relative h-56 shrink-0 snap-start overflow-hidden rounded-2xl border-2 border-ink bg-ink shadow-block-sm sm:h-64 lg:h-72"
                    aria-label={`Play the ${name} trailer`}
                  >
                    {trailer.poster && <img src={trailer.poster} alt="" className="h-full w-auto object-cover" />}
                    <span className="absolute inset-0 flex items-center justify-center bg-ink/30">
                      <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-ink bg-sun shadow-block-sm">
                        <Play className="ml-0.5 h-6 w-6 fill-ink text-ink" />
                      </span>
                    </span>
                  </button>
                )}
                {shots.map((src, i) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setShot(i + shotOffset)}
                    className="h-56 shrink-0 snap-start overflow-hidden rounded-2xl border-2 border-ink bg-sand shadow-block-sm transition hover:-translate-y-0.5 sm:h-64 lg:h-72"
                    aria-label={`Open screenshot ${i + 1}`}
                  >
                    <img src={src} alt={`${name} screenshot ${i + 1}`} loading={i < 2 ? "eager" : "lazy"} className="h-full w-auto object-cover" />
                  </button>
                ))}
              </Shelf>
            )}

            {/* About this app */}
            <section>
              <button type="button" onClick={() => setAboutOpen(true)} className="group flex w-full items-center justify-between gap-3 text-left">
                <h2 className="font-display text-xl font-bold sm:text-2xl">About this app</h2>
                <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-ink bg-card transition group-hover:bg-sun">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </button>
              {tagline && <p className="mt-3 font-display text-lg font-bold leading-snug">{tagline}</p>}
              <p className="mt-2 line-clamp-4 whitespace-pre-line text-[15px] leading-relaxed text-foreground/85">{intro}</p>
              {updated && (
                <div className="mt-5">
                  <p className="text-sm font-bold">Updated on</p>
                  <p className="text-sm text-muted-foreground">{updated}</p>
                </div>
              )}
              {tags.length > 0 && (
                <ul className="mt-5 flex flex-wrap gap-2">
                  {tags.map((c) => (
                    <li key={c}>
                      <Link
                        to={`/ai-apps?q=${encodeURIComponent(c)}`}
                        className="inline-flex rounded-full border-2 border-ink bg-card px-3.5 py-1.5 text-sm font-semibold transition hover:bg-sun"
                      >
                        {c}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* What you give and get (the brand's own block) */}
            <section className="space-y-4">
              <GiveGet give={info.give} get={info.get} />
              <div className="border-l-[6px] border-ink pl-3">
                <p className="text-[15px] font-bold">{kind.title}</p>
                <p className="text-sm text-muted-foreground">{kind.line}</p>
              </div>
            </section>

            {/* Curated feature cards */}
            {features.length > 0 && (
              <section>
                <h2 className="mb-4 font-display text-xl font-bold sm:text-2xl">What you get</h2>
                <Shelf>
                  {features.slice(0, 8).map((f) => (
                    <div key={f.title} className="block-card flex w-[78%] shrink-0 snap-start flex-col gap-2 p-5 sm:w-[46%] xl:w-[31%]" style={{ background: `color-mix(in srgb, ${goal.color} 38%, hsl(var(--card)))` }}>
                      <h3 className="font-body text-[17px] font-bold leading-snug">{f.title}</h3>
                      <p className="text-[15px] leading-relaxed text-ink/85">{f.body}</p>
                    </div>
                  ))}
                </Shelf>
              </section>
            )}

            {/* Safety and payments (where Play shows "Data safety") */}
            <section>
              <h2 className="font-display text-xl font-bold sm:text-2xl">Safety and payments</h2>
              <p className="mt-2 text-[15px] text-muted-foreground">How {name} handles your work and your money.</p>
              <ul className="mt-4 divide-y-2 divide-ink/10 rounded-2xl border-2 border-ink bg-card p-2 shadow-block-sm">
                {SAFETY.map(({ Icon, title: t, body }) => (
                  <li key={t} className="flex items-start gap-3 p-3">
                    <Icon className="mt-0.5 h-5 w-5 shrink-0" />
                    <div>
                      <p className="font-bold">{t}</p>
                      <p className="text-sm text-muted-foreground">{body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            {/* Price (where Play shows ratings): the real cost, and what each pack buys */}
            <section>
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-xl font-bold sm:text-2xl">Price and packs</h2>
                <Link to="/credits" className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-ink bg-card transition hover:bg-sun" aria-label="See credit packs">
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="mt-4 grid gap-6 rounded-2xl border-2 border-ink bg-card p-5 shadow-block-sm sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
                <div>
                  <p className="font-display text-6xl font-extrabold leading-none">
                    <NumberTicker value={Math.max(1, creditCost)} />
                  </p>
                  <p className="mt-2 font-bold">{creditCost === 1 ? "credit" : "credits"} per result</p>
                  <p className="text-sm text-muted-foreground">About {perResult}. New accounts get 100 free credits.</p>
                </div>
                <ul className="space-y-1.5">
                  {CREDIT_PACKS.map((p) => {
                    const runs = Math.floor(p.credits / Math.max(1, creditCost));
                    const max = Math.floor(CREDIT_PACKS[CREDIT_PACKS.length - 1].credits / Math.max(1, creditCost));
                    return (
                      <li key={p.id} className="grid grid-cols-[3.5rem_minmax(0,1fr)_5.5rem] items-center gap-2 text-sm">
                        <span className="font-bold">₹{p.inr}</span>
                        <span className="h-2.5 overflow-hidden rounded-full border border-ink/30 bg-sand">
                          <span className="block h-full rounded-full bg-ink" style={{ width: `${Math.max(4, (runs / Math.max(1, max)) * 100)}%` }} />
                        </span>
                        <span className="text-right text-muted-foreground">{runs.toLocaleString("en-IN")} results</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </section>

            {/* How it works: one row of steps */}
            <section>
              <h2 className="mb-4 font-display text-xl font-bold sm:text-2xl">How it works</h2>
              <Shelf>
                {howSteps.map((s, i) => (
                  <div
                    key={s.title + i}
                    className="flex w-[78%] shrink-0 snap-start flex-col gap-2.5 rounded-2xl border-2 border-ink p-5 shadow-block-sm sm:w-[44%] xl:w-[31%]"
                    style={{ background: `color-mix(in srgb, ${goal.color} 38%, hsl(var(--card)))` }}
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-ink bg-sun font-display font-extrabold">{i + 1}</span>
                    <h3 className="text-[17px] font-bold leading-snug">{s.title}</h3>
                    <p className="text-[15px] leading-relaxed text-ink/85">{s.body}</p>
                  </div>
                ))}
              </Shelf>
            </section>
          </div>

          {/* ───────── Side column: support and similar apps ───────── */}
          <aside className="mt-10 min-w-0 space-y-9 lg:mt-0">
            <details className="group rounded-2xl border-2 border-ink bg-card p-4 shadow-block-sm">
              <summary className="flex cursor-pointer list-none items-center justify-between font-display text-lg font-bold">
                App support <ChevronDown className="h-5 w-5 transition group-open:rotate-180" />
              </summary>
              <ul className="mt-3 space-y-3 text-sm">
                <li>
                  <a href="mailto:support@ezyourlife.com" className="flex items-center gap-2 font-semibold hover:underline">
                    <Mail className="h-4 w-4" /> support@ezyourlife.com
                  </a>
                </li>
                <li>
                  <Link to="/#request-tool" className="font-semibold hover:underline">
                    Ask us for a new app
                  </Link>
                </li>
                <li>
                  <Link to="/credits" className="font-semibold hover:underline">
                    Credit packs and prices
                  </Link>
                </li>
              </ul>
            </details>
            <AppList title="Similar apps" to={`/ai-apps?category=${encodeURIComponent(category)}`} apps={related} />
            <AppList title={`More in ${goal.name}`} to={`/ai-apps?goal=${goal.id}`} apps={sameGoal} />
          </aside>
        </div>
      </main>

      {/* Phone: keep the main action in reach */}
      <div className="sticky bottom-[76px] z-30 mb-4 ml-4 mr-[72px] flex items-center justify-between gap-3 rounded-2xl border-2 border-ink bg-card p-2.5 pl-4 shadow-block md:hidden">
        <span className="min-w-0 truncate font-bold">{name}</span>
        <Button size="sm" onClick={handleUseIt} className="h-10 shrink-0">
          Open <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <SEOFooter />

      <Dialog open={aboutOpen} onOpenChange={setAboutOpen}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto border-2 border-ink sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-left">
              <AppIcon toolId={id} category={category} name={name} size="sm" />
              <span>
                <span className="block font-display text-lg">{name}</span>
                <span className="block text-sm font-normal text-muted-foreground">About this app</span>
              </span>
            </DialogTitle>
            <DialogDescription className="sr-only">Everything about {name}</DialogDescription>
          </DialogHeader>
          <p className="whitespace-pre-line text-[15px] leading-relaxed">{intro}</p>
          {subtitle && subtitle !== intro && <p className="text-[15px] leading-relaxed text-muted-foreground">{subtitle}</p>}
          <ol className="list-decimal space-y-1 pl-5 text-[15px]">
            {howSteps.map((s) => (
              <li key={s.title}>
                <span className="font-bold">{s.title}.</span> {s.body}
              </li>
            ))}
          </ol>
          <dl className="grid grid-cols-2 gap-3 rounded-xl border-2 border-ink/15 p-3 text-sm">
            <div>
              <dt className="font-bold">Price</dt>
              <dd className="text-muted-foreground">
                {Math.max(1, creditCost)} {creditCost === 1 ? "credit" : "credits"} per result
              </dd>
            </div>
            <div>
              <dt className="font-bold">Category</dt>
              <dd className="text-muted-foreground">{category || goal.name}</dd>
            </div>
            {updated && (
              <div>
                <dt className="font-bold">Updated on</dt>
                <dd className="text-muted-foreground">{updated}</dd>
              </div>
            )}
            <div>
              <dt className="font-bold">Made by</dt>
              <dd className="text-muted-foreground">EZYOURLIFE</dd>
            </div>
          </dl>
          <Button size="lg" onClick={handleUseIt} className="h-12 w-full">
            Open the app <ArrowRight className="h-4 w-4" />
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={trailerOpen} onOpenChange={setTrailerOpen}>
        <DialogContent className="max-w-4xl overflow-hidden border-2 border-ink bg-ink p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>{name} trailer</DialogTitle>
            <DialogDescription>A short look at {name}</DialogDescription>
          </DialogHeader>
          {trailerOpen && trailer && (
            <div className="aspect-video w-full bg-ink">
              {trailer.kind === "video" ? (
                <video src={trailer.src} poster={trailer.poster ?? undefined} controls autoPlay playsInline className="h-full w-full" />
              ) : (
                <img src={trailer.src} alt={`${name} trailer`} className="h-full w-full object-contain" />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ImageLightbox images={lightboxImages} index={shot} onIndexChange={setShot} onClose={() => setShot(null)} label={`${name} screenshots`} />
      <LoginPromptDialog open={loginOpen} onOpenChange={setLoginOpen} returnTo={`/promo/${pageSlug}?launch=1`} />
    </div>
  );
}

/** Play's side list on wide screens; one sideways row of app tiles on phones. */
function AppList({ title, to, apps }: { title: string; to: string; apps: CatalogTool[] }) {
  if (!apps.length) return null;
  return (
    <section>
      <Link to={to} className="group mb-3 flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-bold">{title}</h2>
        <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink bg-card transition group-hover:bg-sun">
          <ArrowRight className="h-4 w-4" />
        </span>
      </Link>
      <ul className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] lg:mx-0 lg:block lg:space-y-1 lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden">
        {apps.map((t) => (
          <li key={t.id} className="w-[132px] shrink-0 snap-start lg:w-auto">
            <Link to={appPagePath(t)} className="flex flex-col gap-2 rounded-xl p-1 transition hover:bg-sand lg:flex-row lg:items-center lg:gap-3 lg:p-2">
              <AppIcon toolId={t.id} category={t.category} name={t.name} size="md" className="!h-[124px] !w-[124px] lg:!h-14 lg:!w-14" />
              <span className="min-w-0">
                <span className="line-clamp-2 text-sm font-bold leading-snug">{t.name}</span>
                <span className="block truncate text-xs text-muted-foreground">{t.category}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
