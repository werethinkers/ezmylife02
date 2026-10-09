import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Flame, Search, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { PageSeo } from "@/components/seo/PageSeo";
import { Input } from "@/components/ui/input";
import { CATEGORIES } from "@/instant/catalog";
import { GROUPS, groupOf } from "@/instant/catalog/groups";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProducts, type Listed } from "@/instant/useProducts";
import { inr } from "@/instant/util";
import type { CategoryId } from "@/instant/types";
import { cn } from "@/lib/utils";
import { CARD_CATEGORIES, WEBSITE_CATEGORIES } from "@/components/brand/nav";

type Sort = "recommended" | "price-asc" | "price-desc" | "name";
const PRICES = [
  { id: "all", name: "Any price", test: () => true },
  { id: "u50", name: "Under ₹50", test: (n: number) => n < 50 },
  { id: "50-199", name: "₹50 – ₹199", test: (n: number) => n >= 50 && n < 200 },
  { id: "200", name: "₹200 and up", test: (n: number) => n >= 200 },
] as const;
const SORTS: { id: Sort; name: string }[] = [
  { id: "recommended", name: "Recommended" }, { id: "price-asc", name: "Price: low to high" },
  { id: "price-desc", name: "Price: high to low" }, { id: "name", name: "Name (A–Z)" },
];

const chip = (on: boolean) => cn("shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors", on ? "bg-foreground text-background border-foreground" : "bg-background hover:bg-muted");

