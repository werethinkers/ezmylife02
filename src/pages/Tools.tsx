import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, Search, X } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import RequestToolSection from "@/components/RequestToolSection";
import { useToolsCatalog, type CatalogTool } from "@/hooks/useToolsCatalog";
import { useRecentTools } from "@/hooks/useRecentTools";
import { useAuth } from "@/contexts/AuthContext";
import { useAppCountLabel } from "@/lib/appCount";
import { GOALS_WITH_MORE, KIND_TEXT, byCategoryOrder, categoriesOf, categoryInfo, goalById, type GoalId } from "@/data/goals";
import { STUDIO_IDS } from "@/data/studios";
import { hasTag, tagCounts } from "@/lib/catalogTags";
import { cn } from "@/lib/utils";
import { seoFor } from "@/lib/seo/pages";
import { placedIn } from "@/data/placements";
import { useProducts } from "@/instant/useProducts";
import { CATEGORIES as DESIGN_CATEGORIES } from "@/instant/catalog";
import { ModernPage } from "@/components/modern/ModernPage";
import { ToolCard } from "@/components/modern/ToolCard";
import { DesignCard } from "@/components/modern/DesignCard";
import { toDesignLite } from "@/components/modern/designLite";
import { EmptyState, PageHeader, SectionHead } from "@/components/modern/ui";
import { BTN_OUTLINE, FOCUS_RING, CONTAINER, GOAL_GRADIENT, pillClass, subPillClass } from "@/components/modern/styles";
import { AppShowcaseRow, type ShowcaseApp } from "@/components/AppShowcaseCard";
import { ScrollRow } from "@/components/ui/scroll-row";

const TOOLS_SHOWCASE_APPS: ShowcaseApp[] = [
  {
    id: "content-idea-generator",
    name: "Content Idea Generator",
    description: "Get 20 content ideas with hooks, formats and headlines — matched to your brand, niche and audience — ready to drop into your content calendar.",
    imageSrc: "/app-previews/content-idea-generator.jpg",
    category: "Content",
    href: "/tool/content-idea-generator",
  },
  {
    id: "customer-persona-lab",
    name: "Customer Persona Lab",
    description: "Turn reviews, survey answers or chats into 3–4 detailed customer personas with needs, objections, channels and messages.",
    imageSrc: "/app-previews/customer-persona-lab.jpg",
    category: "Marketing",
    href: "/tool/customer-persona-lab",
  },
  {
    id: "product-launch-kit",
    name: "Product Launch Kit",
    description: "Everything to launch a product: positioning, timeline, emails, social posts, press template and a 30-day task list.",
    imageSrc: "/app-previews/product-launch-kit.jpg",
    category: "Marketing",
    href: "/tool/product-launch-kit",
  },
  {
    id: "remove-background",
    name: "Remove Background",
    description: "Auto-remove the background from any photo in seconds — sharp edges, transparent PNG, ready for Canva, your website or any design tool.",
    imageSrc: "/app-previews/remove-background.jpg",
    category: "Image",
    href: "/tool/remove-background",
  },
  {
    id: "resume-studio",
    name: "Resume Studio",
    description: "Upload your resume and a job description to get an ATS score, a rewritten resume tailored to the role, and a matching cover letter.",
    imageSrc: "/app-previews/resume-studio.jpg",
    category: "Careers",
    href: "/tool/resume-studio",
    ctaLabel: "Try Studio",
  },
  {
    id: "food-menu-photo-studio",
    name: "Food Menu Photo Studio",
    description: "Turn quick kitchen photos into appetising menu shots for Zomato, Swiggy and your menu card: top-down, plated, thali and close-ups.",
    imageSrc: "/app-previews/food-menu-photo-studio.jpg",
    category: "Food & Commerce",
    href: "/tool/food-menu-photo-studio",
    ctaLabel: "Try Studio",
  },
];

const PER_CATEGORY = 8;
/** Filter-by-type chips shown before "Show more". */
const TAGS_SHOWN = 8;
/** A type needs at least this many apps to be worth a chip. */
const TAG_MIN_APPS = 3;

