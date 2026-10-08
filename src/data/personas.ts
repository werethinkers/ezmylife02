// "I am a…" personas and editorial collections for the home page.
// Every id here must exist in tools_catalog; ids that are missing or not live are skipped at render time.

export interface Persona {
  id: string;
  emoji: string;
  label: string;
  blurb: string;
  toolIds: string[];
  /** Catalog categories that also count as relevant when filtering shelves. */
  categories: string[];
}

export const PERSONAS: Persona[] = [
  {
    id: "founders",
    emoji: "🚀",
    label: "Founders & Startups",
    blurb: "Analyse markets, draft contracts and chase leads without hiring yet.",
    toolIds: ["startup-analyser", "promptmaster-ai", "tool-6", "tool-1", "tool-11", "ai-data-analysis", "tool-3"],
    categories: ["AI Agent", "Finance & Accounting", "Legal & Compliance"],
  },
  {
    id: "ecommerce",
    emoji: "🛍️",
    label: "D2C & E-Commerce",
    blurb: "Studio-style product shots, clean backgrounds and offers that convert.",
    toolIds: ["productvision-360", "remove-background", "ai-photo-enhancer", "add-logo-image", "tool-12", "tool-19", "tool-13"],
    categories: ["AI Image Generation", "Image Tools", "Marketing & Sales"],
  },
  {
    id: "creators",
    emoji: "✍️",
    label: "Marketers & Creators",
    blurb: "Ideas, scripts, captions and thumbnails — from blank page to posted.",
    toolIds: ["content-idea-generator", "social-post-generator", "video-script-writer", "thumbnail-maker", "caption-generator", "hashtag-generator", "video-maker"],
    categories: ["Content Creation", "Content", "Marketing & Sales"],
  },
  {
    id: "students",
    emoji: "🎓",
    label: "Students & Researchers",
    blurb: "Read PDFs faster, plan study time and test yourself before exams.",
    toolIds: ["speedy-notebook", "quiz-maker", "flashcard-maker", "study-planner", "bibliography-generator", "ocr"],
    categories: ["For Students", "Research"],
  },
];

export interface Collection {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  toolIds: string[];
  personaId?: string;
}

export const COLLECTIONS: Collection[] = [
  {
    id: "solo-founder",
    emoji: "🧰",
    title: "The solo founder's toolkit",
    subtitle: "Size up a market, paper the deal and send the first invoice.",
    toolIds: ["startup-analyser", "tool-6", "tool-1", "tool-11", "promptmaster-ai"],
    personaId: "founders",
  },
  {
    id: "product-photos",
    emoji: "📸",
    title: "Product photos that sell",
    subtitle: "Clean backgrounds, sharper detail and your logo on every shot.",
    toolIds: ["productvision-360", "remove-background", "ai-photo-enhancer", "add-logo-image", "upscale-image-ai"],
    personaId: "ecommerce",
  },
  {
    id: "blank-page",
    emoji: "✍️",
    title: "From blank page to posted",
    subtitle: "An idea, a script, the caption and the hashtags.",
    toolIds: ["content-idea-generator", "video-script-writer", "social-post-generator", "caption-generator", "hashtag-generator"],
    personaId: "creators",
  },
  {
    id: "exam-week",
    emoji: "🎓",
    title: "Exam week, sorted",
    subtitle: "Plan the week, read the PDFs, then quiz yourself.",
    toolIds: ["study-planner", "flashcard-maker", "quiz-maker", "speedy-notebook"],
    personaId: "students",
  },
  {
    id: "govt-photos",
    emoji: "🪪",
    title: "Form photos in the right size",
    subtitle: "Passport, UPSC, SSC and PAN photos plus signatures, sized to spec.",
    toolIds: ["passport-photo-maker", "upsc-photo-resize", "ssc-photo-resize", "pan-card-resize", "resize-signature"],
  },
];

/** "Try it in 3 taps" — one real app per everyday task. */
export const QUICK_TASKS: Array<{ label: string; toolId: string }> = [
  { label: "Remove a background", toolId: "remove-background" },
  { label: "Analyse a startup", toolId: "startup-analyser" },
  { label: "Write a social post", toolId: "social-post-generator" },
  { label: "Make a passport photo", toolId: "passport-photo-maker" },
  { label: "Draft a contract", toolId: "tool-6" },
  { label: "Turn notes into a quiz", toolId: "quiz-maker" },
];
