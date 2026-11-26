import { useEffect } from "react";

/*
 * Pulls the two recommended Google Fonts and a sample tagline out of a result's Markdown (the
 * "Typography" and "Taglines" sections the flagship prompts ask for), and loads real Google Fonts
 * for a live preview — used by both the on-screen Visual Brand Board and the PDF, so they match.
 */

export interface BrandFonts {
  heading?: string;
  body?: string;
}

const FONT_NAME = /\b([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+){0,2})\b/;
// Words that match FONT_NAME's shape but are never an actual font name in this context.
const NOT_A_FONT = new Set(["Google Fonts", "Free Google", "Use For", "The Body", "For Headings", "For Body", "And Body"]);

function fontIn(line: string): string | undefined {
  const m = line.match(FONT_NAME);
  return m && !NOT_A_FONT.has(m[1]) ? m[1] : undefined;
}

/** The text of a "## <heading>" section (by a case-insensitive name match), or "" if not found. */
function sectionBody(markdown: string, heading: RegExp): string {
  const m = markdown.match(heading);
  if (!m || m.index === undefined) return "";
  const rest = markdown.slice(m.index + m[0].length);
  const end = rest.search(/\n#{1,6}\s/);
  return rest.slice(0, end === -1 ? rest.length : end);
}

/** "**Headings:** Playfair Display — elegant serif." / "Body: Inter" → `{ heading, body }`. */
export function extractFonts(markdown: string): BrandFonts {
  const section = sectionBody(markdown, /^#{1,6}\s*typography\b.*$/im);
  if (!section.trim()) return {};
  const lines = section
    .split("\n")
    .map((l) => l.replace(/^\s*[-*|]+\s*/, "").replace(/\*\*/g, "").trim())
    .filter(Boolean);
  const pick = (re: RegExp) => {
    for (const line of lines) {
      if (!re.test(line)) continue;
      const after = line.slice(line.search(re) + line.match(re)![0].length);
      return fontIn(after) ?? fontIn(line);
    }
    return undefined;
  };
  return { heading: pick(/headings?\b/i), body: pick(/\bbody\b/i) };
}

/** The first tagline listed, for a realistic font-preview sample line. */
export function extractTagline(markdown: string): string | undefined {
  const section = sectionBody(markdown, /^#{1,6}\s*taglines\b.*$/im);
  const first = section
    .split("\n")
    .map((l) => l.replace(/^\s*(?:[-*]|\d+[.)])\s*/, "").replace(/\*\*/g, "").replace(/^"(.*)"$/, "$1").trim())
    .find(Boolean);
  return first;
}

function family(name: string): string {
  return `family=${encodeURIComponent(name).replace(/%20/g, "+")}:wght@400;600;700`;
}

/** A Google Fonts stylesheet URL for the given families, or null when there's nothing to load. */
export function googleFontsHref(fonts: BrandFonts): string | null {
  const families = Array.from(new Set([fonts.heading, fonts.body].filter((f): f is string => !!f)));
  return families.length ? `https://fonts.googleapis.com/css2?${families.map(family).join("&")}&display=swap` : null;
}

const loaded = new Map<string, Promise<void>>();

/**
 * Adds a Google Fonts <link> for `href` (once per href, shared across every caller) and resolves
 * once it's loaded — or after a short timeout, so a slow or blocked font host never hangs a PDF.
 * A font that isn't really on Google Fonts just 404s quietly; callers always pair the family with
 * a safe CSS fallback, so that reads as the fallback font rather than breaking anything.
 */
export function loadGoogleFontLink(href: string): Promise<void> {
  const existing = loaded.get(href);
  if (existing) return existing;
  const p = new Promise<void>((resolve) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.onload = () => resolve();
    link.onerror = () => resolve();
    document.head.appendChild(link);
    setTimeout(resolve, 2500);
  });
  loaded.set(href, p);
  return p;
}

/** Loads the brand's two fonts for a live on-screen preview (PDF rendering loads them itself). */
export function useGoogleFonts(fonts: BrandFonts) {
  const href = googleFontsHref(fonts);
  useEffect(() => {
    if (href) void loadGoogleFontLink(href);
  }, [href]);
}
