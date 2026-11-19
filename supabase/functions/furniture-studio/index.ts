// Furniture Sheets studio: photo of a piece of furniture in, Gemini out.
//
//   action "analyze"  reads the photo and returns a structured spec (name, size, parts, materials,
//                     joinery, foam build-up, cutting lists, QC fields, etc.) as JSON.
//                     charged as furniture-analyze
//   action "sheet"    draws the technical design sheet. By default (hybrid) Gemini draws only the DRAWINGS
//                     (exploded view, elevations, plan, section, details) on a wide board; the browser then
//                     adds the parts list, materials, notes and title block as exact text. Three quality tiers.
//                     Six sheet types: full | exploded | ortho | details | structural | manufacturing | assembly | bom
//                     charged as furniture-sheet-quick / furniture-sheet / furniture-sheet-pro
//   action "image"    one picture: product view, catalogue shot, isometric, line drawing, room scene,
//                     colourway or a free edit.                           charged as furniture-image
//
// AI goes only through _shared/llm.ts (AGENTS.md). Each call is one charge by billed(): success charges,
// any error costs nothing.
import { json } from "../_shared/http.ts";
import { billed } from "../_shared/billing.ts";
import { chat, image, ModelError, type Part } from "../_shared/llm.ts";
import { readSpec } from "./repair.ts";

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
    • Full 3D photorealistic/near-photorealistic render of the actual furniture piece from the photo
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
    • Numbered layer callouts (①②③…) keyed to a right-margin legend listing each layer
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
    "• ALL DIMENSIONS INDICATIVE — VERIFY PRIOR TO PRODUCTION."
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
- FRONT ELEVATION: full-width front view, all exterior dimensions (overall width, height, seat height, arm height), section cut A-A arrows
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

  structural: `STRUCTURAL ENGINEERING SHEET — internal frame and support structure without upholstery:
- TOP ZONE: large 3D isometric "X-ray" or transparent view showing only the internal frame and structure
  • Main wooden frame members shown as solid structural sections
  • Plywood panels shown hatched
  • Steel brackets and metal hardware shown solid
  • All components clearly separated and visible
  • Numbered callout badges for each structural element (①②③…), no text labels — browser overlays them
- MIDDLE ZONE: FRONT STRUCTURAL ELEVATION and SIDE STRUCTURAL ELEVATION side by side
  • Both views show ONLY the structural skeleton, no upholstery
  • Dimension lines with closed arrowheads (leave value gaps blank), extension lines
  • Centre lines as dash-dot
  • Section cut arrows for Section B-B
- BOTTOM ZONE: SECTION B-B cross-section through the structural core
  • Show only the frame, platform and hardware layers
  • Numbered callout badges for each structural layer (①②③…)
  • Dimension arrowheads with blank value gaps
- NO text labels or dimension values anywhere — browser overlays all text
- TITLE BLOCK bottom-right`,

  manufacturing: `MANUFACTURING PACKAGE SHEET — cutting lists, material schedules, detailed BOM:
- TOP ZONE (top 40%):
  LEFT — large 3D isometric of the complete assembled piece (photorealistic), ~40% width
  RIGHT — CUTTING LIST tables (one per material type: PLYWOOD | SOLID WOOD | METAL | FOAM):
    Each table: columns PART ID | COMPONENT | L | W | T/THICKNESS | QTY | NOTES
    Show at least 4 rows per material type, fill with realistic component dimensions
    Label each table in bold ALL CAPS
- MIDDLE ZONE (30%): MATERIAL & FINISH SCHEDULE
  2 rows × 4 swatches (M01–M08), each swatch a large realistic texture square, code + full name + grade below
  For each material: grade, thickness/density, finish, colour
- BOTTOM ZONE (30%): full-width DETAILED BOM table
  All columns: ITEM NO. | COMPONENT ID | COMPONENT NAME | MATERIAL CODE | RAW MATERIAL | LENGTH | WIDTH | THICKNESS | QTY | FINISH | PROCESS | DRAWING REF | NOTES
  At least 10–12 rows, all filled with realistic values, NO truncation
  TITLE BLOCK bottom-right`,

  assembly: `ASSEMBLY & QUALITY CONTROL SHEET — build sequence, inspection and testing:
- TOP ZONE (top 45%):
  LEFT — ASSEMBLY SEQUENCE (numbered stages diagram):
    Large numbered step diagram showing the construction order:
    STAGE 1: BASE FRAME ASSEMBLY — components, fasteners used
    STAGE 2: SUSPENSION INSTALLATION — webbing, springs
    STAGE 3: SEAT DECK INSTALLATION
    STAGE 4: FRAME UPHOLSTERY — foam, dacron, fabric attachment
    STAGE 5: BACKREST ASSEMBLY AND ATTACHMENT
    STAGE 6: ARM / DETAIL ELEMENT INSTALLATION
    STAGE 7: BASE AND HARDWARE INSTALLATION
    STAGE 8: FINAL UPHOLSTERY AND FINISHING
    Each stage: numbered box with arrows showing direction of assembly
  RIGHT — FASTENER AND HARDWARE SCHEDULE table:
    Columns: ID | DESCRIPTION | MATERIAL | SIZE | QTY | LOCATION
    At least 8 rows with realistic fastener specs (screws, bolts, brackets, glides)
- BOTTOM ZONE (55%): QUALITY CONTROL AND INSPECTION CHECKLIST
  Large table with columns: CHECK NO. | INSPECTION ITEM | NOMINAL DIMENSION | TOLERANCE | PASS CRITERION | REMARKS
  Rows covering: overall width, depth, height, seat height, joint strength, foam density confirmation,
  upholstery tension, surface finish, hardware function, structural stability, leg levelness
  Show PASS/FAIL column, target values, tolerance values (±5mm for major dims, ±2mm for details)
  Label clearly "DIMENSIONAL INSPECTION RECORD — MARK ACTUAL AS MEASURED"
  Add note: "DO NOT CERTIFY UNTIL ALL CHECKS PASSED AND SIGNED OFF"
  TITLE BLOCK bottom-right`,

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
  foamLayers?: Array<{ component?: string; layer?: string; density?: string; thickness?: string; hardness?: string }>;
  cuttingLists?: Array<{ materialType?: string; components?: Array<{ partId?: string; name?: string; length?: number; width?: number; thickness?: number; qty?: number; notes?: string }> }>;
  structuralComponents?: Array<{ item?: number; component?: string; material?: string; dimensions?: string; qty?: number; notes?: string }>;
  assemblyStages?: Array<{ stage?: number; title?: string; components?: string[]; fasteners?: string; notes?: string }>;
  qcChecks?: Array<{ checkNo?: number; item?: string; nominal?: string; tolerance?: string; criterion?: string }>;
  metalComponents?: Array<{ item?: number; component?: string; material?: string; thickness?: string; finish?: string; notes?: string }>;
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
    out.push(`Use EXACTLY these overall dimensions in ${unit}: width ${d.width ?? "?"}, depth ${d.depth ?? "?"}, height ${d.height ?? "?"}${d.seatHeight ? `, seat height ${d.seatHeight}` : ""}. Make every dimension line add up to them. All orthographic views MUST show the same geometry.`);
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
    "DIMENSIONAL CONSISTENCY RULE: All orthographic views (front, side, back, top, section) must show EXACTLY the same piece at EXACTLY the same geometry. The front elevation width must equal the top plan width. The side elevation depth must equal the top plan depth. Every sub-dimension must add up to its overall. If you are not certain of a value from the photo, write 'INDICATIVE / TO BE VERIFIED' next to it — never present an estimate as a verified manufacturing dimension.",
    "VISUAL STYLE TO APPLY:\n" + STYLES[style],
    "SHEET CONTENT AND PANEL LAYOUT:\n" + SHEET_TYPES[kind],
    `TEXT AND DIMENSION RULES:
- All text: correctly spelled, ALL CAPS for panel headings and callout labels
- Dimension text: small (7px equivalent), placed on dimension lines with closed arrowheads at both ends
- All dimensions in ${unit} — use realistic values appropriate for the furniture category
- Dimension lines: show both overall dimensions AND sub-dimensions (e.g. three equal seat bay widths that sum to overall width)
- Section callout numbers on the cross-section use circled numerals ①②③ with a right-margin legend
- No lorem ipsum, no placeholder text, no gibberish — all text must be real and meaningful
- Mark all AI-estimated dimensions with "(INDICATIVE)" — never present them as verified measurements`,
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
    • Accurate orthographic front projection of the piece — SAME geometry as TOP PLAN width
    • Dimension lines: closed arrowheads at both ends, extension lines — LEAVE dimension value blank (draw the line and arrowhead only)
    • Section cut arrow pair "A ← →A" with arrows showing cut location
    • Bold panel title "FRONT ELEVATION"
  RIGHT — SIDE ELEVATION (~28% width):
    • Accurate orthographic side/profile projection — SAME depth as TOP PLAN depth
    • Dimension lines with closed arrowheads — LEAVE values blank, browser overlays them
    • Bold panel title "SIDE ELEVATION"

