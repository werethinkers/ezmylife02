import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Flame, Search, SlidersHorizontal, X } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import SEOFooter from "@/components/SEOFooter";
import { PageSeo } from "@/components/seo/PageSeo";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CATEGORIES } from "@/instant/catalog";
import { GROUPS, groupOf } from "@/instant/catalog/groups";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProducts } from "@/instant/useProducts";
import type { CategoryId } from "@/instant/types";
import { cn } from "@/lib/utils";
import { CARD_CATEGORIES, WEBSITE_CATEGORIES } from "@/components/brand/nav";
import { FlowSteps } from "@/components/brand/FlowSteps";
import { ProductCard } from "@/components/instant/ProductCard";
import { seoFor } from "@/lib/seo/pages";

type Sort = "recommended" | "price-asc" | "price-desc" | "name";
const PRICES = [
  { id: "all", name: "Any price", test: () => true },
  { id: "u50", name: "Under ₹50", test: (n: number) => n < 50 },
  { id: "50-199", name: "₹50 – ₹199", test: (n: number) => n >= 50 && n < 200 },
  { id: "200", name: "₹200 and up", test: (n: number) => n >= 200 },
] as const;
const SORTS: { id: Sort; name: string }[] = [
  { id: "recommended", name: "Recommended" },
  { id: "price-asc", name: "Price: low to high" },
  { id: "price-desc", name: "Price: high to low" },
  { id: "name", name: "Name (A–Z)" },
];

const COPY = {
  websites: {
    title: "Make a website",
    line: "A website stays online. You get one link to put on WhatsApp, Google and your shop board, with call and WhatsApp buttons built in.",
    search: "Try “gym”, “salon”, “menu”, “visiting card”",
    color: "hsl(var(--teal))",
    path: "/websites",
  },
  cards: {
    title: "Send a card or invite",
    line: "A card is made for one moment. Add names, a photo and your message, pay once, and send the link on WhatsApp.",
    search: "Try “birthday”, “wedding”, “diwali”, “anniversary”",
    color: "hsl(var(--sun))",
    path: "/cards",
  },
  all: {
    title: "Websites, cards and invites",
    line: "Ready-made designs for your business and your celebrations. Add your details, see it live, pay once and share one link.",
    search: "Try “birthday”, “gym”, “menu”, “wedding”",
    color: "hsl(var(--pink))",
    path: "/create",
  },
} as const;

