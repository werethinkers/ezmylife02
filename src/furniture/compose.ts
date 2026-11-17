// Builds the final sheet in the browser. The AI picture (when there is one) is the drawing board; the
// parts list, materials, notes and title block are drawn here as exact text, so they always match what
// the person edited, in any style, for free.
import type { Item, Mat, Part, SheetStyle } from "./lib";

interface Palette { bg: string; panel: string; ink: string; line: string; accent: string; muted: string; head: string; font: string }

const PALETTES: Record<SheetStyle, Palette> = {
  light: { bg: "#ffffff", panel: "#ffffff", ink: "#16181d", line: "#2a2d33", accent: "#1f4fd8", muted: "#5b6068", head: "#16181d", font: "Helvetica, Arial, sans-serif" },
  blueprint: { bg: "#0b1a33", panel: "#0b1a33", ink: "#e8f1ff", line: "#9fd8ff", accent: "#ffd34d", muted: "#8fb3d9", head: "#ffd34d", font: "Helvetica, Arial, sans-serif" },
  mono: { bg: "#ffffff", panel: "#ffffff", ink: "#000000", line: "#000000", accent: "#000000", muted: "#444444", head: "#000000", font: "Helvetica, Arial, sans-serif" },
  vintage: { bg: "#f1e6cc", panel: "#f1e6cc", ink: "#3b2a1a", line: "#5a4128", accent: "#8a3b12", muted: "#7a6347", head: "#5a4128", font: "Georgia, 'Times New Roman', serif" },
};

const W = 3000;
const H = 2121; // A-series ratio

const load = (src: string) => new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error("image")); i.src = src; });

function wrap(ctx: CanvasRenderingContext2D, text: string, max: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const t = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(t).width > max && cur) { lines.push(cur); cur = w; } else cur = t;
  }
  if (cur) lines.push(cur);
  return lines;
}

/** Draws text clipped to one line with an ellipsis. */
function fit(ctx: CanvasRenderingContext2D, text: string, max: number): string {
  if (ctx.measureText(text).width <= max) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > max) t = t.slice(0, -1);
  return `${t}…`;
}

function box(ctx: CanvasRenderingContext2D, p: Palette, x: number, y: number, w: number, h: number, title?: string) {
  ctx.strokeStyle = p.line; ctx.lineWidth = 3; ctx.strokeRect(x, y, w, h);
  if (title) { ctx.fillStyle = p.head; ctx.font = `bold 34px ${p.font}`; ctx.textBaseline = "top"; ctx.fillText(title, x + 22, y + 18); }
}