MIDDLE ZONE (next 15% of board):
  LEFT — TOP PLAN (~32% width):
    • True orthographic overhead view — width MUST match FRONT ELEVATION width; depth MUST match SIDE ELEVATION depth
    • Dimension lines with arrowheads — values left blank
    • Centre lines as dash-dot lines
    • Bold panel title "TOP PLAN"
  RIGHT — SECTION A-A (~62% width):
    • Full vertical cross-section at the A-A cut line from front elevation — interior must match the construction described in the spec
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
- SIDE ELEVATION: full profile, dimension lines with arrowheads (blank values) — depth shown MUST equal the top plan depth
- BACK ELEVATION: rear view with dimension arrowheads
- TOP PLAN: overhead view, dimension arrowheads, centre lines as dash-dot — width shown MUST equal the front elevation width
- SECTION A-A: vertical cross-section, interior construction, numbered layer callouts ①②③… with leader lines (NO right-margin legend text — browser overlays it)
- GEOMETRIC CONSISTENCY: All four views show the SAME piece. Front elevation width = top plan width. Side elevation depth = top plan depth. No view may show different proportions from another.
- All dimension lines: closed arrowheads at both ends, extension lines, value gap left blank
- All bold panel titles in ALL CAPS`,

  details: `CONSTRUCTION DETAILS DRAWING BOARD — 9 to 12 enlarged detail drawings (geometry and hatching only):
