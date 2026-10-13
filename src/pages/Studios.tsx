import { useEffect, useMemo, useState } from "react";
import { motion, MotionConfig } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, ListChecks, MessageSquareText, FileCheck2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import SEOFooter from "@/components/SEOFooter";
import { PageSeo } from "@/components/seo/PageSeo";
import { Button } from "@/components/ui/button";
import { AppTile } from "@/components/store/AppTile";
import { useToolsCatalog, type CatalogTool } from "@/hooks/useToolsCatalog";
import { useAppCountLabel } from "@/lib/appCount";
import { seoFor } from "@/lib/seo/pages";
import { STUDIO_TABS } from "@/data/studios";
import { SitesCta } from "@/components/sites/SitesCta";
import "./sitewatch/sitewatch.css";
import { cn } from "@/lib/utils";

const TAB_COLOURS = ["bg-pink", "bg-sun", "bg-teal", "bg-lime", "bg-sky", "bg-coral"];
const FIRST = 6;
const POPULAR = ["business-plan-studio", "resume-studio", "catalogue-photo-studio", "ai-headshot-studio", "income-tax-regime-planner", "home-interior-designer", "maa-ki-virasat"];

/** Fades and lifts its children in once, as they scroll into view. */
function Reveal({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.5, ease: "easeOut" }}>
      {children}
    </motion.div>
  );
}

const STEPS = [
  { Icon: MessageSquareText, h: "Answer a few questions", d: "Plain questions about your business or your job. Speak or type." },
  { Icon: ListChecks, h: "We do the heavy work", d: "The studio builds each part in order and shows you as it goes." },
  { Icon: FileCheck2, h: "Take the finished result", d: "A full plan, report, set of pictures or document, ready to use or share." },
];

/** The Sites category: apps for roads, solar plants and construction sites. Not in the catalogue yet, so it is listed here. */
function SitesGroup() {
  return (
    <>
      <section id="sites" className="sw scroll-mt-28">
        <div className="sec">
          <Reveal>
            <h2>Sites</h2>
            <p className="m" style={{ margin: "6px 0 0", fontSize: 15 }}>Photos, drone and camera footage turned into tasks and proof for roads, solar plants and construction.</p>
          </Reveal>
          <div className="cards">
            <Link to="/studios/site-watch" className="scard" style={{ cursor: "pointer", color: "inherit", textDecoration: "none" }}>
              <span className="k">APP · RUN YOUR SITES</span>
              <h3 style={{ fontSize: 18 }}>Site Watch</h3>
              <span>You get problems spotted, tasks sent to your crew and proof that the work is done.</span>
              <span style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
                <span className="chip pk">Watch the demo</span><span className="chip">Roads</span><span className="chip sun">Solar</span><span className="chip ok">Construction</span>
              </span>
            </Link>
            <div className="scard soon"><span className="k">COMING SOON</span><h3 style={{ fontSize: 18 }}>Site Attendance</h3><span>Who was on site, when, with proof.</span></div>
            <div className="scard soon"><span className="k">COMING SOON</span><h3 style={{ fontSize: 18 }}>Material Tracker</h3><span>Stock counts from photos.</span></div>
          </div>
        </div>
      </section>
      <SitesCta />
    </>
  );
}

