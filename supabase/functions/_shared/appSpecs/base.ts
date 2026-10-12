// Types and shared wording for the server-side app definitions (one file per vertical in this folder).
// Server-side definitions for apps powered by the shared `ai-app` function.
// The browser only sends form values; the instructions, model, output limit and
// default price live here so a request can't change what a run costs.
//
// credits: default price used only when the app has no row in tool_pricing yet
// (set by the 3x cost rule in docs/pricing.md: Flash-Lite 1, Flash 4/6/9, vision 4, chat 3, one AI image 31).

export type AppKind = "doc" | "json" | "chat" | "vision" | "image";

export interface AppSpec {
  kind: AppKind;
  credits: number;
  system: string;
  task?: string;
  model?: string;
  maxTokens?: number;
  /** Vision apps: most images per run (keeps a 1–2 credit run within cost). */
  maxImages?: number;
  /** Price id to charge under, when it differs from the app id (re-priced apps). */
  chargeId?: string;
  /** Chat apps: how much uploaded document text is sent with each question. */
  maxContext?: number;
}

// Short, 1-credit jobs use Flash-Lite (about a fifth of Flash's cost, no "thinking" tokens);
// longer documents, chat and anything that needs careful reasoning use Flash.
export const FLASH = "google/gemini-2.5-flash";
export const LITE = "google/gemini-2.5-flash-lite";

export const BIZ = `You write for small and medium businesses in India. Use plain, professional English (or the language the user asks for). Use Indian conventions (₹, lakh/crore, GST, Indian states, Indian holidays and festivals) where relevant. Never invent facts about the user's business, real people, laws, case numbers or statistics: if something is needed and not given, leave a clear [placeholder] in square brackets. Where a figure has already been worked out and given to you — a subtotal, a tax amount, a grand total, an instalment, an average rating, a number of days — use it exactly as given and never recalculate or round it differently. Format the answer as clean Markdown with short headings, bullet lists and tables where they help. Do not add a preamble or closing commentary — return only the deliverable.`;

export const LEGAL_NOTE = `Add one line at the end in italics: "This is a draft for reference, not legal advice. Have it reviewed before sending."`;

export const COMMON_RULES = "Follow the task exactly. Keep the user's language if they wrote in Hindi or Hinglish unless asked otherwise.";
