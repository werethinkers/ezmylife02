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

/** Decodes a Gmail message part's base64url body data. */
export function decode64url(s: string): string {
  const b = atob((s || "").replace(/-/g, "+").replace(/_/g, "/"));
  return new TextDecoder().decode(Uint8Array.from(b, (c) => c.charCodeAt(0)));
}

// deno-lint-ignore no-explicit-any
type GmailPart = Record<string, any>;
/** Walks a Gmail message's MIME tree for the text/plain body, falling back to text/html. */
export function pickBody(part: GmailPart | undefined): string {
  if (!part) return "";
  if (part.mimeType === "text/plain" && part.body?.data) return decode64url(part.body.data);
  const kids = (part.parts ?? []).map(pickBody).filter(Boolean);
  if (kids.length) return kids.join("\n");
  if (part.mimeType === "text/html" && part.body?.data) return decode64url(part.body.data);
  return "";
}

// ---------- Gmail OAuth tokens & sending ----------
// Shared by mail-desk (read), send-mail-brain-reply (manual reply) and run-mail-brain-tasks
// (the auto-reply automation) so the AES-GCM sealing and the refresh dance exist in one place.
const MAIL_DESK_CLIENT_ID = Deno.env.get("MAIL_DESK_GOOGLE_CLIENT_ID") ?? "";
const MAIL_DESK_CLIENT_SECRET = Deno.env.get("MAIL_DESK_GOOGLE_CLIENT_SECRET") ?? "";
const MAIL_DESK_TOKEN_KEY = Deno.env.get("MAIL_DESK_TOKEN_KEY") ?? ""; // 64 hex characters

function hex(b: ArrayBuffer | Uint8Array): string {
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
}
function fromHex(h: string): Uint8Array<ArrayBuffer> {
  return new Uint8Array(h.match(/../g)!.map((x) => parseInt(x, 16)));
}
const b64 = (u: Uint8Array) => btoa(String.fromCharCode(...u));
const unb64 = (s: string): Uint8Array<ArrayBuffer> => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function aesKey() {
  if (!/^[0-9a-f]{64}$/i.test(MAIL_DESK_TOKEN_KEY)) throw new Error("MAIL_DESK_TOKEN_KEY is not set (64 hex characters)");
  return await crypto.subtle.importKey("raw", fromHex(MAIL_DESK_TOKEN_KEY), "AES-GCM", false, ["encrypt", "decrypt"]);
}
export async function seal(text: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await aesKey(), new TextEncoder().encode(text)));
  return `${b64(iv)}.${b64(enc)}`;
}
export async function unseal(blob: string): Promise<string> {
  const [iv, enc] = blob.split(".");
  return new TextDecoder().decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(iv) }, await aesKey(), unb64(enc)));
}

/** Fresh Gmail access token for this mail_desk_accounts row; refreshes and re-saves it if expired.
 * Throws "This Gmail needs to be connected again" if there's no refresh token or the refresh fails. */
// deno-lint-ignore no-explicit-any
export async function googleAccessToken(db: any, accountId: string): Promise<string> {
  const { data: t } = await db.from("mail_desk_tokens").select("*").eq("account_id", accountId).maybeSingle();
  if (!t?.refresh_token) throw new Error("This Gmail needs to be connected again");
  if (t.access_token && t.expiry && Number(t.expiry) > Date.now() + 60_000) return await unseal(t.access_token);
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: MAIL_DESK_CLIENT_ID, client_secret: MAIL_DESK_CLIENT_SECRET, refresh_token: await unseal(t.refresh_token), grant_type: "refresh_token" }),
  });
  if (!r.ok) {
    await db.from("mail_desk_accounts").update({ connected: false }).eq("id", accountId);
    throw new Error("This Gmail needs to be connected again");
  }
  const j = await r.json();
  await db.from("mail_desk_tokens").update({ access_token: await seal(j.access_token), expiry: Date.now() + j.expires_in * 1000 }).eq("account_id", accountId);
  return j.access_token;
}

function b64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
const qEncode = (s: string) => (/[^\x20-\x7e]/.test(s) ? `=?UTF-8?B?${btoa(unescape(encodeURIComponent(s)))}?=` : s);

export interface GmailThreadInfo { messageIdHeader: string; referencesHeader: string }

/** Reads just the headers needed to thread a reply properly (Gmail's own threadId groups the
 * conversation even without these, but a correct In-Reply-To/References keeps other mail clients'
 * threading correct too). */
export async function gmailThreadHeaders(accessToken: string, extMessageId: string): Promise<GmailThreadInfo> {
  const r = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${extMessageId}?format=metadata&metadataHeaders=Message-ID&metadataHeaders=References`,
    { headers: { authorization: `Bearer ${accessToken}` } },
  );
  if (!r.ok) return { messageIdHeader: "", referencesHeader: "" };
  const m = await r.json();
  const h = (m.payload?.headers ?? []) as { name: string; value: string }[];
  const find = (n: string) => h.find((x) => x.name.toLowerCase() === n)?.value ?? "";
  return { messageIdHeader: find("message-id"), referencesHeader: find("references") };
}

/** Sends a plain-text reply through Gmail, threaded onto the original message. */
export async function sendGmailReply(
  accessToken: string,
  opts: { to: string; subject: string; body: string; threadId: string; thread: GmailThreadInfo },
): Promise<{ id: string; threadId: string }> {
  // Gmail always sends as the authenticated account's own address, so there's no From header to set.
  const references = [opts.thread.referencesHeader, opts.thread.messageIdHeader].filter(Boolean).join(" ");
  const subject = /^re:/i.test(opts.subject) ? opts.subject : `Re: ${opts.subject}`;
  const headers = [
    `To: ${opts.to}`,
    `Subject: ${qEncode(subject)}`,
    opts.thread.messageIdHeader ? `In-Reply-To: ${opts.thread.messageIdHeader}` : "",
    references ? `References: ${references}` : "",
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
  ].filter(Boolean).join("\r\n");
  const raw = `${headers}\r\n\r\n${btoa(unescape(encodeURIComponent(opts.body)))}`;
  const r = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: { authorization: `Bearer ${accessToken}`, "content-type": "application/json" },
    body: JSON.stringify({ raw: b64url(new TextEncoder().encode(raw)), threadId: opts.threadId }),
  });
  if (!r.ok) throw new Error(`Gmail said ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return await r.json();
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
