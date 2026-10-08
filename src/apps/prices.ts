// Default prices (credits per successful run) for apps built on the shared engines.
// They mirror supabase/functions/_shared/appSpecs.ts — the server's copy is what is charged;
// this copy only lets the page show the right price before the app's first run creates its
// pricing row. Apps that run entirely in the browser are 0 (free).
export const DEFAULT_PRICES: Record<string, number> = {
  "tool-10": 2,
  "tool-12": 2,
  "tool-18": 2,
  "tool-29": 2,
  "tool-38": 2,
  "tool-8": 3,
  "tool-36": 2,
  "tool-9": 2,
  "tool-16": 2,
  "tool-14": 1,
  "tool-7": 3,
  "tool-5": 2,
  "tool-27": 1,
  "tool-13": 1,
  "tool-11": 1,
  "tool-15": 2,
  "tool-19": 1,
  "tool-17": 2,
  "tool-31": 1,
  "tool-22": 1,
  "tool-21": 1,
  "tool-23": 1,
  "tool-32": 1,
  "tool-33": 2,
  "tool-34": 1,
  "tool-37": 1,
  "tool-35": 1,
  "tool-25": 1,
  "tool-26": 1,
  "tool-20": 1,
  "tool-24": 1,
  "tool-39": 1,
  "cognimap": 2,
  "wrong-written-words": 1,
  "storybook-creator": 2,
  "smart-diagram-ai": 1,
  "kundkund-mindmap": 1,
  "interactive-videos": 1,
  "soul-mirror": 1,
  "ai-data-analysis": 2,
  "advance-ai-bot": 1,
  "html-editor": 1,
  "rich-editor": 1,
  "book-editor": 1,
  "book-editor-html": 1,
  "shastra-multi-pdf-ai-bot": 2,
  "kundkund-ebook-bot": 2,
  "shastra-pdf-reader": 1,
  "pdf-metadata-ai-analyst": 1,
  "pdf-profile-extractor": 2,
  "dictionary-extractor-ai": 1,
  "ocr": 1,
  "advance-text-extractor": 2,
  "auto-text-extractor": 2,
  "jaingyan-ai": 1,
  "shastra-hover-dictionary": 1,
  "jain-encyclopedia": 1,
  "jain-ganit": 1,
  "jainbhugol-maps": 1,
  "image-creator": 12,
  "create-3d-images": 12,
  "sketchflow-ai": 12,
  "storybook-illustration": 12,
  "thumbnail-maker": 12,
  "startup-analyser-chat": 1,
  "productvision-angle": 12,
  "thumbnail-maker-img": 12,
  "video-keyframe": 12,
  "virasat-book": 10,
  "content-workflow-step": 1,
  "startup-analyser-flash": 10,
  "bulk-ai-background": 12,
  "bulk-ai-passport": 12,
  "bulk-ai-beautify": 12,
  "jain-panchang": 0,
  "jain-video-stream": 0,
  "jain-audio-stream": 0,
  "pdf-chart-image-extractor": 0,
};

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
 * They have no AI or server cost and never deduct credits, so they are shown as Free
 * (their old "1 credit" rows in tool_pricing are ignored for display).
 */
/** Jain study apps removed from the store at the owner's request (hidden from the catalogue). */
export const REMOVED_APPS = new Set<string>(["jain-video-stream", "jain-audio-stream", "jain-encyclopedia", "jain-ganit", "jain-panchang", "jainbhugol-maps", "jaingyan-ai", "shastra-hover-dictionary", "kundkund-ebook-bot"]);

export const BROWSER_ONLY = new Set<string>(["add-logo-image","add-name-dob-photo","add-text-image","ai-face-generator","ai-photo-enhancer","assignment-tracker","beautify-image","bibliography-generator","black-white","blemish-remover","blur-background","blur-face","blur-image","bulk-image-resizer","censor-photo","check-dpi","circle-crop","convert-dpi","edit-metadata","exam-scheduler","flashcard-maker","flip-image","freehand-crop","generate-signature","grade-calculator","grayscale-image","image-color-picker","increase-image-quality","increase-image-size-kb","instagram-grid","instagram-resize","join-images","lesson-planner","merge-photo-signature","motion-blur","pan-card-resize","passport-photo-maker","picture-pixel-art","pixelate-face","pixelate-image","psc-photo-resize","quiz","quiz-maker","reduce-image-size-kb","remove-background","remove-metadata","remove-object-photo","resize-2x2-inch","resize-35x45mm","resize-3x4-inch","resize-4x6-inch","resize-600x600","resize-a4","resize-image-3.5x4.5","resize-image-cm","resize-image-inch","resize-image-mm","resize-image-pixel","resize-sign-6x2","resize-signature","resize-signature-50x20","retouch-image","rotate-image","split-image","square-crop","ssc-photo-resize","study-planner","super-resolution","tool-1","tool-2","tool-28","tool-3","tool-30","tool-4","tool-6","unblur-face","unblur-image","upsc-photo-resize","upscale-image-ai","view-metadata","watermark-images","whatsapp-dp","youtube-banner","zoom-out-image"]);

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
