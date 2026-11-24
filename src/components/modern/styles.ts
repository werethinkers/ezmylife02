import { goalOf, type GoalId } from "@/data/goals";
import type { CatalogTool } from "@/hooks/useToolsCatalog";
import { cn } from "@/lib/utils";

/*
 * Shared class names for the modern look (src/components/modern/). Neo-brutalist brand palette:
 * warm cream page, white cards, thick #111111 (ink/foreground) borders with hard offset shadows,
 * #F472D0 (pink/primary) CTAs, #FACC15 (yellow/accent, sun) highlights, #C8E967 (lime/accent-lime)
 * badges — all text on pink/yellow/lime is #111111 (foreground), never white. These are the same
 * `orange`/`amber` Tailwind classes as before (now remapped onto the pink/yellow scales in
 * tailwind.config.ts) plus the shadcn tokens (primary/foreground/card/background), so this file and
 * every page that was already using them picked up the rebrand together. `zinc` is untouched — still
 * the neutral gray used for muted text/structure. `rose`/`emerald`/`green` stay semantic (favourites,
 * success) and are not part of the brand palette.
 */

/** Page width and side padding, as in the prototype. */
export const CONTAINER = "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8";

export const FOCUS_RING = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background";

/** Small eyebrow label over a section title — lime badge per the brand's pill/tag treatment. */
export const EYEBROW =
  "inline-flex items-center rounded-full border-[1.5px] border-foreground bg-accent-lime px-2.5 py-0.5 text-xs font-bold uppercase tracking-widest text-foreground";

export const BTN_BASE = cn("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-bold transition", FOCUS_RING);
/** Pink primary action button — #111111 text and border, never white text on the pink. */
export const BTN_PRIMARY = cn(BTN_BASE, "border-2 border-foreground bg-primary px-5 py-2.5 text-sm text-primary-foreground shadow-block-sm hover:bg-pink-hover");
/** Ink button: near-black on the light page, white on the dark page. */
export const BTN_INK = cn(BTN_BASE, "border-2 border-foreground bg-foreground px-4 py-2 text-sm text-background hover:opacity-90");
export const BTN_OUTLINE = cn(BTN_BASE, "border-2 border-foreground bg-card px-4 py-2 text-sm text-foreground hover:bg-background");

/** Rounded filter pill: ink when on, card surface when off. */
export const pillClass = (on: boolean) =>
  cn(
    "inline-flex shrink-0 whitespace-nowrap items-center gap-1.5 rounded-full border-[1.5px] border-foreground px-3.5 py-1.5 text-xs font-semibold transition",
    FOCUS_RING,
    on ? "bg-foreground text-background" : "bg-card text-foreground hover:bg-background",
  );

/** Smaller outlined pill for a second row of filters (categories, types, groups) — lime when on. */
export const subPillClass = (on: boolean) =>
  cn(
    "inline-flex shrink-0 whitespace-nowrap items-center gap-1.5 rounded-full border-[1.5px] border-foreground px-3 py-1 text-xs font-medium transition",
    FOCUS_RING,
    on ? "bg-accent-lime text-foreground" : "bg-card text-foreground hover:bg-background",
  );

/** White (or dark) card with a thick ink border. */
export const CARD = "rounded-3xl border-[1.5px] border-foreground bg-card";

/** One gradient per business goal (same order as the brand colours in docs/design.md). */
export const GOAL_GRADIENT: Record<GoalId, string> = {
  customers: "from-fuchsia-500 to-rose-600",
  business: "from-amber-500 to-orange-600",
  content: "from-emerald-500 to-green-600",
  helpers: "from-blue-500 to-indigo-600",
  learn: "from-violet-500 to-purple-600",
  more: "from-zinc-500 to-zinc-700",
};

/** Gradients for the things that are not apps. */
export const KIND_GRADIENT = {
  website: "from-violet-500 to-indigo-600",
  card: "from-rose-500 to-fuchsia-600",
} as const;

/** Badge and no-picture gradient for an app or studio: its goal's colour (studios span several goals). */
export const toolGradient = (tool: Pick<CatalogTool, "category">) => GOAL_GRADIENT[goalOf(tool.category).id];

/** "440+" style label for a count, like the app count. */
export const roundedLabel = (n: number) => (n >= 10 ? `${Math.floor(n / 10) * 10}+` : String(n));

export const creditsLabel = (n: number) => `${n.toLocaleString("en-IN")} credit${n === 1 ? "" : "s"}`;
