import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { ArrowRight, Gift, Search, ShieldCheck, X, Zap } from "lucide-react";
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
import { Shelf } from "@/components/store/Shelf";
import { AppTile, AppRow } from "@/components/store/AppTile";
import { HeroPicker } from "@/components/home/HeroPicker";
import { TodaySection } from "@/components/home/TodaySection";
import { CreditValue } from "@/components/home/CreditValue";
import RequestToolSection from "@/components/RequestToolSection";
import BuyCreditsDialog from "@/components/wallet/BuyCreditsDialog";
import { ToolsEmptyState } from "@/components/tools/ToolsEmptyState";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "today", label: "Today" },
  { id: "apps", label: "Apps" },
  { id: "categories", label: "Categories" },
  { id: "credits", label: "Credit packs" },
];

const SKIP_CATEGORY_SHELVES = new Set(["Popular", "Lab"]);

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
  const persona = PERSONAS.find((p) => p.id === personaId) ?? null;

  const query = search.trim().toLowerCase();
  const results = useMemo(
    () =>
      query
        ? live
            .filter((t) => `${t.name} ${t.description} ${t.category}`.toLowerCase().includes(query))
            .slice(0, 24)
        : [],
    [live, query],
  );

  // Hand-picked by the team (catalog flag set in admin).
  const editorsPicks = useMemo(() => live.filter((t) => t.home_section === "hot"), [live]);
  const oneCredit = useMemo(
    () => live.filter((t) => costOf(t.id) === 1 && !editorsPicks.includes(t)).slice(0, 14),
    [live, costOf, editorsPicks],
  );
  const newest = useMemo(() => [...live].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 12), [live]);

  const categories = useMemo(() => {
    const m = new Map<string, number>();
    live.forEach((t) => m.set(t.category, (m.get(t.category) ?? 0) + 1));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [live]);

  const shelfCategories = useMemo(() => {
    if (persona) return persona.categories.filter((c) => categories.some(([n]) => n === c));
    return categories.map(([n]) => n).filter((n) => !SKIP_CATEGORY_SHELVES.has(n)).slice(0, 3);
  }, [persona, categories]);

  const personaTools = persona ? (persona.toolIds.map((id) => byId.get(id)).filter(Boolean) as CatalogTool[]) : [];

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query) navigate(`/ai-apps?q=${encodeURIComponent(search.trim())}`);
  };

  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-background">
        <SEOHead
          title={`EZYOURLIFE - The Future's First AI App Store | ${countLabel} AI Apps`}
          description={`Pay only for the AI you use. ${countLabel} specialised AI apps for business, marketing, images, content and study. Packs from ₹10, no monthly fees, 100 free credits to start.`}
          path="/"
          keywords="ezyourlife, ai apps, ai app store, pay as you go ai, ai tools india, no subscription ai"
        />
        <Navbar />

        {/* ───────── Hero ───────── */}
        <section className="relative overflow-hidden">
          <div aria-hidden className="absolute inset-0 bg-mesh" />
          <div className="relative container mx-auto grid gap-10 px-4 pb-10 pt-8 md:pt-14 lg:grid-cols-12 lg:gap-12 lg:pb-16">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="min-w-0 lg:col-span-7">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary sm:text-sm">
                <Zap className="h-4 w-4" />
                {countLabel} AI apps · one wallet · from ₹10
              </span>

              <h1 className="mt-5 text-[2rem] font-bold leading-[1.08] tracking-tight sm:text-5xl xl:text-6xl">
                Stop paying $20/mo for 10 different AI subscriptions.{" "}
                <span className="text-gradient">Pay only for what you actually use.</span>
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
                Access {countLabel} specialised AI apps for business, marketing, images, content and study. No monthly fees. Packs start at
                just ₹10, and you get 100 free credits to start.
              </p>

              <form onSubmit={onSearch} className="relative mt-7 max-w-2xl" role="search">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="What do you need done? Try “invoice” or “passport photo”"
                  aria-label="Search AI apps"
                  className="h-14 rounded-2xl border-border/70 bg-card pl-12 pr-12 text-base shadow-sm"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </form>

              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">I am a…</p>
                <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden" role="group" aria-label="Show apps for">
                  {PERSONAS.map((p) => {
                    const active = p.id === personaId;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setPersonaId(active ? null : p.id)}
                        className={cn(
                          "relative shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          active ? "border-transparent text-primary-foreground" : "border-border/70 bg-card hover:border-primary/40",
                        )}
                      >
                        {active && <motion.span layoutId="persona-pill" className="absolute inset-0 rounded-full bg-primary" transition={{ type: "spring", bounce: 0.2, duration: 0.45 }} />}
                        <span className="relative">
                          <span aria-hidden>{p.emoji} </span>
                          {p.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                {user ? (
                  <>
                    <Button asChild size="lg" className="group h-12 rounded-xl px-6 text-base shadow-lg shadow-primary/25">
                      <Link to="/ai-apps">
                        Browse all apps <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </Button>
                    <Button asChild size="lg" variant="outline" className="h-12 rounded-xl px-6 text-base">
                      <Link to="/credits">Top up from ₹10</Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button asChild size="lg" className="h-12 rounded-xl px-6 text-base shadow-lg shadow-primary/25">
                      <Link to="/auth?mode=signup">
                        <Gift className="mr-2 h-4 w-4" /> Get 100 free credits
                      </Link>
                    </Button>
                    <Button asChild size="lg" variant="outline" className="group h-12 rounded-xl px-6 text-base">
                      <Link to="/ai-apps">
                        Browse all apps <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </Button>
                  </>
                )}
              </div>

              <ul className="mt-6 grid gap-2.5 text-sm sm:grid-cols-3">
                {[
                  { Icon: Zap, t: "UPI & card checkout", s: "Packs from ₹10" },
                  { Icon: Gift, t: "100 free credits", s: "No card needed" },
                  { Icon: ShieldCheck, t: "No monthly fees", s: "Pay per use" },
                ].map(({ Icon, t, s }) => (
                  <li key={t} className="flex items-center gap-2.5 rounded-2xl border border-border/60 bg-card/70 px-3 py-2.5 backdrop-blur">
                    <Icon className="h-5 w-5 shrink-0 text-primary" />
                    <span className="leading-tight">
                      <span className="block font-semibold">{t}</span>
                      <span className="block text-xs text-muted-foreground">{s}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="min-w-0 lg:col-span-5">
              <HeroPicker catalog={catalog} />
            </motion.div>
          </div>
        </section>

        {query ? (
          <section className="container mx-auto px-4 pb-16" aria-live="polite">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-bold">
                Results for “{search.trim()}” <span className="text-sm font-normal text-muted-foreground">({results.length})</span>
              </h2>
              <button type="button" onClick={() => setSearch("")} className="text-sm font-semibold text-primary hover:underline">
                Clear search
              </button>
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
            {/* ───────── Persona spotlight ───────── */}
            <AnimatePresence initial={false}>
              {persona && personaTools.length > 0 && (
                <motion.section
                  key={persona.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                  aria-live="polite"
                >
                  <div className="container mx-auto px-4 pb-10">
                    <div className="rounded-[1.75rem] border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-accent/10 p-5 md:p-7">
                      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h2 className="text-xl font-bold md:text-2xl">
                            <span aria-hidden>{persona.emoji} </span>Picked for {persona.label}
                          </h2>
                          <p className="mt-1 text-sm text-muted-foreground">{persona.blurb}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPersonaId(null)}
                          className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-card px-3 py-1.5 text-sm font-medium hover:bg-muted"
                        >
                          <X className="h-4 w-4" /> Show everything
                        </button>
                      </div>
                      <div className="grid gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
                        {personaTools.map((t, i) => (
                          <motion.div key={t.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                            <AppRow tool={t} />
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.section>
              )}
            </AnimatePresence>

            <SectionTabs />

            {/* ───────── Today ───────── */}
            <section id="today" className="container mx-auto scroll-mt-32 px-4 pb-14 pt-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{today}</p>
              <h2 className="mb-5 text-3xl font-bold tracking-tight md:text-4xl">Today</h2>
              <TodaySection catalog={catalog} editorsPicks={editorsPicks} personaId={personaId} />
            </section>

            {/* ───────── Shelves ───────── */}
            <section id="apps" className="container mx-auto scroll-mt-32 space-y-12 px-4 pb-14">
              {editorsPicks.length > 0 && (
                <Shelf title="Editor's picks" subtitle="Hand-picked by the EZYOURLIFE team" seeAllTo="/ai-apps">
                  {editorsPicks.map((t) => (
                    <AppTile key={t.id} tool={t} />
                  ))}
                </Shelf>
              )}
              {shelfCategories.map((cat) => {
                const tools = live.filter((t) => t.category === cat).slice(0, 14);
                if (tools.length < 3) return null;
                return (
                  <Shelf key={cat} title={cat} subtitle={`${live.filter((t) => t.category === cat).length} apps in this category`} seeAllTo={`/ai-apps?category=${encodeURIComponent(cat)}`}>
                    {tools.map((t) => (
                      <AppTile key={t.id} tool={t} />
                    ))}
                  </Shelf>
                );
              })}
              {oneCredit.length > 0 && (
                <Shelf title="Under ₹1 a run" subtitle="1-credit apps for everyday jobs" seeAllTo="/ai-apps">
                  {oneCredit.map((t) => (
                    <AppTile key={t.id} tool={t} />
                  ))}
                </Shelf>
              )}
              {newest.length > 0 && (
                <Shelf title="New arrivals" subtitle="The latest apps added to the store">
                  {newest.map((t) => (
                    <AppTile key={t.id} tool={t} />
                  ))}
                </Shelf>
              )}
            </section>

            {/* ───────── Categories ───────── */}
            <section id="categories" className="container mx-auto scroll-mt-32 px-4 pb-14">
              <h2 className="mb-4 text-xl font-bold md:text-2xl">Browse by category</h2>
              <div className="-mx-4 flex snap-x gap-2.5 overflow-x-auto px-4 pb-2 [scrollbar-width:none] md:mx-0 md:flex-wrap md:px-0 [&::-webkit-scrollbar]:hidden">
                {categories.map(([name, count]) => (
                  <Link
                    key={name}
                    to={`/ai-apps?category=${encodeURIComponent(name)}`}
                    className="shrink-0 snap-start rounded-2xl border border-border/60 bg-card px-4 py-3 transition-colors hover:border-primary/40 hover:bg-primary/5"
                  >
                    <span className="block text-sm font-semibold">{name}</span>
                    <span className="block text-xs text-muted-foreground">{count} app{count === 1 ? "" : "s"}</span>
                  </Link>
                ))}
              </div>
            </section>

            {/* ───────── Credits ───────── */}
            <section id="credits" className="container mx-auto scroll-mt-32 px-4 pb-16">
              <div className="mx-auto mb-8 max-w-2xl text-center">
                <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                  What does <span className="text-gradient">₹10</span> actually get you?
                </h2>
                <p className="mt-2 text-muted-foreground">One wallet for every app. Credits never tie you to a plan.</p>
              </div>
              <CreditValue catalog={catalog} onBuy={setBuyPackId} />
            </section>

            <RequestToolSection />

            {!user && (
              <section className="container mx-auto px-4 pb-16">
                <div className="relative overflow-hidden rounded-[2rem] bg-gradient-hero p-8 text-center text-white shadow-xl shadow-primary/20 md:p-12">
                  <div aria-hidden className="absolute inset-0 bg-black/10" />
                  <div className="relative">
                    <h2 className="text-2xl font-bold md:text-4xl">Your first 100 credits are on us</h2>
                    <p className="mx-auto mt-2 max-w-lg text-white/90">50 when you sign up and 50 more after your first run. No card needed.</p>
                    <Button asChild size="lg" variant="secondary" className="mt-6 h-12 rounded-xl px-8 text-base font-semibold">
                      <Link to="/auth?mode=signup">
                        <Gift className="mr-2 h-4 w-4" /> Claim free credits
                      </Link>
                    </Button>
                  </div>
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

/** Desktop segmented control that jumps between sections and tracks where you are. */
function SectionTabs() {
  const [active, setActive] = useState(TABS[0].id);
  const clicking = useRef(false);

  useEffect(() => {
    const els = TABS.map((t) => document.getElementById(t.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        if (clicking.current) return;
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
        else if (els[0] && window.scrollY < els[0].offsetTop - 200) setActive(TABS[0].id);
      },
      { rootMargin: "-140px 0px -55% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const go = (id: string) => {
    setActive(id);
    clicking.current = true;
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => (clicking.current = false), 800);
  };

  return (
    <div className="sticky top-16 z-40 hidden py-3 md:block">
      <div className="container mx-auto flex justify-center px-4">
        <nav aria-label="Page sections" className="flex items-center gap-1 rounded-full border border-border/60 bg-background/80 p-1 shadow-lg shadow-black/5 backdrop-blur-xl">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => go(t.id)}
              aria-current={active === t.id ? "true" : undefined}
              className={cn(
                "relative rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active === t.id ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {active === t.id && <motion.span layoutId="section-tab" className="absolute inset-0 rounded-full bg-primary" transition={{ type: "spring", bounce: 0.2, duration: 0.4 }} />}
              <span className="relative">{t.label}</span>
            </button>
          ))}
          <Link to="/ai-apps" className="rounded-full px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            All apps
          </Link>
        </nav>
      </div>
    </div>
  );
}

export default Home;