/** GOALS already ends with "More apps" and GOALS_WITH_MORE adds it again; keep the first so it shows once. */
const GOAL_LIST = GOALS_WITH_MORE.filter((g, i, all) => all.findIndex((x) => x.id === g.id) === i);
const linkish = cn("rounded font-semibold text-orange-700 underline-offset-4 hover:underline dark:text-orange-400", FOCUS_RING);

/**
 * All business apps, organised by what people want to get done. Filters live in the URL so every
 * view can be linked: ?goal=customers, ?category=Image%20Tools, ?type=document%20tools, ?q=invoice,
 * ?request=1. An app that sits in more than one category (set in admin) is listed under each.
 */
const Tools = () => {
  const countLabel = useAppCountLabel();
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const goalId = (params.get("goal") as GoalId | null) ?? null;
  const category = params.get("category");
  const typeKey = params.get("type");
  const [allTags, setAllTags] = useState(false);
  const { data: catalog = [] } = useToolsCatalog();
  const { list: designs } = useProducts();
  const { user } = useAuth();
  const { recent } = useRecentTools();

  const set = (patch: Record<string, string | null>) =>
    setParams(
      (p) => {
        const n = new URLSearchParams(p);
        Object.entries(patch).forEach(([k, v]) => (v ? n.set(k, v) : n.delete(k)));
        return n;
      },
      { replace: true },
    );

  useEffect(() => {
    if (params.get("request") === "1") document.getElementById("request-app")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [params]);

  const live = useMemo(() => catalog.filter((t) => t.is_live), [catalog]);
  // Apps after the "type" filter (if one is on); everything below groups these.
  const shown = useMemo(() => (typeKey ? live.filter((t) => hasTag(t, typeKey)) : live), [live, typeKey]);
  const byCategory = useMemo(() => {
    const m = new Map<string, CatalogTool[]>();
    shown.forEach((t) => categoriesOf(t).forEach((c) => m.set(c, [...(m.get(c) ?? []), t])));
    return m;
  }, [shown]);

  // Goals in display order, each with its categories (admin order first, then largest) and its number of apps.
  const goals = useMemo(
    () =>
      GOAL_LIST.map((g) => {
        const cats = [...byCategory.entries()]
          .filter(([c]) => categoryInfo(c).goal === g.id)
          .sort((a, b) => byCategoryOrder([a[0], a[1].length], [b[0], b[1].length]));
        return { goal: g, cats, count: new Set(cats.flatMap(([, tools]) => tools.map((t) => t.id))).size };
      }).filter((x) => x.cats.length > 0),
    [byCategory],
  );

  const query = q.trim().toLowerCase();
  const results = useMemo(
    () =>
      query
        ? shown.filter((t) => `${t.name} ${t.description} ${categoriesOf(t).join(" ")} ${(t.tool_types ?? []).join(" ")}`.toLowerCase().includes(query))
        : [],
    [shown, query],
  );
  // Websites, cards and invites are found by the same search, so nothing in the store is hidden from it.
  const designResults = useMemo(
    () =>
      query && !typeKey
        ? designs
            .filter((l) => `${l.product.name} ${l.product.tagline ?? ""} ${l.product.category} ${DESIGN_CATEGORIES.find((c) => c.id === l.product.category)?.name ?? ""}`.toLowerCase().includes(query))
            .map(toDesignLite)
        : [],
    [designs, query, typeKey],
  );
  // Same picks as the home page's top ten (src/data/placements.ts).
  const hot = useMemo(() => placedIn(live, "home-start"), [live]);

  const activeGoal = category ? goalById(categoryInfo(category).goal) : goalById(goalId);
  const visibleGoals = activeGoal ? goals.filter((g) => g.goal.id === activeGoal.id) : goals;
  const catInfo = category ? categoryInfo(category) : null;
  const catTools = category ? byCategory.get(category) ?? [] : [];

  // The "type" chips: tags of the apps in the current goal or category, so every chip leads somewhere.
  const tagOptions = useMemo(() => {
    const inScope = live.filter((t) => {
      const cats = categoriesOf(t);
      if (category) return cats.includes(category);
      if (activeGoal) return cats.some((c) => categoryInfo(c).goal === activeGoal.id);
      return true;
    });
    return tagCounts(inScope).filter((x) => x.count >= TAG_MIN_APPS || x.key === typeKey);
  }, [live, category, activeGoal, typeKey]);
  const tagsVisible = allTags ? tagOptions : tagOptions.slice(0, TAGS_SHOWN);

  const chipFor = (t: CatalogTool) => (STUDIO_IDS.has(t.id) ? "Studio" : t.category);
  // Under a category heading the category chip would repeat on every card; only studios keep a chip there.
  const chipInCategory = (t: CatalogTool) => (STUDIO_IDS.has(t.id) ? "Studio" : "");

  const searchBox = (
    <form className="relative" role="search" onSubmit={(e) => e.preventDefault()}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden />
      <input
        value={q}
        onChange={(e) => set({ q: e.target.value || null })}
        placeholder="Search apps: invoice, passport photo, salary…"
        aria-label="Search apps"
        className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-10 pr-10 text-base placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500 sm:text-sm dark:border-zinc-800 dark:bg-zinc-900"
      />
      {q && (
        <button
          type="button"
          onClick={() => set({ q: null })}
          aria-label="Clear search"
          className={cn("absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800", FOCUS_RING)}
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      )}
    </form>
  );

  return (
    <ModernPage section="apps">
      <SEOHead
        {...seoFor("/ai-apps", countLabel)}
        keywords="ai apps for business, gst invoice app, passport photo maker, ai tools india, ezyourlife ai apps"
      />

      <main className="min-h-[75vh] py-12">
        <div className={cn(CONTAINER, "space-y-8")}>
          <div>
            <nav aria-label="Breadcrumb" className="mb-4 text-xs font-medium text-zinc-500 dark:text-zinc-400">
              <Link to="/" className={cn("rounded hover:text-zinc-900 dark:hover:text-white", FOCUS_RING)}>Home</Link>
              <span aria-hidden> › </span>
              {category || activeGoal ? (
                <Link to="/ai-apps" className={cn("rounded hover:text-zinc-900 dark:hover:text-white", FOCUS_RING)}>Business apps</Link>
              ) : (
                <span>Business apps</span>
              )}
              {activeGoal && (
                <>
                  <span aria-hidden> › </span>
                  {category ? (
                    <Link to={`/ai-apps?goal=${activeGoal.id}`} className={cn("rounded hover:text-zinc-900 dark:hover:text-white", FOCUS_RING)}>{activeGoal.name}</Link>
                  ) : (
                    <span>{activeGoal.name}</span>
                  )}
                </>
              )}
              {category && (
                <>
                  <span aria-hidden> › </span>
                  <span>{category}</span>
                </>
              )}
            </nav>

            <PageHeader
              eyebrow={category && activeGoal ? activeGoal.name : `${countLabel} business apps`}
              title={category ?? activeGoal?.name ?? "Business apps"}
              line={
                category
                  ? catInfo?.line
                  : activeGoal
                    ? activeGoal.line
                    : `${countLabel} apps, grouped by what you want to get done. Tap any app to see what it does and what it costs.`
              }
              aside={searchBox}
            >
              {category && catInfo && (
                <>
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 dark:border-zinc-800 dark:bg-zinc-900">
                      <span className="font-semibold">You give:</span> {catInfo.give}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-zinc-400" aria-hidden />
                    <span className="rounded-full border border-emerald-300/60 bg-emerald-50 px-3 py-1 text-emerald-900 dark:border-emerald-700/50 dark:bg-emerald-950/50 dark:text-emerald-200">
                      <span className="font-semibold">You get:</span> {catInfo.get}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{KIND_TEXT[catInfo.kind].title}.</span> {KIND_TEXT[catInfo.kind].line}
                  </p>
                </>
              )}
            </PageHeader>
          </div>

          {/* Goal and category filters */}
          <div className="space-y-3">
            <div className="ez-chips" role="group" aria-label="Show apps for">
              <button type="button" className={pillClass(!activeGoal)} aria-pressed={!activeGoal} onClick={() => set({ goal: null, category: null })}>
                All apps <span className="tabular-nums opacity-70">({shown.length})</span>
              </button>
              {goals.map(({ goal, count }) => (
                <button
                  key={goal.id}
                  type="button"
                  aria-pressed={activeGoal?.id === goal.id}
                  onClick={() => set({ goal: goal.id, category: null })}
                  className={pillClass(activeGoal?.id === goal.id)}
                >
                  <span className={cn("h-2 w-2 rounded-full bg-gradient-to-br", GOAL_GRADIENT[goal.id])} aria-hidden />
                  {goal.name} <span className="tabular-nums opacity-70">({count})</span>
                </button>
              ))}
            </div>
            {activeGoal && (
              <div className="ez-chips" role="group" aria-label="Type of app">
                {(goals.find((g) => g.goal.id === activeGoal.id)?.cats ?? []).map(([c, tools]) => (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={category === c}
                    onClick={() => set({ goal: activeGoal.id, category: category === c ? null : c })}
                    className={subPillClass(category === c)}
                  >
                    {c} <span className="tabular-nums opacity-70">{tools.length}</span>
                  </button>
                ))}
              </div>
            )}
            {tagOptions.length > 1 && (
              <div className="ez-chips" role="group" aria-label="Filter by type">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Type:</span>
                {tagsVisible.map((tg) => (
                  <button key={tg.key} type="button" aria-pressed={typeKey === tg.key} onClick={() => set({ type: typeKey === tg.key ? null : tg.key })} className={subPillClass(typeKey === tg.key)}>
                    {tg.label} <span className="tabular-nums opacity-70">{tg.count}</span>
                  </button>
                ))}
                {tagOptions.length > TAGS_SHOWN && (
                  <button type="button" onClick={() => setAllTags((v) => !v)} className={cn("px-1 text-xs", linkish)}>
                    {allTags ? "Show fewer" : `Show ${tagOptions.length - TAGS_SHOWN} more`}
                  </button>
                )}
                {typeKey && (
                  <button type="button" onClick={() => set({ type: null })} className={cn("px-1 text-xs", linkish)}>
                    Clear type
                  </button>
                )}
              </div>
            )}
          </div>

          {query ? (
            <section aria-live="polite" className="space-y-10">
              <SectionHead
                className="mb-0"
                title={
                  <>
                    Results for “{q.trim()}” <span className="text-base font-normal text-zinc-500 dark:text-zinc-400">({results.length + designResults.length})</span>
                  </>
                }
                action={
                  <button type="button" onClick={() => set({ q: null })} className={BTN_OUTLINE}>
                    Clear search
                  </button>
                }
              />
              {results.length > 0 && (
                <ScrollRow size="card">
                  {results.map((t) => (
                    <ToolCard key={t.id} tool={t} chip={chipFor(t)} />
                  ))}
                </ScrollRow>
              )}
              {designResults.length > 0 && (
                <div>
                  <h3 className="mb-4 font-display text-lg font-bold">
                    Websites, cards & invites <span className="text-sm font-normal text-zinc-500 dark:text-zinc-400">({designResults.length})</span>
                  </h3>
                  <ScrollRow size="card">
                    {designResults.map((d) => (
                      <DesignCard key={d.id} d={d} chip={d.site ? "Website" : "Card / invite"} size="md" />
                    ))}
                  </ScrollRow>
                </div>
              )}
              {results.length === 0 && designResults.length === 0 && (
                <EmptyState message="No apps, websites or cards match that search." action="Clear search" onAction={() => set({ q: null })} />
              )}
            </section>
          ) : category ? (
            <section>
              <h2 className="mb-5 font-display text-xl font-bold">
                {catTools.length} app{catTools.length === 1 ? "" : "s"}
              </h2>
              {catTools.length ? (
                <ScrollRow size="card">
                  {catTools.map((t) => (
                    <ToolCard key={t.id} tool={t} chip={chipInCategory(t)} />
                  ))}
                </ScrollRow>
              ) : (
                <EmptyState
                  message={typeKey ? "No apps of this type here." : "No apps here yet."}
                  action={typeKey ? "Clear type" : undefined}
                  onAction={() => set({ type: null })}
                />
              )}
            </section>
          ) : (
            <div className="space-y-14">
              {!activeGoal && user && recent.length > 0 && (
                <section>
                  <SectionHead eyebrow="Pick up where you left off" title="Your recent apps" className="mb-5" />
                  <ScrollRow size="card">
                    {recent.slice(0, PER_CATEGORY).map((t) => (
                      <ToolCard key={t.id} tool={t} chip={chipFor(t)} />
                    ))}
                  </ScrollRow>
                </section>
              )}
              {!activeGoal && hot.length > 0 && (
                <section>
                  <SectionHead eyebrow="Picked by our team" title="Most useful to start" className="mb-5" />
                  <ScrollRow size="card">
                    {hot.slice(0, 12).map((t) => (
                      <ToolCard key={t.id} tool={t} chip={chipFor(t)} />
                    ))}
                  </ScrollRow>
                </section>
              )}

              {!activeGoal && !category && (
                <section id="tools-showcase" className="py-2">
                  <AppShowcaseRow
                    heading="See tools in action"
                    subheading="Popular picks to get started"
                    apps={TOOLS_SHOWCASE_APPS}
                  />
                </section>
              )}

              {visibleGoals.map(({ goal, cats }) => (
                <section key={goal.id} aria-labelledby={`goal-${goal.id}`} className="scroll-mt-24">
                  <div className="mb-6 flex items-center gap-3 border-b border-zinc-200 pb-3 dark:border-zinc-800">
                    <span className={cn("h-5 w-5 shrink-0 rounded-full bg-gradient-to-br", GOAL_GRADIENT[goal.id])} aria-hidden />
                    <h2 id={`goal-${goal.id}`} className="font-display text-2xl font-bold tracking-tight md:text-3xl">
                      {goal.name}
                    </h2>
                    {!activeGoal && (
                      <button type="button" className={cn(BTN_OUTLINE, "ml-auto px-3 py-1.5 text-xs")} onClick={() => set({ goal: goal.id, category: null })}>
                        See only these
                      </button>
                    )}
                  </div>
                  <div className="space-y-10">
                    {cats.map(([c, tools]) => (
                      <div key={c}>
                        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                          <h3 className="font-display text-lg font-bold">
                            <button type="button" className={cn("rounded hover:underline", FOCUS_RING)} onClick={() => set({ goal: goal.id, category: c })}>
                              {c}
                            </button>
                            <span className="ml-2 font-sans text-xs font-normal text-zinc-500 dark:text-zinc-400">
                              {tools.length} app{tools.length === 1 ? "" : "s"}
                              {categoryInfo(c).line ? ` · ${categoryInfo(c).line}` : ""}
                            </span>
                          </h3>
                          {tools.length > PER_CATEGORY && (
                            <button type="button" className={cn("inline-flex items-center gap-1 text-xs", linkish)} onClick={() => set({ goal: goal.id, category: c })}>
                              See all {tools.length} <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                            </button>
                          )}
                        </div>
                        <ScrollRow size="card">
                          {tools.slice(0, PER_CATEGORY).map((t) => (
                            <ToolCard key={t.id} tool={t} chip={chipInCategory(t)} />
                          ))}
                        </ScrollRow>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </main>

      <div id="request-app" className="scroll-mt-20">
        <RequestToolSection />
      </div>
    </ModernPage>
  );
};

export default Tools;
