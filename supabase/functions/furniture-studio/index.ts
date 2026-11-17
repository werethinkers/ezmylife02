// Furniture Sheets studio: photo of a piece of furniture in, Gemini out.
//
//   action "analyze"  reads the photo and returns a structured spec (name, size, parts, materials, finishes,
//                     joinery, an indicative cost) as JSON.              charged as furniture-analyze
//   action "sheet"    draws the technical design sheet. By default (hybrid) Gemini draws only the DRAWINGS
//                     (exploded view, elevations, plan, section, details) on a wide board; the browser then adds
//                     the parts list, materials, notes and title block as exact text. Three quality tiers.
//                     charged as furniture-sheet-quick / furniture-sheet / furniture-sheet-pro
//   action "image"    one picture: product view, catalogue shot, isometric, line drawing, room scene,
//                     colourway or a free edit.                           charged as furniture-image
//
// AI goes only through _shared/llm.ts (AGENTS.md). Each call is one charge by billed(): success charges,
// any error costs nothing.
import { json } from "../_shared/http.ts";
import { billed } from "../_shared/billing.ts";
import { chat, image, ModelError, parseJson, type Part } from "../_shared/llm.ts";

const TOOL_ANALYZE = "furniture-analyze";
const TOOL_SHEET = "furniture-sheet"; // standard tier
const TOOL_SHEET_QUICK = "furniture-sheet-quick";
const TOOL_SHEET_PRO = "furniture-sheet-pro";
const TOOL_IMAGE = "furniture-image";

// Credits by the 3x rule in docs/pricing.md (price = AI cost in rupees x 3 / 0.376, rounded up, at 96.36 rupees a dollar).
//   quick     Gemini 2.5 Flash Image,                about $0.039 = 3.8 rupees  -> 31 credits
//   standard  Gemini 3.1 Flash Lite Image (fallback: 2.5-flash-image),          -> 52 credits
//   premium   Gemini 3.1 Flash Lite Image (best quality currently available),   -> 52 credits
//   image     Gemini 2.5 Flash Image                                            -> 31 credits
//   analyze   Flash with one photo, about 0.5 rupees                            -> 4 credits
// The rows are created on first use; admins can change them later.
const DEFAULT_CREDITS: Record<string, number> = {
  [TOOL_ANALYZE]: 4, [TOOL_SHEET_QUICK]: 31, [TOOL_SHEET]: 52, [TOOL_SHEET_PRO]: 52, [TOOL_IMAGE]: 31,
};

// Each tier tries its own model first and, only if that model is not available, the one after it.
// gemini-2.5-flash-image  = standard image model (~$0.039/image, used across the codebase)
// gemini-3.1-flash-lite-image = higher quality lite variant (used in productvision-angles)
const TIER_MODELS: Record<string, string[]> = {
  quick: ["google/gemini-2.5-flash-image"],
  standard: ["google/gemini-3.1-flash-lite-image", "google/gemini-2.5-flash-image"],
  premium: ["google/gemini-3.1-flash-lite-image"],
};
const tierOf = (b: { tier?: unknown } | null) => (b?.tier === "quick" || b?.tier === "premium" ? String(b.tier) : "standard");
const IMAGE_MODEL = "google/gemini-2.5-flash-image";

const MAX_IMAGE_CHARS = 14_000_000;

const bad = (message: string, status = 400) => json({ error: message, message }, status);

// ---------------------------------------------------------------------------------------------
// Sheet look
// ---------------------------------------------------------------------------------------------

type Opt = Record<string, string>;