export default function CreateGallery({ kind }: { kind?: "websites" | "cards" }) {
  const { list: all } = useProducts();
  const allowed = kind === "websites" ? WEBSITE_CATEGORIES : kind === "cards" ? CARD_CATEGORIES : null;
  const list = allowed ? all.filter((l) => (allowed as readonly string[]).includes(l.product.category)) : all;
  const CATS = allowed ? CATEGORIES.filter((c) => (allowed as readonly string[]).includes(c.id)) : CATEGORIES;
  const [params, setParams] = useSearchParams();
  const cat = (params.get("cat") as CategoryId | null) ?? "all";
  const group = params.get("type") ?? "all";
  const price = params.get("price") ?? "all";
  const sort = (params.get("sort") as Sort | null) ?? "recommended";
  const popular = params.get("popular") === "1";
  const [q, setQ] = useState("");
  const set = (patch: Record<string, string | null>) => setParams((p) => {
    const n = new URLSearchParams(p);
    Object.entries(patch).forEach(([k, v]) => (v == null || v === "all" || v === "" || (k === "sort" && v === "recommended") ? n.delete(k) : n.set(k, v)));
    return n;
  }, { replace: true });

  const groups = cat === "all" ? [] : GROUPS[cat];
  const priceTest = (PRICES.find((x) => x.id === price) ?? PRICES[0]).test;
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    const out = list.filter(({ product: p, price: n, featured }) =>
      (cat === "all" || p.category === cat) && (group === "all" || groupOf(p.id) === group) && priceTest(n)
      && (!popular || featured || p.popular) && (!s || `${p.name} ${p.tagline} ${p.category} ${p.seasonal ?? ""}`.toLowerCase().includes(s)));
    if (sort === "price-asc") out.sort((a, b) => a.price - b.price || a.sort - b.sort);
    else if (sort === "price-desc") out.sort((a, b) => b.price - a.price || a.sort - b.sort);
    else if (sort === "name") out.sort((a, b) => a.product.name.localeCompare(b.product.name));
    return out;
  }, [list, cat, group, priceTest, popular, sort, q]);
  const featured = list.filter((l) => l.featured).slice(0, 8);
  const filtered = cat !== "all" || group !== "all" || price !== "all" || popular || sort !== "recommended" || !!q.trim();
  const clear = () => { setQ(""); setParams(new URLSearchParams(), { replace: true }); };

  // Unsorted views keep the shelves (category, then type); a sort shows one flat, ordered grid.
  const shelves = sort !== "recommended" ? [{ key: "sorted", title: SORTS.find((x) => x.id === sort)!.name, blurb: "", items: shown }]
    : cat === "all" ? CATS.map((c) => ({ key: c.id, title: c.name, blurb: c.blurb, items: shown.filter((l) => l.product.category === c.id) }))
    : GROUPS[cat].filter((g) => group === "all" || g.id === group).map((g) => ({ key: g.id, title: g.name, blurb: "", items: shown.filter((l) => groupOf(l.product.id) === g.id) }));

  return (
    <div className="min-h-screen bg-background">
      <PageSeo title="Create instantly: birthday surprises, invitations, business websites and QR menus | EZYOURLIFE"
        description="Pick a beautifully designed digital product, add your details, preview it live and publish in minutes. Birthday surprises from ₹29, business websites, QR menus, wedding invitations and more."
        path="/create" />
      <Navbar />
      <header className="container mx-auto px-4 pt-10 pb-6 md:pt-16">
        <p className="inline-flex items-center gap-2 rounded-full border bg-primary/5 px-3 py-1 text-sm font-medium text-primary"><Sparkles className="h-4 w-4" /> {list.length} ready-made digital products</p>
        <h1 className="mt-4 font-display text-4xl md:text-6xl font-bold tracking-tight max-w-3xl text-balance">Pick it. Personalise it. Share it in minutes.</h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl">Birthday surprises, festival greetings, wedding invitations, gym and salon websites, QR menus and visiting cards. Each one designed for its job, live on its own link, with WhatsApp built in.</p>
        <div className="relative mt-6 max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Try “birthday”, “gym”, “menu”, “wedding”" className="h-14 pl-12 rounded-2xl text-base" aria-label="Search products" />
        </div>
      </header>

      {!filtered && featured.length > 0 && (
        <section className="container mx-auto px-4 pb-4" aria-labelledby="pop-h">
          <h2 id="pop-h" className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">Most loved</h2>
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x">
            {featured.map((l) => <div key={l.product.id} className="snap-start shrink-0 w-[260px]"><Card l={l} /></div>)}
          </div>
        </section>
      )}

      <nav className="sticky top-16 z-30 bg-background/95 backdrop-blur border-y" aria-label="Filters">
        <div className="container mx-auto px-4 flex gap-2 overflow-x-auto py-3" role="group" aria-label="Category">
          {[{ id: "all" as const, name: "All" }, ...CATS].map((c) => (
            <button key={c.id} type="button" onClick={() => set({ cat: c.id, type: null })} aria-pressed={cat === c.id} className={chip(cat === c.id)}>{c.name}</button>
          ))}
        </div>
        {groups.length > 0 && (
          <div className="container mx-auto px-4 flex gap-2 overflow-x-auto pb-3 -mt-1" role="group" aria-label="Type">
            {[{ id: "all", name: "All types" }, ...groups].map((g) => (
              <button key={g.id} type="button" onClick={() => set({ type: g.id })} aria-pressed={group === g.id}
                className={cn("shrink-0 rounded-full px-3 py-1.5 text-[13px] font-medium", group === g.id ? "bg-primary text-primary-foreground" : "bg-muted text-foreground/80 hover:bg-muted/70")}>{g.name}</button>
            ))}
          </div>
        )}
        <div className="border-t">
          <div className="container mx-auto px-4 flex items-center gap-2 py-2 overflow-x-auto">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
            <Select value={price} onValueChange={(v) => set({ price: v })}>
              <SelectTrigger className="h-9 w-auto min-w-[130px] rounded-full text-sm shrink-0" aria-label="Price"><SelectValue /></SelectTrigger>
              <SelectContent>{PRICES.map((x) => <SelectItem key={x.id} value={x.id}>{x.name}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={sort} onValueChange={(v) => set({ sort: v })}>
              <SelectTrigger className="h-9 w-auto min-w-[150px] rounded-full text-sm shrink-0" aria-label="Sort"><SelectValue /></SelectTrigger>
              <SelectContent>{SORTS.map((x) => <SelectItem key={x.id} value={x.id}>{x.name}</SelectItem>)}</SelectContent>
            </Select>
            <button type="button" onClick={() => set({ popular: popular ? null : "1" })} aria-pressed={popular}
              className={cn("shrink-0 h-9 rounded-full border px-3 text-sm font-medium inline-flex items-center gap-1.5", popular ? "bg-amber-100 border-amber-300 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100" : "bg-background hover:bg-muted")}>
              <Flame className="h-4 w-4" /> Popular
            </button>
            <span className="ml-auto shrink-0 text-sm text-muted-foreground tabular-nums">{shown.length} {shown.length === 1 ? "result" : "results"}</span>
            {filtered && <button type="button" onClick={clear} className="shrink-0 text-sm font-medium text-primary inline-flex items-center gap-1"><X className="h-4 w-4" /> Clear</button>}
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8 pb-28">
        {shelves.map((sh) => {
          if (!sh.items.length) return null;
          return (
            <section key={sh.key} className="mb-12" aria-labelledby={`shelf-${sh.key}`}>
              <div className="flex items-baseline justify-between gap-4 mb-4">
                <div>
                  <h2 id={`shelf-${sh.key}`} className="font-display text-2xl md:text-3xl font-bold">{sh.title}</h2>
                  {sh.blurb && <p className="text-muted-foreground">{sh.blurb}</p>}
                </div>
                <span className="text-sm text-muted-foreground tabular-nums shrink-0">{sh.items.length}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                {sh.items.map((l) => <Card key={l.product.id} l={l} />)}
              </div>
            </section>
          );
        })}
        {!shown.length && (
          <div className="text-center py-16 grid gap-3 justify-items-center">
            <p className="text-muted-foreground">{q.trim() ? `Nothing matches “${q}” with these filters.` : "Nothing matches these filters."}</p>
            <button type="button" onClick={clear} className="text-primary font-medium">Clear filters</button>
          </div>
        )}
      </main>
    </div>
  );
}

function Card({ l }: { l: Listed }) {
  const p = l.product, t = p.themes[0];
  return (
    <div className="group relative rounded-3xl border bg-card overflow-hidden hover:shadow-xl transition-shadow focus-within:ring-2 focus-within:ring-primary">
      <Link to={`/create/${p.id}`} className="block outline-none" aria-label={`Create ${p.name}`}>
        <div className="relative aspect-[4/3] overflow-hidden" style={{ background: `linear-gradient(140deg, ${t.c.sf}, ${t.c.bg})`, color: t.c.tx }}>
          {["celebration", "festival", "event"].includes(p.family) && (
            <div className="absolute inset-0 opacity-50" style={{ backgroundImage: `radial-gradient(circle at 20% 30%, ${t.c.ac} 0 3px, transparent 4px), radial-gradient(circle at 70% 60%, ${t.c.ac2} 0 2.5px, transparent 3.5px), radial-gradient(circle at 40% 80%, ${t.c.ac3} 0 2px, transparent 3px)`, backgroundSize: "90px 90px, 110px 110px, 80px 80px" }} />
          )}
          {["business", "menu", "profile"].includes(p.family) && <div className="absolute left-0 right-0 top-0 h-1.5" style={{ background: t.c.ac }} />}
          {(l.featured || p.popular) && <span className="absolute left-3 top-3 rounded-full bg-black/55 text-white text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5">Popular</span>}
          <span className="absolute right-3 top-3 text-5xl md:text-6xl transition-transform group-hover:scale-110 group-hover:-rotate-6" aria-hidden="true">{p.glyph}</span>
          <div className="absolute left-4 right-4 bottom-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest truncate" style={{ color: t.c.ac2 }}>{p.seasonal ?? p.themes.map((x) => x.name).slice(0, 2).join(" · ")}</p>
            <p className="mt-1 text-lg md:text-2xl font-bold leading-tight line-clamp-2" style={{ fontFamily: t.f.d, color: t.c.tx }}>{p.name}</p>
          </div>
        </div>
        <p className="px-4 pt-3 text-sm text-muted-foreground line-clamp-2 min-h-[3.25rem]">{p.tagline}</p>
      </Link>
      <div className="px-4 pb-4 pt-2 flex items-center justify-between gap-2">
        <span className="font-semibold">{l.price ? inr(l.price) : "Free"}</span>
        <span className="flex items-center gap-3 text-sm">
          <Link to={`/make/${p.id}`} className="text-muted-foreground hover:text-foreground underline-offset-4 hover:underline">Details</Link>
          <Link to={`/create/${p.id}`} className="font-medium text-primary" tabIndex={-1} aria-hidden="true">Create →</Link>
        </span>
      </div>
    </div>
  );
}