function Group({ tab, index, tools }: { tab: (typeof STUDIO_TABS)[number]; index: number; tools: CatalogTool[] }) {
  const [all, setAll] = useState(false);
  const shown = all ? tools : tools.slice(0, FIRST);
  return (
    <section id={tab.id} className="scroll-mt-28 py-8 md:py-12">
      <Reveal>
      <div className={cn("mb-7 flex flex-wrap items-center justify-between gap-3 rounded-3xl border-2 border-ink p-5 shadow-block md:p-6", TAB_COLOURS[index % TAB_COLOURS.length])}>
        <div className="min-w-0">
          <h2 className="text-2xl font-extrabold md:text-3xl">{tab.label}</h2>
          <p className="mt-1 text-[16px] text-ink/85">{tab.line}</p>
        </div>
        <span className="rounded-full border-2 border-ink bg-card px-3 py-1 text-sm font-bold">{tools.length} studios</span>
      </div>
      </Reveal>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((t, i) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, delay: (i % 3) * 0.06, ease: "easeOut" }}
          >
            <AppTile tool={t} layout="grid" />
          </motion.div>
        ))}
      </div>
      {tools.length > FIRST && (
        <div className="mt-5 text-center">
          <Button variant="outline" onClick={() => setAll((v) => !v)}>
            {all ? "Show fewer" : `Show all ${tools.length} in ${tab.label}`}
          </Button>
        </div>
      )}
    </section>
  );
}

