// Mail Desk logic with no network and no Deno calls, so it can be tested anywhere.
//
// Price rule: every mail that goes through our sorting is billed, with or without the AI.
// 0.08 credits per mail, rounded up to a whole credit, at least 1 credit per fetch.
// The wallet charges one fixed price per run, so a fetch is cut into runs of up to 25 mails:
//   up to 12 mails  -> tool "mail-desk-12", 1 credit
//   13 to 25 mails  -> tool "mail-desk-25", 2 credits
// Added up, that equals ceil(mails x 0.08) exactly (see mailDesk_test.mjs).

export const CHUNK = 25;
export const TOOL_SMALL = "mail-desk-12";
export const TOOL_FULL = "mail-desk-25";
export const CREDITS_PER_MAIL = 0.08;

export interface ChunkPrice { toolId: string; credits: number }

/** Which fixed-price run a batch of `n` mails (1 to 25) is charged as. */
export function chunkPrice(n: number): ChunkPrice | null {
  if (!Number.isFinite(n) || n <= 0) return null;
  return n <= 12 ? { toolId: TOOL_SMALL, credits: 1 } : { toolId: TOOL_FULL, credits: 2 };
}

/** Sizes of the runs a fetch of `total` mails is cut into. */
export function planChunks(total: number): number[] {
  const out: number[] = [];
  for (let left = Math.max(0, Math.floor(total)); left > 0; left -= CHUNK) out.push(Math.min(CHUNK, left));
  return out;
}

/** Credits for a fetch of `total` mails. Same as ceil(total x 0.08) using whole numbers. */
export function creditsForMails(total: number): number {
  return planChunks(total).reduce((s, n) => s + (chunkPrice(n)?.credits ?? 0), 0);
}

// ---------- free sorting (no AI) ----------
const NOREPLY = /^(no[-_.]?reply|do[-_.]?not[-_.]?reply|donotreply|noreply|mailer-daemon|notifications?|alerts?|news(letter)?|offers?|deals?|marketing|promo(tions)?|updates?|info|hello|support|billing|team)@/i;

export type Kind = "person" | "update" | "promo" | "social" | "forum" | "notice" | "sent";
export interface SortInput { labels: string[]; list_unsub: boolean; precedence: string; from_email: string }

/** Decides what a mail is without the AI. useAI is true only for mails written by people. */
export function sortMail(m: SortInput, readUpdates = false): { kind: Kind; useAI: boolean } {
  const L = new Set(m.labels ?? []);
  if (L.has("SENT") || L.has("DRAFT")) return { kind: "sent", useAI: false };
  if (L.has("CATEGORY_PROMOTIONS")) return { kind: "promo", useAI: false };
  if (L.has("CATEGORY_SOCIAL")) return { kind: "social", useAI: false };
  if (L.has("CATEGORY_FORUMS")) return { kind: "forum", useAI: false };
  if (m.list_unsub || /bulk|list|junk/i.test(m.precedence || "")) return { kind: "promo", useAI: false };
  if (L.has("CATEGORY_UPDATES")) return { kind: "update", useAI: readUpdates };
  if (NOREPLY.test((m.from_email || "").toLowerCase())) return { kind: "notice", useAI: false };
  return { kind: "person", useAI: true };
}

