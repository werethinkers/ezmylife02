import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { ArrowRight, Search, X } from "lucide-react";
import { PageSeo } from "@/components/seo/PageSeo";
import { USE_CASE_SEEDS, humanize, landingMatches } from "@/lib/seoData";
import { useToolsCatalog } from "@/hooks/useToolsCatalog";
import { useProducts } from "@/instant/useProducts";
import { useAppCountLabel } from "@/lib/appCount";
import { categoriesOf, inCategory } from "@/data/goals";
import { seoFor } from "@/lib/seo/pages";
import { STUDIO_IDS } from "@/data/studios";
import { WEBSITE_CATEGORIES } from "@/components/brand/nav";
import { EXPLORE_BUSINESS_TYPES } from "@/data/exploreBusinessTypes";
import { ModernPage } from "@/components/modern/ModernPage";
import { ToolCard } from "@/components/modern/ToolCard";
import { DesignCard } from "@/components/modern/DesignCard";
import { toDesignLite } from "@/components/modern/designLite";
import { PageHeader, SectionHead, EmptyState } from "@/components/modern/ui";
import { CONTAINER, FOCUS_RING, pillClass } from "@/components/modern/styles";
import { AppShowcaseRow, type ShowcaseApp } from "@/components/AppShowcaseCard";
import { cn } from "@/lib/utils";