const hexOk = (h?: string) => (h && /^#[0-9a-f]{6}$/i.test(h) ? h : null);

function swatch(ctx: CanvasRenderingContext2D, p: Palette, m: Mat, x: number, y: number, s: number) {
  ctx.fillStyle = hexOk(m.hex) ?? "#cccccc";
  ctx.fillRect(x, y, s, s);
  ctx.strokeStyle = p.line; ctx.lineWidth = 2; ctx.strokeRect(x, y, s, s);
}

export async function composeSheet(item: Item, boardUrl: string | null): Promise<string> {
  const p = PALETTES[item.style];
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("canvas");
  const spec = item.spec;
  const unit = item.unit === "in" ? "in" : "mm";

  ctx.fillStyle = p.bg; ctx.fillRect(0, 0, W, H);
  const m = 30;
  ctx.strokeStyle = p.line; ctx.lineWidth = 5; ctx.strokeRect(m, m, W - 2 * m, H - 2 * m);

  // Band at the bottom: how tall depends on how much data there is.
  const rich = item.sheetType === "full" || item.sheetType === "bom";
  const bandH = item.sheetType === "bom" ? H - 2 * m - 20 : rich ? 640 : 420;
  const bandY = H - m - bandH - 10;
  const bx = m + 10;
  const bw = W - 2 * m - 20;

  // Drawing board — Gemini's geometry-only drawing (no text)
  let drawAreaX = m + 10, drawAreaY = m + 10;
  let drawAreaW = W - 2 * m - 20, drawAreaH = bandY - drawAreaY - 14;
  if (boardUrl && item.sheetType !== "bom") {
    const img = await load(boardUrl);
    const aw = drawAreaW, ah = drawAreaH;
    const s = Math.min(aw / img.width, ah / img.height);
    const ix = drawAreaX + (aw - img.width * s) / 2;
    const iy = drawAreaY + (ah - img.height * s) / 2;
    ctx.drawImage(img, ix, iy, img.width * s, img.height * s);
    drawAreaX = ix; drawAreaY = iy;
    drawAreaW = img.width * s; drawAreaH = img.height * s;
  }

  // Browser text overlay on the drawing area — dimension values, callout legend, section layer legend.
  // Gemini drew geometry only; we render all text here so it is always crisp and never clipped.
  if (spec && item.sheetType !== "bom") {
    drawOverlay(ctx, p, spec, item, drawAreaX, drawAreaY, drawAreaW, drawAreaH);
  }

  // Title block (right) is always there.
  const tbW = 760;
  const tbX = bx + bw - tbW;
  const tbY = item.sheetType === "bom" ? bandY + bandH - 560 : bandY;
  const tbH = item.sheetType === "bom" ? 560 : bandH;
  box(ctx, p, tbX, tbY, tbW, tbH);
  const meta = item.meta;
  const rows: Array<[string, string]> = [
    ["PROJECT", (meta.project || "Luxury living collection").toUpperCase()],
    ["DRAWING TITLE", (meta.title || `${item.name} technical design sheet`).toUpperCase()],
    ["DRAWING NO.", meta.drawingNo || "FT-01"],
    ["REVISION", meta.revision || "REV A"],
    ["SCALE", meta.scale || "NTS / INDICATIVE"],
    ["DATE", meta.date || String(new Date().getFullYear())],
    ["DRAWN BY", (meta.drawnBy || "Design studio").toUpperCase()],
  ];
  const rh = tbH / rows.length;
  rows.forEach(([k, v], i) => {
    const y = tbY + i * rh;
    if (i) { ctx.strokeStyle = p.line; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(tbX, y); ctx.lineTo(tbX + tbW, y); ctx.stroke(); }
    ctx.fillStyle = p.muted; ctx.font = `bold 26px ${p.font}`; ctx.textBaseline = "top"; ctx.fillText(k, tbX + 20, y + 10);
    ctx.fillStyle = p.ink; ctx.font = `bold ${i === 1 ? 34 : 38}px ${p.font}`;
    const lines = wrap(ctx, v, tbW - 40).slice(0, 2);
    lines.forEach((l, j) => ctx.fillText(l, tbX + 20, y + 44 + j * 40));
  });

  const leftW = tbX - bx - 14;

  if (item.sheetType === "bom") {
    // Whole sheet is data: the photo, materials, parts list and notes.
    const topH = bandH - 560 - 14;
    if (item.photo) {
      const img = await load(item.photo);
      const ax = bx, ay = bandY, aw = 900, ah = bandH - 14;
      box(ctx, p, ax, ay, aw, ah, "REFERENCE PHOTO");
      const s = Math.min((aw - 40) / img.width, (ah - 110) / img.height);
      ctx.drawImage(img, ax + (aw - img.width * s) / 2, ay + 80 + (ah - 110 - img.height * s) / 2, img.width * s, img.height * s);
    }
    void topH;
    if (spec) {
      const px = bx + 914, pw = leftW - 914;
      drawParts(ctx, p, spec.parts, px, bandY, pw, bandH - 560 - 14, unit);
      drawMaterials(ctx, p, spec.materials, px, bandY + bandH - 560, Math.floor((pw - 14) / 2), 560);
      drawNotes(ctx, p, spec, item, px + Math.floor((pw - 14) / 2) + 14, bandY + bandH - 560, pw - Math.floor((pw - 14) / 2) - 14, 560);
    }
  } else if (rich && spec) {
    const mw = 760;
    drawMaterials(ctx, p, spec.materials, bx, bandY, mw, bandH);
    const nw = 640;
    drawParts(ctx, p, spec.parts, bx + mw + 14, bandY, leftW - mw - nw - 28, bandH, unit);
    drawNotes(ctx, p, spec, item, bx + leftW - nw, bandY, nw, bandH);
  } else if (spec) {
    // Compact band: notes beside the title block.
    drawNotes(ctx, p, spec, item, bx, bandY, leftW, bandH);
  }

  return c.toDataURL("image/png");
}

/** Overlay crisp browser-rendered text onto the Gemini drawing area.
 *  Gemini drew pure geometry with blank dimension gaps and numbered callout circles only.
 *  We add: dimensions block (top-right), callout legend (left strip on exploded/ortho/details),
 *  and section layer legend (bottom-right on full/ortho).
 *
 *  Sizing is in absolute canvas pixels (canvas = 3000 × 2121).
 *  The drawing image is letterboxed inside the drawing area; x/y/w/h are the actual image bounds. */
function drawOverlay(
  ctx: CanvasRenderingContext2D, p: Palette, spec: NonNullable<Item["spec"]>,
  item: Item, x: number, y: number, w: number, h: number
) {
  const unit = item.unit === "in" ? "in" : "mm";
  const d = spec.dimensions;
  const parts = spec.parts;
  const sheetType = item.sheetType;

  // Helper: filled rounded-ish semi-transparent panel
  function panel(px: number, py: number, pw: number, ph: number) {
    ctx.save();
    ctx.globalAlpha = 0.90;
    ctx.fillStyle = p.bg;
    ctx.fillRect(px, py, pw, ph);
    ctx.globalAlpha = 1;
    ctx.restore();
    ctx.strokeStyle = p.line; ctx.lineWidth = 2; ctx.strokeRect(px, py, pw, ph);
  }
  function divider(px: number, py: number, pw: number) {
    ctx.strokeStyle = p.line; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + pw, py); ctx.stroke();
  }

  // ── 1. DIMENSIONS BLOCK — top-right corner of the drawing image ───────────
  // Shows W × D × H × SeatH from spec.dimensions, always.
  {
    const fmtV = (v: number | undefined) => v ? String(v) : undefined;
    const dimRows: Array<[string, string]> = [
      ["WIDTH",   fmtV(d.width)],
      ["DEPTH",   fmtV(d.depth)],
      ["HEIGHT",  fmtV(d.height)],
      ["SEAT H",  fmtV(d.seatHeight)],
    ].filter((r): r is [string, string] => Boolean(r[1]));

    if (dimRows.length) {
      // Fixed pixel sizes — readable at 3000px canvas, looks right when displayed smaller
      const LABEL_W = 160; // px for label column
      const VAL_W   = 220; // px for value column
      const BW = LABEL_W + VAL_W + 24; // total block width  = 404
      const ROW_H  = 52;
      const HEAD_H = 44;
      const BH = HEAD_H + dimRows.length * ROW_H + 8;
      const BX = x + w - BW - 14;  // 14px from right edge of drawing image
      const BY = y + 14;            // 14px from top edge

      panel(BX, BY, BW, BH);
      ctx.fillStyle = p.head; ctx.font = `bold 24px ${p.font}`; ctx.textBaseline = "middle";
      ctx.fillText(`OVERALL DIMS — ${unit.toUpperCase()}`, BX + 12, BY + HEAD_H / 2);
      divider(BX, BY + HEAD_H, BW);

      dimRows.forEach(([label, val], i) => {
        const ry = BY + HEAD_H + i * ROW_H;
        if (i > 0) divider(BX, ry, BW);
        ctx.textBaseline = "middle";
        ctx.fillStyle = p.muted; ctx.font = `bold 22px ${p.font}`;
        ctx.fillText(label, BX + 12, ry + ROW_H / 2);
        ctx.fillStyle = p.ink; ctx.font = `bold 28px ${p.font}`;
        ctx.fillText(`${val} ${unit}`, BX + LABEL_W + 12, ry + ROW_H / 2);
      });
    }
  }

  // ── 2. CALLOUT LEGEND STRIP — left side of drawing image ──────────────────
  // For exploded, ortho, details and bom sheet types — these are the sheets where
  // Gemini draws large exploded views with numbered callout circles and no names.
  // For 'full', the BOM table in the bottom band already lists all parts; we still
  // show a compact legend so the drawing is self-contained.
  if (parts.length && sheetType !== "bom") {
    const maxRows = Math.min(parts.length, 15);
    const ROW_H  = Math.min(52, Math.floor((h - 20) / (maxRows + 1))); // +1 for header
    const FS_BAD = Math.max(20, Math.min(30, Math.floor(ROW_H * 0.56))); // badge font
    const FS_TXT = Math.max(18, Math.min(26, Math.floor(ROW_H * 0.48))); // name font
    // Width: badge (FS_BAD + 8) + longest name. Measure a representative name.
    ctx.font = `${FS_TXT}px ${p.font}`;
    const longestName = parts.slice(0, maxRows).reduce((acc, pt) =>
      ctx.measureText(pt.component.toUpperCase()).width > acc ? ctx.measureText(pt.component.toUpperCase()).width : acc, 0);
    const BADGE_COL = FS_BAD + 16;  // px
    const NAME_COL  = Math.min(longestName + 20, 480); // cap at 480px
    const SW = BADGE_COL + NAME_COL + 24;
    const HEAD_H = ROW_H;
    const SH = HEAD_H + maxRows * ROW_H + 8;
    const SX = x + 10;
    const SY = y + (h - SH) / 2; // vertically centred on drawing area

    panel(SX, SY, SW, SH);
    ctx.fillStyle = p.head; ctx.font = `bold 22px ${p.font}`; ctx.textBaseline = "middle";
    ctx.fillText("CALLOUT LEGEND", SX + 12, SY + HEAD_H / 2);
    divider(SX, SY + HEAD_H, SW);

    const BADGES = ["①","②","③","④","⑤","⑥","⑦","⑧","⑨","⑩","⑪","⑫","⑬","⑭","⑮"];
    parts.slice(0, maxRows).forEach((pt, i) => {
      const ry = SY + HEAD_H + i * ROW_H;
      if (i > 0) divider(SX, ry, SW);
      ctx.textBaseline = "middle";
      // Badge circle
      const cx2 = SX + 12 + FS_BAD / 2, cy2 = ry + ROW_H / 2;
      ctx.beginPath(); ctx.arc(cx2, cy2, FS_BAD / 2 + 4, 0, Math.PI * 2);
      ctx.fillStyle = p.accent; ctx.fill();
      ctx.fillStyle = p.bg; ctx.font = `bold ${FS_BAD}px ${p.font}`;
      ctx.textAlign = "center";
      ctx.fillText(BADGES[i] ?? String(pt.item), cx2, cy2 + 1);
      ctx.textAlign = "left";
      // Component name + material
      ctx.fillStyle = p.ink; ctx.font = `${FS_TXT}px ${p.font}`;
      const nameStr = fit(ctx, pt.component.toUpperCase(), NAME_COL - 8);
      ctx.fillText(nameStr, SX + BADGE_COL + 12, ry + ROW_H / 2 - (pt.material ? FS_TXT * 0.35 : 0));
      if (pt.material) {
        ctx.fillStyle = p.muted; ctx.font = `${Math.max(14, FS_TXT - 6)}px ${p.font}`;
        ctx.fillText(fit(ctx, pt.material.toUpperCase(), NAME_COL - 8), SX + BADGE_COL + 12, ry + ROW_H / 2 + FS_TXT * 0.55);
      }
    });
  }

  // ── 3. SECTION A-A LAYER LEGEND — bottom-right of drawing image ───────────
  // Only on full and ortho sheets, which include the cross-section panel.
  // Derives layers from spec.parts (structural/frame/foam/fabric items) so it
  // matches this actual piece, not a generic sofa.
  if (sheetType === "full" || sheetType === "ortho") {
    // Pick structural layer description from materials list (fabric, foam, frame types)
    // Fall back to a standard sofa layer stack if spec has no recognisable layers.
    const matLayers = spec.materials.slice(0, 8).map((mt, i) => {
      const badge = ["①","②","③","④","⑤","⑥","⑦","⑧"][i] ?? `${i + 1}.`;
      return `${badge} ${mt.name.toUpperCase()}`;
    });
    const layers = matLayers.length >= 3 ? matLayers : [
      "① UPHOLSTERY FABRIC", "② DACRON WRAP", "③ HIGH-RESILIENCE FOAM",
      "④ PLYWOOD PANEL", "⑤ SOLID WOOD FRAME", "⑥ WEBBING SUSPENSION",
      "⑦ SEAT PLATFORM BOARD", "⑧ SOLID WOOD LEG",
    ];

    const ROW_H2 = Math.min(40, Math.floor((h * 0.42) / (layers.length + 1)));
    const FS2 = Math.max(16, Math.min(22, Math.floor(ROW_H2 * 0.55)));
    ctx.font = `${FS2}px ${p.font}`;
    const maxLen = layers.reduce((acc, l) => Math.max(acc, ctx.measureText(l).width), 0);
    const SW2 = Math.min(maxLen + 36, 500);
    const SH2 = ROW_H2 + layers.length * ROW_H2 + 8;
    // Position: bottom-right of drawing image, left of the dims block
    const dimBlockW = 404 + 14; // dims block width + its right margin
    const SX2 = x + w - dimBlockW - SW2 - 20;
    const SY2 = y + h - SH2 - 14;

    panel(SX2, SY2, SW2, SH2);
    ctx.fillStyle = p.head; ctx.font = `bold 20px ${p.font}`; ctx.textBaseline = "middle";
    ctx.fillText("SECTION A-A LAYERS", SX2 + 10, SY2 + ROW_H2 / 2);
    divider(SX2, SY2 + ROW_H2, SW2);

    layers.forEach((l, i) => {
      const ry = SY2 + ROW_H2 + i * ROW_H2;
      if (i > 0) divider(SX2, ry, SW2);
      ctx.fillStyle = p.ink; ctx.font = `${FS2}px ${p.font}`; ctx.textBaseline = "middle";
      ctx.fillText(fit(ctx, l, SW2 - 20), SX2 + 10, ry + ROW_H2 / 2);
    });
  }
}

