/**
 * Plain-language map of the app catalogue.
 *
 * Every catalogue category sits under one business goal, so people pick what they want done
 * ("Get customers") instead of reading category jargon. Each category also says, in plain words,
 * what you give the app, what you get back, and how the app opens. Categories not listed here
 * (new ones added in admin) are read from the catalog_categories table (see registerCategories),
 * and only fall under "More apps" with neutral wording if they are in neither place.
 */

export type GoalId = "customers" | "business" | "content" | "helpers" | "learn" | "more";

export interface Goal {
  id: GoalId;
  name: string;
  line: string;
  /** Brand colour of the goal (CSS colour value). */
  color: string;
}

export const GOALS: Goal[] = [
  { id: "customers", name: "Get customers", line: "Find buyers, write to them and answer them.", color: "hsl(var(--pink))" },
  { id: "business", name: "Run your business", line: "Bills, tax, contracts, staff and stock.", color: "hsl(var(--sun))" },
  { id: "content", name: "Photos & content", line: "Fix photos and make posts, videos and pictures.", color: "hsl(var(--teal))" },
  { id: "helpers", name: "Smart helpers", line: "Apps that read, check, analyse and write for you.", color: "hsl(var(--sky))" },
  { id: "learn", name: "Learn & grow", line: "Study, teach and understand yourself better.", color: "hsl(var(--lime))" },
  { id: "more", name: "More apps", line: "Everything else in the store.", color: "hsl(var(--coral))" },
];

/**
 * Where apps go when their category belongs to no goal (a category made in admin without one, or a typo).
 * Lists add it as a last section, so no app is ever hidden from the category view.
 */
export const MORE_GOAL: Goal = { id: "more", name: "More apps", line: "Everything else we have.", color: "hsl(var(--card))" };
export const GOALS_WITH_MORE: Goal[] = [...GOALS, MORE_GOAL];

/** How an app opens: on the same page, or as a full-screen workspace. */
export type AppKind = "quick" | "photo" | "document" | "sheet" | "file";

export const KIND_TEXT: Record<AppKind, { title: string; line: string }> = {
  quick: { title: "Works in a few taps", line: "Type a line or two and get your answer on the same screen." },
  photo: { title: "Opens a photo editor", line: "Add a photo, pick what you want, and download the new one." },
  document: { title: "Opens a document maker", line: "Fill a short form and your document is written for you." },
  sheet: { title: "Opens a sheet", line: "Add rows like a register. Totals and alerts work themselves out." },
  file: { title: "Opens a file converter", line: "Add your files, pick the format, and download the new ones. Nothing is uploaded." },
};

export interface CategoryInfo {
  goal: GoalId;
  /** One plain line about the category. */
  line: string;
  give: string;
  get: string;
  kind: AppKind;
  /** Wording for apps here that write a document instead of filling a sheet (see giveGetFor). */
  docGive?: string;
  docGet?: string;
}

