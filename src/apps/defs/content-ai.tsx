// Thinking, chat, text-from-image and picture apps. Prices mirror supabase/functions/_shared/appSpecs/content-ai.ts.
import { p, LANG } from "./shared";
import type { AppDef } from "../types";

export const contentAi: Record<string, AppDef> = {
  "cognimap": {
    engine: "doc", credits: p("cognimap"), fileName: "mental-models", cta: "Think it through",
    intro: "Run a decision or problem through six mental models — first principles, inversion, second-order effects and more.",
    related: ["soul-mirror", "smart-diagram-ai", "startup-analyser"],
    fields: [
      { key: "Decision or problem", label: "Your decision or problem", type: "textarea", rows: 4, required: true, placeholder: "Should I open a second outlet in Vijay Nagar or invest in online delivery first?" },
      { key: "Options", label: "Options you're considering", type: "textarea", rows: 2 },
      { key: "Constraints", label: "Constraints (money, time, people)", type: "textarea", rows: 2 },
      LANG,
    ],
  },
  // ═════════════ CHAT ═════════════
  "advance-ai-bot": {
    engine: "chat", credits: p("advance-ai-bot"),
    intro: "A general AI assistant for writing, explaining, planning and everyday questions.",
    welcome: "Ask anything — draft an email, explain a concept, plan a trip, solve a maths problem.",
    suggestions: ["Write a polite payment reminder", "Explain GST input credit simply", "Plan a 3-day Udaipur trip", "Summarise this paragraph:"],
    related: ["rich-editor", "cognimap"],
  },
  // ═════════════ VISION ═════════════
  "ocr": {
    engine: "vision", credits: p("ocr"), mode: "text", fileName: "ocr-text", cta: "Extract text",
    intro: "Turn photos, screenshots and scanned PDF pages into editable text — Hindi, English and more.",
    steps: ["Add a photo or PDF", "Extract", "Copy, save or send on"],
    related: ["advance-text-extractor", "auto-text-extractor", "tool-8", "ai-data-analysis"],
  },
  "advance-text-extractor": {
    engine: "vision", credits: p("advance-text-extractor"), mode: "text", fileName: "extracted", cta: "Extract & structure",
    intro: "Converts document images into clean, structured Markdown — headings, lists and tables preserved.",
    related: ["ocr", "auto-text-extractor", "rich-editor", "ai-data-analysis"],
  },
  "auto-text-extractor": {
    engine: "vision", credits: p("auto-text-extractor"), mode: "fields", fileName: "fields", cta: "Extract fields",
    intro: "Snap an invoice, bill, receipt or card — get every field and line item as an editable table and CSV.",
    related: ["tool-2", "tool-1", "ocr", "meet-nudge"],
  },

  // ═════════════ IMAGES ═════════════
  "image-creator": {
    engine: "image", credits: p("image-creator"), promptLabel: "Describe the image", promptPlaceholder: "A cosy Indian chai stall at sunrise, steam rising, warm light",
    intro: "Create original images from a description — for posts, posters, products and presentations.",
    styles: ["Photo-realistic", "Illustration", "Watercolour", "Flat vector", "Cinematic", "Minimal"],
    aspects: ["1:1", "4:5", "16:9", "9:16"], allowReference: true,
    ideas: ["Festive Diwali sweets box on a marble table, diyas glowing", "Modern clinic reception, clean and welcoming", "Hand-drawn map of a spice market"],
    related: ["create-3d-images", "sketchflow-ai", "thumbnail-maker", "social-post-generator"],
  },
  "create-3d-images": {
    engine: "image", credits: p("create-3d-images"), promptLabel: "What should the 3D image show?", promptPlaceholder: "A cute 3D mascot of a smiling delivery scooter",
    promptPrefix: "A high-quality 3D render:",
    intro: "3D-style renders — mascots, product mock-ups, icons and scenes with depth and soft lighting.",
    styles: ["Pixar-style", "Clay", "Glossy product render", "Low-poly", "Isometric", "Realistic"],
    aspects: ["1:1", "4:5", "16:9"], allowReference: true,
    ideas: ["Isometric 3D model of a small bakery shop", "Glossy 3D app icon of a wallet with coins", "Clay-style 3D elephant mascot waving"],
    related: ["image-creator", "productvision-360", "thumbnail-maker"],
  },
  "sketchflow-ai": {
    engine: "image", credits: p("sketchflow-ai"), promptLabel: "Describe the sketch, or add your own rough drawing", promptPlaceholder: "Turn my rough sketch into a clean line drawing of a house with a garden",
    intro: "Turn ideas or rough doodles into clean sketches, line art and concept drawings.",
    styles: ["Pencil sketch", "Ink line art", "Architectural sketch", "Fashion sketch", "Storyboard", "Colour concept"],
    aspects: ["1:1", "4:3", "16:9", "3:4"], allowReference: true,
    ideas: ["Pencil sketch of a Rajasthani haveli courtyard", "Storyboard frame: girl opening a gift box", "Fashion sketch of an Indo-western kurta"],
    related: ["image-creator", "smart-diagram-ai", "storybook-creator"],
  },
};
