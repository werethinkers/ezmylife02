import { Link } from "react-router-dom";
import { fmtCredits } from "@/lib/creditRate";
import type { Listed } from "@/instant/useProducts";
import { WEBSITE_CATEGORIES } from "@/components/brand/nav";
import { CATEGORIES } from "@/instant/catalog";
import { designPreviewUrl } from "@/data/previewManifest";
import { cn } from "@/lib/utils";
import { DESIGN_COLOUR } from "@/data/designColours";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { GiveGetStrip } from "@/components/store/GiveGetStrip";

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
  const sampleTitle = String(p.sample?.[p.titleField] ?? p.name);
  const colour = DESIGN_COLOUR[p.category] ?? "hsl(var(--sun))";
  const catName = CATEGORIES.find((c) => c.id === p.category)?.name ?? "";
  return (
    <SpotlightCard
      className={cn(
        "block-card block-lift group relative flex w-[78%] shrink-0 snap-start flex-col overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 sm:w-[46%] lg:w-[31%] xl:w-[23.5%]",
        className,
      )}
      style={{ background: `color-mix(in srgb, ${colour} 38%, hsl(var(--card)))` }}
    >
      <Link to={`/make/${p.id}`} tabIndex={-1} aria-hidden className="block">
        <div className="flex aspect-[4/3] items-end justify-center overflow-hidden border-b-2 border-ink px-5 pt-4" style={{ background: `color-mix(in srgb, ${colour} 62%, hsl(var(--card)))` }}>
          <div className="relative aspect-[420/520] w-[52%] overflow-hidden rounded-t-3xl border-2 border-b-0 border-ink bg-card transition-transform duration-200 group-hover:-translate-y-1.5">
            {shot ? (
              <img src={shot} alt="" loading="lazy" className="h-full w-full object-cover object-top" />
            ) : (
              // No picture yet: draw the top of the page from the design's own sample, colours and fonts.
              <div className="flex h-full flex-col text-left" style={{ background: t.c.bg, color: t.c.tx, fontFamily: t.f.b }}>
                <div className="flex items-center gap-1.5 px-2.5 py-2" style={{ borderBottom: `1px solid ${t.c.line}` }}>
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] text-[8px] font-bold" style={{ background: t.c.tx, color: t.c.bg }}>{sampleTitle[0]}</span>
                  <span className="truncate text-[8px] font-bold">{sampleTitle}</span>
                </div>
                <div className="flex flex-1 flex-col gap-1.5 px-2.5 pt-3">
                  {p.opts?.heroVerb && <span className="text-[8px] font-semibold" style={{ color: t.c.mu }}>{p.opts.heroVerb}</span>}
                  <span className="line-clamp-3 text-[17px] font-extrabold leading-[1.02]" style={{ fontFamily: t.f.d }}>{sampleTitle}</span>
                  {p.sample?.tagline && <span className="line-clamp-2 text-[8px] leading-snug" style={{ color: t.c.mu }}>{String(p.sample.tagline)}</span>}
                  <span className="mt-1 rounded-md px-1.5 py-1.5 text-center text-[8px] font-bold" style={{ background: t.c.ac, color: t.c.on }}>{String(p.sample?.offer ?? p.name)}</span>
                  <span className="rounded-md px-1.5 py-1.5 text-center text-[8px] font-bold" style={{ background: "#25D366", color: "#0b2e17" }}>WhatsApp us</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </Link>
      <Link to={`/make/${p.id}`} className="flex flex-1 flex-col gap-2.5 px-4 pt-3.5 outline-none" aria-label={`${p.name}: see the design`}>
        <div className="flex items-center gap-2">
          <span className="rounded-full border-2 border-ink bg-card px-2.5 py-0.5 text-xs font-bold">{isSite ? "Website" : "Card"}</span>
          <span className="truncate text-[12.5px] font-medium text-ink/70">
            {catName}
            {p.seasonal ? ` · ${p.seasonal}` : ""}
          </span>
        </div>
        <p className="line-clamp-2 text-[17px] font-bold leading-tight">{p.name}</p>
        <p className="line-clamp-2 min-h-[2.6rem] text-[14.5px] leading-snug text-ink/85">{p.tagline}</p>
        <GiveGetStrip give={isSite ? "your items, photos and timings" : "names, a date and a message"} get={isSite ? "a website with one link" : "a card with one link"} />
      </Link>
      <div className="flex items-center gap-2.5 px-4 pb-4 pt-3">
        <Link
          to={`/make/${p.id}`}
          className="inline-flex h-9 items-center rounded-xl border-2 border-ink bg-card/60 px-4 text-sm font-bold transition-colors hover:bg-pink"
        >
          {isSite ? "Build it" : "Make it"} →
        </Link>
        <span className="text-[15px] font-bold">
          {l.credits ? fmtCredits(l.credits) : "Free"}
          <span className="ml-1 text-xs font-medium text-ink/70">{l.credits ? "once" : ""}</span>
        </span>
      </div>
    </SpotlightCard>
  );
}
