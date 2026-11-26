/*
 * The refined neo-brutalist input look's class names, split out of ./studioUi so a foundational,
 * widely-imported module like shell/Fields.tsx can use them without pulling in studioUi's catalog
 * and tool-media dependencies (those are heavier, browser-only hooks that a plain form control
 * has no business depending on — and that broke the node-based app-definition checker when it did).
 */

// Keeps a heading in Unbounded even inside the `.ez-modern` wrapper (used for dark-mode tokens),
// which otherwise switches --font-display to Space Grotesk.
export const UNBOUNDED = { fontFamily: "'Unbounded', 'Hind', system-ui, sans-serif" } as const;

export const CONTROL =
  "rounded-xl border border-black/10 bg-[#F3F4F6] focus:bg-white focus:border-[#111111] focus:ring-2 focus:ring-[#F472D0]/30 dark:border-white/15 dark:bg-[#1F1F24] dark:text-white dark:focus:bg-[#1F1F24] dark:focus:border-white";
export const LABEL = "text-sm font-semibold text-[#111111] dark:text-white";
export const HINT = "text-xs text-black/45 dark:text-white/40";