const Studios = () => {
  const countLabel = useAppCountLabel();
  const { data: catalog = [] } = useToolsCatalog();
  const byId = useMemo(() => new Map(catalog.filter((t) => t.is_live).map((t) => [t.id, t])), [catalog]);
  const groups = useMemo(
    () => STUDIO_TABS.map((t, i) => ({ tab: t, index: i, tools: t.ids.map((id) => byId.get(id)).filter(Boolean) as CatalogTool[] })).filter((g) => g.tools.length > 0),
    [byId],
  );
  const popular = useMemo(() => POPULAR.map((id) => byId.get(id)).filter(Boolean) as CatalogTool[], [byId]);
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    const els = [...groups.map((g) => g.tab.id), "sites"].map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (!els.length || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.find((e) => e.isIntersecting);
        if (hit) setActive(hit.target.id);
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [groups]);
  const total = groups.reduce((n, g) => n + g.tools.length, 0);
  const label = total >= 10 ? `${Math.floor(total / 10) * 10}+` : String(total);

  return (
    <MotionConfig reducedMotion="user">
    <div className="min-h-screen bg-background">
      <PageSeo
        {...seoFor("/studios", countLabel)}
        keywords="business plan maker, ai resume builder, catalogue photos, pitch deck maker, ezyourlife studios"
        jsonLd={{ "@context": "https://schema.org", "@type": "CollectionPage", name: "Studios", url: "https://ezyourlife.com/studios" }}
      />
      <Navbar />

      <main>
        <header className="mx-auto max-w-7xl px-4 pt-8 md:pt-12">
          <div className="relative grid gap-8 overflow-hidden rounded-[2rem] border-2 border-ink bg-pink p-6 shadow-block-lg md:grid-cols-[1.3fr_1fr] md:p-12">
            <motion.span aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full border-2 border-ink bg-sun" animate={{ y: [0, 10, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} />
            <motion.span aria-hidden className="pointer-events-none absolute -bottom-12 left-1/3 h-32 w-32 rotate-12 rounded-3xl border-2 border-ink bg-lime" animate={{ y: [0, -10, 0], rotate: [12, 6, 12] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }} />
            <motion.div className="relative" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: "easeOut" }}>
              <span className="inline-flex rounded-full border-2 border-ink bg-sun px-3 py-1 text-[13px] font-bold">
                {total > 0 ? `${label} studios` : "Studios"}
              </span>
              <h1 className="mt-4 text-4xl font-extrabold leading-[1.05] md:text-6xl">
                Big jobs, <span className="inline-block -rotate-1 rounded-xl border-2 border-ink bg-sun px-2 shadow-block">finished</span> for you.
              </h1>
              <p className="mt-4 max-w-xl text-lg text-ink/85 md:text-xl">
                A business plan, catalogue photos, a resume, a tax plan, a family book, and now your sites. Answer a few questions and a studio does the whole job, step by step.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <a href={groups[0] ? `#${groups[0].tab.id}` : "#all"}>
                    Pick a studio <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
                <Button asChild size="lg" variant="outline" className="bg-card">
                  <Link to="/credits">See prices</Link>
                </Button>
              </div>
              <p className="mt-4 text-sm font-semibold text-ink/80">100 free credits to start. Pay only when you get a result.</p>
            </motion.div>
            <ol className="relative flex flex-col gap-3 self-center">
              {STEPS.map(({ Icon, h, d }, i) => (
                <motion.li key={h} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.15 + i * 0.1, ease: "easeOut" }} className="flex gap-3 rounded-2xl border-2 border-ink bg-card p-4 shadow-block-sm">
                  <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-ink", ["bg-sun", "bg-teal", "bg-lime"][i])}>
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <div>
                    <p className="font-bold">{h}</p>
                    <p className="text-[14px] text-muted-foreground">{d}</p>
                  </div>
                </motion.li>
              ))}
            </ol>
          </div>
        </header>

        <nav aria-label="Studio groups" className="sticky top-0 z-30 mt-6 border-y-2 border-ink bg-cream/95 backdrop-blur">
          <div className="mx-auto flex max-w-7xl gap-2.5 overflow-x-auto px-4 py-3 no-scrollbar">
            {groups.map((g) => (
              <a
                key={g.tab.id}
                href={`#${g.tab.id}`}
                className={cn(
                  "shrink-0 rounded-full border-2 border-ink px-4 py-1.5 text-[15px] font-semibold shadow-[2px_2px_0_0_hsl(var(--ink))] transition-all duration-200 hover:-translate-y-0.5",
                  active === g.tab.id ? "bg-ink text-cream" : TAB_COLOURS[g.index % TAB_COLOURS.length],
                )}
              >
                {g.tab.label}
              </a>
            ))}
            <a
              href="#sites"
              className={cn(
                "relative shrink-0 rounded-full border-2 border-ink px-4 py-1.5 text-[15px] font-semibold shadow-[2px_2px_0_0_hsl(var(--ink))] transition-all duration-200 hover:-translate-y-0.5",
                active === "sites" ? "bg-ink text-cream" : "bg-sky",
              )}
            >
              Sites
              <span className="absolute -right-1.5 -top-2.5 rounded-full bg-ink px-1.5 text-[10px] font-extrabold tracking-wider text-lime">NEW</span>
            </a>
          </div>
        </nav>

        <div id="all" className="mx-auto max-w-7xl px-4 pb-6">
          {groups.length === 0 && <p className="py-16 text-center text-muted-foreground">Studios are being added. Check back soon.</p>}
          {popular.length >= 3 && (
            <section className="pt-10 md:pt-12" aria-label="Most used studios">
              <Reveal>
                <h2 className="text-2xl font-extrabold md:text-3xl">Start with a favourite</h2>
                <p className="mt-1 text-[16px] text-muted-foreground">The studios people open first.</p>
              </Reveal>
              <div className="-mx-4 mt-6 flex snap-x gap-5 overflow-x-auto px-4 pb-4 no-scrollbar">
                {popular.map((t) => (
                  <AppTile key={t.id} tool={t} />
                ))}
              </div>
            </section>
          )}
          {groups.map((g) => (
            <Group key={g.tab.id} tab={g.tab} index={g.index} tools={g.tools} />
          ))}
          <SitesGroup />
        </div>

        <section className="mx-auto max-w-7xl px-4 pb-16">
          <div className="rounded-3xl border-2 border-ink bg-sun p-8 text-center shadow-block-lg md:p-12">
            <h2 className="text-3xl font-extrabold md:text-4xl">Not sure which one you need?</h2>
            <p className="mx-auto mt-2 max-w-xl text-lg text-ink/85">Tell us your type of business and we show the apps and studios people like you use most.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg">
                <Link to="/explore">Find by business type</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-card">
                <Link to="/ai-apps">Browse all apps</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <SEOFooter />
    </div>
    </MotionConfig>
  );
};

export default Studios;