const STYLES: Opt = {
  light: `LIGHT PROFESSIONAL DRAFTING STYLE (like the reference sheets):
- Background: crisp white (#FFFFFF), outer sheet border 2 px dark grey
- Linework: uniform 0.5–1 px black lines for drawings; 1.5 px thick outlines for the exploded isometric
- 3D Exploded Isometric: full photorealistic or near-photorealistic 3D render of the actual furniture piece, exploded along vertical axis so all parts float apart with dotted leader lines and round numbered callout badges (①②③…). The piece must look exactly like the furniture in the photo.
- Orthographic elevations: clean orthographic projection drawings, thin lines, dimension lines with closed-arrow heads, dimension text in a sans-serif condensed font
- Detail drawings: crisp cut-away cross-sections or profile drawings with hatching on cut faces (45-degree hatching), leader lines to material callouts written in ALL CAPS
- Material swatches: small photorealistic square swatches (fabric/wood/metal textures rendered realistically), labelled M01, M02… beneath each one, with the material name in small text
- BOM table: clean thin-rule table, alternating very light grey row fills, header row in dark grey with white text, 6 columns: ITEM NO. | COMPONENT | MATERIAL | FINISH | QTY | NOTES
- Text: Helvetica or similar sans-serif, panel headings in bold ALL CAPS 10–11px, dimension text 7px, table text 7–8px
- Looks exactly like a luxury furniture manufacturer's production drawing package.`,

  blueprint: `BLUEPRINT CAD STYLE (dark technical):
- Background: deep navy (#0d1b2a), outer border 1.5 px pale cyan
- Primary linework: white and pale cyan; dimension lines and leader lines in pale cyan
- Dimension numbers and panel titles: yellow (#FFD700)
- Section cut lines and annotation leaders: bright red
- 3D Exploded Isometric: pale cyan wireframe style with ghost-visible interior components, numbered callout circles in yellow
- Detail cross-sections: white outlines, diagonal hatching in cyan on cut faces
- Material swatches: dark-background squares showing light-coloured textures, label text in yellow
- BOM table: dark background, cyan rules, yellow header text, white body text
- Title block: bottom-right, cyan border, white project/drawing text, yellow drawing number
- Looks like a CAD night-mode production export.`,

  mono: `MONOCHROME LINE-ART STYLE (blueprint photocopy):
- Background: white (#FFFFFF), no greys, no colour
- All linework: black only, uniform fine strokes
- Exploded isometric: black line-art, every part outlined only, no shading, dashed leader lines, number callouts in black circles
- Section cuts: 45-degree cross-hatching in black
- Material swatches: black-and-white texture patterns (dots for foam, diagonal lines for wood grain, cross-hatching for metal)
- BOM table: thin black rules, no fills
- Text: clean typewriter or Courier-style font, all caps headings
- Looks like a high-quality photocopied architect's technical drawing.`,

  vintage: `VINTAGE DRAFTING STYLE (hand-drawn era):
- Background: aged cream (#F5F0E8) or warm ivory paper texture
- Linework: brown-black ink (#2C1810), slightly variable weight as if hand-drawn with a technical pen
- Exploded isometric: ink line drawing with light wash shading in warm grey/sepia
- Elevations and details: ink outlines with pencil-like grey fill for shaded faces
- Section hatching: hand-drawn look 45-degree hatching in brown ink
- Material swatches: watercolour-style texture patches, hand-labelled
- Text: hand-lettered feel but fully legible sans-serif, slight imperfection
- Title block: double-rule border, engraved/inked style, year as Roman numerals
- Looks like a master craftsman's workshop drawing from the 1960s-70s.`,
};

