// Server side of the flagship apps: the deeper, multi-step apps run by the `flagship-app` function
// (interviews that become books, uploads that become reports, photo studios, plan builders,
// coaches and packs). One file per category in this folder (flagship-<category>.ts), written by
// scripts/flagship/generate.mjs from scripts/flagship/data/<category>.mjs — edit the data, not the output.
//
// Each spec is an ordinary AppSpec (so prices, checks and the catalogue work as for every other app)
// plus a `flagship` block that tells the function how the app's steps run.
import { FLASH, LITE, type AppSpec } from "./base.ts";

export type Shell = "interview" | "analyse" | "studio" | "plan" | "pack" | "coach";

export interface FlagshipSpec extends AppSpec {
  flagship: {
    shell: Shell;
    /** Interview and coach apps: how the AI asks its questions or coaches (free steps on Flash-Lite). */
    guide?: string;
    /** Interview and coach apps: most answers or turns the free steps accept. */
    maxTurns?: number;
    /** Photo studio apps: the picture each option makes, by key. */
    variants?: Record<string, string>;
    /** Look of the optional AI pictures made from a result (30 credits each). */
    imageStyle?: string;
    /** Longest value accepted for a field, by the same label the client sends it under — the
     *  server-side half of the form's own maxLength, so a request that bypasses the form can't
     *  send something long enough to waste tokens or time out. */
    fieldLimits?: Record<string, number>;
    /** The result's own ## sections, in order — so a section-regenerate request can look up the
     *  exact shape (e.g. "Taglines (10)") for the one section it's asked to redo. */
    sections?: string[];
  };
}

/** Price ids shared by every flagship app. */
export const FOLLOWUP_ID = "flagship-followup";
export const IMAGE_ID = "flagship-image";
/** Regenerating one named section of an existing result, instead of the whole thing — 2 credits,
 *  the same flat rate as a follow-up question, regardless of which app or how large its own price. */
export const SECTION_ID = "flagship-section";

export const FLAGSHIP_STYLE = `You are building a finished, professional deliverable for a customer of EZYOURLIFE, an Indian app store. The customer paid for this result, so it must be worth keeping, printing and sharing.

Quality rules:
- Be specific to the customer. Use every detail they gave: names, numbers, places, dates, goals. Never write generic filler that would fit anyone.
- Where you work something out (totals, timelines, scores), show the figures in a table so they can be checked. Use figures the customer gave exactly as given.
- Never invent facts about the customer, real people, companies, laws, case numbers, scheme names, prices or statistics. If something important is missing, write a clear [placeholder in square brackets] and list what to fill in under a final "To complete" heading.
- Use Indian context where it fits: ₹ with lakh/crore, Indian states and cities, GST, Indian festivals and holidays, Indian institutions. Write in the language the customer used (English, Hindi or Hinglish) unless they ask otherwise.
- Format as clean Markdown: a short title line (# heading), then each requested section as a ## heading in the order given, short paragraphs, bullet lists and tables. Bold the few things that matter most.
- Start directly with the deliverable. No preamble, no "Sure, here is", no closing chit-chat.
- End with "## Next steps": 3 to 5 concrete actions the customer can take this week.`;

const NOTES = {
  legal: `This touches law. Explain in plain words, cite an Act or rule only when you are sure of its name, never quote section numbers you are unsure of, and never promise an outcome. End with one italic line: "This is a draft for reference, not legal advice. Have it reviewed by a lawyer before you rely on it."`,
  money: `This touches money. Give general, educational planning, not personalised investment, tax or credit advice. Show every assumption (returns, inflation, tax) in a table so the customer can change it. Never recommend a specific fund, stock, insurer or lender by name. End with one italic line: "This is general information for planning, not financial advice. Check with a SEBI-registered adviser or a chartered accountant before acting."`,
  health: `This touches health. Explain in plain words and never diagnose, prescribe or change medicines. Point out anything that needs a doctor soon, clearly at the top. End with one italic line: "This is general information, not medical advice. Talk to your doctor before making changes."`,
  official: `Rules, fees, dates, limits and rates set by governments, exam bodies, embassies or companies change often. Never state one as current fact unless the customer gave it. Say what to check and name the official website or office to check it at.`,
} as const;
export type Note = keyof typeof NOTES;

export interface FlagshipInput {
  credits: number;
  /** Who the AI is for this app. */
  role: string;
  /** What the finished result is, e.g. "a keepsake life-story book". */
  deliverable: string;
  /** The result's sections, in order. */
  sections: string[];
  /** Extra instructions for the finished result. */
  rules?: string[];
  notes?: Note[];
  guide?: string;
  maxTurns?: number;
  variants?: Record<string, string>;
  imageStyle?: string;
  maxTokens?: number;
  fieldLimits?: Record<string, number>;
}

/** Builds one flagship app's server spec from its data. */
export function flagship(shell: Shell, i: FlagshipInput): FlagshipSpec {
  const notes = (i.notes ?? []).map((n) => NOTES[n]).join("\n\n");
  const system = [i.role, FLAGSHIP_STYLE, notes].filter(Boolean).join("\n\n");
  // A photo studio's task is added to every picture prompt, so it carries only the picture rules.
  const task = shell === "studio" ? (i.rules ?? []).join("\n") : [
    `Write ${i.deliverable}.`,
    `Use these sections, in this order, each as a ## heading: ${i.sections.join("; ")}.`,
    ...(i.rules ?? []),
  ].join("\n");
  const kind = shell === "coach" ? "chat" : shell === "studio" ? "image" : "doc";
  return {
    kind,
    credits: i.credits,
    system,
    task,
    model: FLASH,
    maxTokens: i.maxTokens ?? (shell === "interview" ? 12000 : 8192),
    flagship: {
      shell,
      guide: i.guide,
      maxTurns: i.maxTurns,
      variants: i.variants,
      imageStyle: i.imageStyle,
      fieldLimits: i.fieldLimits,
      sections: i.sections,
    },
  };
}

export { FLASH, LITE };
