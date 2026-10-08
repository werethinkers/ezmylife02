import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Sparkles } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { PageSeo } from "@/components/seo/PageSeo";
import { Input } from "@/components/ui/input";
import { CATEGORIES } from "@/instant/catalog";
import { useProducts, type Listed } from "@/instant/useProducts";
import { inr } from "@/instant/util";
import type { CategoryId } from "@/instant/types";
import { cn } from "@/lib/utils";

export default function CreateGallery() {
  const { list } = useProducts();
  const [cat, setCat] = useState<CategoryId | "all">("all");
  const [q, setQ] = useState("");
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return list.filter(({ product: p }) => (cat === "all" || p.category === cat) && (!s || `${p.name} ${p.tagline} ${p.category}`.toLowerCase().includes(s)));
  }, [list, cat, q]);
  const featured = list.filter((l) => l.featured).slice(0, 8);

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

      {!q && cat === "all" && featured.length > 0 && (
        <section className="container mx-auto px-4 pb-4" aria-labelledby="pop-h">
          <h2 id="pop-h" className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">Most loved</h2>
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x">
            {featured.map((l) => <div key={l.product.id} className="snap-start shrink-0 w-[260px]"><Card l={l} /></div>)}
          </div>
        </section>
      )}

      <nav className="sticky top-16 z-30 bg-background/90 backdrop-blur border-y" aria-label="Categories">
        <div className="container mx-auto px-4 flex gap-2 overflow-x-auto py-3">
          {[{ id: "all" as const, name: "All" }, ...CATEGORIES].map((c) => (
            <button key={c.id} type="button" onClick={() => setCat(c.id)} aria-pressed={cat === c.id}
              className={cn("shrink-0 rounded-full border px-4 py-2 text-sm font-medium", cat === c.id ? "bg-foreground text-background border-foreground" : "bg-background hover:bg-muted")}>{c.name}</button>
          ))}
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8 pb-28">
        {CATEGORIES.filter((c) => cat === "all" || c.id === cat).map((c) => {
          const items = shown.filter((l) => l.product.category === c.id);
          if (!items.length) return null;
          return (
            <section key={c.id} className="mb-12" aria-labelledby={`cat-${c.id}`}>
              <div className="flex items-baseline justify-between gap-4 mb-4">
                <div>
                  <h2 id={`cat-${c.id}`} className="font-display text-2xl md:text-3xl font-bold">{c.name}</h2>
                  <p className="text-muted-foreground">{c.blurb}</p>
                </div>
                <span className="text-sm text-muted-foreground tabular-nums shrink-0">{items.length}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {items.map((l) => <Card key={l.product.id} l={l} />)}
              </div>
            </section>
          );
        })}
        {!shown.length && <p className="text-center text-muted-foreground py-16">Nothing matches “{q}”. Try another word, or browse all products.</p>}
      </main>
    </div>
  );
}

function Card({ l }: { l: Listed }) {
  const p = l.product, t = p.themes[0];
  return (
    <Link to={`/create/${p.id}`} className="group block rounded-3xl border bg-card overflow-hidden hover:shadow-xl transition-shadow focus-visible:ring-2 focus-visible:ring-primary outline-none">
      <div className="relative aspect-[4/3] overflow-hidden" style={{ background: `linear-gradient(140deg, ${t.c.sf}, ${t.c.bg})`, color: t.c.tx }}>
        {["celebration", "festival", "event"].includes(p.family) && (
          <div className="absolute inset-0 opacity-50" style={{ backgroundImage: `radial-gradient(circle at 20% 30%, ${t.c.ac} 0 3px, transparent 4px), radial-gradient(circle at 70% 60%, ${t.c.ac2} 0 2.5px, transparent 3.5px), radial-gradient(circle at 40% 80%, ${t.c.ac3} 0 2px, transparent 3px)`, backgroundSize: "90px 90px, 110px 110px, 80px 80px" }} />
        )}
        {["business", "menu", "profile"].includes(p.family) && <div className="absolute left-0 right-0 top-0 h-1.5" style={{ background: t.c.ac }} />}
        <span className="absolute right-3 top-3 text-5xl md:text-6xl transition-transform group-hover:scale-110 group-hover:-rotate-6" aria-hidden="true">{p.glyph}</span>
        <div className="absolute left-4 right-4 bottom-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: t.c.ac2 }}>{p.seasonal ?? p.themes.map((x) => x.name).slice(0, 2).join(" · ")}</p>
          <p className="mt-1 text-xl md:text-2xl font-bold leading-tight" style={{ fontFamily: t.f.d, color: t.c.tx }}>{p.name}</p>
        </div>
      </div>
      <div className="p-4 grid gap-2">
        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">{p.tagline}</p>
        <div className="flex items-center justify-between">
          <span className="font-semibold">{l.price ? inr(l.price) : "Free"}</span>
          <span className="text-sm font-medium text-primary">Create →</span>
        </div>
      </div>
    </Link>
  );
}