const SHEET_TYPES: Opt = {
  full: `FULL TECHNICAL DESIGN SHEET — include ALL 10 panels arranged in a landscape 3:2 grid:

TOP ROW (spanning full width from left to right):
  Panel 1 — 3D EXPLODED ISOMETRIC ASSEMBLY (largest panel, top-left, ~38% of sheet width):
    • Full 3D photorealistic/near-photorealistic render of the furniture piece from the photo
    • Explode all parts vertically along a central axis with dotted guideline between parts
    • Every part gets a numbered callout badge: ①②③④⑤⑥⑦⑧⑨⑩ (at least 8 parts)
    • Leader lines from each badge to the part
    • Left margin: callout legend text, e.g. "LOOSE BACK CUSHIONS (03 NOS.)", "SEAT FRAME (HARDWOOD)", etc.
    • Label the panel "3D EXPLODED ISOMETRIC ASSEMBLY" at top-left
  Panel 2 — FRONT ELEVATION (top-centre, ~28% width):
    • Accurate orthographic front view of the piece
    • Full exterior dimension lines: overall width, seat height, back height, arm height
    • Section cut-line "A–A" with arrows showing where section is taken
    • Label "FRONT ELEVATION" at top
  Panel 3 — SIDE ELEVATION (top-right, ~28% width):
    • Accurate orthographic side/profile view
    • Overall depth and height dimension lines
    • Label "SIDE ELEVATION" at top

MIDDLE ROW:
  Panel 4 — TOP PLAN (mid-left, ~28% width):
    • True orthographic top-down view
    • Overall width and depth dimension lines
    • Centre-lines (CL) shown as dash-dot lines
    • Label "TOP PLAN"
  Panel 5 — SECTION A-A (mid-right, ~40% width):
    • Full vertical cross-section through the piece at cut-line A-A from the front elevation
    • Interior construction clearly visible: foam layers, frame, webbing, back panel
    • Numbered layer callouts (①②③…) keyed to a right-margin legend listing each layer: e.g. "① TOP FABRIC / UPHOLSTERY", "② TOP FOAM (40mm)", "③ FIBER WRAP", "④ PLYWOOD PANEL", "⑤ SOLID WOOD FRAME"
    • Label "SECTION A-A"

BOTTOM ROW:
  Panel 6 — CONSTRUCTION DETAIL DRAWINGS (bottom-left band, ~65% width, 6 to 7 details side by side):
    Each detail in its own thin-bordered sub-panel with a bold ALL-CAPS title:
    DETAIL A — ARM or EDGE PROFILE CROSS-SECTION (enlarged cut-away showing arm build-up layers)
    DETAIL B — BACK-TO-SEAT FRAME JUNCTION (how back frame meets seat frame)
    DETAIL C — SEAT CUSHION BUILD-UP (foam layers, dacron wrap, ticking fabric, exploded layers)
    DETAIL D — LEG TO FRAME MOUNTING DETAIL (metal insert, wood screw, solid wood leg)
    DETAIL E — UPHOLSTERY SEAM AND PIPING (piping cord, top stitch, internal foam edge)
    DETAIL F — BACK CUSHION FILL AND TICKING (feather+fiber fill, dacron wrap, ticking fabric)
    DETAIL G — FULL VERTICAL SECTION BUILD-UP (numbered layers: ①upholstery fabric ②dacron ③foam ④back panel ⑤back frame ⑥webbing ⑦seat platform ⑧seat frame ⑨arm panel ⑩leg)
  Panel 7 — MATERIAL & FINISH SCHEDULE (bottom-middle, 2 rows of 4 swatches):
    8 swatches M01–M08, each a realistic photorealistic texture square (~40×40px), code and name below
    Label "MATERIAL & FINISH SCHEDULE" at top of this panel
  Panel 8 — PARTS SCHEDULE / BILL OF MATERIALS table:
    Table heading: "[PIECE NAME] ASSEMBLY PARTS SCHEDULE / BILL OF MATERIALS"
    Columns: ITEM NO. | COMPONENT | MATERIAL | FINISH | QTY | NOTES
    8–12 rows, e.g.: 1 Frame Assembly, 2 Seat Platform Board, 3 Webbing Suspension, 4 Seat Cushion, 5 Back Cushion, 6 Arm Panels, 7 Back Panel, 8 Leg, 9 Piping Cord, 10 Upholstery Cover
  Panel 9 — SPECIFICATION LEGEND (below section, left-aligned notes):
    "• ALL DIMENSIONS INDICATIVE; VERIFY PRIOR TO PRODUCTION."
    "• SEAT HEIGHT 400–440mm AFF."
    "• ALL UPHOLSTERED SURFACES SEAMLESS AT VISIBLE FACES."
    Plus 2–3 piece-specific notes
  Panel 10 — TITLE BLOCK (bottom-right corner, bordered box):
    PROJECT: [name]
    DRAWING TITLE: [title]
    DRAWING NO.: [number]
    REVISION: REV A
    SCALE: NTS / INDICATIVE
    DATE: [year]
    DRAWN BY: DESIGN STUDIO`,

  exploded: `EXPLODED ISOMETRIC FOCUS SHEET — single large exploded assembly as the hero:
- 3D EXPLODED ISOMETRIC ASSEMBLY takes ~70% of the sheet area, centred-left
- Explode ALL parts along vertical axis with dotted guide lines, generous spacing between parts
- Every part gets a numbered callout badge (① to ⑫+) with leader lines
- Left column: callout legend text for each numbered part, one line each in ALL CAPS
- Right side: compact PARTS SCHEDULE / BILL OF MATERIALS table (ITEM | COMPONENT | MATERIAL | FINISH | QTY | NOTES)
- Bottom-right: TITLE BLOCK
- Label "3D EXPLODED ISOMETRIC ASSEMBLY" prominently at top`,

  ortho: `ORTHOGRAPHIC ELEVATIONS SHEET — all elevations and section, fully dimensioned:
- FRONT ELEVATION: full-width front view, all exterior dimensions (overall width, height, seat height, arm height), section cut A-A
- SIDE ELEVATION: full profile, depth and height dimensions
- BACK ELEVATION: rear view with dimensions
- TOP PLAN: overhead view, width and depth, centre lines as dash-dot
- SECTION A-A: vertical cross-section at cut line, interior construction visible, numbered layer callouts with legend
- All dimension lines: closed arrowheads at both ends, extension lines, leave the numeric value BLANK (a short dash "—") — the browser overlays exact values; overall and sub-dimensions both shown
- Section A-A: numbered layer callout circles (①②③…) with NO text labels next to them — the browser overlays the legend
- NO text values, legends, or specification notes anywhere in the drawing — TITLE BLOCK bottom-right only`,

  details: `CONSTRUCTION DETAILS SHEET — maximum detail on joinery and build-ups:
- 9 to 12 large enlarged detail drawings in a tidy grid, each in its own thin-bordered sub-panel
- Every detail has: bold ALL-CAPS title (e.g. DETAIL A — ARM PROFILE), scale note, dimension lines with blank values (closed arrowheads, blank gap), 45-degree section hatching on cut faces, numbered callout circles (①②③) with NO text labels next to them
- Include all relevant details for the piece: arm/edge cross-section, back-to-seat junction, seat cushion build-up (all foam+fabric layers), leg mounting hardware, upholstery seam and piping, panel joinery (dowel/screw/bracket), back panel fill and ticking, full vertical section with numbered layers
- MATERIAL & FINISH SCHEDULE (8 swatches M01–M08) in one column
- TITLE BLOCK bottom-right`,

  bom: `PRODUCTION DATA SHEET — materials, BOM and specification focus:
- Large 3D isometric thumbnail of the complete (non-exploded) piece (top-left, ~30% width)
- MATERIAL & FINISH SCHEDULE: 2 rows × 4 swatches (M01–M08), each swatch a realistic texture square, code + full material name + finish note beneath
- PARTS SCHEDULE / BILL OF MATERIALS: large table filling ~40% of sheet area, all columns: ITEM NO. | COMPONENT | MATERIAL | FINISH | QTY | NOTES, 10–14 rows
- SPECIFICATION LEGEND: bulleted notes block (dimensions indicative, foam densities, fabric specification, production notes)
- TITLE BLOCK bottom-right`,
};

