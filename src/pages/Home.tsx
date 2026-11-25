import { Suspense, lazy, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Search, X } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import RequestToolSection from "@/components/RequestToolSection";
import { useQuickLook } from "@/components/store/QuickLook";
import { EARN_LINKS } from "@/components/brand/nav";
import { FLOW_STEPS, type Flow } from "@/components/brand/FlowSteps";
import { useAuth } from "@/contexts/AuthContext";
import { useToolsCatalog, type CatalogTool } from "@/hooks/useToolsCatalog";
import { usePricingMap } from "@/hooks/usePricingMap";
import { useAppCountLabel } from "@/lib/appCount";
import { seoFor } from "@/lib/seo/pages";
import { cn } from "@/lib/utils";
import { STUDIO_IDS, studioTabOf } from "@/data/studios";
import { POPULAR_STUDIO_IDS } from "@/data/studioPicks";
import { GOALS, categoriesOf, categoryInfo } from "@/data/goals";
import { placedIn } from "@/data/placements";
import { APP_PREVIEW_IDS } from "@/data/previewManifest";
import { ModernPage } from "@/components/modern/ModernPage";
import { ToolCard, ToolMedia } from "@/components/modern/ToolCard";
import { DesignCard, DesignMedia } from "@/components/modern/DesignCard";
import { HeroSpotlight, type SpotItem, type SpotTab } from "@/components/modern/home/HeroSpotlight";
import type { DesignSummary } from "@/components/modern/home/DesignFeed";
import type { DesignLite } from "@/components/modern/designLite";
import { CardSkeleton, CtaBand, EmptyState, SectionHead } from "@/components/modern/ui";
import { BTN_INK, BTN_OUTLINE, BTN_PRIMARY, CONTAINER, EYEBROW, FOCUS_RING, creditsLabel, pillClass, roundedLabel } from "@/components/modern/styles";
import { ScrollRow } from "@/components/ui/scroll-row";
import { NumberTicker } from "@/components/ui/number-ticker";
import { AppShowcaseRow, type ShowcaseApp } from "@/components/AppShowcaseCard";

// The website and card designs are a large catalogue: load them after the first screen is up.
const DesignFeed = lazy(() => import("@/components/modern/home/DesignFeed"));

const POPULAR_SEARCHES = ["invoice", "passport photo", "salary", "remove background", "caption", "contract"];

/** Featured apps shown in the showcase row. Images live in /public/app-previews/<id>.jpg */
const FEATURED_SHOWCASE_APPS: ShowcaseApp[] = [
  {
    id: "ai-headshot-studio",
    name: "AI Headshot Studio",
    description:
      "Turn a casual selfie into professional headshots — corporate, LinkedIn, creative, doctor or lawyer looks, all with natural lighting. No photographer needed.",
    imageSrc: "/app-previews/ai-headshot-studio.jpg",
    category: "AI Image",
    href: "/tool/ai-headshot-studio",
    ctaLabel: "Try Studio",
  },
  {
    id: "ad-campaign-studio",
    name: "Ad Campaign Studio",
    description:
      "Plan a full paid-ad campaign for Meta or Google: audiences, 10 ad copies, creative briefs, budget split and a testing plan — plus ready-to-use ad images.",
    imageSrc: "/app-previews/ad-campaign-studio.jpg",
    category: "Marketing",
    href: "/tool/ad-campaign-studio",
    ctaLabel: "Try Studio",
  },
  {
    id: "contract-risk-reviewer",
    name: "Contract Risk Reviewer",
    description:
      "Upload any contract and get a clause-by-clause risk review: red flags, missing protections and suggested negotiation wording, in seconds.",
    imageSrc: "/app-previews/contract-risk-reviewer.jpg",
    category: "Legal",
    href: "/tool/contract-risk-reviewer",
  },
  {
    id: "thumbnail-maker",
    name: "AI Thumbnail Maker",
    description:
      "Generate click-worthy video thumbnails with AI. Pick a style, drop in your title and face — get a polished YouTube or Reels thumbnail in one click.",
    imageSrc: "/app-previews/thumbnail-maker.jpg",
    category: "Content Creation",
    href: "/tool/thumbnail-maker",
  },
  {
    id: "ai-photo-enhancer",
    name: "AI Photo Enhancer",
    description:
      "Fix lighting, remove noise, sharpen details and upscale low-res photos automatically. Works on portraits, products and any everyday shot.",
    imageSrc: "/app-previews/ai-photo-enhancer.jpg",
    category: "Image Tools",
    href: "/tool/ai-photo-enhancer",
  },
  {
    id: "bill-invoice-generator",
    name: "Invoice Generator",
    description:
      "Create professional GST-compliant invoices in seconds. Add your logo, line items and tax rates — download a PDF or share a link instantly.",
    imageSrc: "/app-previews/bill-invoice-generator.jpg",
    category: "Finance",
    href: "/tool/bill-invoice-generator",
  },
];

