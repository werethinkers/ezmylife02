import { Link, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { SEOHead } from "@/components/SEOHead";
import SEOFooter from "@/components/SEOFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Navbar } from "@/components/Navbar";
import { motion } from "framer-motion";
import {
  ArrowRight, Sparkles, Zap, ShieldCheck, Wallet, Search,
  MessageSquare, Image as ImageIcon, Video, AudioLines, Pencil,
  Briefcase, Megaphone, LayoutGrid, Gift, LogIn, UserPlus,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@/hooks/useWallet";
import { useToolsCatalog } from "@/hooks/useToolsCatalog";
import { useHomeSections } from "@/hooks/useHomeSections";
import { ToolLandscapeCard } from "@/components/tools/ToolLandscapeCard";
import { EnhancedToolCard } from "@/components/tools/EnhancedToolCard";
import { ToolsEmptyState } from "@/components/tools/ToolsEmptyState";
import { CREDIT_PACKS } from "@/data/creditPacks";
import RequestToolSection from "@/components/RequestToolSection";
import { BulkPromoSection } from "@/components/home/BulkPromoSection";
import logo from "@/assets/logo.png";

const CATEGORY_ICONS: Record<string, typeof MessageSquare> = {
  "Chatbots": MessageSquare,
  "Image Processing": ImageIcon,
  "Image": ImageIcon,
  "Video": Video,
  "Audio": AudioLines,
  "Content Creation": Pencil,
  "Writing": Pencil,
  "Productivity": Zap,
  "Marketing": Megaphone,
  "Business & Finance": Briefcase,
  "Business": Briefcase,
  "AI Apps": Sparkles,
};

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { total: walletTotal } = useWallet();
  const { data: catalog = [] } = useToolsCatalog();
  const { hot, featured } = useHomeSections();
  const [search, setSearch] = useState("");

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = search.trim();
    if (q) navigate(`/ai-apps?q=${encodeURIComponent(q)}`);
  };

  const liveQuery = search.trim().toLowerCase();
  const isSearching = liveQuery.length > 0;

  const searchResults = useMemo(() => {
    if (!isSearching) return [];
    return catalog
      .filter((t) => t.is_live)
      .filter((t) =>
        t.name.toLowerCase().includes(liveQuery) ||
        t.description.toLowerCase().includes(liveQuery) ||
        t.category.toLowerCase().includes(liveQuery)
      )
      .slice(0, 24);
  }, [catalog, liveQuery, isSearching]);

  const categories = useMemo(() => {
    const map = new Map<string, number>();
    catalog.filter((t) => t.is_live).forEach((t) => {
      map.set(t.category, (map.get(t.category) ?? 0) + 1);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count, Icon: CATEGORY_ICONS[name] ?? LayoutGrid }));
  }, [catalog]);

  const popularPacks = useMemo(() => {
    const ids = ["p100", "p250", "p1000"];
    return CREDIT_PACKS.filter((p) => ids.includes(p.id));
  }, []);

  const topPicks = (hot.length ? hot : featured).slice(0, 4);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="EZYOURLIFE - The Future's First AI App Store | 200+ AI Apps"
        description="EZYOURLIFE is the world's first AI App Store with 200+ live AI apps today (2,000+ launching within a year). Pay-as-you-go, no subscriptions."
        path="/"
        keywords="ezyourlife, ai apps, ai app store, pay as you go ai, free ai apps"
      />
      <Navbar />

      <main className="container mx-auto px-4 pt-8 pb-12">
        {/* Search bar */}
        <form onSubmit={onSearch} className="relative mb-10 max-w-5xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search AI apps, tools and more…"
            className="pl-12 h-14 text-base bg-card/60 border-border/60 rounded-2xl shadow-sm"
          />
        </form>

        {isSearching ? (
          <section className="mb-16">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
              <h2 className="text-xl font-semibold">
                Search results for "{search}"
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({searchResults.length} found)
                </span>
              </h2>
              <button
                onClick={() => setSearch("")}
                className="text-sm text-primary hover:underline"
              >
                Clear search
              </button>
            </div>
            {searchResults.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {searchResults.map((t, i) => (
                  <EnhancedToolCard
                    key={t.id}
                    id={t.id}
                    toolId={t.id}
                    name={t.name}
                    description={t.description}
                    category={t.category}
                    isLive={t.is_live}
                    isFree={!!t.is_free}
                    iconUrl={t.icon_url ?? null}
                    icon={<Sparkles className="h-8 w-8" />}
                    index={i}
                  />
                ))}
              </div>
            ) : (
              <ToolsEmptyState onClearFilters={() => setSearch("")} hasActiveFilters={true} />
            )}
          </section>
        ) : (
        <>
        {/* Hero split: left copy, right credits card */}
        <section className="grid lg:grid-cols-2 gap-8 items-stretch mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">AI Marketplace for Everyday Superpowers</span>
            </div>
            <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight leading-[1.05]">
              Find the right AI apps.<br />
              Simplify life.<br />
              <span className="bg-gradient-to-r from-primary via-primary/80 to-accent-foreground bg-clip-text text-transparent">
                Spend smarter.
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              Explore, compare and buy powerful AI apps. All purchases are credit-based — simple, secure and flexible.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-12 px-6 rounded-xl shadow-lg group">
                <Link to="/ai-apps">
                  Explore AI Apps
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-6 rounded-xl">
                <a href="#how-it-works">How It Works</a>
              </Button>
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              {[
                { v: "200+", l: "AI Apps" },
                { v: "₹10", l: "Min Pack" },
                { v: "4.8★", l: "Avg Rating" },
              ].map((s) => (
                <div key={s.l} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/40 border border-border/50">
                  <span className="text-lg font-bold text-foreground">{s.v}</span>
                  <span className="text-xs text-muted-foreground">{s.l}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right card: credits (logged in) or signup CTA (logged out) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative"
          >
            {user ? (
              <div className="rounded-3xl border border-border/60 bg-gradient-to-br from-primary/10 via-card to-card p-7 overflow-hidden h-full">
                <div className="absolute -top-12 -right-12 h-56 w-56 rounded-full bg-primary/15 blur-3xl pointer-events-none" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <h2 className="text-xl font-semibold">Your Credits</h2>
                  </div>
                  <div className="flex items-center gap-4 mb-2">
                    <div className="h-14 w-14 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                      <Zap className="h-7 w-7 text-primary" />
                    </div>
                    <div className="text-5xl font-bold tabular-nums">{walletTotal.toLocaleString()}</div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-5">Credits Available</p>
                  <div className="space-y-2 mb-6">
                    <Button asChild size="lg" className="w-full h-12 rounded-xl">
                      <Link to="/credits">Top Up Credits</Link>
                    </Button>
                    <Button asChild size="lg" variant="outline" className="w-full h-12 rounded-xl">
                      <Link to="/credits/history">Transaction History</Link>
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border/40">
                    {[
                      { Icon: Wallet, t: "Pay with Credits", s: "No subscriptions" },
                      { Icon: ShieldCheck, t: "Secure & Safe", s: "Trusted payments" },
                      { Icon: Zap, t: "Use Instantly", s: "Start in seconds" },
                    ].map((b) => (
                      <div key={b.t} className="text-center space-y-1">
                        <b.Icon className="h-5 w-5 text-primary mx-auto" />
                        <p className="text-[11px] font-semibold leading-tight">{b.t}</p>
                        <p className="text-[10px] text-muted-foreground leading-tight">{b.s}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative rounded-3xl bg-gradient-to-br from-primary via-primary to-purple-600 p-7 text-primary-foreground shadow-xl overflow-hidden h-full">
                <div className="absolute -top-10 -right-10 h-48 w-48 rounded-full bg-white/10 blur-3xl pointer-events-none" />
                <p className="text-sm font-medium mb-1 opacity-90">Welcome to EzYourLife 👋</p>
                <h2 className="text-3xl font-bold leading-tight mb-5">
                  Log in or sign up and<br />
                  get <span className="underline decoration-white/40">100 free credits!</span>
                </h2>
                <div className="flex justify-center mb-5">
                  <div className="h-32 w-32 rounded-3xl bg-white/15 border border-white/20 flex items-center justify-center backdrop-blur-sm">
                    <Gift className="h-16 w-16 text-white drop-shadow" />
                  </div>
                </div>
                <Button asChild size="lg" variant="secondary" className="w-full h-12 font-bold rounded-xl">
                  <Link to="/auth?mode=signup"><UserPlus className="h-4 w-4 mr-2" /> Sign Up Free</Link>
                </Button>
                <div className="text-center text-xs my-2 opacity-80">or</div>
                <Button asChild size="lg" variant="outline" className="w-full h-12 rounded-xl bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white">
                  <Link to="/auth"><LogIn className="h-4 w-4 mr-2" /> Log In</Link>
                </Button>
                <p className="text-center text-xs mt-3 opacity-80">No credit card required</p>
              </div>
            )}
          </motion.div>
        </section>

        {/* Categories */}
        {categories.length > 0 && (
          <section className="mb-16">
            <div className="flex items-end justify-between mb-5">
              <h2 className="text-2xl md:text-3xl font-bold">Browse by Categories</h2>
              <Link to="/ai-apps" className="text-sm text-primary hover:underline">View all categories →</Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              {categories.map(({ name, count, Icon }) => (
                <Link
                  key={name}
                  to={`/ai-apps?category=${encodeURIComponent(name)}`}
                  className="group rounded-2xl border border-border/50 bg-card hover:border-primary/40 hover:shadow-md transition-all p-4 text-center"
                >
                  <div className="h-12 w-12 mx-auto rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-2 group-hover:bg-primary/20 transition">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-sm font-semibold truncate">{name}</p>
                  <p className="text-xs text-muted-foreground">{count} AI Apps</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Featured AI Apps */}
        {featured.length > 0 && (
          <section className="mb-16">
            <div className="flex items-end justify-between mb-5">
              <h2 className="text-2xl md:text-3xl font-bold">Featured AI Apps</h2>
              <Link to="/ai-apps" className="text-sm text-primary hover:underline">View all AI apps →</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {featured.slice(0, 6).map((t) => (
                <ToolLandscapeCard
                  key={t.id}
                  toolId={t.id}
                  name={t.name}
                  description={t.description}
                  category={t.category}
                  isLive={t.isLive}
                  iconUrl={t.iconUrl}
                />
              ))}
            </div>
          </section>
        )}

        {/* How it works + Credit packs */}
        <section id="how-it-works" className="mb-16 rounded-3xl border border-border/60 bg-card/50 p-6 md:p-10">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h2 className="text-2xl md:text-3xl font-bold mb-2">Simple. Credit-Based. Hassle-Free.</h2>
              <p className="text-sm text-muted-foreground mb-6">Real prices, real packs. No subscriptions, no surprises.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(() => {
                  const starter = CREDIT_PACKS[0];
                  const popular = CREDIT_PACKS.find((p) => p.badge === "Popular") ?? CREDIT_PACKS[3];
                  const best = CREDIT_PACKS.find((p) => p.badge === "Best value") ?? CREDIT_PACKS[CREDIT_PACKS.length - 1];
                  const steps = [
                    { n: 1, t: "Start small", v: `₹${starter.inr}`, sub: `${starter.credits} credits`, s: "Try AI apps with our smallest pack.", Icon: Wallet },
                    { n: 2, t: "Most popular", v: `₹${popular.inr}`, sub: `${popular.credits} credits`, s: "What most users pick — great value.", Icon: LayoutGrid, highlight: true },
                    { n: 3, t: "Best value", v: `₹${best.inr}`, sub: `${best.credits} credits`, s: "Lowest cost per credit. Stock up.", Icon: Zap },
                  ];
                  return steps.map((s) => (
                    <div key={s.n} className={`rounded-2xl bg-background/60 border p-5 text-center ${s.highlight ? "border-primary/50 shadow-lg shadow-primary/10" : "border-border/50"}`}>
                      <div className="h-12 w-12 mx-auto rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center mb-3">
                        <s.Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div className="text-xs font-semibold text-primary mb-1">Step {s.n}</div>
                      <p className="font-bold text-sm mb-1">{s.t}</p>
                      <p className="text-2xl font-bold tabular-nums">{s.v}</p>
                      <p className="text-xs font-medium text-primary mb-1">{s.sub}</p>
                      <p className="text-xs text-muted-foreground leading-snug">{s.s}</p>
                    </div>
                  ));
                })()}
              </div>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/70 p-5">
              <h3 className="font-bold mb-4">Popular Credit Packs</h3>
              <ul className="space-y-3">
                {popularPacks.map((p, idx) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 py-2 border-b border-border/40 last:border-0">
                    <div>
                      <p className="font-semibold text-sm">
                        {idx === 0 ? "Starter" : idx === 1 ? "Pro" : "Ultimate"}
                        {idx === 1 && (
                          <span className="ml-2 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/15 text-primary">Best Value</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">{p.credits.toLocaleString()} credits</p>
                    </div>
                    <span className="font-bold tabular-nums">₹{p.inr}</span>
                  </li>
                ))}
              </ul>
              <Button asChild variant="outline" className="w-full mt-4">
                <Link to="/credits">View All Packs</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Top Picks */}
        {topPicks.length > 0 && (
          <section className="mb-16">
            <div className="flex items-end justify-between mb-5">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold">Top Picks for You</h2>
                <p className="text-sm text-muted-foreground">Curated AI apps based on what users love.</p>
              </div>
              <Link to="/ai-apps" className="text-sm text-primary hover:underline">View more →</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {topPicks.map((t) => (
                <Link
                  key={t.id}
                  to={`/tool-preview/${t.id}`}
                  className="rounded-2xl border border-border/50 bg-card p-4 hover:border-primary/40 hover:shadow-md transition-all flex gap-3"
                >
                  <div className="h-14 w-14 flex-shrink-0 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20 flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate">{t.name}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{t.description}</p>
                    <p className="text-xs text-primary mt-1 font-medium">View app →</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Trust strip (Happy Users removed) */}
        <section className="mb-12 rounded-2xl border border-border/50 bg-muted/40 p-6 flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-primary flex-shrink-0" />
          <div>
            <p className="font-semibold">Secure payments · 24/7 support · Your data is always protected.</p>
            <p className="text-xs text-muted-foreground">Pay-as-you-go credits — no subscriptions, ever.</p>
          </div>
        </section>

        <BulkPromoSection />
        <RequestToolSection />
      </main>

      <SEOFooter />
    </div>
  );
};

export default Home;