interface Meta {
  project?: string;
  title?: string;
  drawingNo?: string;
  revision?: string;
  scale?: string;
  date?: string;
  drawnBy?: string;
}

interface Spec {
  name?: string;
  category?: string;
  dimensions?: { width?: number; depth?: number; height?: number; seatHeight?: number; unit?: string };
  parts?: Array<{ item?: number; component?: string; material?: string; finish?: string; qty?: number | string; notes?: string }>;
  materials?: Array<{ code?: string; name?: string; note?: string }>;
  notes?: string[];
}

const clip = (v: unknown, n = 80) => String(v ?? "").replace(/[\r\n]+/g, " ").trim().slice(0, n);

function metaBlock(m: Meta, spec: Spec | undefined, unit: string): string {
  const title = clip(m.title) || (spec?.name ? `${clip(spec.name, 60)} TECHNICAL DESIGN SHEET` : "TECHNICAL DESIGN SHEET");
  return [
    `PROJECT: ${clip(m.project) || "LUXURY LIVING COLLECTION"}`,
    `DRAWING TITLE: ${title}`,
    `DRAWING NO.: ${clip(m.drawingNo, 24) || "FT-01"}`,
    `REVISION: ${clip(m.revision, 12) || "REV A"}`,
    `SCALE: ${clip(m.scale, 24) || "NTS / INDICATIVE"}`,
    `DATE: ${clip(m.date, 24) || String(new Date().getFullYear())}`,
    `DRAWN BY: ${clip(m.drawnBy) || "DESIGN STUDIO"}`,
    `UNITS: ${unit}`,
  ].join("\n");
}

function specBlock(spec: Spec | undefined, unit: string): string {
  if (!spec) return "";
  const out: string[] = [];
  if (spec.name) out.push(`The piece is: ${clip(spec.name, 100)}${spec.category ? ` (${clip(spec.category, 40)})` : ""}.`);
  const d = spec.dimensions;
  if (d && (d.width || d.depth || d.height)) {
    out.push(`Use EXACTLY these overall dimensions in ${unit}: width ${d.width ?? "?"}, depth ${d.depth ?? "?"}, height ${d.height ?? "?"}${d.seatHeight ? `, seat height ${d.seatHeight}` : ""}. Make every dimension line add up to them.`);
  }
  if (spec.parts?.length) {
    out.push("Use EXACTLY this parts schedule / bill of materials (same item numbers, names, materials, finishes, quantities):");
    for (const p of spec.parts.slice(0, 24)) {
      out.push(`${p.item ?? ""}. ${clip(p.component, 60)} | ${clip(p.material, 40)} | ${clip(p.finish, 30) || "-"} | qty ${clip(p.qty, 10) || "1"} | ${clip(p.notes, 50)}`);
    }
  }
  if (spec.materials?.length) {
    out.push("Material and finish swatches, in this order:");
    for (const m of spec.materials.slice(0, 10)) out.push(`${clip(m.code, 6)} ${clip(m.name, 60)}${m.note ? ` (${clip(m.note, 40)})` : ""}`);
  }
  if (spec.notes?.length) {
    out.push("Specification legend lines:");
    for (const n of spec.notes.slice(0, 8)) out.push(`- ${clip(n, 110)}`);
  }
  return out.join("\n");
}

function sheetPrompt(body: Record<string, unknown>): string {
  const style = STYLES[String(body.style)] ? String(body.style) : "light";
  const kind = SHEET_TYPES[String(body.sheetType)] ? String(body.sheetType) : "full";
  const unit = body.unit === "in" ? "inches" : "millimetres";
  const spec = (body.spec && typeof body.spec === "object" ? body.spec : undefined) as Spec | undefined;
  const meta = (body.meta && typeof body.meta === "object" ? body.meta : {}) as Meta;
  const notes = clip(body.notes, 500);
  const recolour = clip(body.materials, 300);
  return [
    "You are a senior furniture design engineer at a luxury manufacturer. You produce MANUFACTURER-READY TECHNICAL DESIGN SHEETS that are used directly on the factory floor.",
    "Study the attached photograph carefully. Draw the SAME piece of furniture: identical silhouette, proportions, upholstery pattern, fabric texture, piping/welting, legs, hardware, cushion count and materials. Do NOT invent a different design.",
    "Output ONE single landscape image (aspect ratio 3:2, e.g. 3000×2000 px) of the finished drawing sheet. The sheet fills the entire image edge-to-edge with a thin outer border. Every panel is neatly aligned in a grid with thin panel borders. The result must look indistinguishable from a real professional furniture manufacturer's production drawing package.",
    "VISUAL STYLE TO APPLY:\n" + STYLES[style],
    "SHEET CONTENT AND PANEL LAYOUT:\n" + SHEET_TYPES[kind],
    `TEXT AND DIMENSION RULES:
- All text: correctly spelled, ALL CAPS for panel headings and callout labels
- Dimension text: small (7px equivalent), placed on dimension lines with closed arrowheads at both ends
- All dimensions in ${unit} — use realistic values appropriate for the furniture category
- Dimension lines: show both overall dimensions AND sub-dimensions (e.g. three equal seat bay widths that sum to overall width)
- Section callout numbers on the cross-section use circled numerals ①②③ with a right-margin legend
- No lorem ipsum, no placeholder text, no gibberish — all text must be real and meaningful`,
    specBlock(spec, unit),
    recolour ? `MATERIAL CHANGES (apply to every drawing, swatch and BOM table): ${recolour}.` : "",
    notes ? `CUSTOMER NOTES: ${notes}` : "",
    "TITLE BLOCK EXACT TEXT (bottom-right bordered box):\n" + metaBlock(meta, spec, unit),
    "QUALITY REQUIREMENTS: Every detail drawing must be large enough to read clearly. The exploded isometric must look 3-dimensional and realistic. Material swatches must look like real fabric/wood/metal, not flat colour squares. The BOM table must have all visible rows filled with real component names, not 'Component 1'. Do not add watermarks, logos of real brands, or people.",
  ].filter(Boolean).join("\n\n");
}

