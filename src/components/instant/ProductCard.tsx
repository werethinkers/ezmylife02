import { Link } from "react-router-dom";
import type { Listed } from "@/instant/useProducts";
import { inr } from "@/instant/util";
import { WEBSITE_CATEGORIES } from "@/components/brand/nav";
import { cn } from "@/lib/utils";

/**
 * One ready-made design (a website or a card) with its own colours, the price paid once,
 * and two clear actions: see the design page, or start making it.
 */
export function ProductCard({ l, className }: { l: Listed; className?: string }) {
  const p = l.product;
  const t = p.themes[0];
  const isSite = (WEBSITE_CATEGORIES as readonly string[]).includes(p.category);
  return (
    <div className={cn("block-card block-lift group relative flex flex-col overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2", className)}>
      <Link to={`/make/${p.id}`} className="block outline-none" aria-label={`${p.name}: see the design`}>
        <div className="relative aspect-[4/3] overflow-hidden border-b-2 border-ink" style={{ background: t.c.bg, color: t.c.tx }}>
          {!isSite && (
            <div
              aria-hidden
              className="absolute inset-0 opacity-50"
              style={{
                backgroundImage: `radial-gradient(circle at 20% 30%, ${t.c.ac} 0 3px, transparent 4px), radial-gradient(circle at 70% 60%, ${t.c.ac2} 0 2.5px, transparent 3.5px), radial-gradient(circle at 40% 80%, ${t.c.ac3} 0 2px, transparent 3px)`,
                backgroundSize: "90px 90px, 110px 110px, 80px 80px",
              }}
            />
          )}
          {isSite && <div aria-hidden className="absolute inset-x-0 top-0 h-2" style={{ background: t.c.ac }} />}
          {(l.featured || p.popular) && (
            <span className="absolute left-2.5 top-2.5 rounded-full border-2 border-ink bg-sun px-2 py-0.5 text-[11px] font-bold text-ink">Popular</span>
          )}
          <span className="absolute right-3 top-3 text-5xl transition-transform group-hover:-rotate-6 group-hover:scale-110 md:text-6xl" aria-hidden>
            {p.glyph}
          </span>
          <div className="absolute inset-x-4 bottom-4">
            <p className="truncate text-[11px] font-semibold uppercase tracking-widest" style={{ color: t.c.ac2 }}>
              {p.seasonal ?? p.themes.map((x) => x.name).slice(0, 2).join(" · ")}
            </p>
            <p className="mt-1 line-clamp-2 text-lg font-bold leading-tight md:text-xl" style={{ fontFamily: t.f.d, color: t.c.tx }}>
              {p.name}
            </p>
          </div>
        </div>
        <p className="min-h-[3.25rem] px-3.5 pt-3 text-sm text-muted-foreground line-clamp-2">{p.tagline}</p>
      </Link>
      <div className="mt-auto flex items-center justify-between gap-2 px-3.5 pb-3.5 pt-2">
        <span className="text-[15px] font-bold">
          {l.price ? inr(l.price) : "Free"}
          <span className="ml-1 text-xs font-medium text-muted-foreground">{l.price ? "once" : ""}</span>
        </span>
        <Link
          to={`/create/${p.id}`}
          className="rounded-full border-2 border-ink bg-pink px-3 py-1 text-[13px] font-bold text-ink shadow-[2px_2px_0_0_hsl(var(--ink))] transition-transform hover:-translate-y-px"
        >
          {isSite ? "Build it" : "Make it"} →
        </Link>
      </div>
    </div>
  );
}
