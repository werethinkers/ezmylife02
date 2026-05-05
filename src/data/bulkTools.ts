// Registry of tools that support Bulk Mode.
// Tools NOT in this map do not render the BulkModeToggle.
// Excluded by design: SpeedyNotebook, PromptMaster, Virasat, Tools Chat,
// Personalized Tools, Meet Nudge dashboards, calculators, wrapped iframe tools.

export type BulkMode = "client" | "edge";

export type BulkParamField =
  | {
      key: string;
      label: string;
      type: "select";
      options: { value: string; label: string }[];
      default: string;
      help?: string;
    }
  | {
      key: string;
      label: string;
      type: "number";
      min?: number;
      max?: number;
      step?: number;
      default: number;
      suffix?: string;
      help?: string;
    }
  | {
      key: string;
      label: string;
      type: "text";
      default?: string;
      placeholder?: string;
      help?: string;
    }
  | {
      key: string;
      label: string;
      type: "toggle";
      default: boolean;
      help?: string;
    };

export interface BulkPerFileField {
  key: string;
  label: string;
  type: "text";
  required?: boolean;
  placeholder?: string;
  /** When true, prefill from filename (without extension) on first add. */
  prefillFromFilename?: boolean;
}

export interface BulkToolConfig {
  toolId: string;
  toolName: string;
  /** HTML accept string, e.g. "image/*" or ".pdf,.pptx,.docx" */
  accept: string;
  /** Friendly hint shown in the dropzone (e.g. "PNG, JPG up to 50 images"). */
  hint: string;
  maxFiles: number;
  /** Per-file max size in MB. */
  maxFileSizeMb: number;
  /** "client" = browser-side processing (free image ops); "edge" = AI dispatch. */
  mode: BulkMode;
  /** Estimated AI cost per item in INR (₹) — shown for transparency. 0 for free client ops. */
  estCostPerItemInr: number;
  /** Brief description of what the bulk run produces. */
  outputDescription: string;
  /** Optional per-tool settings — applied to every file in the batch. */
  params?: BulkParamField[];
  /** Optional per-file inputs collected inline next to each uploaded file. */
  perFileFields?: BulkPerFileField[];
}

