import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, X } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import SEOFooter from "@/components/SEOFooter";
import { Navbar } from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToolsCatalog, type CatalogTool } from "@/hooks/useToolsCatalog";
import { useRecentTools } from "@/hooks/useRecentTools";
import { useAuth } from "@/contexts/AuthContext";
import { useAppCountLabel } from "@/lib/appCount";
import { GOALS, KIND_TEXT, byCategoryOrder, categoriesOf, categoryInfo, goalById, type GoalId } from "@/data/goals";
import { hasTag, tagCounts } from "@/lib/catalogTags";
import { GiveGet } from "@/components/brand/GiveGet";
import { Shelf } from "@/components/store/Shelf";
import { AppTile, AppRow } from "@/components/store/AppTile";
import { ToolsEmptyState } from "@/components/tools/ToolsEmptyState";
import RequestToolSection from "@/components/RequestToolSection";
import { cn } from "@/lib/utils";
import { seoFor } from "@/lib/seo/pages";
import { placedIn } from "@/data/placements";

const PER_CATEGORY = 8;
/** Filter-by-type chips shown before "Show more". */
const TAGS_SHOWN = 8;
/** A type needs at least this many apps to be worth a chip. */
const TAG_MIN_APPS = 3;

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

  // Goals in display order, each with its categories (admin order first, then largest).
  const goals = useMemo(
    () =>
      GOALS.map((g) => ({
        goal: g,
        cats: [...byCategory.entries()]
          .filter(([c]) => categoryInfo(c).goal === g.id)
          .sort((a, b) => byCategoryOrder([a[0], a[1].length], [b[0], b[1].length])),
      })).filter((x) => x.cats.length > 0),
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
  // Same picks as the home page's "Most useful to start" (src/data/placements.ts).
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
    const counted = tagCounts(inScope).filter((x) => x.count >= TAG_MIN_APPS || x.key === typeKey);
    return counted;
  }, [live, category, activeGoal, typeKey]);
  const tagsVisible = allTags ? tagOptions : tagOptions.slice(0, TAGS_SHOWN);

  const chip = (on: boolean) =>
    cn(
      "shrink-0 rounded-full border-2 border-ink px-3.5 py-1.5 text-[15px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      on ? "bg-ink text-cream" : "bg-card hover:bg-sun",
    );

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        {...seoFor("/ai-apps", countLabel)}
        keywords="ai apps for business, gst invoice app, passport photo maker, ai tools india, ezyourlife ai apps"
      />
      <Navbar />

      {/* ───────── Header ───────── */}
      <header className="mx-auto max-w-7xl px-4 pt-6 md:pt-10">
        <nav aria-label="Breadcrumb" className="mb-3 text-sm font-medium text-muted-foreground">
          <Link to="/" className="underline underline-offset-4 hover:text-ink">Home</Link>
          <span aria-hidden> › </span>
          {category || activeGoal ? (
            <Link to="/ai-apps" className="underline underline-offset-4 hover:text-ink">Business apps</Link>
          ) : (
            <span>Business apps</span>
          )}
          {activeGoal && (
            <>
              <span aria-hidden> › </span>
              {category ? (
                <Link to={`/ai-apps?goal=${activeGoal.id}`} className="underline underline-offset-4 hover:text-ink">{activeGoal.name}</Link>
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

        <div className="rounded-3xl border-2 border-ink p-5 shadow-block-lg md:p-8" style={{ background: activeGoal?.color ?? "hsl(var(--pink))" }}>
          {category && catInfo ? (
            <>
              <span className="inline-flex rounded-full border-2 border-ink bg-card px-2.5 py-0.5 text-xs font-bold">{activeGoal?.name}</span>
              <h1 className="mt-3 text-3xl font-extrabold md:text-5xl">{category}</h1>
              {catInfo.line && <p className="mt-2 max-w-2xl text-lg text-ink/85">{catInfo.line}</p>}
              <GiveGet className="mt-5 max-w-3xl" give={catInfo.give} get={catInfo.get} />
              <p className="mt-3 text-[15px] font-semibold">
                {KIND_TEXT[catInfo.kind].title}. <span className="font-normal">{KIND_TEXT[catInfo.kind].line}</span>
              </p>
            </>
          ) : activeGoal ? (
            <>
              <h1 className="text-3xl font-extrabold md:text-5xl">{activeGoal.name}</h1>
              <p className="mt-2 max-w-2xl text-lg text-ink/85">{activeGoal.line}</p>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-extrabold md:text-5xl">Business apps</h1>
              <p className="mt-2 max-w-2xl text-lg text-ink/85">
                {countLabel} apps, grouped by what you want to get done. Tap any app to see what it does and what it costs.
              </p>
            </>
          )}

          <form className="relative mt-6 max-w-2xl" role="search" onSubmit={(e) => e.preventDefault()}>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              value={q}
              onChange={(e) => set({ q: e.target.value || null })}
              placeholder="Search apps: invoice, passport photo, salary…"
              aria-label="Search apps"
              className="h-[52px] rounded-2xl pl-12 pr-11 text-base"
            />
            {q && (
              <button
                type="button"
                onClick={() => set({ q: null })}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full hover:bg-sand"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </form>
        </div>

        {/* Goal and category filters */}
        <div className="-mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-2 no-scrollbar" role="group" aria-label="Show apps for">
          <button type="button" className={chip(!activeGoal)} aria-pressed={!activeGoal} onClick={() => set({ goal: null, category: null })}>
            All apps
          </button>
          {goals.map(({ goal }) => (
            <button
              key={goal.id}
              type="button"
              aria-pressed={activeGoal?.id === goal.id}
              onClick={() => set({ goal: goal.id, category: null })}
              className={chip(activeGoal?.id === goal.id)}
            >
              <span className="mr-1.5 inline-block h-3 w-3 rounded-full border-2 border-ink align-[-1px]" style={{ background: goal.color }} aria-hidden />
              {goal.name}
            </button>
          ))}
        </div>
        {activeGoal && (
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 no-scrollbar" role="group" aria-label="Type of app">
            {(goals.find((g) => g.goal.id === activeGoal.id)?.cats ?? []).map(([c, tools]) => (
              <button
                key={c}
                type="button"
                aria-pressed={category === c}
                onClick={() => set({ goal: activeGoal.id, category: category === c ? null : c })}
                className={cn(
                  "shrink-0 rounded-full border-2 px-3 py-1 text-sm font-semibold",
                  category === c ? "border-ink bg-sun" : "border-ink/30 bg-card hover:border-ink",
                )}
              >
                {c} <span className="tabular-nums text-muted-foreground">{tools.length}</span>
              </button>
            ))}
          </div>
        )}
        {tagOptions.length > 1 && (
          <div className="-mx-4 flex flex-wrap items-center gap-2 px-4 pb-2 pt-1" role="group" aria-label="Filter by type">
            <span className="text-sm font-semibold text-muted-foreground">Type:</span>
            {tagsVisible.map((tg) => (
              <button
                key={tg.key}
                type="button"
                aria-pressed={typeKey === tg.key}
                onClick={() => set({ type: typeKey === tg.key ? null : tg.key })}
                className={cn(
                  "rounded-full border-2 px-3 py-0.5 text-sm font-semibold",
                  typeKey === tg.key ? "border-ink bg-ink text-cream" : "border-ink/30 bg-card hover:border-ink",
                )}
              >
                {tg.label} <span className={cn("tabular-nums", typeKey === tg.key ? "text-cream/80" : "text-muted-foreground")}>{tg.count}</span>
              </button>
            ))}
            {tagOptions.length > TAGS_SHOWN && (
              <button type="button" onClick={() => setAllTags((v) => !v)} className="rounded-full px-2 py-0.5 text-sm font-semibold underline underline-offset-4 hover:text-ink">
                {allTags ? "Show fewer" : `Show ${tagOptions.length - TAGS_SHOWN} more`}
              </button>
            )}
            {typeKey && (
              <button type="button" onClick={() => set({ type: null })} className="rounded-full px-2 py-0.5 text-sm font-semibold underline underline-offset-4 hover:text-ink">
                Clear type
              </button>
            )}
          </div>
        )}
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {query ? (
          <section aria-live="polite">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-bold">
                Results for “{q.trim()}” <span className="text-sm font-normal text-muted-foreground">({results.length})</span>
              </h2>
              <Button variant="outline" size="sm" onClick={() => set({ q: null })}>
                Clear search
              </Button>
            </div>
            {results.length ? (
              <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
                {results.map((t) => (
                  <AppRow key={t.id} tool={t} />
                ))}
              </div>
            ) : (
              <ToolsEmptyState onClearFilters={() => set({ q: null })} hasActiveFilters />
            )}
          </section>
        ) : category ? (
          <section>
            <h2 className="mb-5 text-xl font-bold">
              {catTools.length} app{catTools.length === 1 ? "" : "s"}
            </h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {catTools.map((t) => (
                <AppTile key={t.id} tool={t} layout="grid" />
              ))}
            </div>
          </section>
        ) : (
          <div className="space-y-12">
            {!activeGoal && user && recent.length > 0 && (
              <Shelf title="Your recent apps" subtitle="Pick up where you left off">
                {recent.map((t) => (
                  <AppTile key={t.id} tool={t} />
                ))}
              </Shelf>
            )}
            {!activeGoal && hot.length > 0 && (
              <Shelf title="Most useful to start" subtitle="Picked by our team">
                {hot.map((t) => (
                  <AppTile key={t.id} tool={t} />
                ))}
              </Shelf>
            )}

            {visibleGoals.map(({ goal, cats }) => (
              <section key={goal.id} aria-labelledby={`goal-${goal.id}`} className="scroll-mt-24">
                <div className="mb-5 flex items-center gap-3 border-b-2 border-ink pb-3">
                  <span className="h-6 w-6 shrink-0 rounded-full border-2 border-ink" style={{ background: goal.color }} aria-hidden />
                  <h2 id={`goal-${goal.id}`} className="text-2xl font-extrabold md:text-3xl">
                    {goal.name}
                  </h2>
                  {!activeGoal && (
                    <Button variant="outline" size="sm" className="ml-auto" onClick={() => set({ goal: goal.id, category: null })}>
                      See only these
                    </Button>
                  )}
                </div>
                <div className="space-y-9">
                  {cats.map(([c, tools]) => (
                    <div key={c}>
                      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                        <h3 className="font-body text-lg font-bold">
                          <button type="button" className="hover:underline" onClick={() => set({ goal: goal.id, category: c })}>
                            {c}
                          </button>
                          <span className="ml-2 text-sm font-normal text-muted-foreground">
                            {tools.length} app{tools.length === 1 ? "" : "s"}
                            {categoryInfo(c).line ? ` · ${categoryInfo(c).line}` : ""}
                          </span>
                        </h3>
                        {tools.length > PER_CATEGORY && (
                          <Button variant="outline" size="sm" onClick={() => set({ goal: goal.id, category: c })}>
                            See all {tools.length}
                          </Button>
                        )}
                      </div>
                      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {tools.slice(0, PER_CATEGORY).map((t) => (
                          <AppTile key={t.id} tool={t} layout="grid" />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      <div id="request-app" className="scroll-mt-20">
        <RequestToolSection />
      </div>
      <SEOFooter />
    </div>
  );
};

export default Tools;
