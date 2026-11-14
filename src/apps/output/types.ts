/*
 * The shared "how do you want your result?" choice and the PDF documents every app can make.
 * See docs/output-formats.md.
 */

/** How the person wants a result. Saved per app. */
export type OutputFormat = "text" | "pdf" | "word" | "whatsapp";

/** The six PDF looks. Every app maps to one (see templateFor in choice.ts). */
export type TemplateId = "letter" | "report" | "document" | "statement" | "register" | "plan";

/** The goal colours from docs/design.md, used as the PDF's accent. */
export type Accent = "sun" | "lime" | "sky" | "pink" | "teal" | "coral";

export interface Letterhead {
  name: string;
  tagline?: string;
  lines: string[];
}

/** One block of a PDF document. Text may hold **bold** and *italic*. */
export type PdfBlock =
  | { t: "h"; level: 1 | 2 | 3; text: string }
  | { t: "p"; text: string; big?: boolean }
  | { t: "ul" | "ol" | "check"; items: string[] }
  | { t: "table"; head: string[]; rows: string[][]; foot?: string[] }
  | { t: "tiles"; items: { label: string; value: string; main?: boolean }[] }
  | { t: "kv"; rows: [string, string][] }
  | { t: "box"; label: string; blocks: PdfBlock[]; tint?: boolean }
  | { t: "split"; parts: { label: string; value: number }[] }
  | { t: "note"; text: string }
  | { t: "sign"; lines: string[] }
  | { t: "hr" }
  /** A picture (data: URL or a CORS-readable link), at most `maxH` px tall. */
  | { t: "img"; src: string; alt?: string; maxH?: number }
  /** Start a new page here. */
  | { t: "break" };

export interface PdfDoc {
  template: TemplateId;
  /** Big title on the document. */
  title: string;
  /** The app's name, shown as a small tag. */
  kicker: string;
  /** One line under the title (reports and plans). */
  subtitle?: string;
  /** "13 November 2026". */
  date: string;
  accent: Accent;
  landscape?: boolean;
  letterhead?: Letterhead;
  blocks: PdfBlock[];
  /** Saved file name without ".pdf". */
  fileName: string;
}
