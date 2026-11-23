import type { AppKind } from "./goals";

/** What an app/studio hands back, from its real AppKind (src/data/goals.ts) — no per-app guessing. */
export const OUTPUT_FORMAT: Record<AppKind, string> = {
  quick: "Instant answer",
  photo: "HD photo",
  document: "PDF · DOCX",
  sheet: "Spreadsheet",
  file: "Converted file",
};
