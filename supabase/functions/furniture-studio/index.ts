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
//   standard  Gemini 3.1 Flash Image (1K),           about $0.067 = 6.5 rupees  -> 52 credits
//   premium   Gemini 3 Pro Image,                    about $0.134 = 12.9 rupees -> 104 credits
//   image     Gemini 2.5 Flash Image                                            -> 31 credits
//   analyze   Flash with one photo, about 0.5 rupees                            -> 4 credits
// The rows are created on first use; admins can change them later.
const DEFAULT_CREDITS: Record<string, number> = {
  [TOOL_ANALYZE]: 4, [TOOL_SHEET_QUICK]: 31, [TOOL_SHEET]: 52, [TOOL_SHEET_PRO]: 104, [TOOL_IMAGE]: 31,
};

// Each tier tries its own model first and, only if that model is not available, the one after it.
const TIER_MODELS: Record<string, string[]> = {
  quick: ["google/gemini-2.5-flash-image"],
  standard: ["google/gemini-3.1-flash-image-preview", "google/gemini-2.5-flash-image"],
  premium: ["google/gemini-3-pro-image-preview", "google/gemini-3.1-flash-image-preview"],
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
  light:
    "LIGHT DRAFTING STYLE: white background, fine black linework, soft grey shading, a realistic rendered 3D exploded isometric at top-left, clean thin panel borders, small photoreal material swatches, a crisp title block at bottom-right. Looks like a luxury furniture maker's production drawing.",
  blueprint:
    "BLUEPRINT CAD STYLE: deep navy background, white and pale-cyan linework, yellow dimension numbers and panel titles, a few red cut-line accents, thin white panel borders, photoreal material swatches, a title block at bottom-right. Looks like a night-mode CAD export.",
  mono:
    "MONOCHROME LINE-ART STYLE: pure black line art on white paper, no fills and no colour, hatching for sections, thin panel borders, neat title block. Looks like a photocopied architect's drawing.",
  vintage:
    "VINTAGE DRAFTING STYLE: aged cream paper, brown-black ink linework with light wash shading, hand-lettered feel but fully legible, thin double-rule borders, an engraved-style title block.",
};

const SHEET_TYPES: Opt = {
  full:
    "Include ALL of these panels in one landscape sheet: (1) 3D exploded isometric assembly with numbered callout labels, (2) front elevation, (3) side elevation, (4) top plan, (5) section A-A, (6) a row of 5 to 7 lettered construction detail drawings (arm profile, back-to-seat junction, seat build-up, leg mounting, upholstery seam, and so on as fit the piece), (7) material and finish schedule with swatches M01 to M08, (8) parts schedule / bill of materials table, (9) specification legend notes, (10) title block.",
  exploded:
    "Make a single large exploded isometric assembly the hero of the sheet (about 60 percent of the area), every part separated along vertical guide lines with numbered callouts and leader lines, plus a compact parts schedule table and the title block.",
  ortho:
    "Include front elevation, side elevation, back elevation, top plan and section A-A, all fully dimensioned with dimension lines and arrows, with the title block. No exploded view.",
  details:
    "Include 8 to 12 enlarged construction detail drawings (joinery, cross-sections, upholstery build-ups, fixings, leg and foot details, hardware), each lettered with a title, with dimensions and material callouts, plus the title block.",
  bom:
    "Focus on production data: a large material and finish schedule with realistic swatches M01 onwards, a full parts schedule / bill of materials table (item, component, material, finish, qty, notes), specification legend notes, a small isometric thumbnail of the piece, and the title block.",
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
    "You are a senior furniture design engineer producing a manufacturer-ready TECHNICAL DESIGN SHEET from the attached photograph.",
    "Draw the SAME piece of furniture as in the photo: identical silhouette, proportions, upholstery pattern, piping, legs, hardware and materials. Do not invent a different design.",
    "Output ONE single landscape 3:2 image of the finished drawing sheet, edge to edge, with a thin outer border, every panel neatly aligned in a grid.",
    STYLES[style],
    SHEET_TYPES[kind],
    "All text must be spelled correctly, upper-case panel headings, small legible labels, sensible dimension values in " + unit + ". Dimension lines have arrows and numbers. Never show lorem ipsum or gibberish text.",
    specBlock(spec, unit),
    recolour ? `Material changes requested by the customer (apply them to every drawing, swatch and the parts schedule): ${recolour}.` : "",
    notes ? `Extra instructions from the customer: ${notes}` : "",
    "TITLE BLOCK (bottom-right, exact text):\n" + metaBlock(meta, spec, unit),
    "Do not add watermarks, logos of real brands, or people.",
  ].filter(Boolean).join("\n\n");
}

