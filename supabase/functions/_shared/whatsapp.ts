// WhatsApp updates through Wavo (https://api.wavo.digital): a message after every purchase and
// every finished AI task, with the result in it.
//
// WhatsApp only delivers free-form messages inside the 24-hour window after the customer last
// wrote to us; outside it, only Meta-approved templates arrive. So each update:
//   1. sends its template when Wavo reports it APPROVED (reaches everyone), and
//   2. sends the free-form version (full text, image, invoice PDF) when there is no approved
//      template yet, or when the template could not carry everything (a long result).
//
// Key: WAVO_API_KEY env, else the WAVO_API_KEY secret in Supabase Vault (read via app_secret).
// Templates (created in Wavo; names can be overridden with env):
//   payment_receipt_ezyourlife  body: name, amount, item, invoice no, payment id · button: invoice link
//   payment_verification_ezyourlife (older, credits only)  body: name, credits
//   page_live_ezyourlife        body: name, order no, product · button: page path
//   task_ready_ezyourlife       body: name, app, request id, result preview · button: app path
//   task_image_ezyourlife       header: image · body: name, app, request id · button: app path

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const WAVO = (Deno.env.get("WAVO_BASE_URL") ?? "https://api.wavo.digital").replace(/\/$/, "");
const SITE = "https://ezyourlife.com";
const TPL = {
  receipt: Deno.env.get("WAVO_TPL_RECEIPT") ?? "payment_receipt_ezyourlife",
  credits: Deno.env.get("WAVO_TPL_CREDITS") ?? "payment_verification_ezyourlife",
  page: Deno.env.get("WAVO_TPL_PAGE") ?? "page_live_ezyourlife",
  task: Deno.env.get("WAVO_TPL_TASK") ?? "task_ready_ezyourlife",
  image: Deno.env.get("WAVO_TPL_IMAGE") ?? "task_image_ezyourlife",
};
// The receipt template's button is https://<project>.supabase.co/storage/v1/{{1}}.
const STORAGE_BASE = `${SUPABASE_URL}/storage/v1/`;
const PREVIEW_MAX = 650; // result preview inside the task template (body limit is 1024 characters)
const TASK_THROTTLE_MIN = 10; // at most one update per app per user in this many minutes (chat apps)