// Hybrid: Gemini draws only the DRAWINGS section of the sheet (the visual panels).
// The browser canvas (compose.ts) adds the BOM table, material swatches, spec legend and title block as exact text.
// So the full image budget goes to line quality, 3D accuracy, dimensions and construction detail.
const BOARD_TYPES: Opt = {
  full: `DRAWING BOARD LAYOUT (landscape 16:9, full drawing area only — NO title block, NO BOM table, NO material swatches, NO text labels):

TOP ZONE (top 55% of board, full width):
  LEFT — 3D EXPLODED ISOMETRIC ASSEMBLY (top-left, ~38% of board width):
    • Full 3D photorealistic render of the furniture piece from the photo, exploded vertically
    • Parts separated with dotted vertical guide lines, generous spacing between parts
    • Round numbered callout badges ONLY: ①②③④⑤⑥⑦⑧⑨⑩ (at minimum 8 parts)
    • Thin leader lines from each badge to its part — NO accompanying text, the browser overlays labels
    • Bold panel title "3D EXPLODED ISOMETRIC ASSEMBLY" at top-left
  CENTRE — FRONT ELEVATION (~28% width):
    • Accurate orthographic front projection of the piece
    • Dimension lines: closed arrowheads at both ends, extension lines — LEAVE dimension value blank (draw the line and arrowhead only)
    • Section cut arrow pair "A ← →A" with arrows showing cut location
    • Bold panel title "FRONT ELEVATION"
  RIGHT — SIDE ELEVATION (~28% width):
    • Accurate orthographic side/profile projection
    • Dimension lines with closed arrowheads — LEAVE values blank, browser overlays them
    • Bold panel title "SIDE ELEVATION"

MIDDLE ZONE (next 15% of board):
  LEFT — TOP PLAN (~32% width):
    • True orthographic overhead view
    • Dimension lines with arrowheads — values left blank
    • Centre lines as dash-dot lines
    • Bold panel title "TOP PLAN"
  RIGHT — SECTION A-A (~62% width):
    • Full vertical cross-section at the A-A cut line from front elevation
    • Interior construction clearly visible: upholstery fabric, foam layers, dacron wrap, back panel, solid wood frame, webbing suspension, seat platform, leg
    • Numbered layer callouts ①②③④⑤⑥⑦⑧ with leader lines to layers — NO text labels next to them, browser overlays the legend
    • Bold panel title "SECTION A-A"

BOTTOM ZONE (bottom 30% of board, a row of 6–7 side-by-side detail drawings):
  Each detail in its own thin-bordered sub-panel. Choose the 6–7 most relevant from:
  DETAIL A — ARM PROFILE CROSS-SECTION: enlarged cut-away showing all build-up layers, 45-degree hatching, dimension arrowheads (no values)
  DETAIL B — BACK-TO-SEAT FRAME JUNCTION: frame connection geometry, hatching, numbered callout badges only
  DETAIL C — SEAT CUSHION BUILD-UP: exploded layer diagram — layers shown as geometry, numbered badges for each layer
  DETAIL D — LEG TO FRAME MOUNTING: hardware geometry, numbered badges
  DETAIL E — UPHOLSTERY SEAM AND PIPING: cross-section geometry, hatching, numbered badges
  DETAIL F — BACK CUSHION FILL AND TICKING: layer diagram geometry with numbered badges
  DETAIL G — FULL VERTICAL SECTION BUILD-UP: numbered layers ①–⑩ as a vertical strip cross-section
  Each detail panel: bold ALL-CAPS title, section hatching on cut faces, dimension arrowheads only (NO values)`,

  exploded: `EXPLODED ISOMETRIC DRAWING BOARD — large exploded assembly (geometry only, NO text labels):
- ONE very large 3D exploded isometric assembly filling ~80% of the board
- Parts separated along vertical dotted guide lines with generous spacing
- ALL parts visible with numbered callout badges ①②③…⑫+ and thin leader lines — NO text names next to badges (browser overlays them)
- Leave blank space on left side where the browser will overlay the callout legend
- Corner (bottom-right): small accurate FRONT ELEVATION with dimension arrowheads (values left blank)
- Bold title "3D EXPLODED ISOMETRIC ASSEMBLY" at top`,

  ortho: `ORTHOGRAPHIC ELEVATIONS DRAWING BOARD — clean geometry with dimension lines, NO dimension values:
- FRONT ELEVATION: full orthographic front view, dimension lines with closed arrowheads (leave the value gap blank), section A-A arrows
- SIDE ELEVATION: full profile, dimension lines with arrowheads (blank values)
- BACK ELEVATION: rear view with dimension arrowheads
- TOP PLAN: overhead view, dimension arrowheads, centre lines as dash-dot
- SECTION A-A: vertical cross-section, interior construction, numbered layer callouts ①②③… with leader lines (NO right-margin legend text — browser overlays it)
- All dimension lines: closed arrowheads at both ends, extension lines, value gap left blank
- All bold panel titles in ALL CAPS`,

  details: `CONSTRUCTION DETAILS DRAWING BOARD — 9 to 12 enlarged detail drawings (geometry and hatching only):
- Tidy grid of 9–12 large detail drawings, each in its own thin-bordered sub-panel
- Every detail: bold ALL-CAPS title (DETAIL A — ARM PROFILE, etc.), 45-degree section hatching on cut faces, dimension arrowheads with blank value gaps, numbered callout badges ①②③ with leader lines but NO text labels (browser overlays them)
- Include: arm/edge cross-section, back-to-seat junction, seat cushion build-up layers, leg mounting hardware, upholstery seam and piping, panel joinery, back cushion fill, full vertical section with numbered layers
- Each detail enlarged enough to read all geometry clearly — NO text crammed in tight spaces`,

  bom: `BILL OF MATERIALS DRAWING BOARD — parts-focused technical overview (geometry only, NO text labels):
TOP ZONE (top 50% of board):
  LEFT — 3D EXPLODED ISOMETRIC ASSEMBLY (~55% width):
    • Large photorealistic exploded 3D assembly from the furniture photo
    • Parts floated apart along vertical dotted guide lines
    • Numbered callout badges ①②③…⑫ with thin leader lines — NO text labels, browser overlays them
    • Leave a clear left margin strip (blank/white) where browser will overlay the callout legend
    • Bold panel title "EXPLODED ASSEMBLY — PARTS IDENTIFICATION"
  RIGHT — FRONT + SIDE ELEVATIONS stacked (~40% width):
    • Top half: FRONT ELEVATION with dimension lines (closed arrowheads, leave value gaps blank)
    • Bottom half: SIDE ELEVATION with dimension lines (arrowheads, blank values)
    • Bold panel titles "FRONT ELEVATION" and "SIDE ELEVATION"

BOTTOM ZONE (bottom 50% of board):
  A tidy row of 5–7 ENLARGED PART DETAIL drawings, each in its own bordered sub-panel:
  • Each detail focuses on ONE specific component — show geometry and construction at 2× or 3× scale
  • 45-degree section hatching on cut faces, numbered callout badges, dimension arrowheads (no values)
  • NO text callout labels inside the detail — browser overlays them
  • Bold ALL-CAPS title per panel: "DETAIL — [COMPONENT NAME]"
  • Cover: upholstery build-up, frame joint, hardware mounting, foam layer, leg detail`,
};

