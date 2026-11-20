import { goalOf, type GoalId } from "@/data/goals";
import type { CatalogTool } from "@/hooks/useToolsCatalog";
import { cn } from "@/lib/utils";

/*
 * Shared class names for the modern look (src/components/modern/). Colours come from Tailwind's own
 * zinc / orange / amber scales. Note: `pink`, `teal`, `sky` and `lime` are the brand's single block
 * colours in tailwind.config.ts, so their numbered shades (pink-500…) do not exist; use rose,
 * emerald, blue and green instead.
 */

/** Page width and side padding, as in the prototype. */
export const CONTAINER = "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8";

export const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F7F6F2] dark:focus-visible:ring-offset-[#0F1115]";

/** Small orange heading over a section title. Orange-700 on the light page keeps small text readable. */
export const EYEBROW = "text-xs font-bold uppercase tracking-widest text-orange-700 dark:text-orange-400";

export const BTN_BASE = cn("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-bold transition", FOCUS_RING);
/** Orange action button. */
export const BTN_PRIMARY = cn(BTN_BASE, "bg-orange-600 px-5 py-2.5 text-sm text-white hover:bg-orange-700");
/** Ink button: near-black on the light page, white on the dark page. */
export const BTN_INK = cn(BTN_BASE, "bg-zinc-950 px-4 py-2 text-sm text-white hover:opacity-90 dark:bg-white dark:text-zinc-950");
export const BTN_OUTLINE = cn(
  BTN_BASE,
  "border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-900 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800",
);

/** Rounded filter pill: ink when on, soft zinc when off. */
export const pillClass = (on: boolean) =>
  cn(
    "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
    FOCUS_RING,
    on
      ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950"
      : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800",
  );

/** Smaller outlined pill for a second row of filters (categories, types, groups). */
export const subPillClass = (on: boolean) =>
  cn(
    "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition",
    FOCUS_RING,
    on
      ? "border-orange-500 bg-orange-50 text-orange-800 dark:border-orange-700 dark:bg-orange-950/50 dark:text-orange-300"
      : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600",
  );

/** White (or dark) card with a hairline border. */
export const CARD = "rounded-3xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900";

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