/** Gallery of ready-made designs: /websites, /cards, or both at /create. */
export default function CreateGallery({ kind }: { kind?: "websites" | "cards" }) {
  const { list: all } = useProducts();
  const allowed = kind === "websites" ? WEBSITE_CATEGORIES : kind === "cards" ? CARD_CATEGORIES : null;
  const list = allowed ? all.filter((l) => (allowed as readonly string[]).includes(l.product.category)) : all;
  const CATS = allowed ? CATEGORIES.filter((c) => (allowed as readonly string[]).includes(c.id)) : CATEGORIES;
  const copy = COPY[kind ?? "all"];

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

  const groups = cat === "all" ? [] : GROUPS[cat];
  const priceTest = (PRICES.find((x) => x.id === price) ?? PRICES[0]).test;
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    const out = list.filter(
      ({ product: p, price: n, featured }) =>
        (cat === "all" || p.category === cat) &&
        (group === "all" || groupOf(p.id) === group) &&
        priceTest(n) &&
        (!popular || featured || p.popular) &&
        (!s || `${p.name} ${p.tagline} ${p.category} ${p.seasonal ?? ""}`.toLowerCase().includes(s)),
    );
    if (sort === "price-asc") out.sort((a, b) => a.price - b.price || a.sort - b.sort);
    else if (sort === "price-desc") out.sort((a, b) => b.price - a.price || a.sort - b.sort);
    else if (sort === "name") out.sort((a, b) => a.product.name.localeCompare(b.product.name));
    return out;
  }, [list, cat, group, priceTest, popular, sort, q]);
  const featured = list.filter((l) => l.featured).slice(0, 8);
  const filtered = cat !== "all" || group !== "all" || price !== "all" || popular || sort !== "recommended" || !!q.trim();
  const clear = () => {
    setQ("");
    setParams(new URLSearchParams(), { replace: true });
  };
  const prices = list.map((l) => l.price).filter((n) => n > 0);
  const from = prices.length ? Math.min(...prices) : null;

  // Unsorted views keep the shelves (category, then type); a sort shows one flat, ordered grid.
  const shelves =
    sort !== "recommended"
      ? [{ key: "sorted", title: SORTS.find((x) => x.id === sort)!.name, blurb: "", items: shown }]
      : cat === "all"
        ? CATS.map((c) => ({ key: c.id, title: c.name, blurb: c.blurb, items: shown.filter((l) => l.product.category === c.id) }))
        : GROUPS[cat]
            .filter((g) => group === "all" || g.id === group)
            .map((g) => ({ key: g.id, title: g.name, blurb: "", items: shown.filter((l) => groupOf(l.product.id) === g.id) }));

  const chip = (on: boolean) =>
    cn("shrink-0 rounded-full border-2 border-ink px-4 py-1.5 text-[15px] font-semibold transition-colors", on ? "bg-ink text-cream" : "bg-card hover:bg-sun");

  return (
    <div className="min-h-screen bg-background">
      <PageSeo {...seoFor(copy.path, "")} />
      <Navbar section={kind ?? null} />

      <header className="mx-auto max-w-7xl px-4 pt-6 md:pt-10">
        <div className="rounded-3xl border-2 border-ink p-5 shadow-block-lg md:p-8" style={{ background: copy.color }}>
          <span className="inline-flex rounded-full border-2 border-ink bg-card px-2.5 py-0.5 text-xs font-bold">
            {list.length} designs{from ? ` · from ₹${from}, paid once` : ""}
          </span>
          <h1 className="mt-3 text-3xl font-extrabold md:text-5xl">{copy.title}</h1>
          <p className="mt-2 max-w-2xl text-lg text-ink/85">{copy.line}</p>
          <div className="relative mt-6 max-w-xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={copy.search} className="h-[52px] rounded-2xl pl-12 text-base" aria-label="Search designs" />
          </div>
          <FlowSteps flow={kind === "cards" ? "card" : "website"} step={1} className="mt-6 max-w-3xl" />
        </div>
        {!kind && (
          <p className="mt-4 text-[15px]">
            Looking for one kind?{" "}
            <Link to="/websites" className="font-bold underline decoration-2 underline-offset-4">Websites</Link> stay online.{" "}
            <Link to="/cards" className="font-bold underline decoration-2 underline-offset-4">Cards and invites</Link> are sent once.
          </p>
        )}
      </header>

      {!filtered && featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-10" aria-labelledby="pop-h">
          <h2 id="pop-h" className="mb-4 text-2xl font-bold">Most loved</h2>
          <div className="-mx-4 flex snap-x gap-5 overflow-x-auto px-4 pb-4 pt-1 no-scrollbar">
            {featured.map((l) => (
              <ProductCard key={l.product.id} l={l} className="w-[260px] shrink-0 snap-start" />
            ))}
          </div>
        </section>
      )}

      <nav className="sticky top-16 z-30 mt-6 border-y-2 border-ink bg-background/95 backdrop-blur" aria-label="Filters">
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3 no-scrollbar" role="group" aria-label="Category">
          {[{ id: "all" as const, name: "All" }, ...CATS].map((c) => (
            <button key={c.id} type="button" onClick={() => set({ cat: c.id, type: null })} aria-pressed={cat === c.id} className={chip(cat === c.id)}>
              {c.name}
            </button>
          ))}
        </div>
        {groups.length > 0 && (
          <div className="mx-auto -mt-1 flex max-w-7xl gap-2 overflow-x-auto px-4 pb-3 no-scrollbar" role="group" aria-label="Type">
            {[{ id: "all", name: "All types" }, ...groups].map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => set({ type: g.id })}
                aria-pressed={group === g.id}
                className={cn("shrink-0 rounded-full border-2 px-3 py-1 text-[13px] font-semibold", group === g.id ? "border-ink bg-sun" : "border-ink/30 bg-card hover:border-ink")}
              >
                {g.name}
              </button>
            ))}
          </div>
        )}
        <div className="border-t-2 border-ink/10">
          <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 py-2 no-scrollbar">
            <SlidersHorizontal className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <Select value={price} onValueChange={(v) => set({ price: v })}>
              <SelectTrigger className="h-9 w-auto min-w-[130px] shrink-0 rounded-full text-sm" aria-label="Price">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRICES.map((x) => (
                  <SelectItem key={x.id} value={x.id}>
                    {x.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={(v) => set({ sort: v })}>
              <SelectTrigger className="h-9 w-auto min-w-[150px] shrink-0 rounded-full text-sm" aria-label="Sort">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORTS.map((x) => (
                  <SelectItem key={x.id} value={x.id}>
                    {x.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button
              type="button"
              onClick={() => set({ popular: popular ? null : "1" })}
              aria-pressed={popular}
              className={cn("inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border-2 border-ink px-3 text-sm font-semibold", popular ? "bg-sun" : "bg-card hover:bg-sand")}
            >
              <Flame className="h-4 w-4" /> Popular
            </button>
            <span className="ml-auto shrink-0 text-sm tabular-nums text-muted-foreground">
              {shown.length} {shown.length === 1 ? "design" : "designs"}
            </span>
            {filtered && (
              <Button type="button" variant="ghost" size="sm" onClick={clear} className="shrink-0">
                <X className="h-4 w-4" /> Clear
              </Button>
            )}
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-10 pb-16">
        {shelves.map((sh) => {
          if (!sh.items.length) return null;
          return (
            <section key={sh.key} className="mb-14" aria-labelledby={`shelf-${sh.key}`}>
              <div className="mb-5 flex items-baseline justify-between gap-4 border-b-2 border-ink pb-3">
                <div>
                  <h2 id={`shelf-${sh.key}`} className="text-2xl font-bold md:text-3xl">
                    {sh.title}
                  </h2>
                  {sh.blurb && <p className="mt-1 text-[15px] text-muted-foreground">{sh.blurb}</p>}
                </div>
                <span className="shrink-0 text-sm tabular-nums text-muted-foreground">{sh.items.length}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
                {sh.items.map((l) => (
                  <ProductCard key={l.product.id} l={l} />
                ))}
              </div>
            </section>
          );
        })}
        {!shown.length && (
          <div className="grid justify-items-center gap-3 rounded-2xl border-2 border-dashed border-ink/60 bg-sand/60 py-16 text-center">
            <p className="font-semibold">{q.trim() ? `Nothing matches “${q}” with these filters.` : "Nothing matches these filters."}</p>
            <Button type="button" variant="outline" onClick={clear}>
              Clear filters
            </Button>
          </div>
        )}
      </main>
      <SEOFooter />
    </div>
  );
}