export const CATEGORY_INFO: Record<string, CategoryInfo> = {
  "Marketing & Sales": { goal: "customers", line: "Find buyers, run offers and follow up.", give: "who you want to sell to", get: "a message or plan ready to use", kind: "document" },
  "Customer Service": { goal: "customers", line: "Answer customers and collect feedback.", give: "the customer's question", get: "a clear, polite reply", kind: "document" },
  Networking: { goal: "customers", line: "Remember the people you meet and follow up.", give: "who you met and where", get: "a follow-up you can send", kind: "quick" },
  "Finance & Accounting": { goal: "business", line: "Bills, expenses, tax and profit.", give: "amounts and customer details", get: "a ready document or sum", kind: "document" },
  "Legal & Compliance": { goal: "business", line: "Contracts, notices and rules in plain words.", give: "names, dates and what was agreed", get: "a ready legal document", kind: "document" },
  "HR & Staffing": { goal: "business", line: "Hire people, track attendance and pay salaries.", give: "your staff details", get: "a filled sheet or document", kind: "sheet", docGive: "the employee's details", docGet: "a ready letter or form" },
  "Operations & Inventory": { goal: "business", line: "Stock, shifts, repairs and quality checks.", give: "your stock or task list", get: "a sheet that adds up for you", kind: "sheet", docGive: "the order or job details", docGet: "a ready document to print" },
  "Image Tools": { goal: "content", line: "Edit, resize and fix photos.", give: "a photo from your phone", get: "the edited photo to download", kind: "photo" },
  "ID & Exam Photos": { goal: "content", line: "Passport, visa and exam photos and signatures at the exact size forms ask for.", give: "a photo or signature", get: "a file the form will accept", kind: "photo" },
  "Photo Enhance & Retouch": { goal: "content", line: "Sharpen, clean up and upscale blurry or old photos.", give: "a photo from your phone", get: "a clearer photo to download", kind: "photo" },
  "Blur & Privacy": { goal: "content", line: "Blur or pixelate faces, backgrounds and private details.", give: "a photo from your phone", get: "the photo with private details hidden", kind: "photo" },
  "Social Media Sizes": { goal: "content", line: "Fit photos to Instagram, WhatsApp and YouTube without cropping.", give: "a photo from your phone", get: "a photo sized for the app", kind: "photo" },
  "AI Image Generation": { goal: "content", line: "Turn product photos into studio pictures.", give: "a product photo", get: "studio-style pictures", kind: "photo" },
  Content: { goal: "content", line: "Pull text from images, make quizzes and sketches.", give: "a file or a topic", get: "text, pictures or a quiz", kind: "document" },
  "Content Creation": { goal: "content", line: "Post ideas, captions, thumbnails and videos.", give: "your topic", get: "posts and captions ready to share", kind: "quick" },
  "AI Agent": { goal: "helpers", line: "Helpers that read, check and write for you.", give: "a document or an idea", get: "a full written report", kind: "document" },
  Lab: { goal: "helpers", line: "New apps we're testing: charts, diagrams, video.", give: "your data or topic", get: "a chart, diagram or video", kind: "document" },
  Research: { goal: "helpers", line: "Turn scans and PDFs into text and data you can use.", give: "a scan or document", get: "text you can edit", kind: "document" },
  "Writing & Editors": { goal: "helpers", line: "Write, format and fix spelling in long documents and books.", give: "your text", get: "clean text ready to use", kind: "document" },
  Popular: { goal: "helpers", line: "Ask anything and get a clear answer.", give: "any question", get: "a clear answer", kind: "quick" },
  "Modern Science": { goal: "learn", line: "Simple tools to understand how you think.", give: "a few answers about yourself", get: "a simple picture of your thinking", kind: "quick" },
  "For Students": { goal: "learn", line: "Study plans, flashcards and marks.", give: "your subjects and dates", get: "a study plan or sheet", kind: "sheet" },
  "For Teachers": { goal: "learn", line: "Plan lessons in minutes.", give: "class and topic", get: "a lesson plan", kind: "document" },
  Personal: { goal: "learn", line: "Save your family's stories.", give: "family stories and photos", get: "a saved family record", kind: "document" },
  Calculators: { goal: "business", line: "EMI, SIP, deposits, growth and break-even, worked out as you type.", give: "a few numbers", get: "the answer, worked out", kind: "quick" },
  "PDF & Files": { goal: "helpers", line: "Join, split and convert PDFs and photos on your own device.", give: "your files", get: "the converted file to download", kind: "file" },
  // Flagship apps (scripts/flagship): deeper, multi-step apps.
  "Startups & Strategy": { goal: "business", line: "Business plans, pitch decks, pricing and investor prep.", give: "your idea or your numbers", get: "a plan or report you can act on", kind: "document" },
  "Online Selling": { goal: "customers", line: "Listings, store launches and marketplace fixes for online sellers.", give: "your products or seller reports", get: "listings and fixes ready to use", kind: "document" },
  "Money & Planning": { goal: "helpers", line: "Plan savings, retirement, tax and family money in plain words.", give: "your income, goals or statements", get: "a money plan with the sums shown", kind: "document" },
  "Jobs & Careers": { goal: "learn", line: "Resumes, interviews, career moves and salary talks.", give: "your CV or the job you want", get: "a stronger CV, plan or practice", kind: "document" },
  "Health & Wellness": { goal: "helpers", line: "Meal plans, fitness and health reports explained simply.", give: "your goals or reports", get: "a clear plan or explanation", kind: "document" },
  "Home, Family & Travel": { goal: "helpers", line: "Weddings, trips, moves, homes and family care, planned for you.", give: "what you are planning", get: "a full plan and checklist", kind: "document" },
};

const FALLBACK: CategoryInfo = { goal: "more", line: "", give: "a few details", get: "your result", kind: "document" };

/** A row of the catalog_categories table: the same wording as CATEGORY_INFO, plus an order. */
export interface CategoryRow {
  name: string;
  goal: string;
  line?: string | null;
  give?: string | null;
  get_text?: string | null;
  kind?: string | null;
  doc_give?: string | null;
  doc_get?: string | null;
  sort_order?: number | null;
}

