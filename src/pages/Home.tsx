import { Suspense, lazy, useMemo, useRef, useState, type FormEvent } from "react";
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
import { categoriesOf } from "@/data/goals";
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

// The website and card designs are a large catalogue: load them after the first screen is up.
const DesignFeed = lazy(() => import("@/components/modern/home/DesignFeed"));

const POPULAR_SEARCHES = ["invoice", "passport photo", "salary", "remove background", "caption", "contract"];

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
  orange: { box: "border-[1.5px] border-foreground bg-primary text-primary-foreground", chip: "bg-foreground/10", line: "text-foreground/70", steps: "text-foreground/75", go: "text-primary-foreground" },
  ink: { box: "bg-gradient-to-br from-zinc-900 to-zinc-800 text-white", chip: "bg-white/20", line: "text-zinc-300", steps: "text-zinc-400", go: "text-white" },
  night: { box: "border border-zinc-800 bg-zinc-900 text-white", chip: "bg-amber-400 text-zinc-950", line: "text-zinc-300", steps: "text-zinc-400", go: "text-amber-300" },
  paper: {
    box: "border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900",
    chip: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200",
    line: "text-zinc-600 dark:text-zinc-400",
    steps: "text-zinc-500 dark:text-zinc-500",
    go: "text-orange-700 dark:text-orange-400",
  },
} as const;

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-display text-base font-bold text-zinc-900 dark:text-white">{value}</span>
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
  const topScrollRef = useRef<HTMLDivElement>(null);
  const chooseTopKind = (id: TopKind | "all") => {
    setTopKind(id);
    topScrollRef.current?.scrollTo({ left: 0, behavior: "smooth" });
  };

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

  const topGrid = "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5";
  // Below md: a single-row snap-scroll strip so #1-#10 peek in from the right; at md+ this is the same grid as topGrid.
  const topCarousel = "flex overflow-x-auto snap-x snap-mandatory gap-3.5 pb-3 -mx-4 px-4 no-scrollbar md:grid md:gap-4 md:pb-0 md:mx-0 md:px-0 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5";
  const topCardClass = "min-w-[82%] shrink-0 snap-start sm:min-w-[65%] md:min-w-0 h-[230px] min-h-0 md:h-[260px]";
  // Same mobile snap-scroll treatment as the Top 10 strip above, for the "New in the store" / "Cheapest to run" shelf.
  const moreCarousel = "flex overflow-x-auto snap-x snap-mandatory gap-3.5 pb-3 scroll-px-4 -mx-4 px-4 no-scrollbar md:grid md:gap-4 md:pb-0 md:mx-0 md:px-0 md:grid-cols-2 lg:grid-cols-4";
  const moreCardClass = "min-w-[82%] shrink-0 snap-start sm:min-w-[65%] md:min-w-0 h-[230px] min-h-0 md:h-[260px]";

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
        {/* ───────── Hero ───────── */}
        <section id="hero" className="relative overflow-hidden pb-14 pt-10 sm:pb-20 sm:pt-14">
          <div className="pointer-events-none absolute -top-24 left-1/2 h-[360px] w-[720px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-orange-500/20 via-amber-400/15 to-emerald-400/15 blur-3xl" />
          <div className={cn(CONTAINER, "relative")}>
            <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-10">
              <div className="min-w-0 space-y-6 lg:col-span-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold shadow-soft-sm dark:border-zinc-800 dark:bg-zinc-900">
                  <span className="rounded-full border-[1.5px] border-foreground bg-primary px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-primary-foreground">India</span>
                  <span className="text-zinc-600 dark:text-zinc-300">For small businesses · Pay only for results</span>
                </div>

                <h1 className="font-display text-4xl font-bold leading-[1.06] tracking-tight sm:text-5xl lg:text-[54px]">
                  Run your whole business{" "}
                  <span className="bg-gradient-to-r from-orange-600 via-amber-500 to-rose-500 bg-clip-text text-transparent">from one place.</span>
                </h1>

                <p className="max-w-xl text-base leading-relaxed text-zinc-600 sm:text-lg dark:text-zinc-400">
                  {countLabel} ready apps for <strong className="text-zinc-900 dark:text-zinc-100">bills, customers, staff and photos</strong>, plus{" "}
                  <strong className="text-zinc-900 dark:text-zinc-100">websites and cards</strong> you make in minutes.
                  {studioCount >= 10 && (
                    <>
                      {" "}
                      Plus {studioLabel} <strong className="text-zinc-900 dark:text-zinc-100">studios</strong> that finish big jobs for you.
                    </>
                  )}{" "}
                  Pay only when an app gives you a result. Start with 100 free credits.
                </p>

                <form onSubmit={onSearch} role="search" className="max-w-xl">
                  <div className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white p-1.5 shadow-soft-lg shadow-zinc-950/5 transition focus-within:ring-2 focus-within:ring-orange-500 dark:border-zinc-800 dark:bg-zinc-900">
                    <Search className="ml-3 h-5 w-5 shrink-0 text-zinc-400" aria-hidden />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="What do you need? GST bill, passport photo…"
                      aria-label="Search apps"
                      className="min-w-0 flex-1 bg-transparent px-2 py-2.5 text-base placeholder:text-zinc-400 focus:outline-none sm:text-sm"
                    />
                    {search && (
                      <button type="button" onClick={() => setSearch("")} aria-label="Clear search" className={cn("shrink-0 rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800", FOCUS_RING)}>
                        <X className="h-4 w-4" aria-hidden />
                      </button>
                    )}
                    <button type="submit" className={cn("shrink-0 rounded-xl border-2 border-foreground bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-pink-hover", FOCUS_RING)}>
                      Find
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">People search:</span>
                    {POPULAR_SEARCHES.map((q) => (
                      <Link
                        key={q}
                        to={`/ai-apps?q=${encodeURIComponent(q)}`}
                        className={cn(
                          "rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1 text-xs font-medium transition hover:bg-orange-100 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-orange-950/60",
                          FOCUS_RING,
                        )}
                      >
                        {q}
                      </Link>
                    ))}
                  </div>
                </form>

                <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-zinc-500 dark:text-zinc-400">
                  <Stat value={countLabel} label="Business apps" />
                  {hasStudios && (
                    <>
                      <span className="hidden h-4 w-px bg-zinc-300 sm:block dark:bg-zinc-800" aria-hidden />
                      <Stat value={studioLabel} label="Studios" />
                    </>
                  )}
                  <span className="hidden h-4 w-px bg-zinc-300 sm:block dark:bg-zinc-800" aria-hidden />
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
          className="scroll-mt-20 border-t border-zinc-200/80 bg-[#F2F0EA]/70 py-14 dark:border-zinc-800/80 dark:bg-[#14171D]/70"
        >
          <div className={CONTAINER}>
            {query ? (
              <>
                <SectionHead
                  eyebrow="Search"
                  title={
                    <>
                      Results for “{search.trim()}” <span className="text-base font-normal text-zinc-500 dark:text-zinc-400">({results.length})</span>
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
                  <div className={topGrid}>
                    {results.map((t) => (
                      <ToolCard key={t.id} tool={t} chip={STUDIO_IDS.has(t.id) ? "Studio" : t.category} />
                    ))}
                  </div>
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
                    <div
                      role="group"
                      aria-label="Show in the top 10"
                      className="flex flex-nowrap gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap"
                    >
                      {TOP_FILTERS.map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          aria-pressed={topKind === f.id}
                          onClick={() => chooseTopKind(f.id)}
                          className={cn(pillClass(topKind === f.id), "whitespace-nowrap")}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  }
                />
                {loadingApps ? (
                  <div ref={topScrollRef} className={topCarousel}>
                    {TOP_PATTERN.map((k, i) => (
                      <CardSkeleton key={`${k}-${i}`} className={topCardClass} />
                    ))}
                  </div>
                ) : topShown.length ? (
                  <div ref={topScrollRef} className={topCarousel}>
                    {topShown.map((x) =>
                      x.pending ? (
                        <CardSkeleton key={x.key} className={topCardClass} />
                      ) : x.design ? (
                        <DesignCard key={x.key} d={x.design} rank={x.rank} chip={KIND_CHIP[x.kind]} size="md" className={topCardClass} />
                      ) : x.tool ? (
                        <ToolCard key={x.key} tool={x.tool} rank={x.rank} chip={KIND_CHIP[x.kind]} className={topCardClass} />
                      ) : null,
                    )}
                  </div>
                ) : (
                  <EmptyState message="Nothing of this kind in the top 10 right now." action="Show all 10" onAction={() => chooseTopKind("all")} />
                )}
              </>
            )}
          </div>
        </section>

        {/* ───────── Four ways in ───────── */}
        <section id="pillars" className="py-14">
          <div className={CONTAINER}>
            <div className="mb-8">
              <span className={cn(EYEBROW, "text-amber-700 dark:text-amber-400")}>Everything in one place</span>
              <h2 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">What do you want to do today?</h2>
            </div>
            <div className={cn("grid gap-4 md:grid-cols-2", pillars.length === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3")}>
              {pillars.map((p) => {
                const tone = PILLAR_TONES[p.tone];
                return (
                  <Link key={p.to} to={p.to} className={cn("ez-lift flex min-h-[210px] flex-col justify-between rounded-3xl p-6", tone.box, FOCUS_RING)}>
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
            </div>
          </div>
        </section>

        {/* ───────── New and cheapest ───────── */}
        {moreTab && (
          <section className="border-t border-zinc-200/80 py-14 dark:border-zinc-800/80">
            <div className={CONTAINER}>
              <SectionHead
                eyebrow="Keep exploring"
                title={moreTab.label}
                line={moreTab.line}
                action={
                  moreTabs.length > 1 && (
                    <div role="group" aria-label="Show" className="flex flex-nowrap gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap">
                      {moreTabs.map((t) => (
                        <button key={t.id} type="button" aria-pressed={moreTab.id === t.id} onClick={() => setMore(t.id)} className={cn(pillClass(moreTab.id === t.id), "whitespace-nowrap")}>
                          {t.label}
                        </button>
                      ))}
                    </div>
                  )
                }
              />
              <div className={moreCarousel}>
                {moreTab.items.map((t) => (
                  <ToolCard key={t.id} tool={t} chip={STUDIO_IDS.has(t.id) ? "Studio" : t.category} className={moreCardClass} />
                ))}
              </div>
              <Link to="/ai-apps" className={cn(BTN_OUTLINE, "mt-6")}>
                See all {countLabel} apps <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </section>
        )}

        {/* ───────── Earn ───────── */}
        <section id="earn" className="scroll-mt-24 border-t border-zinc-200/80 py-14 dark:border-zinc-800/80">
          <div className={CONTAINER}>
            <SectionHead eyebrow="Earn with us" title="Earn with Ezyourlife" line="Two ways to earn from what you already have: your followers, or an app you built." />
            <div className="grid gap-4 md:grid-cols-2">
              {EARN_LINKS.map((l, i) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className={cn(
                    "ez-lift flex flex-col justify-between gap-6 rounded-3xl p-6",
                    i === 0 ? "border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900" : "bg-gradient-to-br from-zinc-900 to-zinc-800 text-white",
                    FOCUS_RING,
                  )}
                >
                  <div>
                    <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", i === 0 ? "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300" : "bg-white/15")}>
                      <l.Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <h3 className="mt-4 font-display text-xl font-bold">{l.label}</h3>
                    <p className={cn("mt-1.5 text-sm", i === 0 ? "text-zinc-600 dark:text-zinc-400" : "text-zinc-300")}>{l.line}</p>
                  </div>
                  <span className={cn("inline-flex items-center gap-1 text-xs font-bold underline underline-offset-4", i === 0 ? "text-orange-700 dark:text-orange-400" : "text-amber-300")}>
                    {i === 0 ? "Join free" : "List your app"} <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ───────── Credits ───────── */}
        <section id="credits" className="scroll-mt-24 border-t border-zinc-200/80 py-12 dark:border-zinc-800/80">
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
                <Link to="/credits" className={cn("inline-flex items-center rounded-xl border border-white/25 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-white/10", FOCUS_RING)}>
                  See prices
                </Link>
              </CtaBand>
            )}
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
