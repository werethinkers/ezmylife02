import { useEffect, useMemo } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { ArrowRight, FileCheck2, HardHat, ListChecks, MessageSquareText, Package, ScanEye } from "lucide-react";
import { PageSeo } from "@/components/seo/PageSeo";
import { useToolsCatalog, type CatalogTool } from "@/hooks/useToolsCatalog";
import { useAppCountLabel } from "@/lib/appCount";
import { seoFor } from "@/lib/seo/pages";
import { STUDIO_TABS } from "@/data/studios";
import { POPULAR_STUDIO_IDS } from "@/data/studioPicks";
import { cn } from "@/lib/utils";
import { ModernPage } from "@/components/modern/ModernPage";
import { ToolCard } from "@/components/modern/ToolCard";
import { ShowcaseCard } from "@/components/modern/ShowcaseCard";
import { SitesContact } from "@/components/modern/SitesContact";
import { CtaBand, EmptyState, PageHeader, SectionHead } from "@/components/modern/ui";
import { BTN_OUTLINE, BTN_PRIMARY, CONTAINER, FOCUS_RING, pillClass, roundedLabel } from "@/components/modern/styles";
import { ScrollRow } from "@/components/ui/scroll-row";

/** Studios per group before "See all" when every group is shown. */
const PER_GROUP = 6;

const STEPS = [
  { Icon: MessageSquareText, h: "Answer a few questions", d: "Plain questions about your business or your job. Speak or type." },
  { Icon: ListChecks, h: "We do the heavy work", d: "The studio builds each part in order and shows you as it goes." },
  { Icon: FileCheck2, h: "Take the finished result", d: "A full plan, report, set of pictures or document, ready to use or share." },
];

/** The Sites group: apps for roads, solar plants and construction. Not in the catalogue yet, so it is listed here. */
const SITES = [
  { name: "Site Watch", get: "Problems spotted, tasks sent and proof of work", to: "/studios/site-watch", Icon: ScanEye, gradient: "from-emerald-500 to-green-600" },
  { name: "Site Attendance", get: "Who was on site, when, with proof", Icon: HardHat, gradient: "from-blue-500 to-indigo-600" },
  { name: "Material Tracker", get: "Stock counts from photos", Icon: Package, gradient: "from-amber-500 to-orange-600" },
];

function SiteMedia({ Icon, get, gradient }: { Icon: typeof ScanEye; get: string; gradient: string }) {
  return (
    <div className={cn("flex h-full w-full flex-col bg-gradient-to-br p-4 pt-12 text-white", gradient)}>
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <p className="mt-3 max-w-[16rem] text-sm font-semibold leading-snug text-white/90">You get: {get.toLowerCase()}</p>
    </div>
  );
}

function SitesSection() {
  return (
    <section id="sites" aria-labelledby="sites-h" className="scroll-mt-28 space-y-6">
      <SectionHead
        id="sites-h"
        className="mb-0"
        eyebrow="New"
        title="Sites"
        line="Roads, solar plants and construction sites, watched and followed up."
        action={<span className="shrink-0 text-xs font-semibold text-zinc-500 dark:text-zinc-400">1 studio, 2 coming soon</span>}
      />
      <ScrollRow size="card">
        {SITES.map((s) => (
          <ShowcaseCard
            key={s.name}
            media={<SiteMedia Icon={s.Icon} get={s.get} gradient={s.gradient} />}
            title={s.name}
            chip={s.to ? "Live" : "Coming soon"}
            action={s.to ? "Open" : "Soon"}
            to={s.to}
            label={s.to ? `${s.name}: open the studio` : `${s.name}, coming soon`}
            size="lg"
          />
        ))}
      </ScrollRow>
      <SitesContact />
    </section>
  );
}

function GroupSection({ id, label, line, tools, capped, onSeeAll }: { id: string; label: string; line: string; tools: CatalogTool[]; capped: boolean; onSeeAll: () => void }) {
  const list = capped ? tools.slice(0, PER_GROUP) : tools;
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-28">
      <SectionHead
        id={`${id}-h`}
        className="mb-5"
        title={label}
        line={line}
        action={
          capped && tools.length > PER_GROUP ? (
            <button type="button" onClick={onSeeAll} className={cn("inline-flex shrink-0 items-center gap-1 rounded text-xs font-semibold text-orange-700 underline-offset-4 hover:underline dark:text-orange-400", FOCUS_RING)}>
              See all {tools.length} <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </button>
          ) : (
            <span className="shrink-0 text-xs tabular-nums text-zinc-500 dark:text-zinc-400">{tools.length} studios</span>
          )
        }
      />
      <ScrollRow size="card">
        {list.map((t) => (
          <ToolCard key={t.id} tool={t} chip="" size="lg" />
        ))}
      </ScrollRow>
    </section>
  );
}