// Categories made in admin. They win over the built-in map above, so a change in admin shows
// everywhere without a code change. Filled by useToolsCatalog; empty in build scripts.
let dynamicInfo: Record<string, CategoryInfo> = {};
let dynamicOrder: Record<string, number> = {};
const KINDS: AppKind[] = ["quick", "photo", "document", "sheet", "file"];

export function registerCategories(rows: CategoryRow[] | null | undefined) {
  const info: Record<string, CategoryInfo> = {};
  const order: Record<string, number> = {};
  for (const r of rows ?? []) {
    if (!r?.name) continue;
    const base = CATEGORY_INFO[r.name] ?? FALLBACK;
    info[r.name] = {
      goal: GOALS.some((g) => g.id === r.goal) ? (r.goal as GoalId) : base.goal,
      line: r.line ?? base.line,
      give: r.give || base.give,
      get: r.get_text || base.get,
      kind: KINDS.includes(r.kind as AppKind) ? (r.kind as AppKind) : base.kind,
      docGive: r.doc_give || base.docGive,
      docGet: r.doc_get || base.docGet,
    };
    order[r.name] = r.sort_order ?? 0;
  }
  dynamicInfo = info;
  dynamicOrder = order;
}

export const categoryInfo = (category?: string | null): CategoryInfo =>
  (category && (dynamicInfo[category] ?? CATEGORY_INFO[category])) || FALLBACK;

/** Is this category known anywhere (built in or made in admin)? */
export const isKnownCategory = (category?: string | null): boolean =>
  !!category && !!(dynamicInfo[category] ?? CATEGORY_INFO[category]);

/** Every known category name, built in and from admin. */
export const knownCategories = (): string[] => [...new Set([...Object.keys(CATEGORY_INFO), ...Object.keys(dynamicInfo)])];

/** Order set in admin: 1 is first, 0 means "no preference" (largest first, as before). */
export const categoryOrder = (category: string): number => dynamicOrder[category] || 0;
/** Sort comparator for [category, apps] pairs: admin order first, then the biggest. */
export const byCategoryOrder = (a: [string, number], b: [string, number]): number =>
  (categoryOrder(a[0]) || 9999) - (categoryOrder(b[0]) || 9999) || b[1] - a[1] || a[0].localeCompare(b[0]);

/**
 * Where an app is listed: its main category first, then any others it was also put in.
 * Everything that groups apps (home, the apps page, shelves, counts) goes through this, so an
 * app in two categories shows up under both, once each.
 */
export const categoriesOf = (t: { category?: string | null; extra_categories?: string[] | null }): string[] => {
  const out: string[] = [];
  for (const c of [t.category, ...(t.extra_categories ?? [])]) if (c && !out.includes(c)) out.push(c);
  return out;
};
export const inCategory = (t: { category?: string | null; extra_categories?: string[] | null }, category: string): boolean =>
  categoriesOf(t).includes(category);

/**
 * "You give / you get" for one app. A category can hold both sheets and documents (a staff
 * register and an offer letter are both HR), so the category's sheet wording would be wrong
 * on a letter. Say what the app produces either with `kind` (from appKindOf, exact — it reads
 * the app's engine) or with `toolTypes` from the catalogue row, which lists are built from
 * and which must not pull the whole app registry into the page.
 */
export function giveGetFor(
  category: string | null | undefined,
  produces: { kind?: AppKind; toolTypes?: string[] | null } = {},
): { give: string; get: string } {
  const info = categoryInfo(category);
  const kind = produces.kind ?? (produces.toolTypes?.includes("Document Tools") ? "document" : info.kind);
  if (kind === "document" && info.kind === "sheet") {
    return { give: info.docGive ?? info.give, get: info.docGet ?? "a ready document" };
  }
  return { give: info.give, get: info.get };
}
export const goalOf = (category?: string | null): Goal => GOALS.find((g) => g.id === categoryInfo(category).goal)!;
export const goalById = (id?: string | null): Goal | undefined => GOALS_WITH_MORE.find((g) => g.id === id);

/** Engine type from the app registry → how it opens. */
export const KIND_BY_ENGINE: Record<string, AppKind> = {
  doc: "document",
  tracker: "sheet",
  chat: "quick",
  vision: "document",
  image: "photo",
  calc: "quick",
  convert: "file",
  preset: "photo",
  interview: "document",
  analyse: "document",
  studio: "photo",
  plan: "document",
  pack: "document",
  coach: "quick",
};