function boardPrompt(body: Record<string, unknown>): string {
  const style = STYLES[String(body.style)] ? String(body.style) : "light";
  const kind = BOARD_TYPES[String(body.sheetType)] ? String(body.sheetType) : "full";
  const unit = body.unit === "in" ? "inches" : "millimetres";
  const spec = (body.spec && typeof body.spec === "object" ? body.spec : undefined) as Spec | undefined;
  const notes = clip(body.notes, 500);
  const recolour = clip(body.materials, 300);
  const d = spec?.dimensions;
  return [
    "You are a senior furniture design engineer at a luxury manufacturer. You are drawing the DRAWINGS SECTION of a professional technical design sheet from the attached photograph of a furniture piece.",
    "Study the photo carefully. Draw the SAME piece: identical silhouette, proportions, upholstery pattern, fabric texture, piping, leg style, hardware, cushion count and materials. Do NOT invent a different design.",
    "Output ONE single landscape 16:9 image. The drawings fill the entire image edge-to-edge. Spend every pixel on crisp, accurate, well-spaced, high-quality technical drawings.",
    "VISUAL STYLE:\n" + STYLES[style],
    "DRAWING LAYOUT AND CONTENT:\n" + BOARD_TYPES[kind],
    `CRITICAL — TEXT-FREE DRAWING ZONE. The browser renders ALL text. You must NOT include any of these in the drawing image: title block, bill of materials table, material swatch grid, specification legend notes, dimension values/numbers (e.g. "2100mm", "420"), part name text labels, material callout text, finish text, or any written words inside the drawing area. The ONLY text permitted is: numbered callout badge numerals (①②③…), ALL-CAPS panel section headings (e.g. "FRONT ELEVATION"), and the main drawing title if it fits cleanly in a header strip.`,
    `DRAWING GEOMETRY RULES: Draw all dimension lines WITH closed arrowheads and extension lines but leave the value blank (a short dash "—" if needed). Draw callout leader lines ending in numbered circles (①②…) with NO accompanying text label. The browser will overlay all dimension values and legend text as crisp vector text. Focus all effort on accurate, beautiful geometry. The exploded isometric must look 3D and photo-quality.`,
    d && (d.width || d.depth || d.height)
      ? `USE EXACTLY THESE DIMENSIONS in ${unit}: width ${d.width ?? "?"}, depth ${d.depth ?? "?"}, height ${d.height ?? "?"}${d.seatHeight ? `, seat height ${d.seatHeight}` : ""}. All sub-dimensions must sum correctly to these overall values.`
      : "Use realistic dimensions appropriate for this furniture category (e.g. a standard sofa: width ~2000–2400mm, depth ~900mm, height ~800mm, seat height ~420mm).",
    spec?.parts?.length ? `The exploded view must have exactly ${Math.min(spec.parts.length, 20)} numbered callout badges (①②…). Number them ${spec.parts.slice(0, 20).map((p) => p.item).join(", ")} — the browser overlays the part names. Do NOT write part names in the image.` : "",
    recolour ? `MATERIAL CHANGES (apply to every drawing): ${recolour}.` : "",
    notes ? `CUSTOMER NOTES: ${notes}` : "",
    "No watermarks, no real brand logos, no people.",
  ].filter(Boolean).join("\n\n");
}

