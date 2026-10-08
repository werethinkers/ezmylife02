/*
 * "Use in another app": carries a result from one app into the next one the user opens
 * (e.g. a supplier list → Supplier Order, an OCR result → AI Data Analysis).
 */

export interface Handoff {
  from: string;
  fromName: string;
  to: string;
  text: string;
  at: number;
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
