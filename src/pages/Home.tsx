import { Suspense, lazy, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { ArrowRight, Gift, Globe, LayoutGrid, Mail, Search, Sparkles, X } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import SEOFooter from "@/components/SEOFooter";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useToolsCatalog, type CatalogTool } from "@/hooks/useToolsCatalog";
import { usePricingMap } from "@/hooks/usePricingMap";
import { useAppCountLabel } from "@/lib/appCount";
import { PERSONAS } from "@/data/personas";
import { STUDIO_IDS } from "@/data/studios";
import { byCategoryOrder, categoriesOf, categoryInfo, inCategory } from "@/data/goals";
import { ROLES } from "@/apps/workflows";
import { Shelf } from "@/components/store/Shelf";
import { AppTile, AppRow } from "@/components/store/AppTile";
import { HeroPicker } from "@/components/home/HeroPicker";
import { StudiosShelf } from "@/components/home/StudiosShelf";
import { TodaySection } from "@/components/home/TodaySection";
import { CreditValue } from "@/components/home/CreditValue";
import { EarnBand } from "@/components/earn/EarnBits";
import { placedIn } from "@/data/placements";
import RequestToolSection from "@/components/RequestToolSection";
import BuyCreditsDialog from "@/components/wallet/BuyCreditsDialog";
import { ToolsEmptyState } from "@/components/tools/ToolsEmptyState";
import { cn } from "@/lib/utils";
import { seoFor } from "@/lib/seo/pages";

// Website and card shelves need the design catalogue; load it after the first screen is up.
const HomeMakeShelves = lazy(() => import("@/components/home/HomeMakeShelves"));
// The full store list also needs the design catalogue; it sits below the fold.
const AppDirectory = lazy(() => import("@/components/home/AppDirectory"));

const SKIP_CATEGORY_SHELVES = new Set(["Popular", "Lab"]);
const POPULAR_SEARCHES = ["invoice", "passport photo", "salary", "remove background", "caption", "contract"];

/** A door: a page link, or an on-page jump (to="#studios") for a section further down. */
function DoorLink({ to, className, children }: { to: string; className?: string; children: React.ReactNode }) {
  return to.startsWith("#") ? (
    <a href={to} className={className}>
      {children}
    </a>
  ) : (
    <Link to={to} className={className}>
      {children}
    </Link>
  );
}