// Hybrid: Gemini draws only the drawings. No tables, no swatches, no title block (the browser adds those
// as exact text), so the whole picture goes to line quality, dimensions and construction detail.
const BOARD_TYPES: Opt = {
  full:
    "Layout of the board: top-left a large 3D exploded isometric assembly with numbered callout labels and leader lines; to its right the front elevation and side elevation; below them the top plan and section A-A; along the bottom a row of 6 or 7 lettered construction DETAIL drawings (each in its own thin frame with a title such as DETAIL A ARM PROFILE) chosen to fit the piece: arm or edge profile, back-to-seat junction, seat or top build-up, leg or foot mounting, upholstery seam or edge, back cushion or panel fill, full vertical section build-up.",
  exploded:
    "Layout of the board: ONE very large exploded isometric assembly filling about 80 percent of the board, every part separated along vertical dotted guide lines with numbered callouts (1, 2, 3 ...) and leader lines, and a small front elevation in the corner.",
  ortho:
    "Layout of the board: front elevation, side elevation, back elevation, top plan and section A-A, all large, fully dimensioned with dimension lines, arrows and numbers.",
  details:
    "Layout of the board: 9 to 12 large enlarged construction detail drawings in a tidy grid (joinery, cross-sections, upholstery and foam build-ups, fixings, leg and foot details, hardware), each in a thin frame with a lettered title, dimensions and short material callouts.",
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
    "You are a senior furniture design engineer drawing the DRAWING BOARD of a technical design sheet from the attached photograph.",
    "Draw the SAME piece of furniture as in the photo: identical silhouette, proportions, upholstery pattern, piping, legs, hardware and materials. Do not invent a different design.",
    "Output ONE single landscape 16:9 image, edge to edge, with a thin outer border. Spend every pixel on crisp, accurate, well-spaced drawings with generous detail.",
    STYLES[style],
    BOARD_TYPES[kind],
    "IMPORTANT: do NOT draw any title block, bill of materials, parts table, material swatches, specification notes or legend. Those are added separately. Leave the board clean with only drawings, panel titles, callout numbers and dimensions.",
    `Text rules: upper-case panel titles, small legible labels, correct spelling, dimension values in ${unit}. Dimension lines have arrows and numbers. Never show lorem ipsum or gibberish.`,
    d && (d.width || d.depth || d.height)
      ? `Use EXACTLY these overall dimensions in ${unit}: width ${d.width ?? "?"}, depth ${d.depth ?? "?"}, height ${d.height ?? "?"}${d.seatHeight ? `, seat height ${d.seatHeight}` : ""}. Every dimension line must add up to them.`
      : "",
    spec?.parts?.length ? `Number the exploded-view callouts to match this parts list (item number: component): ${spec.parts.slice(0, 20).map((p) => `${p.item}: ${clip(p.component, 40)}`).join("; ")}.` : "",
    recolour ? `Material changes requested by the customer (apply them to every drawing): ${recolour}.` : "",
    notes ? `Extra instructions from the customer: ${notes}` : "",
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
      return `Draw a clean isometric product illustration of the piece in the attached photo. ${keep} Soft flat shading, light background, thin outline, no text. Output only the image.`;
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

