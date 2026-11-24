import { useState } from "react";
import { cn } from "@/lib/utils";
import type { DesignLite } from "./designLite";
import { ShowcaseCard } from "./ShowcaseCard";
import { KIND_GRADIENT, creditsLabel } from "./styles";

/**
 * What fills a design card: the phone picture of the real design, or, without one, the top of the
 * page drawn from the design's own colours, fonts and sample title.
 */
export function DesignMedia({ d, className }: { d: DesignLite; className?: string }) {
  const [failed, setFailed] = useState(false);
  const t = d.theme;
  return (
    <div className={cn("relative h-full w-full", className)}>
      {t ? (
        <div className="flex h-full w-full flex-col text-left" style={{ background: t.bg, color: t.tx, fontFamily: t.body }}>
          <div className="flex items-center gap-1.5 px-3 pb-2 pt-12" style={{ borderBottom: `1px solid ${t.line}` }}>
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] text-[8px] font-bold" style={{ background: t.tx, color: t.bg }}>
              {d.sampleTitle[0]}
            </span>
            <span className="truncate text-[9px] font-bold">{d.sampleTitle}</span>
          </div>
          <div className="flex flex-col gap-1.5 px-3 pt-3">
            <span className="line-clamp-2 text-lg font-extrabold leading-[1.05]" style={{ fontFamily: t.display }}>
              {d.sampleTitle}
            </span>
            {d.tagline && (
              <span className="line-clamp-2 text-[9px] leading-snug" style={{ color: t.mu }}>
                {d.tagline}
              </span>
            )}
            <span className="mt-1 self-start rounded-md px-2 py-1 text-[9px] font-bold" style={{ background: t.ac, color: t.on }}>
              {d.site ? "WhatsApp us" : "Open the card"}
            </span>
          </div>
        </div>
      ) : (
        <div className={cn("h-full w-full bg-gradient-to-br", d.site ? KIND_GRADIENT.website : KIND_GRADIENT.card)} />
      )}
      {d.image && !failed && (
        <img src={d.image} alt={`${d.name}: what the design looks like`} loading="lazy" onError={() => setFailed(true)} className="absolute inset-0 h-full w-full object-cover object-top" />
      )}
    </div>
  );
}

/** A ready-made website or card design. The card shows the design (/make/…); the button starts making it (/create/…). */
export function DesignCard({ d, rank, chip, size = "lg", className }: { d: DesignLite; rank?: number; chip?: string; size?: "md" | "lg"; className?: string }) {
  return (
    <ShowcaseCard
      media={<DesignMedia d={d} />}
      title={d.name}
      price={d.credits ? `${creditsLabel(d.credits)}, paid once` : "Free"}
      chip={chip ?? (d.seasonal ? `${d.categoryName} · ${d.seasonal}` : d.categoryName)}
      rank={rank}
      gradient={d.site ? KIND_GRADIENT.website : KIND_GRADIENT.card}
      action={d.site ? "Build it" : "Make it"}
      to={`/make/${d.id}`}
      actionTo={`/make/${d.id}`}
      label={`${d.name}: see the design`}
      size={size}
      className={className}
    />
  );
}