function Section({ id, title, line, children, action }: { id?: string; title: string; line?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section id={id} className="mx-auto max-w-7xl scroll-mt-24 px-4 py-10 md:py-14">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold md:text-[2rem]">{title}</h2>
          {line && <p className="mt-1.5 max-w-2xl text-[16px] text-muted-foreground">{line}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: catalog = [] } = useToolsCatalog();
  const { costOf } = usePricingMap();
  const countLabel = useAppCountLabel();
  const [search, setSearch] = useState("");
  const [personaId, setPersonaId] = useState<string | null>(null);
  const [buyPackId, setBuyPackId] = useState<string | null>(null);

  const live = useMemo(() => catalog.filter((t) => t.is_live), [catalog]);
  const byId = useMemo(() => new Map(live.map((t) => [t.id, t])), [live]);
  const studioCount = useMemo(() => live.filter((t) => STUDIO_IDS.has(t.id)).length, [live]);
  const hasStudios = studioCount > 0;
  const studioLabel = `${Math.floor(studioCount / 10) * 10}+`;
  const persona = PERSONAS.find((p) => p.id === personaId) ?? null;

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
  const oneCredit = useMemo(() => live.filter((t) => costOf(t.id) === 1 && !editorsPicks.includes(t)).slice(0, 14), [live, costOf, editorsPicks]);
  // Pinned new apps first, then the latest additions.
  const newest = useMemo(() => {
    const pinned = placedIn(live, "home-new");
    const rest = [...live].filter((t) => !pinned.includes(t)).sort((a, b) => b.created_at.localeCompare(a.created_at));
    return [...pinned, ...rest].slice(0, 12);
  }, [live]);

  const categories = useMemo(() => {
    const m = new Map<string, number>();
    // An app counts once under every category it is listed in (main one plus "also in").
    live.forEach((t) => categoriesOf(t).forEach((c) => m.set(c, (m.get(c) ?? 0) + 1)));
    return [...m.entries()].sort(byCategoryOrder);
  }, [live]);

  const shelfCategories = useMemo(() => {
    if (persona) return persona.categories.filter((c) => categories.some(([n]) => n === c));
    return categories.map(([n]) => n).filter((n) => !SKIP_CATEGORY_SHELVES.has(n)).slice(0, 3);
  }, [persona, categories]);

  const personaTools = persona ? (persona.toolIds.map((id) => byId.get(id)).filter(Boolean) as CatalogTool[]) : [];
  // The moving strip: apps placed there, then the team's picks, then the newest, so it never shows only the oldest apps.
  const marquee = useMemo(() => {
    const seen = new Set<string>();
    return [...placedIn(live, "home-strip"), ...editorsPicks, ...newest, ...live]
      .filter((t) => !seen.has(t.id) && seen.add(t.id))
      .slice(0, 36)
      .map((t) => t.name);
  }, [live, editorsPicks, newest]);


  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query) navigate(`/ai-apps?q=${encodeURIComponent(search.trim())}`);
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-background">
        <SEOHead
          {...seoFor("/", countLabel)}
          keywords="ezyourlife, ai apps, ai app store, pay as you go ai, ai tools india, business website maker, gst invoice app"
        />
        <Navbar />

        {/* ───────── Hero ───────── */}
        <section className="mx-auto grid max-w-7xl gap-10 px-4 pb-10 pt-8 md:pt-14 lg:grid-cols-12 lg:gap-12">
          <div className="min-w-0 lg:col-span-7">
            <span className="inline-flex items-center rounded-full border-2 border-ink bg-lime px-3 py-1 text-[13px] font-bold">For small businesses in India</span>
            <h1 className="mt-5 text-[2.1rem] font-extrabold leading-[1.06] sm:text-5xl xl:text-[4.1rem]">
              Run your <span className="inline-block -rotate-1 rounded-xl border-2 border-ink bg-sun px-2 shadow-block">whole business</span> from{" "}
              <span className="marker">one place</span>
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              {countLabel} ready apps for bills, customers, staff and photos, plus websites and cards you make in minutes.
              {studioCount >= 10 && ` Plus ${studioLabel} studios that finish big jobs for you: a business plan, catalogue photos, a resume, a family book.`} Pay only when an app
              gives you a result. Start with 100 free credits.
            </p>

            <form onSubmit={onSearch} className="mt-7 flex max-w-2xl gap-2.5" role="search">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="What do you need? GST bill, passport photo…"
                  aria-label="Search apps"
                  className="h-14 rounded-2xl pl-12 pr-11 text-base shadow-block-sm"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    aria-label="Clear search"
                    className="absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full hover:bg-sand"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Button type="submit" className="h-14 rounded-2xl px-5 text-base">
                Find
              </Button>
            </form>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-muted-foreground">People search:</span>
              {POPULAR_SEARCHES.map((q) => (
                <Link
                  key={q}
                  to={`/ai-apps?q=${encodeURIComponent(q)}`}
                  className="rounded-full border-2 border-ink bg-card px-3 py-1 text-sm font-semibold transition-colors hover:bg-sun"
                >
                  {q}
                </Link>
              ))}
            </div>

            <ul className="mt-7 grid gap-2.5 text-sm sm:grid-cols-3">
              {[
                { t: "100 free credits", s: "No card needed" },
                { t: "Pay per result", s: "Packs from ₹10, UPI or card" },
                { t: "Failed runs are free", s: "Credits only when it works" },
              ].map(({ t, s }) => (
                <li key={t} className="rounded-xl border-2 border-ink bg-card px-3 py-2.5">
                  <span className="block font-bold">{t}</span>
                  <span className="block text-[13px] text-muted-foreground">{s}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="min-w-0 lg:col-span-5">
            <HeroPicker catalog={catalog} />
          </div>
        </section>

        {/* ───────── Moving strip of app names ───────── */}
        {marquee.length > 0 && (
          <div aria-hidden className="overflow-hidden border-y-2 border-ink bg-ink py-3 text-cream">
            <div className="flex w-max animate-marquee gap-8 whitespace-nowrap font-display text-lg font-bold motion-reduce:animate-none">
              {[...marquee, ...marquee].map((n, i) => (
                <span key={i} className={i % 3 === 0 ? "text-sun" : i % 3 === 1 ? "text-pink" : "text-cream"}>
                  {n} ✦
                </span>
              ))}
            </div>
          </div>
        )}

        {query ? (
          <section className="mx-auto max-w-7xl px-4 py-10" aria-live="polite">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-bold">
                Results for “{search.trim()}” <span className="text-sm font-normal text-muted-foreground">({results.length})</span>
              </h2>
              <Button variant="outline" size="sm" onClick={() => setSearch("")}>
                Clear search
              </Button>
            </div>
            {results.length ? (
              <div className="grid gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
                {results.map((t) => (
                  <AppRow key={t.id} tool={t} />
                ))}
              </div>
            ) : (
              <ToolsEmptyState onClearFilters={() => setSearch("")} hasActiveFilters />
            )}
          </section>
        ) : (
          <>
            {/* ───────── Three doors ───────── */}
            <Section title="What do you want to do today?" line={hasStudios ? "Four things you can do here. Pick one." : "Three things you can do here. Pick one."}>
              <div className={cn("grid gap-5", hasStudios ? "md:grid-cols-2 xl:grid-cols-4" : "md:grid-cols-3")}>
                {[
                  { to: "/ai-apps", c: "bg-pink", Icon: LayoutGrid, tag: `${countLabel} apps`, h: "Use a business app", d: "Make a bill, write to customers, fix a photo, track staff and stock.", go: "Browse apps" },
                  ...(hasStudios
                    ? [{ to: "/studios", c: "bg-ink text-cream !shadow-[5px_5px_0_0_hsl(var(--sun))]", Icon: Sparkles, tag: `${studioLabel} studios`, h: "Get a big job done", d: "A business plan, catalogue photos, a resume or a family book, finished for you step by step.", go: "See studios" }]
                    : []),
                  { to: "/websites", c: "bg-teal", Icon: Globe, tag: "Stays online", h: "Make a website", d: "A website, QR menu or visiting card with one link to share.", go: "See website designs" },
                  { to: "/cards", c: "bg-sun", Icon: Mail, tag: "Sent once", h: "Send a card or invite", d: "Wedding invites, festival wishes and birthday surprises.", go: "See card designs" },
                ].map((d) => (
                  <DoorLink key={d.to} to={d.to} className={cn("block-card block-lift flex min-h-[250px] flex-col gap-3 p-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", d.c)}>
                    <div className="flex items-center justify-between">
                      <span className={cn("flex h-11 w-11 items-center justify-center rounded-xl border-2 border-ink bg-card", d.c.includes("bg-ink") && "bg-sun text-ink")}>
                        <d.Icon className="h-5 w-5" aria-hidden />
                      </span>
                      <span className={cn("rounded-full border-2 border-ink px-2.5 py-0.5 text-xs font-bold", d.c.includes("bg-ink") ? "bg-sun text-ink" : "bg-card")}>{d.tag}</span>
                    </div>
                    <h3 className="text-[22px] font-extrabold leading-tight">{d.h}</h3>
                    <p className={cn("text-[16px]", d.c.includes("bg-ink") ? "text-cream/85" : "text-ink/85")}>{d.d}</p>
                    <span className={cn("mt-auto inline-flex items-center gap-1.5 pt-2 font-bold", d.c.includes("bg-ink") && "text-sun")}>
                      {d.go} <ArrowRight className="h-4 w-4" />
                    </span>
                  </DoorLink>
                ))}
              </div>
            </Section>

            {/* ───────── Business type ───────── */}
            <Section
              title="Pick your business type"
              line="We show the apps and studios people like you use most."
              action={
                <Button asChild variant="outline" size="sm">
                  <Link to="/explore">All business types</Link>
                </Button>
              }
            >
              <div className="-mx-4 flex gap-2.5 overflow-x-auto px-4 pb-2 no-scrollbar sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Show apps for">
                {PERSONAS.map((p) => {
                  const active = p.id === personaId;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setPersonaId(active ? null : p.id)}
                      className={cn(
                        "shrink-0 rounded-full border-2 border-ink px-4 py-2 text-[15px] font-semibold shadow-[2px_2px_0_0_hsl(var(--ink))] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        active ? "bg-ink text-cream" : "bg-card hover:bg-sun",
                      )}
                    >
                      <span aria-hidden>{p.emoji} </span>
                      {p.label}
                    </button>
                  );
                })}
              </div>

              <AnimatePresence initial={false}>
                {persona && personaTools.length > 0 && (
                  <motion.div
                    key={persona.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                    aria-live="polite"
                  >
                    <div className="mt-6 rounded-2xl border-2 border-ink bg-sky/30 p-5 md:p-6">
                      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="text-xl font-bold">
                            <span aria-hidden>{persona.emoji} </span>Picked for {persona.label}
                          </h3>
                          <p className="mt-1 text-[15px] text-muted-foreground">{persona.blurb}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(() => {
                            const role = ROLES.find(
                              (r) => r.id === ({ founders: "founder", ecommerce: "retail", creators: "creator", students: "student" } as Record<string, string>)[persona.id],
                            );
                            return role ? (
                              <Button asChild size="sm">
                                <Link to={`/tool/${role.steps[0].toolId}`}>Start with the first app</Link>
                              </Button>
                            ) : null;
                          })()}
                          <Button variant="outline" size="sm" onClick={() => setPersonaId(null)}>
                            <X className="h-4 w-4" /> Show everything
                          </Button>
                        </div>
                      </div>
                      <div className="grid gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
                        {personaTools.map((t) => (
                          <AppRow key={t.id} tool={t} />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Section>

            {/* ───────── Shelves ───────── */}
            <div className="mx-auto max-w-7xl space-y-12 px-4 py-10">
              {editorsPicks.length > 0 && (
                <Shelf title="Most useful to start" subtitle="Picked by our team" seeAllTo="/ai-apps">
                  {editorsPicks.map((t) => (
                    <AppTile key={t.id} tool={t} />
                  ))}
                </Shelf>
              )}
              {shelfCategories.map((cat) => {
                // Apps whose main category this is come first, then the ones that are also listed here.
                const inCat = live.filter((t) => inCategory(t, cat)).sort((a, b) => Number(b.category === cat) - Number(a.category === cat));
                const tools = inCat.slice(0, 14);
                if (tools.length < 3) return null;
                return (
                  <Shelf
                    key={cat}
                    title={cat}
                    subtitle={categoryInfo(cat).line || `${inCat.length} apps`}
                    seeAllTo={`/ai-apps?category=${encodeURIComponent(cat)}`}
                  >
                    {tools.map((t) => (
                      <AppTile key={t.id} tool={t} />
                    ))}
                  </Shelf>
                );
              })}
              {oneCredit.length > 0 && (
                <Shelf title="Cheapest to run" subtitle="1 credit each time — less than ₹1" seeAllTo="/ai-apps">
                  {oneCredit.map((t) => (
                    <AppTile key={t.id} tool={t} />
                  ))}
                </Shelf>
              )}
              {newest.length > 0 && (
                <Shelf title="New in the store" subtitle="The latest apps we added">
                  {newest.map((t) => (
                    <AppTile key={t.id} tool={t} />
                  ))}
                </Shelf>
              )}
            </div>

            {/* ───────── Studios ───────── */}
            {hasStudios && (
              <Section
                id="studios"
                title="Studios"
                line="Bigger jobs, done start to finish. Answer a few questions and get a full plan, report or set of pictures."
                action={
                  <Button asChild variant="outline" size="sm">
                    <Link to="/studios">See all studios</Link>
                  </Button>
                }
              >
                <StudiosShelf apps={live} />
              </Section>
            )}

            {/* ───────── Every app, website and card ───────── */}
            <Section
              id="all-apps"
              title="Everything in the store"
              line="Every app, website and card, sorted by what you need. Tap a category to see all of it."
              action={
                <Button asChild variant="outline" size="sm">
                  <Link to="/ai-apps">Open the full app page</Link>
                </Button>
              }
            >
              <Suspense fallback={<div className="min-h-[60vh]" />}>
                <AppDirectory apps={live} />
              </Suspense>
            </Section>

            {/* ───────── App bundles ───────── */}
            <Section title="App bundles" line="A few apps that work well together, for one job.">
              <TodaySection catalog={catalog} editorsPicks={editorsPicks} personaId={personaId} />
            </Section>

            {/* ───────── Websites and cards ───────── */}
            <Suspense fallback={<div className="mx-auto h-96 max-w-7xl px-4" aria-hidden />}>
              <HomeMakeShelves />
            </Suspense>

            {/* ───────── Earn with us ───────── */}
            <Section id="earn" title="Earn with Ezyourlife" line="Two ways to earn from what you already have: your followers, or an app you built.">
              <EarnBand />
            </Section>

            {/* ───────── Credits ───────── */}
            <Section id="credits" title="What does ₹10 get you?" line="One wallet for every app. Credits never tie you to a plan, and failed runs are free.">
              <CreditValue catalog={catalog} onBuy={setBuyPackId} />
            </Section>

            <div id="request-tool" className="scroll-mt-24">
              <RequestToolSection />
            </div>

            {!user && (
              <section className="mx-auto max-w-7xl px-4 pb-16">
                <div className="rounded-3xl border-2 border-ink bg-ink p-8 text-center text-cream shadow-block-lg md:p-12">
                  <h2 className="text-2xl font-extrabold md:text-4xl">
                    Your first <span className="text-sun">100 credits</span> are on us
                  </h2>
                  <p className="mx-auto mt-3 max-w-lg text-cream/85">50 when you sign up and 50 more after your first run. No card needed.</p>
                  <Button asChild size="lg" className="mt-6 h-12 px-8 text-base">
                    <Link to="/auth?mode=signup">
                      <Gift className="h-4 w-4" /> Claim free credits
                    </Link>
                  </Button>
                </div>
              </section>
            )}
          </>
        )}

        <SEOFooter />
        <BuyCreditsDialog open={!!buyPackId} onOpenChange={(v) => !v && setBuyPackId(null)} defaultPackId={buyPackId ?? undefined} autoStart />
      </div>
    </MotionConfig>
  );
};

export default Home;
