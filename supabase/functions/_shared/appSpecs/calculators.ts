// Calculators: the sums run in the browser. The server only writes the optional
// "Explain in plain words" note, from figures the browser has already worked out.
// credits is the default price; the page copy is in src/apps/prices/calculators.ts.
import { type AppSpec, LITE } from "./base.ts";

const EXPLAIN = `You explain a calculator's result to someone in India in plain, friendly English (or Hindi/Hinglish if they wrote in it). The figures given to you were already worked out exactly: use them exactly as given. Never recalculate, round differently, or add new figures of your own. Do not recommend specific banks, funds, loans or products, and do not give investment, tax or legal advice. Format as short Markdown, no preamble.`;

const task = (what: string) =>
  `Explain this ${what} result in three short parts: "What this means" (2–3 sentences using the result figures), "How it was worked out" (the method in plain words, quoting the user's own numbers), and "Things to keep in mind" (2–4 bullets about assumptions and what could change the figure in real life). Under 220 words.`;

const spec = (what: string): AppSpec => ({ kind: "doc", credits: 1, model: LITE, maxTokens: 700, system: EXPLAIN, task: task(what) });

export const calculators: Record<string, AppSpec> = {
  "emi-calculator": spec("loan EMI"),
  "loan-prepayment-calculator": spec("loan part-payment"),
  "sip-calculator": spec("SIP (monthly investment) estimate; say clearly that market returns are not guaranteed"),
  "fd-calculator": spec("fixed deposit"),
  "rd-calculator": spec("recurring deposit"),
  "cagr-calculator": spec("CAGR (yearly growth rate)"),
  "break-even-calculator": spec("break-even (units and sales needed to cover costs)"),
  "percentage-calculator": spec("percentage"),
  "age-calculator": spec("age and age-limit check; remind them to read the exact age wording in their notice"),
};
