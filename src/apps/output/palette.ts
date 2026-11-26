import type { PdfBlock } from "./types";

/*
 * Pulls a "name / hex / use" colour table — the shape the brand-identity-kit prompt asks the AI
 * for — out of a result's PDF blocks, so the PDF can show real colour chips and use the brand's
 * own colour as its accent, instead of the app's generic template colour.
 */

export interface PaletteSwatch {
  name: string;
  hex: string;
  use?: string;
}

const HEX = /#([0-9a-f]{6}|[0-9a-f]{3})\b/i;

/** "Deep Indigo — #1E1B4B" → "#1e1b4b"; expands 3-digit hex. Null when the cell has no hex code. */
function normalizeHex(cell: string): string | null {
  const m = cell.match(HEX);
  if (!m) return null;
  const hex = m[1].toLowerCase();
  return `#${hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex}`;
}

/**
 * Replaces the first table that looks like a colour palette (most cells in one column are hex
 * codes) with a `swatches` block. Returns the swatches too, so the caller can pick one as the
 * document's accent colour. A no-op (same blocks, empty palette) when no such table is found.
 */
export function extractPalette(blocks: PdfBlock[]): { blocks: PdfBlock[]; palette: PaletteSwatch[] } {
  let palette: PaletteSwatch[] = [];
  const out = blocks.map((b): PdfBlock => {
    if (palette.length || b.t !== "table" || !b.rows.length) return b;
    const cols = Math.max(b.head.length, ...b.rows.map((r) => r.length));
    let hexCol = -1;
    for (let i = 0; i < cols; i++) {
      const hits = b.rows.filter((r) => normalizeHex(r[i] ?? "")).length;
      if (hits >= Math.max(2, Math.ceil(b.rows.length * 0.6))) {
        hexCol = i;
        break;
      }
    }
    if (hexCol === -1) return b;
    const items = b.rows
      .map((r): PaletteSwatch | null => {
        const hex = normalizeHex(r[hexCol] ?? "");
        const name = (r[0] ?? "").replace(/\*\*/g, "").trim();
        const last = r.length - 1;
        const use = last !== hexCol && last !== 0 ? r[last]?.replace(/\*\*/g, "").trim() : undefined;
        return hex && name ? { name, hex, use: use || undefined } : null;
      })
      .filter((x): x is PaletteSwatch => !!x);
    if (items.length < 2) return b;
    palette = items;
    return { t: "swatches", items };
  });
  return { blocks: out, palette };
}

/** The palette's primary colour (one tagged "primary", else the first), for the PDF accent. */
export function pickAccent(palette: PaletteSwatch[]): string | undefined {
  if (!palette.length) return undefined;
  const primary = palette.find((p) => /primary/i.test(p.name) || /primary/i.test(p.use ?? ""));
  return (primary ?? palette[0]).hex;
}

export const BRAND_ROLES = ["Primary", "Secondary", "Accent", "Background"] as const;
export type BrandRole = (typeof BRAND_ROLES)[number];

function roleOf(s: PaletteSwatch): BrandRole | undefined {
  const hay = `${s.name} ${s.use ?? ""}`.toLowerCase();
  if (hay.includes("primary")) return "Primary";
  if (hay.includes("secondary")) return "Secondary";
  if (hay.includes("accent")) return "Accent";
  if (hay.includes("background") || hay.includes("neutral") || hay.includes("base")) return "Background";
  return undefined;
}

/**
 * Up to 4 swatches, one per role (Primary/Secondary/Accent/Background), preferring the AI's own
 * "use" wording for each and falling back to palette order for whichever roles it didn't label.
 * The same assignment the Visual Brand Board, the brand mock-ups and the PDF all build from, so a
 * colour reads as the same role everywhere it shows up.
 */
export function roledSwatches(palette: PaletteSwatch[]): { role: BrandRole; swatch: PaletteSwatch }[] {
  const byRole = new Map<BrandRole, PaletteSwatch>();
  for (const s of palette) {
    const role = roleOf(s);
    if (role && !byRole.has(role)) byRole.set(role, s);
  }
  const leftover = palette.filter((s) => !Array.from(byRole.values()).includes(s));
  const out: { role: BrandRole; swatch: PaletteSwatch }[] = [];
  for (const role of BRAND_ROLES) {
    const swatch = byRole.get(role) ?? leftover.shift();
    if (swatch) out.push({ role, swatch });
  }
  return out;
}

function relativeLuminance(hex: string): number {
  const n = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255);
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** Readable text colour (near-black or white) for text sitting on a `background` of this hex. */
export function contrastText(hex: string): "#121212" | "#ffffff" {
  try {
    return relativeLuminance(hex) > 0.42 ? "#121212" : "#ffffff";
  } catch {
    return "#121212";
  }
}
