import { businessDocs } from "./prices/business-docs";
import { businessTrackers } from "./prices/business-trackers";
import { contentAi } from "./prices/content-ai";
import { customApps } from "./prices/custom";
import { extras } from "./prices/extras";

// Default prices (credits per successful run) for apps built on the shared engines.
// They mirror supabase/functions/_shared/appSpecs.ts — the server's copy is what is charged;
// this copy only lets the page show the right price before the app's first run creates its
// pricing row. Every app costs at least 1 credit per use.
// One file per vertical in ./prices; a new vertical adds one file and one line here.
export const PRICE_GROUPS: Record<string, Record<string, number>> = {
  "business-docs": businessDocs,
  "business-trackers": businessTrackers,
  "content-ai": contentAi,
  custom: customApps,
  extras,
};

export const DEFAULT_PRICES: Record<string, number> = Object.assign({}, ...Object.values(PRICE_GROUPS));

export const defaultPrice = (toolId: string): number | undefined => DEFAULT_PRICES[toolId];

/** Bulk Mode tools processed on the server are charged per file at these price ids (see bulk-run). */
export const BULK_PRICE_ID: Record<string, string> = {
  "background-remover": "bulk-ai-background",
  "passport-photo-maker": "bulk-ai-passport",
  "image-beautify": "bulk-ai-beautify",
  "business-card-scanner": "meet-nudge",
};

/**
 * Apps that run entirely in the browser (image resize/crop/filters, calculators, planners…).
 * They cost us nothing to run, so they are charged the minimum (1 credit) once per use via
 * <UsageGate/> — no app on EZYOURLIFE is free.
 */
/** Jain study apps removed from the store at the owner's request (hidden from the catalogue). */
export const REMOVED_APPS = new Set<string>(["jain-video-stream", "jain-audio-stream", "jain-encyclopedia", "jain-ganit", "jain-panchang", "jainbhugol-maps", "jaingyan-ai", "shastra-hover-dictionary", "kundkund-ebook-bot", "kundkund-mindmap", "shastra-multi-pdf-ai-bot", "shastra-pdf-reader"]);

export const BROWSER_ONLY = new Set<string>(["pdf-chart-image-extractor","add-logo-image","add-name-dob-photo","add-text-image","ai-face-generator","ai-photo-enhancer","assignment-tracker","beautify-image","bibliography-generator","black-white","blemish-remover","blur-background","blur-face","blur-image","bulk-image-resizer","censor-photo","check-dpi","circle-crop","convert-dpi","edit-metadata","exam-scheduler","flashcard-maker","flip-image","freehand-crop","generate-signature","grade-calculator","grayscale-image","image-color-picker","increase-image-quality","increase-image-size-kb","instagram-grid","instagram-resize","join-images","lesson-planner","merge-photo-signature","motion-blur","pan-card-resize","passport-photo-maker","ai-id-photo-generator","picture-pixel-art","pixelate-face","pixelate-image","psc-photo-resize","quiz","quiz-maker","reduce-image-size-kb","remove-background","remove-metadata","remove-object-photo","resize-2x2-inch","resize-35x45mm","resize-3x4-inch","resize-4x6-inch","resize-600x600","resize-a4","resize-image-3.5x4.5","resize-image-cm","resize-image-inch","resize-image-mm","resize-image-pixel","resize-sign-6x2","resize-signature","resize-signature-50x20","retouch-image","rotate-image","split-image","square-crop","ssc-photo-resize","study-planner","super-resolution","tool-1","tool-2","tool-28","tool-3","tool-30","tool-4","tool-6","unblur-face","unblur-image","upsc-photo-resize","upscale-image-ai","view-metadata","watermark-images","whatsapp-dp","youtube-banner","zoom-out-image"]);

/**
 * Apps whose runs are charged under a newer price id (re-priced to cost; the server creates
 * these rows with the default below on first use, and admins can edit them in Credits admin).
 */
export const CHARGE_ID: Record<string, string> = {
  "thumbnail-maker": "thumbnail-maker-img",
  "video-maker": "video-keyframe",
  "virasat": "virasat-book",
  "content-workflow": "content-workflow-step",
  "startup-analyser": "startup-analyser-flash",
  "productvision-360": "productvision-angle",
};

/** The price id a page should show for an app. */
export const priceIdFor = (toolId: string) => CHARGE_ID[toolId] ?? toolId;

/**
 * Apps that would otherwise be usable without paying (browser-only tools, plus trackers,
 * editors and makers whose AI step is optional). They are charged their price once per use.
 */
export const USAGE_GATED = new Set<string>([
  ...BROWSER_ONLY,
  "tool-21", "tool-23", "tool-32", "tool-33", "tool-34", "tool-37", "tool-35", "tool-25", "tool-26", "tool-20", "tool-24", "tool-39",
  "tool-22", "html-editor", "rich-editor", "book-editor", "book-editor-html", "smart-diagram-ai", "ai-data-analysis", "pdf-metadata-ai-analyst",
]);
