/*
 * "Use in another app": carries a result from one app into the next one the user opens
 * (e.g. a supplier list → Supplier Order, an OCR result → AI Data Analysis).
 */

/** A brand's visual identity, carried alongside the result text when it's a real brand kit — so a
 *  destination tool (e.g. Packaging Design Studio) can pre-fill its own brand/colour fields and
 *  logo photo slot directly, instead of only getting a blob of text to paste from. */
export interface BrandContext {
  name: string;
  tagline?: string;
  /** Hex codes, each paired with its swatch name, e.g. "#B5541A (Deep Terracotta)". */
  colors: string[];
  fonts?: { heading?: string; body?: string };
  logoUrl?: string;
}

export interface Handoff {
  from: string;
  fromName: string;
  to: string;
  text: string;
  at: number;
  brand?: BrandContext;
}

const KEY = "ez.handoff";

export function sendHandoff(h: Omit<Handoff, "at">) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ ...h, at: Date.now() }));
  } catch {
    /* ignore */
  }
}

/** Returns (and clears) a handoff addressed to this app, if one is waiting (valid 10 minutes). */
export function takeHandoff(toolId: string): Handoff | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const h = JSON.parse(raw) as Handoff;
    if (h.to !== toolId || Date.now() - h.at > 10 * 60 * 1000) return null;
    sessionStorage.removeItem(KEY);
    return h;
  } catch {
    return null;
  }
}