// ---------------------------------------------------------------------------------------------
// Single pictures
// ---------------------------------------------------------------------------------------------

const VIEWS: Opt = {
  front: "straight-on front view, camera facing the piece directly",
  back: "straight-on rear view (180 degrees)",
  left: "pure left side profile (270 degrees)",
  right: "pure right side profile (90 degrees)",
  top: "top-down overhead view looking straight down",
  "three-quarter": "three-quarter view from the front-right at 45 degrees, slightly raised camera",
  "three-quarter-left": "three-quarter view from the front-left at 45 degrees, slightly raised camera",
  detail: "macro close-up of the piece's most distinctive detail, texture, joinery or hardware",
};

const ROOMS: Opt = {
  living: "a bright modern living room",
  bedroom: "a calm contemporary bedroom",
  dining: "an elegant dining room",
  office: "a stylish home office",
  hotel: "a luxury hotel lobby",
  cafe: "a warm boutique cafe",
  showroom: "a minimalist furniture showroom with gallery lighting",
  outdoor: "a sunlit terrace with plants",
};

function imagePrompt(body: Record<string, unknown>): string {
  const kind = String(body.kind || "");
  const keep = "Keep the furniture itself identical to the photo: same shape, proportions, colours, fabric pattern, legs, hardware and materials.";
  const note = clip(body.prompt, 400);
  switch (kind) {
    case "view": {
      const v = VIEWS[String(body.view)] ?? VIEWS.front;
      return `You are a professional furniture catalogue photographer. Using the attached photo, render the SAME piece from this camera angle: ${v}. ${keep} Seamless light-grey studio backdrop, soft even lighting, natural contact shadow, piece centred and fully in frame, photorealistic. No props, text or watermarks. Output only the image.`;
    }
    case "hero":
      return `Create a premium catalogue hero photograph of the piece in the attached photo. ${keep} Seamless warm-white studio background, soft directional light, subtle floor reflection, magazine quality, no props, no text. Output only the image.`;
    case "iso":
      return `Draw a high-quality 3D isometric product illustration of the piece in the attached photo. ${keep} Render from a 30-degree isometric viewpoint (front-right elevated), show the piece fully, use soft ambient shading with light from above-right, thin dark outline stroke, clean white or very light grey background, photorealistic material textures on fabric/wood/metal surfaces, no text, no dimension lines. Magazine quality. Output only the image.`;
    case "lineart":
      return `Convert the piece in the attached photo into a precise black-on-white technical line drawing in three-quarter view, suitable for tracing in CAD. ${keep} Uniform thin outlines, no shading, no background, no text. Output only the image.`;
    case "scene": {
      const room = ROOMS[String(body.room)] ?? ROOMS.living;
      return `Place the piece from the attached photo into ${room}, styled by an interior designer, natural light, realistic scale and perspective, the piece is the clear focal point. ${keep}${note ? ` Style notes: ${note}.` : ""} No text or watermarks. Output only the image.`;
    }
    case "colorway":
      return `Re-colour the piece in the attached photo using this material or colour: ${note || "deep emerald velvet"}. Change only the upholstery, finish or colour as described. Keep the exact shape, proportions, legs and hardware, the same camera angle and background. Photorealistic. Output only the image.`;
    case "edit":
      return `Edit the attached image as follows: ${note || "make it cleaner"}. Change only what is asked and keep everything else identical, including text and layout. Output only the image.`;
    default:
      return "";
  }
}