// ---------- reading a mail body ----------
export function htmlToText(html: string): string {
  return html
    .replace(/<(style|script|head)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>|<\/(p|div|tr|li|h\d)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

/** Cuts quoted replies, signatures and links so the AI reads less. */
export function cleanBody(raw: string, max = 1500): string {
  let t = /<\w+[^>]*>/.test(raw) ? htmlToText(raw) : raw;
  t = t.replace(/\r/g, "");
  const cuts = [/\n\s*On .{5,200}wrote:\s*\n/i, /\n\s*-{2,}\s*Original Message\s*-{2,}/i, /\n\s*From:\s.+\n\s*(Sent|Date):/i, /\n\s*Sent from my /i, /\n--\s*\n/];
  for (const c of cuts) { const m = c.exec(t); if (m) t = t.slice(0, m.index); }
  t = t.split("\n").filter((l) => !/^\s*>/.test(l)).join("\n");
  t = t.replace(/https?:\/\/\S+/g, "<link>").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  return t.length > max ? t.slice(0, max) + " …" : t;
}

export function senderParts(from = ""): { name: string; email: string } {
  const m = /^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/.exec(from);
  return m ? { name: m[1].trim() || m[2], email: m[2].trim().toLowerCase() } : { name: from.trim(), email: from.trim().toLowerCase() };
}

// ---------- the AI step ----------
export const AI_MODEL = "google/gemini-2.5-flash-lite";

export function systemPrompt(opts: { lang: string; signOff: string; today: string }): string {
  const lang = opts.lang === "hi" ? "Hindi" : opts.lang === "en" ? "English" : "the same language as the mail (Hindi mails get Hindi replies, written in Devanagari)";
  return `You read business email for one person and return compact JSON. Be terse.
Return {"mails":[...]} with one item per mail:
- id: copy it exactly.
- summary: one line, at most 25 words.
- label: "needs_reply" if the sender expects an answer from the user, "fyi" if it only informs, "done" if nothing is needed.
- tasks: only real actions for the user (an ask, a follow-up, or an action from minutes of a meeting). Each: title (imperative, under 12 words), kind ("ask"|"follow_up"|"minutes"), due (YYYY-MM-DD or null). Empty list if none.
- reminder: {"date":"YYYY-MM-DD","text":"..."} only when the mail names a date to come back to, else null.
- reply: a short reply the user can send, written ONLY when label is "needs_reply", else null.
Reply language: ${lang}. Sign off as "${opts.signOff}". Never invent facts, prices or dates that are not in the mail. Today is ${opts.today}.`;
}

export interface AiMail { id: string; summary: string; label: "needs_reply" | "fyi" | "done"; tasks: { title: string; kind: string; due: string | null }[]; reminder: { date: string; text: string } | null; reply: string | null }

const DATE = /^\d{4}-\d{2}-\d{2}$/;
/** Checks the AI's answer. Anything malformed is dropped, so one bad item never costs the others. */
export function parseAi(parsed: unknown, askedIds: string[]): Map<string, AiMail> {
  const out = new Map<string, AiMail>();
  const list = (parsed as { mails?: unknown })?.mails;
  if (!Array.isArray(list)) return out;
  const ok = new Set(askedIds);
  for (const r of list as Record<string, unknown>[]) {
    const id = String(r?.id ?? "");
    if (!ok.has(id) || out.has(id)) continue;
    const label = r.label === "needs_reply" || r.label === "fyi" || r.label === "done" ? r.label : "fyi";
    const tasks = (Array.isArray(r.tasks) ? r.tasks : []).slice(0, 5)
      .map((t: Record<string, unknown>) => ({
        title: String(t?.title ?? "").trim().slice(0, 160),
        kind: ["ask", "follow_up", "minutes"].includes(String(t?.kind)) ? String(t.kind) : "ask",
        due: DATE.test(String(t?.due ?? "")) ? String(t.due) : null,
      })).filter((t) => t.title.length > 1);
    const rem = r.reminder as { date?: unknown; text?: unknown } | null;
    out.set(id, {
      id, label, tasks,
      summary: String(r.summary ?? "").trim().slice(0, 300),
      reminder: rem && DATE.test(String(rem.date ?? "")) ? { date: String(rem.date), text: String(rem.text ?? "Come back to this").slice(0, 160) } : null,
      reply: label === "needs_reply" && typeof r.reply === "string" && r.reply.trim() ? r.reply.trim().slice(0, 4000) : null,
    });
  }
  return out;
}

/** Rough AI cost of one batch, in rupees, for the run log. Gemini 2.5 Flash-Lite list price, 96.36 rupees a dollar. */
export function estimateCostInr(inChars: number, outChars: number): number {
  return ((inChars / 4) * 0.10 + (outChars / 4) * 0.40) / 1e6 * 96.36;
}
