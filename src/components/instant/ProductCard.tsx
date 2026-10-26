import { Link } from "react-router-dom";
import { creditsForInr } from "@/lib/creditRate";
import type { Listed } from "@/instant/useProducts";
import { inr } from "@/instant/util";
import { WEBSITE_CATEGORIES } from "@/components/brand/nav";
import { CATEGORIES } from "@/instant/catalog";
import { designPreviewUrl } from "@/data/previewManifest";
import { cn } from "@/lib/utils";
import { DESIGN_COLOUR } from "@/data/designColours";

/**
 * One ready-made design (a website or a card) in the Setapp style: glyph and name, what it is,
 * the price paid once and one clear action, with a phone picture of the real design peeking
 * up from the bottom edge. A design with no picture yet shows its own colours there instead.
 */
export function ProductCard({ l, className }: { l: Listed; className?: string }) {
  const p = l.product;
  const t = p.themes[0];
  const isSite = (WEBSITE_CATEGORIES as readonly string[]).includes(p.category);
  const shot = designPreviewUrl(p.id);
  const colour = DESIGN_COLOUR[p.category] ?? "hsl(var(--sun))";
  const catName = CATEGORIES.find((c) => c.id === p.category)?.name ?? "";
  return (
    <div
      className={cn(
        "block-card block-lift group relative flex w-[78%] shrink-0 snap-start flex-col overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 sm:w-[46%] lg:w-[31%] xl:w-[23.5%]",
        className,
      )}
      style={{ background: `color-mix(in srgb, ${colour} 38%, hsl(var(--card)))` }}
    >
      <Link to={`/make/${p.id}`} className="flex flex-1 flex-col outline-none" aria-label={`${p.name}: see the design`}>
        <div className="flex items-center gap-3.5 px-5 pt-5">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 border-ink bg-card text-3xl" aria-hidden>
            {p.glyph}
          </span>
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-lg font-bold leading-tight">{p.name}</p>
            <p className="mt-0.5 truncate text-[13px] font-medium text-ink/70">
              {catName}
              {p.seasonal ? ` · ${p.seasonal}` : ""}
            </p>
          </div>
        </div>
        <p className="line-clamp-3 min-h-[4.2rem] px-5 pt-3.5 text-[15px] leading-snug text-ink/85">{p.tagline}</p>
      </Link>
      <div className="flex items-center gap-2.5 px-5 pb-5 pt-3.5">
        <Link
          to={`/create/${p.id}`}
          className="inline-flex h-9 items-center rounded-xl border-2 border-ink bg-card/60 px-4 text-sm font-bold transition-colors hover:bg-pink"
        >
          {isSite ? "Build it" : "Make it"} →
        </Link>
        <span className="text-[15px] font-bold">
          {l.price ? inr(l.price) : "Free"}
          <span className="ml-1 text-xs font-medium text-ink/70">{l.price ? `once · ${creditsForInr(l.price).toLocaleString("en-IN")} cr` : ""}</span>
        </span>
      </div>
      <Link to={`/make/${p.id}`} tabIndex={-1} aria-hidden className="mt-auto block">
        <div className="relative mx-auto aspect-[420/520] w-[58%] overflow-hidden rounded-t-3xl border-2 border-b-0 border-ink bg-card transition-transform duration-200 group-hover:-translate-y-2">
          {shot ? (
            <img src={shot} alt="" loading="lazy" className="h-full w-full object-cover object-top" />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center" style={{ background: t.c.bg, color: t.c.tx }}>
              <span className="text-5xl">{p.glyph}</span>
              <span className="line-clamp-3 text-lg font-bold leading-tight" style={{ fontFamily: t.f.d }}>
                {p.name}
              </span>
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}
