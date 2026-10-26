import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import SEOFooter from "@/components/SEOFooter";
import { PageSeo } from "@/components/seo/PageSeo";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CATEGORIES } from "@/instant/catalog";
import { GROUPS, groupOf } from "@/instant/catalog/groups";
import { useProducts } from "@/instant/useProducts";
import type { CategoryId } from "@/instant/types";
import { cn } from "@/lib/utils";
import { inr } from "@/instant/util";
import { CARD_CATEGORIES, WEBSITE_CATEGORIES } from "@/components/brand/nav";
import { FlowSteps } from "@/components/brand/FlowSteps";
import { ProductCard } from "@/components/instant/ProductCard";
import { Shelf } from "@/components/store/Shelf";
import { HeroCarousel, type HeroSlide } from "@/components/store/HeroCarousel";
import { DESIGN_COLOUR } from "@/data/designColours";
import { designPreviewUrl } from "@/data/previewManifest";
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
  // Big carousel: popular designs that have a phone picture, with two neighbours from the same kind beside each.
  const spotlight: HeroSlide[] = useMemo(() => {
    const withShot = list.filter((l) => designPreviewUrl(l.product.id));
    const lead = [...withShot.filter((l) => l.featured || l.product.popular), ...withShot].filter((l, i, a) => a.indexOf(l) === i).slice(0, 6);
    return lead.map((l) => {
      const sib = withShot.filter((x) => x.product.category === l.product.category);
      const i = Math.max(0, sib.indexOf(l));
      const pick = (k: number) => designPreviewUrl(sib[(i + k + sib.length) % sib.length].product.id)!;
      const site = (WEBSITE_CATEGORIES as readonly string[]).includes(l.product.category);
      return {
        key: l.product.id,
        eyebrow: CATEGORIES.find((c) => c.id === l.product.category)?.name ?? "",
        title: l.product.name,
        line: l.product.tagline,
        color: DESIGN_COLOUR[l.product.category] ?? "hsl(var(--sun))",
        phones: [pick(-1), pick(0), pick(1)],
        to: `/make/${l.product.id}`,
        cta: site ? "See the design" : "See the design",
        price: l.price ? `${inr(l.price)}, paid once` : "Free",
      };
    });
  }, [list]);
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

  return (
    <div className="min-h-screen bg-background">
      <PageSeo {...seoFor(copy.path, "")} />
      <Navbar section={kind ?? null} />

      {!filtered && spotlight.length >= 3 && (
        <div className="mx-auto max-w-7xl overflow-hidden px-4 pt-6 md:pt-8">
          <HeroCarousel slides={spotlight} label="Designs to start with" />
        </div>
      )}

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
          <Shelf>
            {featured.map((l) => (
              <ProductCard key={l.product.id} l={l} />
            ))}
          </Shelf>
        </section>
      )}

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
              <Shelf>
                {sh.items.map((l) => (
                  <ProductCard key={l.product.id} l={l} />
                ))}
              </Shelf>
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