const Studios = () => {
  const countLabel = useAppCountLabel();
  const { data: catalog = [] } = useToolsCatalog();
  const [params, setParams] = useSearchParams();
  const { hash } = useLocation();
  const byId = useMemo(() => new Map(catalog.filter((t) => t.is_live).map((t) => [t.id, t])), [catalog]);
  const groups = useMemo(
    () => STUDIO_TABS.map((t) => ({ tab: t, tools: t.ids.map((id) => byId.get(id)).filter((x): x is CatalogTool => !!x) })).filter((g) => g.tools.length > 0),
    [byId],
  );
  const popular = useMemo(() => POPULAR_STUDIO_IDS.map((id) => byId.get(id)).filter((x): x is CatalogTool => !!x), [byId]);
  const total = groups.reduce((n, g) => n + g.tools.length, 0);
  const label = roundedLabel(total);

  // ?tab=<group id> or ?tab=sites shows one group; no tab shows everything.
  const tabParam = params.get("tab");
  const tab = tabParam === "sites" || groups.some((g) => g.tab.id === tabParam) ? tabParam : null;
  const pick = (id: string | null) =>
    setParams(
      (p) => {
        const n = new URLSearchParams(p);
        if (id) n.set("tab", id);
        else n.delete("tab");
        return n;
      },
      { replace: true },
    );

  // Links such as /studios#sites land on that group once it is on the page.
  useEffect(() => {
    const id = hash.slice(1);
    if (!id) return;
    const frame = requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: "start" }));
    return () => cancelAnimationFrame(frame);
  }, [hash, groups.length]);

  const shownGroups = tab ? groups.filter((g) => g.tab.id === tab) : groups;

  return (
    <ModernPage section="studios">
      <PageSeo
        {...seoFor("/studios", countLabel)}
        keywords="business plan maker, ai resume builder, catalogue photos, pitch deck maker, ezyourlife studios"
        jsonLd={{ "@context": "https://schema.org", "@type": "CollectionPage", name: "Studios", url: "https://ezyourlife.com/studios" }}
      />

      <main className="min-h-[75vh] py-12">
        <div className={cn(CONTAINER, "space-y-8")}>
          <PageHeader
            eyebrow={total > 0 ? `${label} guided studios` : "Guided studios"}
            title="Studios"
            line="Big jobs, finished for you. A business plan, catalogue photos, a resume, a tax plan, a family book, and now your sites. Answer a few questions and a studio does the whole job, step by step."
          >
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <a href="#all" className={BTN_PRIMARY}>
                Pick a studio <ArrowRight className="h-4 w-4" aria-hidden />
              </a>
              <Link to="/credits" className={BTN_OUTLINE}>
                See prices
              </Link>
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">100 free credits to start. Pay only when you get a result.</span>
            </div>
          </PageHeader>

          <ScrollRow as="ol" size="step" label="How a studio works">
            {STEPS.map(({ Icon, h, d }, i) => (
              <li key={h} className="flex gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-semibold">
                    {i + 1}. {h}
                  </p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">{d}</p>
                </div>
              </li>
            ))}
          </ScrollRow>

          <div id="all" className="scroll-mt-24 space-y-12">
            <div className="ez-chips" role="group" aria-label="Studio groups">
              <button type="button" aria-pressed={!tab} onClick={() => pick(null)} className={pillClass(!tab)}>
                All <span className="tabular-nums opacity-70">({total} live)</span>
              </button>
              {groups.map((g) => (
                <button key={g.tab.id} type="button" aria-pressed={tab === g.tab.id} onClick={() => pick(g.tab.id)} className={pillClass(tab === g.tab.id)}>
                  {g.tab.label} <span className="tabular-nums opacity-70">({g.tools.length})</span>
                </button>
              ))}
              <button type="button" aria-pressed={tab === "sites"} onClick={() => pick("sites")} className={pillClass(tab === "sites")}>
                Sites <span className="opacity-70">(1 + 2 soon)</span>
              </button>
            </div>

            {groups.length === 0 && <EmptyState message="Studios are being added. Check back soon." />}

            {!tab && popular.length >= 3 && (
              <section aria-labelledby="popular-h">
                <SectionHead id="popular-h" className="mb-5" eyebrow="The studios people open first" title="Start with a favourite" />
                <ScrollRow size="card">
                  {popular.map((t) => (
                    <ToolCard key={t.id} tool={t} chip={STUDIO_TABS.find((x) => x.ids.includes(t.id))?.label ?? "Studio"} size="lg" />
                  ))}
                </ScrollRow>
              </section>
            )}

            {tab !== "sites" &&
              shownGroups.map((g) => (
                <GroupSection key={g.tab.id} id={g.tab.id} label={g.tab.label} line={g.tab.line} tools={g.tools} capped={!tab} onSeeAll={() => pick(g.tab.id)} />
              ))}

            {(!tab || tab === "sites") && <SitesSection />}
          </div>
        </div>

        <section className="mt-16">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <CtaBand chip="Not sure?" title="Not sure which one you need?" line="Tell us your type of business and we show the apps and studios people like you use most.">
              <Link to="/explore" className={BTN_PRIMARY}>
                Find by business type
              </Link>
              <Link to="/ai-apps" className={cn("inline-flex items-center rounded-xl border border-white/25 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-white/10", FOCUS_RING)}>
                Browse all apps
              </Link>
            </CtaBand>
          </div>
        </section>
      </main>
    </ModernPage>
  );
};

export default Studios;