// ---------------------------------------------------------------------------------------------
// Analysis
// ---------------------------------------------------------------------------------------------

const ANALYZE_PROMPT = `You are a furniture design engineer. Study the attached photo of a piece of furniture (or interior trim) and reply with ONE JSON object only, no prose, in exactly this shape:
{
  "name": "short product name, e.g. 3-Seater Curved Bouclé Sofa",
  "category": "sofa | chair | armchair | bench | table | bed | cabinet | shelf | lighting | trim | other",
  "style": "design style in a few words",
  "summary": "two plain sentences describing the piece",
  "dimensions": { "width": 0, "depth": 0, "height": 0, "seatHeight": 0, "unit": "mm" },
  "parts": [ { "item": 1, "component": "", "material": "", "finish": "", "qty": 1, "notes": "" } ],
  "materials": [ { "code": "M01", "name": "", "note": "", "hex": "#RRGGBB approximate colour of the material" } ],
  "joinery": ["how the main parts are joined, one line each"],
  "notes": ["specification legend lines: tolerances, foam density, finishing, assembly"],
  "cost": { "lowINR": 0, "highINR": 0, "note": "indicative workshop cost in India for one piece" },
  "careNotes": ["short care tips"],
  "tags": ["search keywords"]
}
Rules: dimensions are realistic millimetres for this kind of piece (seatHeight 0 if none). Give 8 to 14 parts in build order from top to bottom and 6 to 8 materials. Be honest that every number is an estimate from one photo. Never invent brand names.`;

function cleanImage(v: unknown): string | null {
  return typeof v === "string" && /^data:image\/(png|jpe?g|webp|heic|heif);base64,/.test(v) && v.length < MAX_IMAGE_CHARS ? v : null;
}

// ---------------------------------------------------------------------------------------------

const toolFor = (b: { action?: unknown; tier?: unknown } | null): string | null => {
  switch (b?.action) {
    case "analyze": return TOOL_ANALYZE;
    case "sheet": return tierOf(b as { tier?: unknown }) === "quick" ? TOOL_SHEET_QUICK : tierOf(b as { tier?: unknown }) === "premium" ? TOOL_SHEET_PRO : TOOL_SHEET;
    case "image": return TOOL_IMAGE;
    default: return null;
  }
};

Deno.serve(
  billed(
    {
      tool: toolFor,
      defaultCredits: (id) => DEFAULT_CREDITS[id],
      isImage: (id) => id !== TOOL_ANALYZE,
    },
    async (req, ctx) => {
      if (req.method !== "POST") return bad("method_not_allowed", 405);
      const body = (ctx.body ?? {}) as Record<string, unknown>;
      const action = String(body.action || "");
      if (!toolFor(body)) return bad("Unknown action.");

      const photo = cleanImage(body.image);
      if (!photo) return bad("Add one photo under 10 MB (JPG, PNG or WebP).");

      try {
        if (action === "analyze") {
          const content: Part[] = [{ type: "text", text: ANALYZE_PROMPT }, { type: "image_url", image_url: { url: photo } }];
          const text = await chat([{ role: "user", content }], { model: "google/gemini-2.5-flash", json: true, maxTokens: 3000, temperature: 0.3 });
          const spec = parseJson<Record<string, unknown>>(text);
          if (!spec || typeof spec !== "object" || !("parts" in spec)) throw new ModelError(502, "The photo could not be read. You were not charged.");
          return json({ ok: true, spec, output: String(spec.summary ?? spec.name ?? "Furniture spec ready.") });
        }

        if (action === "sheet") {
          const hybrid = body.hybrid !== false;
          const prompt = hybrid && BOARD_TYPES[String(body.sheetType)] ? boardPrompt(body) : sheetPrompt(body);
          const models = TIER_MODELS[tierOf(body)];
          let last: unknown = null;
          for (const model of models) {
            try {
              const url = await image(prompt, [photo], model);
              return json({ ok: true, image: url, model, hybrid: hybrid && !!BOARD_TYPES[String(body.sheetType)] });
            } catch (e) {
              last = e;
              // Only an unavailable model moves on to the next one; a rate limit stops here.
              if (e instanceof ModelError && e.status === 429) break;
            }
          }
          throw last instanceof Error ? last : new ModelError(502, "The sheet could not be drawn. You were not charged.");
        }

        // action === "image"
        const prompt = imagePrompt(body);
        if (!prompt) return bad("Unknown picture type.");
        const url = await image(prompt, [photo], IMAGE_MODEL);
        return json({ ok: true, image: url });
      } catch (e) {
        if (e instanceof ModelError) return json({ error: e.message, message: e.message }, e.status);
        return json({ error: e instanceof Error ? e.message : String(e) }, 500);
      }
    },
  ),
);

