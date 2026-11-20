import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, Search } from "lucide-react";
import { PageSeo } from "@/components/seo/PageSeo";
import { CATEGORIES } from "@/instant/catalog";
import { GROUPS, groupOf } from "@/instant/catalog/groups";
import { useProducts } from "@/instant/useProducts";
import type { CategoryId } from "@/instant/types";
import { cn } from "@/lib/utils";
import { fmtCredits } from "@/lib/creditRate";
import { CARD_CATEGORIES, WEBSITE_CATEGORIES } from "@/components/brand/nav";
import { seoFor } from "@/lib/seo/pages";
import { ModernPage } from "@/components/modern/ModernPage";
import { ModernSteps } from "@/components/modern/ModernSteps";
import { DesignCard } from "@/components/modern/DesignCard";
import { toDesignLite, type DesignLite } from "@/components/modern/designLite";
import { EmptyState, PageHeader, SectionHead } from "@/components/modern/ui";
import { CONTAINER, FOCUS_RING, pillClass, subPillClass } from "@/components/modern/styles";

type Sort = "recommended" | "price-asc" | "price-desc" | "name";
const PRICES = [
  { id: "all", name: "Any price", test: () => true },
  // In credits (the ids stay as they were, so old links still filter).
  { id: "u50", name: "Under 100 credits", test: (n: number) => n < 100 },
  { id: "50-199", name: "100 – 499 credits", test: (n: number) => n >= 100 && n < 500 },
  { id: "200", name: "500 credits and up", test: (n: number) => n >= 500 },
] as const;
const SORTS: { id: Sort; name: string }[] = [
  { id: "recommended", name: "Recommended" },
  { id: "price-asc", name: "Price: low to high" },
  { id: "price-desc", name: "Price: high to low" },
  { id: "name", name: "Name (A–Z)" },
];
/** Designs per category before "See all" when every category is shown. */
const PER_CATEGORY = 8;
const GRID = "grid gap-5 sm:grid-cols-2 lg:grid-cols-4";

const COPY = {
  websites: {
    title: "Make a website",
    line: "A website stays online. You get one link to put on WhatsApp, Google and your shop board, with call and WhatsApp buttons built in.",
    search: "Try “gym”, “salon”, “menu”, “visiting card”",
    path: "/websites",
  },
  cards: {
    title: "Send a card or invite",
    line: "A card is made for one moment. Add names, a photo and your message, pay once, and send the link on WhatsApp.",
    search: "Try “birthday”, “wedding”, “diwali”, “anniversary”",
    path: "/cards",
  },
  all: {
    title: "Websites, cards and invites",
    line: "Ready-made designs for your business and your celebrations. Add your details, see it live, pay once and share one link.",
    search: "Try “birthday”, “gym”, “menu”, “wedding”",
    path: "/create",
  },
} as const;

const isSite = (category: string) => (WEBSITE_CATEGORIES as readonly string[]).includes(category);