function drawParts(ctx: CanvasRenderingContext2D, p: Palette, parts: Part[], x: number, y: number, w: number, h: number, unit: string) {
  box(ctx, p, x, y, w, h, "PARTS SCHEDULE / BILL OF MATERIALS");
  const cols = [0.06, 0.28, 0.2, 0.15, 0.07, 0.24];
  const heads = ["ITEM", "COMPONENT", "MATERIAL", "FINISH", "QTY", "NOTES"];
  const hy = y + 74;
  ctx.font = `bold 24px ${p.font}`; ctx.fillStyle = p.muted; ctx.textBaseline = "top";
  let cx = x + 18;
  const xs = cols.map((f) => { const v = cx; cx += f * (w - 36); return v; });
  heads.forEach((t, i) => ctx.fillText(t, xs[i], hy));
  ctx.strokeStyle = p.line; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, hy + 34); ctx.lineTo(x + w, hy + 34); ctx.stroke();
  const avail = h - 74 - 44 - 12;
  const n = Math.max(1, parts.length);
  const rh = Math.min(46, avail / n);
  const fs = Math.max(18, Math.min(28, Math.floor(rh * 0.6)));
  ctx.font = `${fs}px ${p.font}`; ctx.fillStyle = p.ink;
  parts.slice(0, Math.floor(avail / rh)).forEach((r, i) => {
    const ry = hy + 44 + i * rh;
    const vals = [String(r.item), r.component, r.material, r.finish || "-", String(r.qty), r.notes];
    vals.forEach((v, j) => ctx.fillText(fit(ctx, v, cols[j] * (w - 36) - 10), xs[j], ry));
  });
  void unit;
}