- Tidy grid of 9–12 large detail drawings, each in its own thin-bordered sub-panel
- Every detail: bold ALL-CAPS title (DETAIL A — ARM PROFILE, etc.), 45-degree section hatching on cut faces, dimension arrowheads with blank value gaps, numbered callout badges ①②③ with leader lines but NO text labels (browser overlays them)
- Include: arm/edge cross-section, back-to-seat junction, seat cushion build-up layers (show ALL foam/dacron/fabric layers), leg mounting hardware, upholstery seam and piping, panel joinery (dowel/bolt/bracket), back cushion fill, full vertical section with numbered layers
- Each detail enlarged enough to read all geometry clearly — NO text crammed in tight spaces
- Each detail should be a separate close-up at a larger scale than the main elevations`,

  structural: `STRUCTURAL FRAME DRAWING BOARD — internal skeleton only, no upholstery (geometry only, NO text labels):
- TOP ZONE (top 50%): large 3D isometric of the furniture piece WITHOUT upholstery — show only the internal structural frame
  • Wooden frame members shown as solid rectangular sections with correct joinery
  • Plywood panels shown with 45-degree cross-hatching
  • Steel brackets and metal hardware shown as solid shapes
  • Parts floated apart slightly (semi-exploded) to show all structural connections
  • Numbered callout badges ①②③…⑩ for each structural element — NO text, browser overlays
  • Bold panel title "STRUCTURAL FRAME ASSEMBLY — WITHOUT UPHOLSTERY"
- MIDDLE ZONE (25%): FRONT STRUCTURAL ELEVATION and SIDE STRUCTURAL ELEVATION side by side
  • Show only the structural skeleton: main frame members, brackets, leg positions
  • Dimension lines with closed arrowheads (blank value gaps)
  • Section cut arrows for Section B-B
  • Bold panel titles "FRONT STRUCTURAL ELEVATION" and "SIDE STRUCTURAL ELEVATION"