type TopKind = "website" | "card" | "studio" | "app";
interface TopItem {
  kind: TopKind;
  key: string;
  rank: number;
  tool?: CatalogTool;
  design?: DesignLite;
  /** A design slot while the designs load. */
  pending?: boolean;
}
// The mix of the top ten: a website and a card first, then studios spread among quick apps.
const TOP_PATTERN: TopKind[] = ["website", "card", "studio", "app", "app", "studio", "app", "app", "app", "studio"];
const TOP_FILTERS: { id: TopKind | "all"; label: string }[] = [
  { id: "all", label: "All 10" },
  { id: "website", label: "Websites" },
  { id: "card", label: "Cards & invites" },
  { id: "studio", label: "Studios" },
  { id: "app", label: "Business apps" },
];
const KIND_CHIP: Record<TopKind, string> = { website: "Website", card: "Card & invite", studio: "Studio", app: "Business app" };

/** Ten picks in TOP_PATTERN order. A kind that runs out is filled with the next app; designs still loading keep their slot. */
function buildTopTen(designs: DesignSummary | null, studios: CatalogTool[], apps: CatalogTool[]): TopItem[] {
  const sites = designs ? [...designs.topWebsites] : null;
  const cards = designs ? [...designs.topCards] : null;
  const studioQ = [...studios];
  const appQ = [...apps];
  const out: TopItem[] = [];
  for (const kind of TOP_PATTERN) {
    const rank = out.length + 1;
    if (kind === "website" || kind === "card") {
      const q = kind === "website" ? sites : cards;
      if (q === null) {
        out.push({ kind, key: `pending-${kind}`, rank, pending: true });
        continue;
      }
      const d = q.shift();
      if (d) {
        out.push({ kind, key: `design-${d.id}`, rank, design: d });
        continue;
      }
    } else {
      const t = (kind === "studio" ? studioQ : appQ).shift();
      if (t) {
        out.push({ kind, key: t.id, rank, tool: t });
        continue;
      }
    }
    const fill = appQ.shift();
    if (fill) out.push({ kind: "app", key: fill.id, rank, tool: fill });
  }
  return out;
}

/** Ids in order, once each. */
const uniqueTools = (lists: CatalogTool[][]) => {
  const seen = new Set<string>();
  return lists.flat().filter((t) => !seen.has(t.id) && !!seen.add(t.id));
};

/** Two items for a spotlight tab, with a picture first. */
const twoWithPicture = <T,>(xs: T[], hasPicture: (x: T) => boolean) => [...xs.filter(hasPicture), ...xs.filter((x) => !hasPicture(x))].slice(0, 2);

const PILLAR_TONES = {
  orange: { box: "border-2 border-ink bg-sun text-ink shadow-block", chip: "bg-ink/15 text-ink", line: "text-ink/80", steps: "text-ink/60", go: "text-ink" },
  ink: { box: "border-2 border-ink bg-ink text-cream shadow-block", chip: "bg-cream/20 text-cream", line: "text-cream/80", steps: "text-cream/60", go: "text-cream" },
  night: { box: "border-2 border-ink bg-ink text-cream shadow-block", chip: "bg-sun text-ink", line: "text-cream/80", steps: "text-cream/60", go: "text-sun" },
  paper: {
    box: "border-2 border-ink bg-card shadow-block",
    chip: "bg-sand text-ink",
    line: "text-muted-foreground",
    steps: "text-muted-foreground",
    go: "text-primary",
  },
} as const;

