/*
 * Search title and description for an app page (/tool/<id>).
 * Used by the page itself and by the build step that writes one HTML page per app
 * (scripts/prerender-apps.mjs), so a search engine sees the same words either way.
 */

export const cut = (s: string, max: number) => {
  if (s.length <= max) return s;
  const t = s.slice(0, max - 1);
  return t.slice(0, Math.max(t.lastIndexOf(" "), max - 25)).replace(/[\s,;:—–-]+$/, "") + "…";
};

export const sentence = (s: string) => {
  const t = s.trim();
  return /[.!?…]$/.test(t) ? t : t + ".";
};

export const appSeoTitle = (name: string, description: string) =>
  `${cut(description ? `${name}: ${description}` : name, 58)} | EZYOURLIFE`;

/** About 160 characters: leads with the app, adds the rest only while it fits. */
export function appSeoDescription(name: string, intro: string, give: string, get: string) {
  let out = cut(intro ? `${name} — ${sentence(intro)}` : name, 160);
  for (const extra of [`You give ${give}; you get ${get}.`, "Pay only for results.", "100 free credits to start."]) {
    if (out.length + 1 + extra.length <= 160) out += " " + extra;
  }
  return out;
}

export const appSeoKeywords = (name: string, category: string, toolTypes: string[] = []) =>
  [name, `${name} online`, category, ...toolTypes, "EZYOURLIFE"].filter(Boolean).join(", ");