- BOTTOM ZONE (25%): SECTION B-B through the structural core
  • Show only frame, platform, brackets, hardware — no foam or upholstery
  • Numbered callout badges ①②③ for each structural layer
  • 45-degree section hatching on cut faces of solid wood and plywood
  • Dimension arrowheads with blank value gaps
  • Bold panel title "SECTION B-B — STRUCTURAL CORE"`,

  manufacturing: `MANUFACTURING PACKAGE DRAWING BOARD — parts data focus (geometry + tables, NO text overlays needed for tables):
- TOP ZONE (top 45%):
  LEFT (~40% width): Large 3D isometric of the complete assembled piece from the photo
    • Photorealistic render showing all materials, textures and hardware
    • Small numbered callout badges ①②③ for key components
    • Bold title "PRODUCT ISOMETRIC"
  RIGHT (~55% width): CUTTING SCHEDULE tables — draw 4 small tables side by side:
    TABLE 1: PLYWOOD CUTTING LIST — columns: PART ID | LENGTH | WIDTH | THKNS | QTY
    TABLE 2: SOLID WOOD CUTTING LIST — same columns
    TABLE 3: FOAM CUTTING LIST — PART ID | LENGTH | WIDTH | HEIGHT | DENSITY | QTY
    TABLE 4: METAL CUTTING LIST — PART ID | LENGTH | WIDTH | THKNS | GRADE | QTY
    Fill each table with 4–6 rows of realistic component dimensions based on the furniture spec
    Use thin-rule table borders, light grey alternate row fills, dark header rows
- MIDDLE ZONE (10%): MATERIAL SPECIFICATION HEADER BAND
  A single row of 8 material swatch squares (M01–M08), each with code and name
- BOTTOM ZONE (45%): DETAILED BILL OF MATERIALS table spanning full width
  Columns: NO | COMPONENT ID | COMPONENT NAME | MAT CODE | RAW MATERIAL | L | W | T | QTY | FINISH | PROCESS | REF
  At least 12 rows with realistic component names and dimensions — NO truncation
  Light grey alternate rows, dark header
  Bold label "ASSEMBLY BILL OF MATERIALS" above the table`,

  assembly: `ASSEMBLY & QUALITY CONTROL DRAWING BOARD — process and inspection (geometry and diagrams, NO text overlays needed):
- TOP ZONE (top 50%):
  LEFT (~55% width): ASSEMBLY SEQUENCE DIAGRAM
    • 8 numbered assembly stage boxes arranged in a flow chart with arrows
    • Each stage box: stage number in a circle, bold ALL-CAPS title, small diagram showing what gets assembled
    • STAGE 1: BASE FRAME ASSEMBLY; STAGE 2: SUSPENSION INSTALLATION; STAGE 3: SEAT DECK;
      STAGE 4: SEAT FOAM & DACRON; STAGE 5: BACKREST ASSEMBLY; STAGE 6: ARM / SPECIAL ELEMENTS;
      STAGE 7: BASE & HARDWARE; STAGE 8: FINAL UPHOLSTERY
    • Arrows between stages showing sequence direction
    • Bold label "ASSEMBLY SEQUENCE — 8 STAGES" at top
  RIGHT (~40% width): FASTENER & HARDWARE SCHEDULE table
    • Columns: ID | DESCRIPTION | MATERIAL | SIZE | QTY | LOCATION
    • 8–10 rows with realistic fastener specs (pocket screws, lag bolts, steel brackets, nylon glides, etc.)
    • Bold label "FASTENER & HARDWARE SCHEDULE" at top
- BOTTOM ZONE (50%): QUALITY CONTROL INSPECTION RECORD
  • Full-width table with columns: CHECK NO. | INSPECTION ITEM | NOMINAL | TOLERANCE | CRITERION | ACTUAL | PASS/FAIL
  • At least 12 rows covering dimensional, structural, upholstery, hardware and finish checks
  • Include realistic tolerance values: ±5mm for major dimensions, ±2mm for details, foam density ±2 kg/m3
  • Leave ACTUAL and PASS/FAIL columns blank (they are for factory use)
  • Add underline row at bottom: "INSPECTOR SIGNATURE: ____________ DATE: ____________ APPROVED: ____________"
  • Bold label "DIMENSIONAL & QUALITY INSPECTION RECORD" at top`,

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
    `DRAWING GEOMETRY RULES:
- Draw all dimension lines WITH closed arrowheads and extension lines but leave the value blank (a short dash "—" if needed).
- Draw callout leader lines ending in numbered circles (①②…) with NO accompanying text label. The browser will overlay all dimension values and legend text as crisp vector text.
- GEOMETRIC CONSISTENCY RULE: All orthographic views must represent the same piece at the same scale. Front elevation width MUST visually match top plan width. Side elevation depth MUST visually match top plan depth. Never make the front view appear wider or narrower than the top plan shows from above.
- Focus all effort on accurate, beautiful geometry. The exploded isometric must look 3D and photo-quality.`,
    d && (d.width || d.depth || d.height)
      ? `USE EXACTLY THESE PROPORTIONS in ${unit}: width ${d.width ?? "?"}, depth ${d.depth ?? "?"}, height ${d.height ?? "?"}${d.seatHeight ? `, seat height ${d.seatHeight}` : ""}. All sub-dimensions must sum correctly to these overall values. These are the SINGLE SOURCE OF TRUTH for all views.`
      : "Use realistic dimensions appropriate for this furniture category (e.g. a standard sofa: width ~2000–2400mm, depth ~900mm, height ~800mm, seat height ~420mm). Use these SAME dimensions for EVERY view consistently.",
    spec?.parts?.length ? `The exploded view must have exactly ${Math.min(spec.parts.length, 20)} numbered callout badges (①②…). Number them ${spec.parts.slice(0, 20).map((p) => p.item).join(", ")} — the browser overlays the part names. Do NOT write part names in the image.` : "",
    spec?.foamLayers?.length ? `Foam/upholstery layer build-up for the cross-section (use these layers in Section A-A from outside to inside): ${spec.foamLayers.slice(0, 8).map((fl, i) => `${i + 1}. ${clip(fl.layer, 40)}${fl.thickness ? ` (${clip(fl.thickness, 20)})` : ""}`).join("; ")}` : "",
    spec?.structuralComponents?.length && (kind === "structural") ? `Structural components to show in this structural frame view: ${spec.structuralComponents.slice(0, 15).map((sc) => `${sc.item}. ${clip(sc.component, 40)} | ${clip(sc.material, 30)}`).join("; ")}` : "",
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
// Analysis — rich structured spec extraction
// ---------------------------------------------------------------------------------------------

const ANALYZE_PROMPT = `You are a senior furniture design engineer at a luxury manufacturer. Study the attached photo of a piece of furniture and reply with ONE JSON object only, no prose, no markdown fences. Use this exact shape:

