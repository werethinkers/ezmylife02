// Prices shared by every flagship app (see flagship-base.ts): follow-up questions on a finished
// result, AI pictures made from a result, and regenerating one named section of a result.
// Priced with the shared rule: AI cost × 3 ÷ ₹0.376.
import type { AppSpec } from "./base.ts";
import { LITE } from "./base.ts";
import { FOLLOWUP_ID, IMAGE_ID, SECTION_ID } from "./flagship-base.ts";

export const flagshipCommon: Record<string, AppSpec> = {
  // Flash-Lite, up to ~6k tokens of result in and 1k out: about ₹0.10 a question → 1 credit by the 3× rule, raised to the AI minimum of 2 (docs/pricing.md).
  [FOLLOWUP_ID]: {
    kind: "chat",
    credits: 2,
    model: LITE,
    maxTokens: 1000,
    system:
      "You help a customer with a result they just made on EZYOURLIFE. Answer their question about it, explain any part, or rewrite a part when asked (return the rewritten part in full, as Markdown). Stay consistent with the result's facts and never invent new facts about the customer. Be brief and practical.",
  },
  // One picture on Gemini 3.1 Flash-Lite Image: about ₹3.31 → 30 credits.
  [IMAGE_ID]: { kind: "image", credits: 30, system: "" },
  // Same shape as a follow-up question (it is one, in effect): redo one section, leave the rest.
  [SECTION_ID]: {
    kind: "chat",
    credits: 2,
    model: LITE,
    maxTokens: 2500,
    system: "",
  },
};
