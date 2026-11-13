import { useSyncExternalStore } from "react";
import { APPS } from "../registry";
import type { Accent, OutputFormat, TemplateId } from "./types";

/*
 * Which formats an app offers, which one the person picked (remembered per app on this
 * device), and which PDF template the app uses. The public API will offer the same choice
 * later (docs/output-formats.md), so the keyboard and Siri can hand out a PDF link.
 */

export const FORMAT_TEXT: Record<OutputFormat, { label: string; line: string }> = {
  text: { label: "Text on screen", line: "Read, copy and edit it here" },
  pdf: { label: "PDF document", line: "Ready to print, send or sign" },
  word: { label: "Word file", line: "Change it later on your computer" },
  whatsapp: { label: "WhatsApp message", line: "Short text you can forward" },
};

type Kind = "writing" | "studio" | "numbers" | "register" | "none";

function kindOf(toolId: string): Kind {
  const engine = (APPS[toolId] as { engine?: string } | undefined)?.engine;
  switch (engine) {
    case "doc":
    case "vision":
    case "chat":
      return "writing";
    case "plan":
    case "pack":
    case "analyse":
    case "interview":
    case "coach":
      return "studio";
    case "calc":
      return "numbers";
    case "tracker":
      return "register";
    default:
      return "none";
  }
}

/** The choices an app offers, in the order shown. Empty = the app gives a file and asks nothing. */
export function formatsFor(toolId: string): OutputFormat[] {
  switch (kindOf(toolId)) {
    case "writing":
      return ["text", "pdf", "word", "whatsapp"];
    case "studio":
      return ["pdf", "text", "word", "whatsapp"];
    case "numbers":
      return ["text", "pdf", "whatsapp"];
    case "register":
      return ["text", "pdf"];
    default:
      return [];
  }
}

// Documents that go out on the business's own letterhead: letters, notices, agreements, invoices and slips.
const LETTER = /(^|[^a-z])(letter|notice|agreement|contract|offer-letter|appointment|quotation|warning|termination|resignation|reference|relieving|certificate|nda|deed|affidavit|undertaking|declaration|authori[sz]ation|consent|reply|legal|memo|circular|application|complaint|apology|invitation|noc|attorney|indemnity|non-compete|assignment|bill-of-sale|statement-of-work|bylaws|invoice|purchase-order|work-order|challan|credit-note|receipt|salary-slip|commission-slip|payment-terms|requisition)([^a-z]|$)/;
const NOT_LETTER = /comparison|register|calendar/;
const PLAN = /plan|planner|schedule|timetable|roster|itinerary|routine|calendar|syllabus|lesson/;

/** The PDF look for an app. */
export function templateFor(toolId: string): TemplateId {
  const kind = kindOf(toolId);
  const def = APPS[toolId] as { fileName?: string; engine?: string } | undefined;
  const key = `${toolId} ${def?.fileName ?? ""}`.toLowerCase();
  if (kind === "numbers") return "statement";
  if (kind === "register") return "register";
  if (kind === "studio") return def?.engine === "plan" && PLAN.test(key) ? "plan" : "report";
  if (LETTER.test(key) && !NOT_LETTER.test(key)) return "letter";
  if (PLAN.test(key)) return "plan";
  return "document";
}

export const TEMPLATE_ACCENT: Record<TemplateId, Accent> = {
  letter: "sun",
  report: "sky",
  document: "sun",
  statement: "lime",
  register: "sun",
  plan: "lime",
};

/** What a first-time visitor gets before they choose. */
export const defaultFormat = (toolId: string): OutputFormat => formatsFor(toolId)[0] ?? "text";

// ── The remembered choice (per app, this device) ──

const KEY = (toolId: string) => `ez-output:${toolId}`;
const listeners = new Set<() => void>();
const memory = new Map<string, OutputFormat>();

function read(toolId: string): OutputFormat {
  if (memory.has(toolId)) return memory.get(toolId)!;
  let v: OutputFormat | null = null;
  try {
    v = localStorage.getItem(KEY(toolId)) as OutputFormat | null;
  } catch {
    /* private mode */
  }
  const ok = v && formatsFor(toolId).includes(v) ? v : defaultFormat(toolId);
  memory.set(toolId, ok);
  return ok;
}

export function setOutputChoice(toolId: string, f: OutputFormat) {
  memory.set(toolId, f);
  try {
    localStorage.setItem(KEY(toolId), f);
  } catch {
    /* private mode */
  }
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** The person's choice for this app, and a setter. Every component on the page stays in step. */
export function useOutputChoice(toolId: string): [OutputFormat, (f: OutputFormat) => void] {
  const v = useSyncExternalStore(
    subscribe,
    () => read(toolId),
    () => defaultFormat(toolId),
  );
  return [v, (f) => setOutputChoice(toolId, f)];
}

export const todayText = (d = new Date()) => d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