{
  "name": "short product name e.g. 3-Seater Curved Bouclé Sofa",
  "category": "sofa | chair | armchair | bench | table | bed | cabinet | shelf | lighting | other",
  "style": "design style in a few words",
  "summary": "two plain sentences describing the piece",
  "dimensions": {
    "width": 0,
    "depth": 0,
    "height": 0,
    "seatHeight": 0,
    "armHeight": 0,
    "backHeight": 0,
    "seatDepth": 0,
    "baseHeight": 0,
    "unit": "mm",
    "confidence": "INDICATIVE — estimated from photo perspective; verify before production"
  },
  "parts": [
    {
      "item": 1,
      "component": "component name",
      "material": "material description",
      "finish": "finish description",
      "qty": 1,
      "notes": "construction notes"
    }
  ],
  "materials": [
    {
      "code": "M01",
      "name": "material name",
      "grade": "grade or specification",
      "thickness": "thickness or density",
      "finish": "finish description",
      "colour": "colour name",
      "application": "where used on the piece",
      "note": "additional technical note",
      "hex": "#RRGGBB approximate colour hex"
    }
  ],
  "foamLayers": [
    {
      "component": "which part e.g. SEAT CUSHION",
      "layer": "layer description e.g. TOP FABRIC",
      "density": "density in kg/m3 if foam",
      "thickness": "thickness in mm",
      "hardness": "ILD if applicable",
      "qty": 1,
      "notes": "shape or attachment notes"
    }
  ],
  "structuralComponents": [
    {
      "item": 1,
      "component": "structural component name",
      "material": "material",
      "dimensions": "L x W x T in mm e.g. 2600 x 80 x 50mm",
      "qty": 1,
      "notes": "where it is and what it does"
    }
  ],
  "cuttingLists": [
    {
      "materialType": "PLYWOOD | SOLID WOOD | METAL | FOAM | FABRIC",
      "components": [
        {
          "partId": "PW-01",
          "name": "component name",
          "length": 0,
          "width": 0,
          "thickness": 0,
          "qty": 1,
          "grain": "along length | across width | n/a",
          "notes": "edge treatment or CNC notes"
        }
      ]
    }
  ],
  "assemblyStages": [
    {
      "stage": 1,
      "title": "STAGE TITLE IN CAPS",
      "components": ["list of component names used in this stage"],
      "fasteners": "fasteners used e.g. 4x M8 hex bolts, 12x pocket screws",
      "notes": "assembly direction and method"
    }
  ],
  "qcChecks": [
    {
      "checkNo": 1,
      "item": "inspection item e.g. OVERALL WIDTH",
      "nominal": "target value e.g. 2600mm",
      "tolerance": "e.g. ±5mm",
      "criterion": "pass criterion e.g. 2595–2605mm"
    }
  ],
  "metalComponents": [
    {
      "item": 1,
      "component": "metal component name",
      "material": "steel grade / alloy",
      "thickness": "sheet thickness in mm",
      "finish": "surface finish",
      "mountingMethod": "how it attaches to the main structure",
      "notes": "load path and fabrication notes"
    }
  ],
  "joinery": ["how the main parts are joined, one line each"],
  "notes": ["specification legend lines: tolerances, foam density, finishing, assembly"],
  "cost": { "lowINR": 0, "highINR": 0, "note": "indicative workshop cost in India for one piece" },
  "careNotes": ["short care tips"],
  "tags": ["search keywords"]
}

RULES:
- dimensions: estimate from photographic proportion and standard ergonomic ranges for this furniture type. seatHeight is floor to top of uncompressed seat cushion. backHeight is floor to top of backrest. Measure ALL seven dimension fields. Mark every value with "confidence": "INDICATIVE — estimated from photo; verify before production."
- parts: 8 to 14 components in construction build order (bottom-to-top / inside-out). Include both visible and inferred internal components (frame, webbing, foam layers). Give realistic quantities.
- materials: 6 to 10 entries. For each: grade (e.g. "18mm Birch Plywood BB/CC grade"), thickness/density (e.g. "35 kg/m3"), finish, colour, where used. Mark proposed specs as "PROPOSED — verify with supplier".
- foamLayers: list every foam and upholstery layer for each major upholstered section (seat, backrest, arms if present) from outside-in: outer fabric → dacron wrap → soft foam → hr foam → structural base. Include thickness and density for each foam layer.
- structuralComponents: list 6–10 major structural members with their approximate dimensions from your analysis of the photo and the overall dimensions.
- cuttingLists: generate plywood, solid wood, foam, and (if metal is present) metal cutting lists based on the structural components and dimensions. Each item should have realistic dimensions that sum correctly to the overall piece.
- assemblyStages: 6–8 logical build stages in factory assembly order.
- qcChecks: 10–12 inspection items covering dimensional, structural, upholstery and hardware checks.
- metalComponents: list only if the piece has integrated metal elements (trays, brackets, frames, legs). Include mounting method and load path.
- Never invent brand names or certified test data. Mark all estimates clearly.`;

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
          const content: Part[] = [
            { type: "text", text: ANALYZE_PROMPT + "\n\nWrite the JSON compactly on as few lines as possible (no indentation) and keep every text value short." },
            { type: "image_url", image_url: { url: photo } },
          ];
          // The full spec is long: give the model room, and if the answer still comes back cut off or
          // malformed, repair it; failing that, ask once more before giving up.
          let spec: Record<string, unknown> | null = null;
          for (let attempt = 0; attempt < 2 && !spec; attempt++) {
            const text = await chat([{ role: "user", content }], { model: "google/gemini-2.5-flash", json: true, maxTokens: 16000, temperature: 0.3 });
            spec = readSpec(text);
          }
          if (!spec) throw new ModelError(502, "The photo could not be read. You were not charged.");
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
