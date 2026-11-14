/*
 * Bento Grid Product Hero with Live Metric Cards
 * Author: @themeocean   Source: https://21st.dev/@themeocean/components/bento-grid-product-hero-with-live-metric-cards   21st.dev id: 45654
 * Licence: covered by the paid 21st.dev plan Ezyourlife bought on 14 Nov 2026 (the API returns no
 * per-component licence text, so the author's own terms were not checked line by line).
 * Kept as published; only this header was added.
 */
// @ts-nocheck
/* eslint-disable */
// This is file of your component
// You can use any dependencies from npm; we import them automatically in package.json

import { useId, useMemo } from "react";
import type { MouseEvent, ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { Variants } from "framer-motion";

/* ==========================================================================
   Types
   ========================================================================== */

export interface HeroAction {
  label: string;
  /** Renders a link when given, a button otherwise. */
  href?: string;
  onClick?: () => void;
  /** Shown after the label. The primary button gets an arrow by default. */
  icon?: ReactNode;
}

export interface BentoItem {
  id: string;
  title: string;
  description: string;
  /** Small pill above the title. */
  badge?: string;
  /** 2 makes the card wide. On desktop a wide card is also two rows tall, unless you set rowSpan to 1. Default 1. */
  colSpan?: 1 | 2;
  /** Overrides how many rows the card covers on desktop. */
  rowSpan?: 1 | 2;
  /** The visual part of the card: a chart, a mock-up, an illustration, anything. */
  content: ReactNode;
}

export interface ComponentProps {
  /** The announcement pill at the top. */
  badge?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  primaryAction?: HeroAction;
  secondaryAction?: HeroAction;
  bentoItems: BentoItem[];
  /** id of the grid, so a link like href="#bento-grid" can scroll to it. */
  gridId?: string;
  className?: string;
}

// end of types


/* ==========================================================================
   Constants and helpers
   ========================================================================== */

// Written out in full so Tailwind can see every class
const COL_SPAN: Record<1 | 2, string> = {
  1: "",
  2: "md:col-span-2 lg:col-span-2",
};

const ROW_SPAN: Record<1 | 2, string> = {
  1: "",
  2: "lg:row-span-2",
};

// Join class names, skipping anything falsy
function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

// When the person prefers reduced motion, the "hidden" pose is the same as the final one, so nothing moves
function makeVariants(reduce: boolean) {
  const rise: Variants = {
    hidden: reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 26 },
    show: (index: number) => ({
      opacity: 1,
      y: 0,
      transition: { duration: reduce ? 0 : 0.7, delay: reduce ? 0 : 0.1 + index * 0.1, ease: [0.22, 1, 0.36, 1] },
    }),
  };

  const card: Variants = {
    hidden: reduce ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 36, scale: 0.97 },
    show: (index: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: reduce ? 0 : 0.75, delay: reduce ? 0 : index * 0.12, ease: [0.22, 1, 0.36, 1] },
    }),
  };

  return { rise, card };
}

const ArrowIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

// end of constants and helpers


/* ==========================================================================
   ActionButton
   ========================================================================== */

function ActionButton({ action, variant }: { action: HeroAction; variant: "primary" | "secondary" }) {
  const classes = cn(
    "group inline-flex h-12 items-center justify-center gap-2 rounded-xl px-6 text-sm font-medium outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98]",
    variant === "primary"
      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:-translate-y-0.5 hover:opacity-90"
      : "border border-border bg-background/60 text-foreground backdrop-blur hover:-translate-y-0.5 hover:bg-muted"
  );

  const icon = action.icon ?? (variant === "primary" ? <ArrowIcon /> : null);
  const content = (
    <>
      {action.label}
      {icon && <span className="transition-transform duration-200 group-hover:translate-x-0.5">{icon}</span>}
    </>
  );

  if (action.href) {
    return (
      <a href={action.href} onClick={action.onClick} className={classes}>
        {content}
      </a>
    );
  }

  return (
    <button type="button" onClick={action.onClick} className={classes}>
      {content}
    </button>
  );
}

// end of ActionButton


/* ==========================================================================
   BentoCard
   ========================================================================== */

