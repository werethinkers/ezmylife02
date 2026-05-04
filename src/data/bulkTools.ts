// Registry of tools that support Bulk Mode.
// Tools NOT in this map do not render the BulkModeToggle.
// Excluded by design: SpeedyNotebook, PromptMaster, Virasat, Tools Chat,
// Personalized Tools, Meet Nudge dashboards, calculators, wrapped iframe tools.

export type BulkMode = "client" | "edge";

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
  },
};

export function getBulkConfig(toolId: string): BulkToolConfig | undefined {
  return BULK_TOOLS[toolId];
}

export const BULK_TOOL_IDS = Object.keys(BULK_TOOLS);