const sb = (path: string, init: RequestInit = {}) =>
  fetch(`${SUPABASE_URL}${path}`, {
    ...init,
    headers: { apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
  });

let keyCache: string | null | undefined;
async function wavoKey(): Promise<string | null> {
  if (keyCache !== undefined) return keyCache;
  const env = Deno.env.get("WAVO_API_KEY");
  if (env) return (keyCache = env);
  try {
    const r = await sb("/rest/v1/rpc/app_secret", { method: "POST", body: JSON.stringify({ _name: "WAVO_API_KEY" }) });
    keyCache = r.ok ? ((await r.json()) as string | null) : null;
  } catch {
    keyCache = null;
  }
  return keyCache;
}

/** Indian mobiles → 91XXXXXXXXXX; other international numbers kept as digits; junk → null. */
export function waNumber(raw: unknown): string | null {
  let d = String(raw ?? "").replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  if (d.length === 10 && /^[6-9]/.test(d)) return "91" + d;
  if (d.length === 12 && /^91[6-9]/.test(d)) return d;
  if (d.length >= 11 && d.length <= 15 && !d.startsWith("91")) return d;
  return null;
}

async function wavoPost(payload: Record<string, unknown>): Promise<void> {
  const key = await wavoKey();
  if (!key) throw new Error("Wavo API key not configured");
  const r = await fetch(`${WAVO}/api/messages/send`, {
    method: "POST",
    headers: { "X-API-Key": key, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", ...payload }),
  });
  if (!r.ok) throw new Error(`Wavo ${r.status}: ${(await r.text()).slice(0, 300)}`);
}

let tplCache: { at: number; approved: Map<string, string> } | null = null;
/** Approved template names → language code, refreshed every 10 minutes. */
async function approvedTemplates(): Promise<Map<string, string>> {
  if (tplCache && Date.now() - tplCache.at < 600_000) return tplCache.approved;
  const approved = new Map<string, string>();
  try {
    const key = await wavoKey();
    const r = key ? await fetch(`${WAVO}/api/templates?limit=100`, { headers: { "X-API-Key": key } }) : null;
    if (r?.ok) {
      const data = await r.json();
      for (const t of data?.templates ?? []) {
        if (t?.isActive !== false && String(t?.whatsappStatus).toUpperCase() === "APPROVED") approved.set(String(t.name), String(t.language || "en"));
      }
    }
  } catch (e) {
    console.warn("wavo templates", e);
  }
  tplCache = { at: Date.now(), approved };
  return approved;
}

/** Template param text: one line, no tabs or runs of spaces (WhatsApp rejects those), capped. */
const param = (s: unknown, max = 120) => String(s ?? "").replace(/[\n\r\t]+/g, " ").replace(/ {4,}/g, " ").trim().slice(0, max) || "-";

interface TemplateParts { body: string[]; button?: string | null; image?: string | null }
/** Sends an approved template; false (nothing sent) when it isn't approved yet. */
async function sendTemplate(to: string, name: string, parts: TemplateParts): Promise<boolean> {
  const lang = (await approvedTemplates()).get(name);
  if (!lang) return false;
  const components: unknown[] = [];
  if (parts.image) components.push({ type: "header", parameters: [{ type: "image", image: { link: parts.image } }] });
  components.push({ type: "body", parameters: parts.body.map((p) => ({ type: "text", text: param(p, PREVIEW_MAX) })) });
  if (parts.button) components.push({ type: "button", sub_type: "url", index: 0, parameters: [{ type: "text", text: parts.button }] });
  await wavoPost({ to, type: "template", template: { name, language: { code: lang }, components } });
  return true;
}
/** Path after https://ezyourlife.com/ for a template's link button. */
const sitePath = (link: string | null | undefined) => String(link ?? "").replace(/^https:\/\/(www\.)?ezyourlife\.com\/?/, "") || "ai-apps";
/** Short, human-friendly request id shown in task templates. */
export const shortRef = (id: string) => "R-" + id.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase();

interface Recipient { userId: string; phone: string; first: string }

/** Who to message: the profile's WhatsApp number (or one Razorpay collected), unless they opted out. */
async function recipient(userId: string, fallbackPhone?: string | null, fallbackName?: string | null): Promise<Recipient | null> {
  const r = await sb(`/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=phone_number,full_name,display_name,whatsapp_updates`);
  const p = r.ok ? ((await r.json()) as Array<{ phone_number: string | null; full_name: string | null; display_name: string | null; whatsapp_updates: boolean | null }>)[0] : undefined;
  if (p && p.whatsapp_updates === false) return null;
  let phone = waNumber(p?.phone_number);
  const fb = waNumber(fallbackPhone);
  if (!phone && fb) {
    phone = fb;
    // Remember the number they paid with, so later updates reach them too.
    if (p) await sb(`/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`, { method: "PATCH", body: JSON.stringify({ phone_number: "+" + fb }) }).catch(() => undefined);
  }
  if (!phone) return null;
  const first = String(p?.full_name || p?.display_name || fallbackName || "").trim().split(/\s+/)[0] || "there";
  return { userId, phone, first };
}

/** Records the message; false when (kind, ref) was already sent, so duplicates are skipped. */
async function claim(kind: string, ref: string, to: Recipient, topic?: string): Promise<string | null> {
  const r = await sb("/rest/v1/whatsapp_messages?on_conflict=kind,ref", {
    method: "POST",
    headers: { Prefer: "resolution=ignore-duplicates,return=representation" },
    body: JSON.stringify({ kind, ref, topic: topic ?? null, user_id: to.userId, phone: to.phone }),
  });
  if (!r.ok) throw new Error(`whatsapp_messages insert ${r.status}`);
  const rows = (await r.json()) as Array<{ id: string }>;
  return rows[0]?.id ?? null;
}
const mark = (id: string, status: string, error?: string) =>
  sb(`/rest/v1/whatsapp_messages?id=eq.${id}`, { method: "PATCH", body: JSON.stringify({ status, error: error?.slice(0, 500) ?? null }) }).catch(() => undefined);

/** Uploads bytes to the private wa-media bucket and returns a 7-day link WhatsApp can fetch. */
export async function hostFile(path: string, bytes: Uint8Array, type: string, days = 7): Promise<string | null> {
  const up = await fetch(`${SUPABASE_URL}/storage/v1/object/wa-media/${path}`, {
    method: "POST",
    headers: { apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}`, "Content-Type": type, "x-upsert": "true" },
    body: bytes,
  });
  if (!up.ok) return null;
  const s = await sb(`/storage/v1/object/sign/wa-media/${path}`, { method: "POST", body: JSON.stringify({ expiresIn: days * 86400 }) });
  if (!s.ok) return null;
  const { signedURL } = await s.json();
  return signedURL ? `${SUPABASE_URL}/storage/v1${signedURL}` : null;
}
export function dataUrlBytes(u: string): { bytes: Uint8Array; type: string } | null {
  const m = /^data:([\w/+.-]+);base64,(.+)$/s.exec(u);
  if (!m) return null;
  const bin = atob(m[2]);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return { bytes, type: m[1] };
}

async function deliver(id: string, steps: Array<() => Promise<unknown>>) {
  const errors: string[] = [];
  for (const s of steps) {
    try { await s(); } catch (e) { errors.push(e instanceof Error ? e.message : String(e)); }
  }
  await mark(id, errors.length === steps.length ? "failed" : "sent", errors.join(" | ") || undefined);
}

const inr = (n: number) => "₹" + Number(n).toLocaleString("en-IN");

export interface PurchaseUpdate {
  kind: "credits" | "page";
  userId: string;
  paymentId: string;
  description: string;
  amountInr: number;
  invoiceNo?: string | null;
  invoicePdf?: Uint8Array | null;
  link?: string | null;
  credits?: number | null;
  phone?: string | null;   // number entered at Razorpay checkout
  name?: string | null;
}

/** Thank-you + invoice on WhatsApp after a payment. Safe to call more than once per payment. */
export async function whatsappPurchase(u: PurchaseUpdate): Promise<void> {
  try {
    const to = await recipient(u.userId, u.phone, u.name);
    if (!to) return;
    const id = await claim("purchase", u.paymentId, to, u.kind);
    if (!id) return;
    const lines = [
      `✅ *Payment received*`,
      ``,
      `Hi ${to.first}, thank you for your payment of *${inr(u.amountInr)}* for ${u.description}.`,
      u.invoiceNo ? `Invoice: ${u.invoiceNo}` : null,
      `Payment ID: ${u.paymentId}`,
      u.link ? `\n${u.kind === "page" ? "Your page is live" : "Start using your credits"}: ${u.link}` : null,
      ``,
      `Reply here if you need anything.`,
      `— Abhijay, EZYOURLIFE`,
    ].filter((l) => l !== null);
    // The invoice is hosted for 30 days; the receipt template's button links to it.
    let invoiceUrl: string | null = null;
    const fileName = u.invoiceNo ? `${u.invoiceNo.replace(/\//g, "-")}.pdf` : "";
    const invoiceLink = async () => {
      if (invoiceUrl || !u.invoicePdf || !u.invoiceNo) return invoiceUrl;
      return (invoiceUrl = await hostFile(`${u.userId}/invoices/${fileName}`, u.invoicePdf, "application/pdf", 30));
    };
    let templated = false;
    await deliver(id, [
      async () => {
        const inv = await invoiceLink();
        if (inv && u.invoiceNo && inv.startsWith(STORAGE_BASE)) {
          templated = await sendTemplate(to.phone, TPL.receipt, {
            body: [to.first, inr(u.amountInr), u.description, u.invoiceNo, u.paymentId], button: inv.slice(STORAGE_BASE.length),
          });
        }
        if (!templated && u.kind === "credits") templated = await sendTemplate(to.phone, TPL.credits, { body: [to.first, String(u.credits ?? "")] });
      },
      async () => {
        // A bought page is also a finished order: tell them it's live, with the link.
        if (u.kind === "page") await sendTemplate(to.phone, TPL.page, { body: [to.first, u.invoiceNo ?? shortRef(u.paymentId), u.description.split(" · ")[0]], button: sitePath(u.link) });
      },
      async () => { if (!templated) await wavoPost({ to: to.phone, type: "text", text: { body: lines.join("\n"), preview_url: true } }); },
      async () => {
        if (templated) return;
        const link = await invoiceLink();
        if (link) await wavoPost({ to: to.phone, type: "document", document: { link, filename: fileName, caption: `Invoice ${u.invoiceNo}` } });
      },
    ]);
  } catch (e) {
    console.error("whatsappPurchase", e);
  }
}

/** Pulls something sendable out of an app's response: text, and/or an image (URL or data URL). */
export function extractOutput(data: unknown): { text: string; image: string | null } {
  let image: string | null = null;
  const texts: string[] = [];
  const isImg = (s: string) => /^data:image\//.test(s) || /^https:\/\/\S+\.(png|jpe?g|webp|gif)(\?\S*)?$/i.test(s);
  const walk = (v: unknown, key: string, depth: number) => {
    if (depth > 4 || v == null) return;
    if (typeof v === "string") {
      if (isImg(v)) { image ??= v; return; }
      if (!/^(ok|error|id|.*_id|status|model|charged)$/i.test(key) && v.trim().length > 1) texts.push(v.trim());
      return;
    }
    if (typeof v === "number" || typeof v === "boolean") return;
    if (Array.isArray(v)) { v.slice(0, 20).forEach((x) => walk(x, key, depth + 1)); return; }
    if (typeof v === "object") {
      const o = v as Record<string, unknown>;
      const keys = Object.keys(o);
      // Prefer the obvious result fields when present.
      const main = keys.filter((k) => /^(output|result|text|content|answer|reply|markdown|summary|image|images|url)$/i.test(k));
      for (const k of main.length ? main : keys) walk(o[k], k, depth + 1);
    }
  };
  walk(data, "", 0);
  return { text: texts.join("\n\n"), image };
}

/** Text from an OpenAI/Gemini-style SSE stream. */
export function sseText(raw: string): string {
  let out = "";
  for (const line of raw.split("\n")) {
    const m = /^data:\s*(.+)$/.exec(line.trim());
    if (!m || m[1] === "[DONE]") continue;
    try {
      const j = JSON.parse(m[1]);
      out += j?.choices?.[0]?.delta?.content ?? j?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? j?.text ?? j?.delta ?? "";
    } catch { /* not JSON */ }
  }
  return out;
}

let appNames: Map<string, string> | null = null;
export async function appName(toolId: string): Promise<string> {
  if (!appNames) {
    appNames = new Map();
    try {
      const r = await sb(`/rest/v1/tools_catalog?select=id,name&limit=5000`);
      if (r.ok) for (const t of (await r.json()) as Array<{ id: string; name: string }>) appNames.set(t.id, t.name);
    } catch { /* names are cosmetic */ }
  }
  return appNames.get(toolId) ?? toolId.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** "Your result is ready" with the output itself, after a paid app run succeeds. */
export async function whatsappTaskDone(t: { userId: string; toolId: string; runId: string; output: unknown; link?: string; name?: string; throttle?: boolean }): Promise<void> {
  try {
    const to = await recipient(t.userId);
    if (!to) return;
    // Chat-style apps run many times in a row: one update per app per few minutes is plenty.
    if (t.throttle !== false) {
      const since = new Date(Date.now() - TASK_THROTTLE_MIN * 60_000).toISOString();
      const recent = await sb(`/rest/v1/whatsapp_messages?user_id=eq.${t.userId}&kind=eq.task&topic=eq.${encodeURIComponent(t.toolId)}&created_at=gte.${since}&select=id&limit=1`);
      if (recent.ok && ((await recent.json()) as unknown[]).length) return;
    }
    const id = await claim("task", t.runId, to, t.toolId);
    if (!id) return;
    const name = t.name ?? await appName(t.toolId);
    const link = t.link ?? `${SITE}/tool/${t.toolId}`;
    const { text, image } = typeof t.output === "string" ? { text: t.output, image: null } : extractOutput(t.output);
    const body = text.length > 3200 ? text.slice(0, 3200).replace(/\s+\S*$/, "") + "…\n\n(See the full result in the app.)" : text;
    let imageUrl: string | null = null;
    // WhatsApp shows only JPEG/PNG pictures; other formats go out as a link in the text.
    const sendable = (u: string) => /^data:image\/(png|jpe?g);/i.test(u) || (/^https:/.test(u) && !/\.(webp|gif|svg)(\?|$)/i.test(u));
    const extraLink = image && !sendable(image) && image.startsWith("https:") ? image : null;
    const message = [`✨ *Your ${name} result is ready*`, body, extraLink ? `Image: ${extraLink}` : "", `Open it: ${link}`].filter(Boolean).join("\n\n");
    if (image && sendable(image)) {
      imageUrl = image;
      if (image.startsWith("data:")) {
        const f = dataUrlBytes(image);
        imageUrl = f ? await hostFile(`${t.userId}/results/${t.runId}.${f.type.split("/")[1] || "png"}`, f.bytes, f.type, 30) : null;
      }
    }
    const ref = shortRef(t.runId);
    const flat = text.replace(/^#{1,6}\s+/gm, "").replace(/\*\*/g, "").replace(/\s+/g, " ").trim();
    const preview = flat.length > PREVIEW_MAX ? flat.slice(0, PREVIEW_MAX - 1).replace(/\s+\S*$/, "") + "…" : flat || "Your result is saved in the app.";
    let imageSent = false, textSent = false;
    await deliver(id, [
      async () => {
        // Image results: the picture itself in the template header.
        if (imageUrl) imageSent = await sendTemplate(to.phone, TPL.image, { image: imageUrl, body: [to.first, name, ref], button: sitePath(link) });
      },
      async () => {
        // Text results: the result (or its start) inside the template.
        if (text || !imageSent) textSent = await sendTemplate(to.phone, TPL.task, { body: [to.first, name, ref, preview], button: sitePath(link) });
      },
      // Free-form copies: only what the templates couldn't carry (they arrive inside the 24-hour window).
      async () => { if (imageUrl && !imageSent) await wavoPost({ to: to.phone, type: "image", image: { link: imageUrl, caption: `${name} · ezyourlife.com` } }); },
      async () => { if ((!textSent && !imageSent) || flat.length > PREVIEW_MAX) await wavoPost({ to: to.phone, type: "text", text: { body: message, preview_url: false } }); },
    ]);
  } catch (e) {
    console.error("whatsappTaskDone", e);
  }
}

/** Keeps the worker alive after the response is sent. */
export function inBackground(p: Promise<unknown>) {
  // deno-lint-ignore no-explicit-any
  (globalThis as any).EdgeRuntime?.waitUntil?.(p);
  return p;
}
