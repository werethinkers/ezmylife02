import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { FOCUS_RING } from "./styles";

/**
 * The modern catalogue card: a picture fills the card, a number and a chip sit on top, and a dark
 * fade at the bottom carries the price, the name and one white button.
 *
 * It works one of three ways:
 * - `onOpen`: the whole card is one button (apps open Quick Look);
 * - `to`: the whole card is one link;
 * - `to` and `actionTo`: the card links to `to`, and the white button is its own link to `actionTo`
 *   (designs: the card shows the design, the button starts making it);
 * - neither: a still card (something coming soon), with the button text shown as a quiet label.
 */
export function ShowcaseCard({
  media,
  title,
  price,
  chip,
  rank,
  gradient,
  action,
  onOpen,
  to,
  actionTo,
  label,
  size = "md",
  className,
}: {
  media: ReactNode;
  title: string;
  price?: ReactNode;
  chip?: string;
  rank?: number;
  /** Gradient classes for the number badge, e.g. "from-amber-500 to-orange-600". */
  gradient?: string;
  action: string;
  onOpen?: () => void;
  to?: string;
  actionTo?: string;
  /** Accessible name of the card. */
  label: string;
  size?: "md" | "lg";
  className?: string;
}) {
  const split = !!to && !!actionTo;
  const still = !onOpen && !to;
  const actionClass = still
    ? "shrink-0 rounded-xl bg-white/15 px-3 py-1.5 text-xs font-bold text-white"
    : "shrink-0 rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-zinc-950 transition";
  const box = cn(
    !still && "ez-lift",
    "group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 text-left shadow-soft-sm dark:border-zinc-800 dark:bg-zinc-900",
    size === "lg" ? "min-h-[260px]" : "min-h-[240px]",
    className,
  );

  const content = (
    <>
      {/* The rows have no z-index on purpose: they paint over the picture in source order, and the
          card link (z-20) and its button (z-30) stay in one stacking context so the button stays clickable. */}
      <div className="pointer-events-none absolute inset-0">{media}</div>
      <div className="relative flex items-center justify-between gap-2 p-3">
        {rank != null ? (
          <span className={cn("inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br font-display text-xs font-bold text-white shadow-soft", gradient)}>
            #{rank}
          </span>
        ) : (
          <span />
        )}
        {chip && <span className="truncate rounded-full bg-zinc-950/75 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">{chip}</span>}
      </div>
      <div className="relative flex items-end justify-between gap-2 bg-gradient-to-t from-zinc-950 via-zinc-950/90 via-40% to-transparent p-3.5 pt-14 text-white">
        <div className="min-w-0">
          {price && <span className="block text-[10px] font-bold text-amber-300">{price}</span>}
          <h3 className={cn("line-clamp-2 font-display font-bold leading-snug", size === "lg" ? "text-base" : "text-sm")}>{title}</h3>
        </div>
        {split ? (
          <Link to={actionTo!} className={cn(actionClass, "relative z-30 hover:bg-primary hover:text-primary-foreground", FOCUS_RING)}>
            {action}
          </Link>
        ) : (
          <span aria-hidden={!still} className={cn(actionClass, !still && "group-hover:bg-primary group-hover:text-primary-foreground")}>
            {action}
          </span>
        )}
      </div>
    </>
  );

  if (onOpen) {
    return (
      <div
        role="button"
        tabIndex={0}
        aria-label={label}
        onClick={onOpen}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen();
          }
        }}
        className={cn(box, "cursor-pointer", FOCUS_RING)}
      >
        {content}
      </div>
    );
  }
  if (split) {
    return (
      <div className={box}>
        <Link to={to!} aria-label={label} className={cn("absolute inset-0 z-20 rounded-2xl", FOCUS_RING)} />
        {content}
      </div>
    );
  }
  if (still) {
    return (
      <article aria-label={label} className={box}>
        {content}
      </article>
    );
  }
  return (
    <Link to={to!} aria-label={label} className={cn(box, FOCUS_RING)}>
      {content}
    </Link>
  );
}