function BentoCard({ item, index, variants }: { item: BentoItem; index: number; variants: Variants }) {
  const titleId = useId();
  const colSpan = item.colSpan ?? 1;
  const rowSpan = item.rowSpan ?? (colSpan === 2 ? 2 : 1);
  const featured = colSpan === 2;

  // A soft light follows the mouse over the card. It moves through CSS variables, so nothing re-renders.
  const handleMouseMove = (e: MouseEvent<HTMLLIElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - rect.top}px`);
  };

  return (
    <motion.li
      aria-labelledby={titleId}
      variants={variants}
      custom={index}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      onMouseMove={handleMouseMove}
      className={cn(
        "group relative flex min-w-0 flex-col overflow-hidden rounded-3xl border border-border bg-card p-6 text-card-foreground transition-[border-color,box-shadow] duration-300 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 sm:p-8",
        COL_SPAN[colSpan],
        ROW_SPAN[rowSpan]
      )}
    >
      {/* Light that follows the mouse, and a faint wash of color from the corner */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: "radial-gradient(420px circle at var(--mx, 50%) var(--my, 0%), hsl(var(--primary) / 0.08), transparent 65%)" }}
      />
      <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/15 to-transparent" />

      <div className="relative">
        {item.badge && (
          <span className="mb-4 inline-flex items-center rounded-full border border-border bg-muted/60 px-2.5 py-1 text-xs font-medium text-muted-foreground">
            {item.badge}
          </span>
        )}
        <h3 id={titleId} className={cn("font-semibold tracking-tight text-foreground", featured ? "text-2xl sm:text-3xl" : "text-xl")}>
          {item.title}
        </h3>
        <p className={cn("mt-2 leading-relaxed text-muted-foreground", featured ? "max-w-xl text-base" : "text-sm")}>{item.description}</p>
      </div>

      <div className="relative mt-6 flex min-h-[160px] flex-1 flex-col">{item.content}</div>
    </motion.li>
  );
}

// end of BentoCard


/* ==========================================================================
   Component
   ========================================================================== */

export function Component({
  badge,
  title,
  subtitle,
  primaryAction,
  secondaryAction,
  bentoItems,
  gridId = "bento-grid",
  className,
}: ComponentProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const { rise, card } = useMemo(() => makeVariants(reduceMotion), [reduceMotion]);
  const headingId = useId();

  return (
    <section
      aria-labelledby={headingId}
      className={cn("relative isolate w-full overflow-hidden bg-background px-4 py-16 text-foreground sm:px-6 sm:py-24 lg:px-8", className)}
    >
      {/* Background: a pool of light at the top and a faint grid that fades away */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-x-0 top-0 h-[34rem]" style={{ background: "radial-gradient(ellipse 60% 100% at 50% 0%, hsl(var(--primary) / 0.12), transparent 70%)" }} />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "linear-gradient(hsl(var(--foreground) / 0.05) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground) / 0.05) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(ellipse 70% 50% at 50% 15%, black 20%, transparent 80%)",
            WebkitMaskImage: "radial-gradient(ellipse 70% 50% at 50% 15%, black 20%, transparent 80%)",
          }}
        />
      </div>

      <div className="mx-auto max-w-6xl">
        {/* Top: badge, headline, subheadline and buttons */}
        <motion.div initial="hidden" animate="show" className="mx-auto flex max-w-3xl flex-col items-center text-center">
          {badge && (
            <motion.div variants={rise} custom={0}>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3.5 py-1.5 text-sm text-muted-foreground shadow-sm backdrop-blur">
                <span aria-hidden="true" className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60 motion-reduce:animate-none" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
                {badge}
              </span>
            </motion.div>
          )}

          <motion.h1
            id={headingId}
            variants={rise}
            custom={1}
            className="mt-6 bg-gradient-to-b from-foreground to-foreground/65 bg-clip-text text-4xl font-bold leading-[1.05] tracking-tight text-transparent sm:text-5xl lg:text-7xl"
          >
            {title}
          </motion.h1>

          {subtitle && (
            <motion.p variants={rise} custom={2} className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {subtitle}
            </motion.p>
          )}

          {(primaryAction || secondaryAction) && (
            <motion.div variants={rise} custom={3} className="mt-9 flex w-full flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row sm:items-center">
              {primaryAction && <ActionButton action={primaryAction} variant="primary" />}
              {secondaryAction && <ActionButton action={secondaryAction} variant="secondary" />}
            </motion.div>
          )}
        </motion.div>

        {/* Bottom: the bento grid. One big card with two smaller ones stacked beside it on desktop. */}
        <ul
          id={gridId}
          role="list"
          className="mt-16 grid scroll-mt-24 grid-cols-1 gap-4 sm:mt-20 md:grid-cols-2 lg:auto-rows-[minmax(240px,auto)] lg:grid-cols-3 lg:gap-6"
        >
          {bentoItems.map((item, index) => (
            <BentoCard key={item.id} item={item} index={index} variants={card} />
          ))}
        </ul>
      </div>
    </section>
  );
}

export default Component;

// end of Component