function Stat({ value, label }: { value: string; label: string }) {
  const m = value.match(/^(\d+)(\+?)$/);
  return (
    <div className="flex items-center gap-2">
      <span className="font-display text-base font-bold text-ink">
        {m ? (
          <>
            <NumberTicker value={Number(m[1])} />
            {m[2]}
          </>
        ) : (
          value
        )}
      </span>
      <span>{label}</span>
    </div>
  );
}

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { openQuickLook } = useQuickLook();
  const { data: catalog = [], isLoading: catalogLoading } = useToolsCatalog();
  const { costOf } = usePricingMap();
  const countLabel = useAppCountLabel();
  const [search, setSearch] = useState("");
  const [designs, setDesigns] = useState<DesignSummary | null>(null);
  const [topKind, setTopKind] = useState<TopKind | "all">("all");
  const [more, setMore] = useState<"new" | "cheap">("new");

  const live = useMemo(() => catalog.filter((t) => t.is_live), [catalog]);
  const byId = useMemo(() => new Map(live.map((t) => [t.id, t])), [live]);
  // First visit only: later visits start from the catalogue cached in this browser.
  const loadingApps = catalogLoading && live.length === 0;
  const studioCount = useMemo(() => live.filter((t) => STUDIO_IDS.has(t.id)).length, [live]);
  const hasStudios = studioCount > 0;
  const studioLabel = roundedLabel(studioCount);

  const query = search.trim().toLowerCase();
  // Exact name first, then names that start with the search, then Studios, then everything else.
  // Sorting happens before the cut at 24 so newer apps are not dropped for being later in the catalogue.
  const results = useMemo(() => {
    if (!query) return [];
    const rank = (t: CatalogTool) => {
      const name = t.name.toLowerCase();
      if (name === query) return 0;
      if (name.startsWith(query)) return 1;
      return STUDIO_IDS.has(t.id) ? 2 : 3;
    };
    return live
      .filter((t) => `${t.name} ${t.description} ${categoriesOf(t).join(" ")} ${(t.tool_types ?? []).join(" ")}`.toLowerCase().includes(query))
      .map((t, i) => ({ t, i, r: rank(t) }))
      .sort((a, b) => a.r - b.r || a.i - b.i)
      .slice(0, 24)
      .map((x) => x.t);
  }, [live, query]);

  // Apps placed on the home page (src/data/placements.ts). A new app that lists a place shows there by itself.
  const editorsPicks = useMemo(() => placedIn(live, "home-start"), [live]);
  // Studios: the team's picks, the favourites, then any studio with an original preview.
  const studioPicks = useMemo(
    () =>
      uniqueTools([
        editorsPicks.filter((t) => STUDIO_IDS.has(t.id)),
        POPULAR_STUDIO_IDS.map((id) => byId.get(id)).filter((t): t is CatalogTool => !!t),
        live.filter((t) => STUDIO_IDS.has(t.id) && APP_PREVIEW_IDS.has(t.id)),
      ]),
    [editorsPicks, byId, live],
  );
  // Quick apps: the team's picks, then apps with an original preview.
  const appPicks = useMemo(
    () => uniqueTools([editorsPicks.filter((t) => !STUDIO_IDS.has(t.id)), live.filter((t) => !STUDIO_IDS.has(t.id) && APP_PREVIEW_IDS.has(t.id))]),
    [editorsPicks, live],
  );

  const topTen = useMemo(() => buildTopTen(designs, studioPicks, appPicks), [designs, studioPicks, appPicks]);
  const topShown = topTen.filter((x) => topKind === "all" || x.kind === topKind);
  const inTop = useMemo(() => new Set(topTen.map((x) => x.key)), [topTen]);

  // Pinned new apps first, then the latest additions.
  const newest = useMemo(() => {
    const pinned = placedIn(live, "home-new");
    const rest = live.filter((t) => !pinned.includes(t)).sort((a, b) => b.created_at.localeCompare(a.created_at));
    return [...pinned, ...rest].filter((t) => !inTop.has(t.id)).slice(0, 8);
  }, [live, inTop]);
  const cheapest = live.filter((t) => !STUDIO_IDS.has(t.id) && !inTop.has(t.id) && costOf(t.id) === 1).slice(0, 8);
  const moreTabs = [
    { id: "new" as const, label: "New in the store", line: "The latest apps we added.", items: newest },
    { id: "cheap" as const, label: "Cheapest to run", line: "1 credit each time — less than ₹1.", items: cheapest },
  ].filter((t) => t.items.length > 0);
  const moreTab = moreTabs.find((t) => t.id === more) ?? moreTabs[0];

  // The moving strip: apps placed there, then the team's picks, then the newest.
  const strip = useMemo(
    () => uniqueTools([placedIn(live, "home-strip"), editorsPicks, newest, live]).slice(0, 30).map((t) => t.name),
    [live, editorsPicks, newest],
  );
  // Apps per goal for "Browse by what you need".
  const goalCounts = useMemo(() => {
    const m = new Map<string, Set<string>>();
    live.forEach((t) =>
      categoriesOf(t).forEach((c) => {
        const g = categoryInfo(c).goal;
        if (!m.has(g)) m.set(g, new Set());
        m.get(g)!.add(t.id);
      }),
    );
    return m;
  }, [live]);

  const lowestCost = (tools: CatalogTool[]) => (tools.length ? Math.min(...tools.map((t) => costOf(t.id))) : null);
  const appCost = lowestCost(live.filter((t) => !STUDIO_IDS.has(t.id)));

  const toolItem = (t: CatalogTool): SpotItem => ({
    key: t.id,
    name: t.name,
    sub: t.description || studioTabOf(t.id)?.tab.label || t.category,
    media: <ToolMedia tool={t} />,
    onOpen: () => openQuickLook(t.id),
  });
  const designItem = (d: DesignLite): SpotItem => ({ key: d.id, name: d.name, sub: d.tagline || d.categoryName, media: <DesignMedia d={d} />, to: `/make/${d.id}` });
  const designCost = (n: number | null | undefined) => (n ? `From ${creditsLabel(n)}` : "Pay once");

  const spotTabs: SpotTab[] = [
    {
      id: "website",
      tab: "Website",
      badge: "Websites · our picks",
      title: designs ? `${roundedLabel(designs.websiteCount)} website designs` : "Website designs",
      line: "A website, QR menu or visiting card with one link to share.",
      cost: designCost(designs?.minWebsiteCredits),
      items: designs ? twoWithPicture(designs.topWebsites, (d) => !!d.image).map(designItem) : null,
      to: "/websites",
      cta: "See all website designs",
    },
    {
      id: "card",
      tab: "Card",
      badge: "Cards & invites · our picks",
      title: designs ? `${roundedLabel(designs.cardCount)} card designs` : "Card designs",
      line: "Wedding invites, festival wishes and birthday surprises, sent with one link.",
      cost: designCost(designs?.minCardCredits),
      items: designs ? twoWithPicture(designs.topCards, (d) => !!d.image).map(designItem) : null,
      to: "/cards",
      cta: "See all card designs",
    },
    ...(loadingApps || hasStudios
      ? [
          {
            id: "studio",
            tab: "Studio",
            badge: "Studios · our picks",
            title: hasStudios ? `${studioLabel} studios` : "Studios",
            line: "A business plan, catalogue photos, a resume or a family book, finished for you step by step.",
            cost: "Pay per result",
            items: loadingApps ? null : twoWithPicture(studioPicks, (t) => APP_PREVIEW_IDS.has(t.id)).map(toolItem),
            to: "/studios",
            cta: "See all studios",
          },
        ]
      : []),
    {
      id: "app",
      tab: "App",
      badge: "Business apps · our picks",
      title: `${countLabel} business apps`,
      line: "Make a bill, write to customers, fix a photo, track staff and stock.",
      cost: appCost ? `From ${creditsLabel(appCost)}` : "Pay per result",
      items: loadingApps ? null : twoWithPicture(appPicks, (t) => APP_PREVIEW_IDS.has(t.id)).map(toolItem),
      to: "/ai-apps",
      cta: "Browse all apps",
    },
  ];

  const pillars: { to: string; chip: string; title: string; line: string; flow: Flow; go: string; tone: keyof typeof PILLAR_TONES }[] = [
    { to: "/websites", chip: "Stays online", title: "Make a website", line: "A website, QR menu or visiting card with one link to share.", flow: "website", go: "See website designs", tone: "orange" },
    { to: "/cards", chip: "Sent once", title: "Send a card or invite", line: "Wedding invites, festival wishes and birthday surprises.", flow: "card", go: "See card designs", tone: "ink" },
    ...(hasStudios
      ? [{ to: "/studios", chip: `${studioLabel} studios`, title: "Get a big job done", line: "A business plan, catalogue photos, a resume or a family book, finished for you step by step.", flow: "app" as Flow, go: "See studios", tone: "night" as const }]
      : []),
    { to: "/ai-apps", chip: `${countLabel} apps`, title: "Use a business app", line: "Make a bill, write to customers, fix a photo, track staff and stock.", flow: "app", go: "Browse apps", tone: "paper" },
  ];

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    if (query) navigate(`/ai-apps?q=${encodeURIComponent(search.trim())}`);
  };


  return (
    <ModernPage section="home">
      <SEOHead
        {...seoFor("/", countLabel)}
        keywords="ezyourlife, ai apps, ai app store, pay as you go ai, ai tools india, business website maker, gst invoice app"
      />
      <Suspense fallback={null}>
        <DesignFeed onChange={setDesigns} />
      </Suspense>

      <main>
        {/* ───────── Moving strip of app names ───────── */}
        {strip.length > 0 && (
          <div aria-hidden className="overflow-hidden border-y-2 border-ink bg-ink py-3 text-cream">
            <div className="flex w-max animate-marquee gap-8 whitespace-nowrap font-display text-lg font-bold motion-reduce:animate-none">
              {[...strip, ...strip].map((n, i) => (
                <span key={i} className={i % 3 === 0 ? "text-sun" : i % 3 === 1 ? "text-pink" : "text-cream"}>
                  {n} ✦
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ───────── Hero ───────── */}
        <section id="hero" className="relative overflow-hidden pb-14 pt-10 sm:pb-20 sm:pt-14">
          <div className="pointer-events-none absolute -top-24 left-1/2 h-[360px] w-[720px] -translate-x-1/2 rounded-full bg-sun/10 blur-3xl" />
          <div className={cn(CONTAINER, "relative")}>
            <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-10">
              <div className="min-w-0 space-y-6 lg:col-span-6">
                <div className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-card px-3 py-1 text-xs font-semibold shadow-block-sm">
                  <span className="rounded-full bg-pink px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-ink">India</span>
                  <span className="text-muted-foreground">For small businesses · Pay only for results</span>
                </div>

                <h1 className="font-display text-4xl font-bold leading-[1.06] tracking-tight sm:text-5xl lg:text-[54px]">
                  Run your whole business{" "}
                  <span className="text-gradient-amber">from one place.</span>
                </h1>

                <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                  {countLabel} ready apps for <strong className="text-ink">bills, customers, staff and photos</strong>, plus{" "}
                  <strong className="text-ink">websites and cards</strong> you make in minutes.
                  {studioCount >= 10 && (
                    <>
                      {" "}
                      Plus {studioLabel} <strong className="text-ink">studios</strong> that finish big jobs for you.
                    </>
                  )}{" "}
                  Pay only when an app gives you a result. Start with 100 free credits.
                </p>

                <form onSubmit={onSearch} role="search" className="max-w-xl">
                  <div className="flex items-center gap-2 rounded-2xl border-2 border-ink bg-card p-1.5 shadow-block transition focus-within:ring-2 focus-within:ring-ring">
                    <Search className="ml-3 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="What do you need? GST bill, passport photo…"
                      aria-label="Search apps"
                      className="min-w-0 flex-1 bg-transparent px-2 py-2.5 text-base placeholder:text-muted-foreground focus:outline-none sm:text-sm"
                    />
                    {search && (
                      <button type="button" onClick={() => setSearch("")} aria-label="Clear search" className={cn("shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-sand", FOCUS_RING)}>
                        <X className="h-4 w-4" aria-hidden />
                      </button>
                    )}
                    <button type="submit" className={cn("shrink-0 rounded-xl border-2 border-ink bg-ink px-4 py-2.5 text-sm font-semibold text-cream shadow-block-sm transition hover:opacity-90", FOCUS_RING)}>
                      Find
                    </button>
                  </div>
                  <div className="ez-chips mt-3">
                    <span className="text-xs font-medium text-muted-foreground">People search:</span>
                    {POPULAR_SEARCHES.map((q) => (
                      <Link
                        key={q}
                        to={`/ai-apps?q=${encodeURIComponent(q)}`}
                        className={cn(
                          "rounded-full border-2 border-ink/30 bg-sand px-3 py-1 text-xs font-medium transition hover:border-ink hover:bg-sun",
                          FOCUS_RING,
                        )}
                      >
                        {q}
                      </Link>
                    ))}
                  </div>
                </form>

                <div className="ez-chips gap-6 pt-2 text-xs text-muted-foreground">
                  <Stat value={countLabel} label="Business apps" />
                  {hasStudios && (
                    <>
                      <span className="hidden h-4 w-px bg-ink/20 sm:block" aria-hidden />
                      <Stat value={studioLabel} label="Studios" />
                    </>
                  )}
                  <span className="hidden h-4 w-px bg-ink/20 sm:block" aria-hidden />
                  <Stat value={designs ? roundedLabel(designs.total) : "…"} label="Website & card designs" />
                </div>
              </div>

              <div className="min-w-0 lg:col-span-6">
                <HeroSpotlight tabs={spotTabs} />
              </div>
            </div>
          </div>
        </section>

        {/* ───────── Top 10 (or search results) ───────── */}
        <section
          id="top-10"
          aria-live={query ? "polite" : undefined}
          className="scroll-mt-20 border-t-2 border-ink/15 bg-sand/40 py-14"
        >
          <div className={CONTAINER}>
            {query ? (
              <>
                <SectionHead
                  eyebrow="Search"
                  title={
                    <>
                      {search.trim()} <span className="text-base font-normal text-muted-foreground">({results.length})</span>
                    </>
                  }
                  action={
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => setSearch("")} className={BTN_OUTLINE}>
                        Clear search
                      </button>
                      <Link to={`/ai-apps?q=${encodeURIComponent(search.trim())}`} className={BTN_INK}>
                        Search websites and cards too
                      </Link>
                    </div>
                  }
                />
                {results.length ? (
                  <ScrollRow size="card">
                    {results.map((t) => (
                      <ToolCard key={t.id} tool={t} chip={STUDIO_IDS.has(t.id) ? "Studio" : t.category} />
                    ))}
                  </ScrollRow>
                ) : (
                  <EmptyState message="No apps match that search." action="Clear search" onAction={() => setSearch("")} />
                )}
              </>
            ) : (
              <>
                <SectionHead
                  eyebrow="Picked by our team"
                  title="Top 10 to start with"
                  line="Websites, cards and invites, studios and quick business apps: the ones we would open first."
                  action={
                    <div role="group" aria-label="Show in the top 10" className="ez-chips">
                      {TOP_FILTERS.map((f) => (
                        <button key={f.id} type="button" aria-pressed={topKind === f.id} onClick={() => setTopKind(f.id)} className={pillClass(topKind === f.id)}>
                          {f.label}
                        </button>
                      ))}
                    </div>
                  }
                />
                {loadingApps ? (
                  <ScrollRow size="card">
                    {TOP_PATTERN.map((k, i) => (
                      <CardSkeleton key={`${k}-${i}`} />
                    ))}
                  </ScrollRow>
                ) : topShown.length ? (
                  <ScrollRow size="card">
                    {topShown.map((x) =>
                      x.pending ? (
                        <CardSkeleton key={x.key} />
                      ) : x.design ? (
                        <DesignCard key={x.key} d={x.design} rank={x.rank} chip={KIND_CHIP[x.kind]} size="md" />
                      ) : x.tool ? (
                        <ToolCard key={x.key} tool={x.tool} rank={x.rank} chip={KIND_CHIP[x.kind]} />
                      ) : null,
                    )}
                  </ScrollRow>
                ) : (
                  <EmptyState message="Nothing of this kind in the top 10 right now." action="Show all 10" onAction={() => setTopKind("all")} />
                )}
              </>
            )}
          </div>
        </section>

        {/* ───────── App Showcase ───────── */}
        <section id="app-showcase" className="py-10">
          <div className={CONTAINER}>
            <AppShowcaseRow
              heading="See apps in action"
              subheading="Featured"
              apps={FEATURED_SHOWCASE_APPS}
            />
          </div>
        </section>

        {/* ───────── Four ways in ───────── */}
        <section id="pillars" className="py-14">
          <div className={CONTAINER}>
            <div className="mb-8">
              <span className={EYEBROW}>Everything in one place</span>
              <h2 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">What do you want to do today?</h2>
            </div>
            <ScrollRow size="wide" label="Ways to start">
              {pillars.map((p) => {
                const tone = PILLAR_TONES[p.tone];
                return (
                  <Link key={p.to} to={p.to} className={cn("block-lift flex min-h-[210px] flex-col justify-between rounded-2xl p-6", tone.box, FOCUS_RING)}>
                    <div>
                      <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold", tone.chip)}>{p.chip}</span>
                      <h3 className="mt-4 font-display text-xl font-bold">{p.title}</h3>
                      <p className={cn("mt-1.5 text-xs leading-relaxed", tone.line)}>{p.line}</p>
                      <p className={cn("mt-3 text-[11px] font-medium", tone.steps)}>{FLOW_STEPS[p.flow].join(" → ")}</p>
                    </div>
                    <span className={cn("mt-4 inline-flex items-center gap-1 text-xs font-bold underline underline-offset-4", tone.go)}>
                      {p.go} <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                    </span>
                  </Link>
                );
              })}
            </ScrollRow>
          </div>
        </section>

        {/* ───────── Browse by what you need ───────── */}
        {goalCounts.size > 0 && (
          <section className="border-t-2 border-ink/15 py-14">
            <div className={CONTAINER}>
              <SectionHead eyebrow="Browse" title="Browse by what you need" line="Every app sorted by what it does for your business." />
              <ScrollRow size="step" label="Browse by what you need">
                {GOALS.filter((g) => g.id !== "more" && (goalCounts.get(g.id)?.size ?? 0) > 0).map((g) => (
                  <Link
                    key={g.id}
                    to={`/ai-apps?goal=${g.id}`}
                    className={cn("block-lift flex min-h-[170px] flex-col gap-2 rounded-2xl border-2 border-ink p-5 shadow-block-sm", FOCUS_RING)}
                    style={{ background: g.color }}
                  >
                    <span className="w-fit rounded-full border-2 border-ink bg-card/80 px-2.5 py-0.5 text-xs font-bold">{goalCounts.get(g.id)?.size} apps</span>
                    <span className="mt-auto font-display text-lg font-extrabold leading-tight">{g.name}</span>
                    <span className="text-sm leading-snug text-ink/80">{g.line}</span>
                    <span className="inline-flex items-center gap-1 text-sm font-bold">
                      Browse <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                    </span>
                  </Link>
                ))}
              </ScrollRow>
            </div>
          </section>
        )}

        {/* ───────── New and cheapest ───────── */}
        {moreTab && (
          <section className="border-t-2 border-ink/15 py-14">
            <div className={CONTAINER}>
              <SectionHead
                eyebrow="Keep exploring"
                title={moreTab.label}
                line={moreTab.line}
                action={
                  moreTabs.length > 1 && (
                    <div role="group" aria-label="Show" className="ez-chips">
                      {moreTabs.map((t) => (
                        <button key={t.id} type="button" aria-pressed={moreTab.id === t.id} onClick={() => setMore(t.id)} className={pillClass(moreTab.id === t.id)}>
                          {t.label}
                        </button>
                      ))}
                    </div>
                  )
                }
              />
              <ScrollRow size="card">
                {moreTab.items.map((t) => (
                  <ToolCard key={t.id} tool={t} chip={STUDIO_IDS.has(t.id) ? "Studio" : t.category} />
                ))}
              </ScrollRow>
              <Link to="/ai-apps" className={cn(BTN_OUTLINE, "mt-6")}>
                See all {countLabel} apps <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </section>
        )}

        {/* ───────── Earn ───────── */}
        <section id="earn" className="scroll-mt-24 border-t-2 border-ink/15 py-14">
          <div className={CONTAINER}>
            <SectionHead eyebrow="Earn with us" title="Earn with Ezyourlife" line="Two ways to earn from what you already have: your followers, or an app you built." />
            <ScrollRow size="wide" label="Ways to earn">
              {EARN_LINKS.map((l, i) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className={cn(
                    "block-lift flex flex-col justify-between gap-6 rounded-2xl p-6",
                    i === 0 ? "border-2 border-ink bg-card shadow-block" : "border-2 border-ink bg-ink text-cream shadow-block",
                    FOCUS_RING,
                  )}
                >
                  <div>
                    <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl border-2", i === 0 ? "border-ink bg-sun text-ink" : "border-cream/30 bg-cream/15 text-cream")}>
                      <l.Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <h3 className="mt-4 font-display text-xl font-bold">{l.label}</h3>
                    <p className={cn("mt-1.5 text-sm", i === 0 ? "text-muted-foreground" : "text-cream/70")}>{l.line}</p>
                  </div>
                  <span className={cn("inline-flex items-center gap-1 text-xs font-bold underline underline-offset-4", i === 0 ? "text-primary" : "text-sun")}>
                    {i === 0 ? "Join free" : "List your app"} <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </span>
                </Link>
              ))}
            </ScrollRow>
          </div>
        </section>

        {/* ───────── Credits ───────── */}
        <section id="credits" className="scroll-mt-24 border-t-2 border-ink/15 py-12">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            {user ? (
              <CtaBand chip="Pay per result" title="One wallet for every app." line="Credits never tie you to a plan, and failed runs are free.">
                <Link to="/credits" className={BTN_PRIMARY}>
                  Buy credits
                </Link>
              </CtaBand>
            ) : (
              <CtaBand
                chip="No card needed"
                title="Your first 100 credits are on us."
                line="50 when you sign up and 50 more after your first run. Pay only when an app gives you a result; failed runs are free."
              >
                <Link to="/auth?mode=signup" className={BTN_PRIMARY}>
                  Claim free credits
                </Link>
                <Link to="/credits" className={cn("inline-flex items-center rounded-xl border border-cream/30 px-5 py-2.5 text-sm font-bold text-cream transition hover:bg-cream/10", FOCUS_RING)}>
                  See prices
                </Link>
              </CtaBand>
            )}
          </div>
        </section>

        {/* ───────── Rate & Review CTA ───────── */}
        <section className="border-t-2 border-ink/10 py-10">
          <div className={cn(CONTAINER, "flex flex-col items-center gap-4 text-center")}>
            <span className="rounded-full border-2 border-ink bg-pink px-3 py-1 font-display text-xs font-bold uppercase tracking-wider">
              Community
            </span>
            <h2 className="font-display text-2xl font-bold sm:text-3xl">
              Tried an app? Tell others what you think.
            </h2>
            <p className="max-w-lg text-muted-foreground">
              Every review helps small businesses pick the right app. Open any app page and tap "Write a review".
            </p>
            <Link to="/ai-apps" className={BTN_INK}>
              Browse apps <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <div id="request-tool" className="scroll-mt-24">
          <RequestToolSection />
        </div>
      </main>
    </ModernPage>
  );
};

export default Home;