/** Gallery of ready-made designs: /websites, /cards, or both at /create. */
export default function CreateGallery({ kind }: { kind?: "websites" | "cards" }) {
  const { list: all } = useProducts();
  const allowed = kind === "websites" ? WEBSITE_CATEGORIES : kind === "cards" ? CARD_CATEGORIES : null;
  const list = allowed ? all.filter((l) => (allowed as readonly string[]).includes(l.product.category)) : all;
  const CATS = allowed ? CATEGORIES.filter((c) => (allowed as readonly string[]).includes(c.id)) : CATEGORIES;
  const copy = COPY[kind ?? "all"];
  const lite = useMemo(() => new Map(all.map((l) => [l.product.id, toDesignLite(l)])), [all]);
  const liteOf = (id: string) => lite.get(id) as DesignLite;

  const [params, setParams] = useSearchParams();
  const catParam = (params.get("cat") as CategoryId | null) ?? "all";
  const cat = catParam === "all" || CATS.some((c) => c.id === catParam) ? catParam : "all";
  const group = params.get("type") ?? "all";
  const price = params.get("price") ?? "all";
  const sort = (params.get("sort") as Sort | null) ?? "recommended";
  const popular = params.get("popular") === "1";
  const [q, setQ] = useState("");
  const set = (patch: Record<string, string | null>) =>
    setParams(
      (p) => {
        const n = new URLSearchParams(p);
        Object.entries(patch).forEach(([k, v]) => (v == null || v === "all" || v === "" || (k === "sort" && v === "recommended") ? n.delete(k) : n.set(k, v)));
        return n;
      },
      { replace: true },
    );

  const priceTest = (PRICES.find((x) => x.id === price) ?? PRICES[0]).test;
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    const out = list.filter(
      ({ product: p, credits: n, featured }) =>
        (cat === "all" || p.category === cat) &&
        (group === "all" || groupOf(p.id) === group) &&
        priceTest(n) &&
        (!popular || featured || p.popular) &&
        (!s || `${p.name} ${p.tagline} ${p.category} ${p.seasonal ?? ""}`.toLowerCase().includes(s)),
    );
    if (sort === "price-asc") out.sort((a, b) => a.credits - b.credits || a.sort - b.sort);
    else if (sort === "price-desc") out.sort((a, b) => b.credits - a.credits || a.sort - b.sort);
    else if (sort === "name") out.sort((a, b) => a.product.name.localeCompare(b.product.name));
    return out;
  }, [list, cat, group, priceTest, popular, sort, q]);
  const featured = list.filter((l) => l.featured).slice(0, PER_CATEGORY);
  const filtered = cat !== "all" || group !== "all" || price !== "all" || popular || sort !== "recommended" || !!q.trim();
  const clear = () => {
    setQ("");
    setParams(new URLSearchParams(), { replace: true });
  };
  const prices = list.map((l) => l.credits).filter((n) => n > 0);
  const from = prices.length ? Math.min(...prices) : null;
  const siteCount = all.filter((l) => isSite(l.product.category)).length;

  // Groups of the chosen category, plus "More" for designs in none of them, so nothing is left out.
  const groupsOfCat = useMemo(() => {
    if (cat === "all") return [];
    const inCat = list.filter((l) => l.product.category === cat);
    return [...GROUPS[cat], { id: "other", name: "More", ids: [] as string[] }]
      .map((g) => ({ ...g, count: inCat.filter((l) => groupOf(l.product.id) === g.id).length }))
      .filter((g) => g.count > 0);
  }, [cat, list]);

  // Unsorted views keep sections (category, then group); a sort shows one flat, ordered grid.
  const sections =
    sort !== "recommended"
      ? [{ key: "sorted", title: SORTS.find((x) => x.id === sort)!.name, blurb: "", items: shown, more: null as CategoryId | null }]
      : cat === "all"
        ? CATS.map((c) => ({ key: c.id, title: c.name, blurb: c.blurb, items: shown.filter((l) => l.product.category === c.id), more: c.id as CategoryId | null }))
        : groupsOfCat
            .filter((g) => group === "all" || g.id === group)
            .map((g) => ({ key: g.id, title: g.name, blurb: "", items: shown.filter((l) => groupOf(l.product.id) === g.id), more: null as CategoryId | null }));

  const tabs = [
    { to: "/create", label: "All", count: all.length, on: !kind },
    { to: "/websites", label: "Websites", count: siteCount, on: kind === "websites" },
    { to: "/cards", label: "Cards & invites", count: all.length - siteCount, on: kind === "cards" },
  ];

  return (
    <ModernPage section={kind ?? null}>
      <PageSeo {...seoFor(copy.path, "")} />

      <main className="min-h-[75vh] py-12">
        <div className={cn(CONTAINER, "space-y-8")}>
          <PageHeader
            eyebrow={`${list.length} ready-made designs${from ? ` · from ${fmtCredits(from)}, paid once` : ""}`}
            title={copy.title}
            line={copy.line}
            asideClassName="md:w-auto"
            aside={
              <nav aria-label="Designs" className="inline-flex max-w-full rounded-xl border border-zinc-200 bg-zinc-100 p-1 text-xs font-semibold dark:border-zinc-800 dark:bg-zinc-900">
                {tabs.map((t) => (
                  <Link
                    key={t.to}
                    to={t.to}
                    aria-current={t.on ? "page" : undefined}
                    className={cn(
                      "whitespace-nowrap rounded-lg px-3 py-2 transition sm:px-4",
                      FOCUS_RING,
                      t.on ? "bg-white text-zinc-950 shadow-soft-sm dark:bg-zinc-800 dark:text-white" : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white",
                    )}
                  >
                    {t.label} <span className="hidden tabular-nums opacity-70 lg:inline">({t.count})</span>
                  </Link>
                ))}
              </nav>
            }
          />

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] lg:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={copy.search}
                aria-label="Search designs"
                className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-10 pr-4 text-base placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500 sm:text-sm dark:border-zinc-800 dark:bg-zinc-900"
              />
            </div>
            <ModernSteps flow={kind === "cards" ? "card" : "website"} step={1} />
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Kind of design">
              <button type="button" aria-pressed={cat === "all"} onClick={() => set({ cat: null, type: null })} className={pillClass(cat === "all")}>
                All designs <span className="tabular-nums opacity-70">({list.length})</span>
              </button>
              {CATS.map((c) => (
                <button key={c.id} type="button" aria-pressed={cat === c.id} onClick={() => set({ cat: c.id, type: null })} className={pillClass(cat === c.id)}>
                  {c.name} <span className="tabular-nums opacity-70">({list.filter((l) => l.product.category === c.id).length})</span>
                </button>
              ))}
            </div>
            {groupsOfCat.length > 1 && (
              <div className="flex flex-wrap gap-2" role="group" aria-label="Type">
                <button type="button" aria-pressed={group === "all"} onClick={() => set({ type: null })} className={subPillClass(group === "all")}>
                  All
                </button>
                {groupsOfCat.map((g) => (
                  <button key={g.id} type="button" aria-pressed={group === g.id} onClick={() => set({ type: group === g.id ? null : g.id })} className={subPillClass(group === g.id)}>
                    {g.name} <span className="tabular-nums opacity-70">{g.count}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {!filtered && featured.length > 0 && (
            <section aria-labelledby="pop-h">
              <SectionHead id="pop-h" eyebrow="Our picks" title="Most loved" className="mb-5" />
              <div className={GRID}>
                {featured.map((l) => (
                  <DesignCard key={l.product.id} d={liteOf(l.product.id)} />
                ))}
              </div>
            </section>
          )}

          {sections.map((sh) => {
            if (!sh.items.length) return null;
            const capped = cat === "all" && sort === "recommended" && sh.items.length > PER_CATEGORY;
            return (
              <section key={sh.key} className="pt-2" aria-labelledby={`shelf-${sh.key}`}>
                <div className="mb-5 flex items-end justify-between gap-4 border-b border-zinc-200 pb-3 dark:border-zinc-800">
                  <div className="min-w-0">
                    <h2 id={`shelf-${sh.key}`} className="font-display text-2xl font-bold tracking-tight md:text-3xl">
                      {sh.title}
                    </h2>
                    {sh.blurb && <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{sh.blurb}</p>}
                  </div>
                  {capped && sh.more ? (
                    <button
                      type="button"
                      onClick={() => set({ cat: sh.more, type: null })}
                      className={cn("inline-flex shrink-0 items-center gap-1 rounded text-xs font-semibold text-orange-700 underline-offset-4 hover:underline dark:text-orange-400", FOCUS_RING)}
                    >
                      See all {sh.items.length} <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  ) : (
                    <span className="shrink-0 text-xs tabular-nums text-zinc-500 dark:text-zinc-400">{sh.items.length}</span>
                  )}
                </div>
                <div className={GRID}>
                  {(capped ? sh.items.slice(0, PER_CATEGORY) : sh.items).map((l) => (
                    <DesignCard key={l.product.id} d={liteOf(l.product.id)} />
                  ))}
                </div>
              </section>
            );
          })}

          {!shown.length && (
            <EmptyState message={q.trim() ? `Nothing matches “${q}” with these filters.` : "Nothing matches these filters."} action="Clear filters" onAction={clear} />
          )}
        </div>
      </main>
    </ModernPage>
  );
}