export const BULK_TOOLS: Record<string, BulkToolConfig> = {
  // --- AI image tools (edge) ---
  "background-remover": {
    toolId: "background-remover",
    toolName: "Background Remover",
    accept: "image/*",
    hint: "Drop up to 50 photos · PNG, JPG, WEBP",
    maxFiles: 50,
    maxFileSizeMb: 15,
    mode: "edge",
    estCostPerItemInr: 0.95,
    outputDescription: "ZIP of transparent PNGs",
    params: [
      {
        key: "background",
        label: "Background",
        type: "select",
        default: "transparent",
        options: [
          { value: "transparent", label: "Transparent PNG" },
          { value: "white", label: "Solid White" },
          { value: "black", label: "Solid Black" },
          { value: "custom", label: "Custom hex color" },
        ],
      },
      {
        key: "background_hex",
        label: "Hex color",
        type: "text",
        default: "#ffffff",
        placeholder: "#ffffff",
        help: "Used only when background is set to Custom",
      },
    ],
  },
  "passport-photo-maker": {
    toolId: "passport-photo-maker",
    toolName: "Passport Photo Maker",
    accept: "image/*",
    hint: "Drop up to 30 portraits",
    maxFiles: 30,
    maxFileSizeMb: 15,
    mode: "edge",
    estCostPerItemInr: 1.14,
    outputDescription: "ZIP of passport-ready photos",
    params: [
      {
        key: "size_preset",
        label: "Size preset",
        type: "select",
        default: "india_35x45",
        options: [
          { value: "india_35x45", label: "India 35×45 mm" },
          { value: "us_2x2", label: "US 2×2 in" },
          { value: "schengen_35x45", label: "Schengen 35×45 mm" },
          { value: "uk_35x45", label: "UK 35×45 mm" },
        ],
      },
      {
        key: "background",
        label: "Background",
        type: "select",
        default: "white",
        options: [
          { value: "white", label: "White" },
          { value: "light_blue", label: "Light Blue" },
          { value: "red", label: "Red" },
          { value: "grey", label: "Grey" },
        ],
      },
    ],
  },
  "image-beautify": {
    toolId: "image-beautify",
    toolName: "Image Beautify",
    accept: "image/*",
    hint: "Drop up to 30 photos",
    maxFiles: 30,
    maxFileSizeMb: 15,
    mode: "edge",
    estCostPerItemInr: 1.14,
    outputDescription: "ZIP of enhanced images",
    params: [
      {
        key: "style",
        label: "Style",
        type: "select",
        default: "natural",
        options: [
          { value: "natural", label: "Natural" },
          { value: "studio", label: "Studio Portrait" },
          { value: "cinematic", label: "Cinematic" },
          { value: "vivid", label: "Vivid" },
        ],
      },
      {
        key: "strength",
        label: "Enhancement strength",
        type: "number",
        min: 1,
        max: 10,
        step: 1,
        default: 6,
      },
    ],
  },

  // --- Free browser image tools (client-side, $0) ---
  "image-compressor": {
    toolId: "image-compressor",
    toolName: "Image Compressor",
    accept: "image/*",
    hint: "Drop up to 100 images",
    maxFiles: 100,
    maxFileSizeMb: 20,
    mode: "client",
    estCostPerItemInr: 0,
    outputDescription: "ZIP of compressed images",
    params: [
      {
        key: "quality",
        label: "Quality",
        type: "number",
        min: 10,
        max: 100,
        step: 5,
        default: 70,
        suffix: "%",
      },
      {
        key: "format",
        label: "Output format",
        type: "select",
        default: "jpeg",
        options: [
          { value: "jpeg", label: "JPEG" },
          { value: "webp", label: "WebP" },
          { value: "png", label: "PNG" },
        ],
      },
    ],
  },
  "image-resizer": {
    toolId: "image-resizer",
    toolName: "Image Resizer",
    accept: "image/*",
    hint: "Drop up to 100 images",
    maxFiles: 100,
    maxFileSizeMb: 20,
    mode: "client",
    estCostPerItemInr: 0,
    outputDescription: "ZIP of resized images",
    params: [
      {
        key: "max_edge",
        label: "Max longest edge",
        type: "number",
        min: 320,
        max: 4096,
        step: 32,
        default: 1280,
        suffix: "px",
      },
      {
        key: "maintain_aspect",
        label: "Maintain aspect ratio",
        type: "toggle",
        default: true,
      },
      {
        key: "format",
        label: "Output format",
        type: "select",
        default: "jpeg",
        options: [
          { value: "jpeg", label: "JPEG" },
          { value: "png", label: "PNG" },
          { value: "webp", label: "WebP" },
        ],
      },
    ],
  },
  "image-grayscale": {
    toolId: "image-grayscale",
    toolName: "Image Grayscale",
    accept: "image/*",
    hint: "Drop up to 100 images",
    maxFiles: 100,
    maxFileSizeMb: 20,
    mode: "client",
    estCostPerItemInr: 0,
    outputDescription: "ZIP of grayscale images",
  },
  "image-rotator": {
    toolId: "image-rotator",
    toolName: "Image Rotator",
    accept: "image/*",
    hint: "Drop up to 100 images",
    maxFiles: 100,
    maxFileSizeMb: 20,
    mode: "client",
    estCostPerItemInr: 0,
    outputDescription: "ZIP of rotated images",
    params: [
      {
        key: "angle",
        label: "Rotation",
        type: "select",
        default: "90",
        options: [
          { value: "90", label: "90° clockwise" },
          { value: "180", label: "180°" },
          { value: "270", label: "270° (90° CCW)" },
        ],
      },
    ],
  },
  "image-blur": {
    toolId: "image-blur",
    toolName: "Image Blur",
    accept: "image/*",
    hint: "Drop up to 100 images",
    maxFiles: 100,
    maxFileSizeMb: 20,
    mode: "client",
    estCostPerItemInr: 0,
    outputDescription: "ZIP of blurred images",
    params: [
      {
        key: "radius",
        label: "Blur radius",
        type: "number",
        min: 1,
        max: 40,
        step: 1,
        default: 8,
        suffix: "px",
      },
    ],
  },
  "metadata-viewer": {
    toolId: "metadata-viewer",
    toolName: "Metadata Viewer",
    accept: "image/*",
    hint: "Drop up to 100 images",
    maxFiles: 100,
    maxFileSizeMb: 20,
    mode: "client",
    estCostPerItemInr: 0,
    outputDescription: "CSV of EXIF metadata",
  },

  // --- Document / AI-on-file tools (edge) ---
  "startup-analyser": {
    toolId: "startup-analyser",
    toolName: "Startup Analyser",
    accept: ".pdf,.pptx,.docx",
    hint: "Drop up to 10 pitch decks",
    maxFiles: 10,
    maxFileSizeMb: 20,
    mode: "edge",
    estCostPerItemInr: 11.4,
    outputDescription: "ZIP of investor-grade reports",
    params: [
      {
        key: "focus",
        label: "Report focus",
        type: "select",
        default: "investor",
        options: [
          { value: "investor", label: "Investor view" },
          { value: "founder", label: "Founder view" },
          { value: "market", label: "Market deep-dive" },
        ],
      },
      {
        key: "stage",
        label: "Stage",
        type: "select",
        default: "seed",
        options: [
          { value: "preseed", label: "Pre-seed" },
          { value: "seed", label: "Seed" },
          { value: "seriesa", label: "Series A+" },
        ],
      },
      {
        key: "industry",
        label: "Industry (optional)",
        type: "text",
        default: "",
        placeholder: "e.g. Fintech, SaaS, D2C",
      },
    ],
  },
  "business-card-scanner": {
    toolId: "business-card-scanner",
    toolName: "Business Card Scanner",
    accept: "image/*",
    hint: "Drop up to 50 business cards",
    maxFiles: 50,
    maxFileSizeMb: 15,
    mode: "edge",
    estCostPerItemInr: 0.29,
    outputDescription: "Contacts saved + CSV export",
    params: [
      {
        key: "auto_save_contacts",
        label: "Auto-save to my contacts",
        type: "toggle",
        default: true,
      },
      {
        key: "tag",
        label: "Tag (optional)",
        type: "text",
        default: "",
        placeholder: "e.g. SaaStr 2026",
      },
    ],
  },
};

export function getBulkConfig(toolId: string): BulkToolConfig | undefined {
  return BULK_TOOLS[toolId];
}

export const BULK_TOOL_IDS = Object.keys(BULK_TOOLS);

/** Build a defaults object from a config's `params` schema. */
export function defaultBulkParams(config: BulkToolConfig): Record<string, any> {
  const out: Record<string, any> = {};
  for (const p of config.params || []) {
    out[p.key] = (p as any).default ?? "";
  }
  return out;
}