function drawMaterials(ctx: CanvasRenderingContext2D, p: Palette, mats: Mat[], x: number, y: number, w: number, h: number) {
  box(ctx, p, x, y, w, h, "MATERIAL & FINISH SCHEDULE");
  const list = mats.slice(0, 8);
  const cols = w > 600 ? 2 : 1;
  const cw = (w - 36) / cols;
  const rowsN = Math.ceil(list.length / cols) || 1;
  const rh = Math.min(120, (h - 84) / rowsN);
  const s = Math.min(rh - 20, 84);
  list.forEach((mt, i) => {
    const col = i % cols, row = Math.floor(i / cols);
    const ox = x + 18 + col * cw, oy = y + 74 + row * rh;
    swatch(ctx, p, mt, ox, oy, s);
    ctx.textBaseline = "top";
    ctx.fillStyle = p.accent; ctx.font = `bold 26px ${p.font}`; ctx.fillText(mt.code, ox + s + 14, oy);
    ctx.fillStyle = p.ink; ctx.font = `22px ${p.font}`;
    wrap(ctx, mt.name, cw - s - 30).slice(0, 2).forEach((l, j) => ctx.fillText(l, ox + s + 14, oy + 32 + j * 26));
  });
}

function drawNotes(ctx: CanvasRenderingContext2D, p: Palette, spec: NonNullable<Item["spec"]>, item: Item, x: number, y: number, w: number, h: number) {
  box(ctx, p, x, y, w, h, "SPECIFICATION LEGEND");
  const d = spec.dimensions;
  const lines = [
    `All dimensions in ${item.unit === "in" ? "inches" : "millimetres"}, indicative. Verify before production.`,
    d.width || d.depth || d.height ? `Overall ${d.width} x ${d.depth} x ${d.height}${d.seatHeight ? `, seat height ${d.seatHeight}` : ""}.` : "",
    ...spec.notes,
    ...spec.joinery.slice(0, 2).map((j) => `Joinery: ${j}`),
  ].filter(Boolean);
  ctx.fillStyle = p.ink; ctx.textBaseline = "top";
  let fs = 26;
  let out: string[] = [];
  for (; fs >= 16; fs -= 2) {
    ctx.font = `${fs}px ${p.font}`;
    out = lines.flatMap((l) => wrap(ctx, `• ${l}`, w - 40));
    if (out.length * (fs + 8) <= h - 84) break;
  }
  const max = Math.floor((h - 84) / (fs + 8));
  out.slice(0, max).forEach((l, i) => ctx.fillText(l, x + 20, y + 74 + i * (fs + 8)));
}
