import { goalOf, type GoalId } from "@/data/goals";
import type { CatalogTool } from "@/hooks/useToolsCatalog";
import { cn } from "@/lib/utils";

/*
 * Shared class names for the EZ brand look (src/components/modern/).
 * Colours use brand tokens: cream bg, ink borders, block shadows, Unbounded/Hind fonts.
 */

/** Page width and side padding. */
export const CONTAINER = "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8";

export const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

/** Small label over a section title. */
export const EYEBROW = "text-xs font-bold uppercase tracking-widest text-ink/60";

export const BTN_BASE = cn("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border-2 border-ink font-bold shadow-block-sm transition", FOCUS_RING);
/** Primary action button: sun yellow fill. */
export const BTN_PRIMARY = cn(BTN_BASE, "bg-sun px-5 py-2.5 text-sm text-ink hover:opacity-90");
/** Ink button: solid ink fill, cream text. */
export const BTN_INK = cn(BTN_BASE, "bg-ink px-4 py-2 text-sm text-cream hover:opacity-90");
export const BTN_OUTLINE = cn(
  BTN_BASE,
  "border-2 border-ink bg-background px-4 py-2 text-sm text-ink hover:bg-sand",
);

/** Rounded filter pill: ink when on, cream/ink when off. */
export const pillClass = (on: boolean) =>
  cn(
    "inline-flex shrink-0 items-center gap-1.5 rounded-full border-2 border-ink px-3.5 py-1.5 text-xs font-semibold transition",
    FOCUS_RING,
    on
      ? "bg-ink text-cream"
      : "bg-background text-ink hover:bg-sand",
  );

/** Smaller outlined pill for a second row of filters (categories, types, groups). */
export const subPillClass = (on: boolean) =>
  cn(
    "inline-flex shrink-0 items-center gap-1.5 rounded-full border-2 px-3 py-1 text-xs font-medium transition",
    FOCUS_RING,
    on
      ? "border-ink bg-sun text-ink"
      : "border-ink/40 bg-background text-ink hover:border-ink hover:bg-sand",
  );

/** White card with thick ink border and block shadow. */
export const CARD = "rounded-2xl border-2 border-ink bg-card shadow-block";

/** One solid brand colour per business goal (from docs/design.md). */
export const GOAL_COLOR: Record<GoalId, string> = {
  customers: "bg-pink",
  business: "bg-sun",
  content: "bg-teal",
  helpers: "bg-sky",
  learn: "bg-lime",
  more: "bg-sand",
};

/** Used as a fallback gradient string — kept for compat but renders as solid brand colour. */
export const GOAL_GRADIENT: Record<GoalId, string> = {
  customers: "bg-pink",
  business: "bg-sun",
  content: "bg-teal",
  helpers: "bg-sky",
  learn: "bg-lime",
  more: "bg-sand",
};

/** Brand colours for the things that are not apps. */
export const KIND_GRADIENT = {
  website: "bg-teal",
  card: "bg-sun",
} as const;

/** Solid brand colour for an app or studio: its goal's colour. */
export const toolGradient = (tool: Pick<CatalogTool, "category">) => GOAL_COLOR[goalOf(tool.category).id];

/** "440+" style label for a count, like the app count. */
export const roundedLabel = (n: number) => (n >= 10 ? `${Math.floor(n / 10) * 10}+` : String(n));

export const creditsLabel = (n: number) => `${n.toLocaleString("en-IN")} credit${n === 1 ? "" : "s"}`;