const EXPLORE_SHOWCASE_APPS: ShowcaseApp[] = [
  {
    id: "brand-identity-studio",
    name: "Brand Identity Studio",
    description: "Get a full brand kit: name ideas, story, voice, colours, fonts, logo directions and taglines, with optional logo and mood images.",
    imageSrc: "/app-previews/brand-identity-studio.jpg",
    category: "Branding",
    href: "/tool/brand-identity-studio",
    ctaLabel: "Try Studio",
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
    id: "catalogue-photo-studio",
    name: "Catalogue Photo Studio",
    description: "Turn one phone photo of a product into marketplace-ready shots: white background, angles, close-up, scale and infographic base.",
    imageSrc: "/app-previews/catalogue-photo-studio.jpg",
    category: "Commerce",
    href: "/tool/catalogue-photo-studio",
    ctaLabel: "Try Studio",
  },
  {
    id: "email-sequence-builder",
    name: "Email Sequence Builder",
    description: "Write a full email sequence for welcome, sales, abandoned cart or win-back — with subject lines, timing and A/B test ideas.",
    imageSrc: "/app-previews/email-sequence-builder.jpg",
    category: "Marketing",
    href: "/tool/email-sequence-builder",
  },
  {
    id: "contract-risk-reviewer",
    name: "Contract Risk Reviewer",
    description: "Upload any contract and get a clause-by-clause risk review: red flags, missing protections and suggested negotiation wording.",
    imageSrc: "/app-previews/contract-risk-reviewer.jpg",
    category: "Legal",
    href: "/tool/contract-risk-reviewer",
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
];

const TOP_USE_CASES = USE_CASE_SEEDS.slice(0, 80);

/** Row of cards: a single-row peek-scroll strip on mobile, a plain grid from md up. Each card needs
 *  an explicit width (not just a minimum), or it sizes to its own content and can push the page wider
 *  than the screen instead of scrolling cleanly within this row. */
const ROW_CLASS = "flex snap-x snap-mandatory gap-3.5 overflow-x-auto px-4 pb-2 -mx-4 no-scrollbar md:mx-0 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:px-0 md:pb-0";
const ITEM_CLASS = "w-[82%] shrink-0 snap-center sm:w-[55%] md:w-auto md:shrink md:snap-none";

const Explore = () => {
  const countLabel = useAppCountLabel();
  const { data: catalog = [], isLoading: catalogLoading } = useToolsCatalog();
  const { list: designs, loading: designsLoading } = useProducts();
  const [query, setQuery] = useState("");
  // null: just the grid. Set once the visitor taps a card, which morphs into the active bar and
  // brings in that industry's recommended stack.
  const [picked, setPicked] = useState<string | null>(null);

  const liveTools = useMemo(() => catalog.filter((t) => t.is_live), [catalog]);
  const apps = useMemo(() => liveTools.filter((t) => !STUDIO_IDS.has(t.id)), [liveTools]);
  const studioTools = useMemo(() => liveTools.filter((t) => STUDIO_IDS.has(t.id)), [liveTools]);
  const matchableDesigns = useMemo(
    () => designs.map((l) => ({ l, name: l.product.name, description: l.product.description, category: l.product.category })),
    [designs],
  );

  // Real counts only: each number is the same fuzzy match /ai-for/<slug> uses, never made up.
  const types = useMemo(
    () =>
      EXPLORE_BUSINESS_TYPES.map((b) => ({
        ...b,
        appCount: landingMatches(b.slug, apps).length + landingMatches(b.slug, studioTools).length,
        designCount: landingMatches(b.slug, matchableDesigns).length,
      })),
    [apps, studioTools, matchableDesigns],
  );

  const q = query.trim().toLowerCase();
  const filteredTypes = q ? types.filter((t) => t.label.toLowerCase().includes(q)) : types;
  const active = picked ? types.find((t) => t.slug === picked) ?? null : null;

  const bundle = useMemo(() => {
    if (!active) return null;
    const matchedApps = landingMatches(active.slug, apps).slice(0, 8);
    const matchedStudios = landingMatches(active.slug, studioTools).slice(0, 8);
    const matchedDesigns = landingMatches(active.slug, matchableDesigns)
      .slice(0, 16)
      .map((m) => m.l);
    const websites = matchedDesigns.filter((l) => (WEBSITE_CATEGORIES as readonly string[]).includes(l.product.category)).slice(0, 8);
    const cards = matchedDesigns.filter((l) => !(WEBSITE_CATEGORIES as readonly string[]).includes(l.product.category)).slice(0, 8);
    return { apps: matchedApps, studios: matchedStudios, websites, cards };
  }, [active, apps, studioTools, matchableDesigns]);

  const categories = Array.from(new Set(liveTools.flatMap((t) => categoriesOf(t)))).sort();
  const shelves = categories
    .map((c) => ({ c, tools: liveTools.filter((t) => inCategory(t, c)).slice(0, 8) }))
    .filter((x) => x.tools.length >= 4)
    .sort((a, b) => b.tools.length - a.tools.length)
    .slice(0, 4);

  const loading = catalogLoading || designsLoading;
  const bundleEmpty = !loading && bundle && !bundle.apps.length && !bundle.studios.length && !bundle.websites.length && !bundle.cards.length;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Explore AI apps by use case and industry",
    url: "https://ezyourlife.com/explore",
    description: `Browse ${countLabel} live AI apps by use case, industry, and category on EZYOURLIFE — the future's first AI app store.`,
  };

  return (
    <ModernPage>
      <PageSeo
        {...seoFor("/explore", "")}
        keywords="ai tool for, ai apps directory, ai for industry, browse ai tools, ai tool explorer, ezyourlife"
        jsonLd={jsonLd}
      />

      <MotionConfig reducedMotion="user">
      <main className={cn(CONTAINER, "space-y-12 py-10 md:py-14")}>
        <PageHeader
          eyebrow="Explore by industry"
          title="Find apps built for your business"
          line="Pick your type of business, or search for it. We show the websites, cards, studios and apps that fit."
        >
          <div className="relative mt-5 max-w-xl">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search shop, salon, clinic, restaurant, CA..."
              className={cn(
                "w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-10 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100",
                FOCUS_RING,
              )}
            />
          </div>
        </PageHeader>

        <section aria-labelledby="business-types-h">
          <h2 id="business-types-h" className="sr-only">
            Business types
          </h2>
          {filteredTypes.length === 0 ? (
            <EmptyState message="No business type matches that search." action="Clear search" onAction={() => setQuery("")} />
          ) : (
            <motion.div layout className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              <AnimatePresence>
                {filteredTypes.map((b) => {
                  const isPicked = picked === b.slug;
                  if (picked && !isPicked) return null;
                  return (
                    <motion.button
                      key={b.slug}
                      layout
                      initial={{ opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.92 }}
                      transition={{ duration: 0.24, ease: "easeOut" }}
                      type="button"
                      onClick={() => setPicked(isPicked ? null : b.slug)}
                      aria-pressed={isPicked}
                      className={cn(
                        "text-left shadow-soft-sm transition",
                        FOCUS_RING,
                        isPicked
                          ? "col-span-2 flex items-center gap-3 rounded-2xl border p-4 sm:col-span-3 lg:col-span-4"
                          : "flex flex-col gap-2.5 rounded-2xl border p-4",
                        isPicked
                          ? "border-orange-500 bg-orange-50 dark:border-orange-500 dark:bg-orange-950/40"
                          : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                          isPicked ? "bg-primary text-primary-foreground" : "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
                        )}
                      >
                        <b.Icon className="h-5 w-5" aria-hidden />
                      </span>
                      {isPicked ? (
                        <>
                          <span className="min-w-0 flex-1">
                            <span className="block font-display text-sm font-bold leading-snug">{b.label}</span>
                            <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                              {b.appCount} app{b.appCount === 1 ? "" : "s"}
                              {b.designCount > 0 ? ` · ${b.designCount} design${b.designCount === 1 ? "" : "s"}` : ""}
                            </span>
                          </span>
                          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-orange-300 bg-white px-3 py-1.5 text-xs font-semibold text-orange-700 dark:border-orange-700 dark:bg-zinc-900 dark:text-orange-300">
                            Change industry <X className="h-3.5 w-3.5" aria-hidden />
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="font-display text-sm font-bold leading-snug">{b.label}</span>
                          {!loading && (
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">
                              {b.appCount} app{b.appCount === 1 ? "" : "s"}
                              {b.designCount > 0 ? ` · ${b.designCount} design${b.designCount === 1 ? "" : "s"}` : ""}
                            </span>
                          )}
                        </>
                      )}
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </section>

        <AnimatePresence>
          {active && (
            <motion.section
              key="bundle"
              aria-labelledby="bundle-h"
              className="scroll-mt-24"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3, ease: "easeOut", delay: 0.12 }}
            >
              <SectionHead
                id="bundle-h"
                eyebrow="Recommended stack"
                title={`Built for ${/^[aeiou]/i.test(active.label) ? "an" : "a"} ${active.label.toLowerCase()}`}
                line="The websites, cards, studios and apps businesses like this use most."
                action={
                  <Link to={`/ai-for/${active.slug}`} className={cn("inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-orange-700 underline-offset-4 hover:underline dark:text-orange-400", FOCUS_RING)}>
                    See the full page <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                }
              />

              {loading ? (
                <div className={ROW_CLASS}>
                  {[0, 1, 2].map((i) => (
                    <div key={i} aria-hidden className={cn(ITEM_CLASS, "h-60 animate-pulse rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900")} />
                  ))}
                </div>
              ) : bundleEmpty ? (
                <EmptyState message={`We don't have a matched stack for ${active.label.toLowerCase()} yet. Browse everything instead.`} />
              ) : (
                <div className="space-y-8">
                  {bundle?.websites.length ? (
                    <div>
                      <p className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Websites</p>
                      <div className={ROW_CLASS}>
                        {bundle.websites.map((l) => (
                          <DesignCard key={l.product.id} d={toDesignLite(l)} size="md" className={ITEM_CLASS} />
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {bundle?.cards.length ? (
                    <div>
                      <p className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Cards & invites</p>
                      <div className={ROW_CLASS}>
                        {bundle.cards.map((l) => (
                          <DesignCard key={l.product.id} d={toDesignLite(l)} size="md" className={ITEM_CLASS} />
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {bundle?.studios.length ? (
                    <div>
                      <p className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Studios</p>
                      <div className={ROW_CLASS}>
                        {bundle.studios.map((t) => (
                          <ToolCard key={t.id} tool={t} size="md" className={ITEM_CLASS} />
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {bundle?.apps.length ? (
                    <div>
                      <p className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Business apps</p>
                      <div className={ROW_CLASS}>
                        {bundle.apps.map((t) => (
                          <ToolCard key={t.id} tool={t} size="md" className={ITEM_CLASS} />
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </motion.section>
          )}
        </AnimatePresence>

        <section aria-labelledby="jobs-h">
          <SectionHead id="jobs-h" title="By job to do" line={`${TOP_USE_CASES.length} everyday tasks`} />
          <PillRow items={TOP_USE_CASES.map((slug) => ({ to: `/ai-tool-for/${slug}`, label: humanize(slug) }))} />
        </section>

        <section id="explore-showcase" className="py-2">
          <AppShowcaseRow
            heading="See apps in action"
            subheading="Popular picks"
            apps={EXPLORE_SHOWCASE_APPS}
          />
        </section>

        <section aria-labelledby="types-h">
          <SectionHead id="types-h" title="By type of app" line={`${categories.length} categories`} />
          <PillRow items={categories.map((c) => ({ to: `/ai-apps?category=${encodeURIComponent(c)}`, label: c }))} />
        </section>

        <div className="space-y-10">
          {shelves.map(({ c, tools }) => (
            <section key={c} aria-labelledby={`shelf-${c}-h`}>
              <SectionHead
                id={`shelf-${c}-h`}
                title={c}
                action={
                  <Link to={`/ai-apps?category=${encodeURIComponent(c)}`} className={cn("inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-orange-700 underline-offset-4 hover:underline dark:text-orange-400", FOCUS_RING)}>
                    See all <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                }
              />
              <div className={ROW_CLASS}>
                {tools.map((t) => (
                  <ToolCard key={t.id} tool={t} size="md" className={ITEM_CLASS} />
                ))}
              </div>
            </section>
          ))}
        </div>

        <section aria-labelledby="all-h">
          <SectionHead id="all-h" title={`All ${liveTools.length} apps`} />
          <PillRow items={liveTools.map((t) => ({ to: `/tool/${t.id}`, label: t.name }))} />
        </section>
      </main>
      </MotionConfig>
    </ModernPage>
  );
};

const PillRow = ({ items }: { items: { to: string; label: string }[] }) => (
  <ul className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-3 no-scrollbar">
    {items.map((it) => (
      <li key={it.to} className="shrink-0 snap-start">
        <Link to={it.to} className={cn(pillClass(false), "whitespace-nowrap")}>
          {it.label}
        </Link>
      </li>
    ))}
  </ul>
);

export default Explore;
