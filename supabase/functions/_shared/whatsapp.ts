// WhatsApp updates through Wavo (https://api.wavo.digital): a message after every purchase and
// every finished AI task, with the result in it.
//
// WhatsApp only delivers free-form messages inside the 24-hour window after the customer last
// wrote to us. Outside it, only approved templates arrive. So each update sends:
//   1. the matching template, when Wavo reports it APPROVED (always delivered), then
//   2. the full message (text, plus the image or invoice PDF), which arrives whenever the window is open.
// With no approved template yet, only step 2 runs.
//
// Key: WAVO_API_KEY env, else the WAVO_API_KEY secret in Supabase Vault (read via app_secret).
// Templates (names, override with env): WAVO_TPL_CREDITS (payment_verification_ezyourlife: name, credits),
// WAVO_TPL_PAGE (page_live_ezyourlife: name, product, link), WAVO_TPL_TASK (task_ready_ezyourlife: name, app).

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const WAVO = (Deno.env.get("WAVO_BASE_URL") ?? "https://api.wavo.digital").replace(/\/$/, "");
const SITE = "https://ezyourlife.com";
const TPL = {
  credits: Deno.env.get("WAVO_TPL_CREDITS") ?? "payment_verification_ezyourlife",
  page: Deno.env.get("WAVO_TPL_PAGE") ?? "page_live_ezyourlife",
  task: Deno.env.get("WAVO_TPL_TASK") ?? "task_ready_ezyourlife",
};
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
const param = (s: unknown, max = 60) => String(s ?? "").replace(/[\n\r\t]+/g, " ").replace(/ {4,}/g, " ").trim().slice(0, max) || "-";

async function sendTemplate(to: string, name: string, params: string[]): Promise<boolean> {
  const lang = (await approvedTemplates()).get(name);
  if (!lang) return false;
  await wavoPost({ to, type: "template", template: { name, language: { code: lang }, parameters: params.map((p) => param(p)) } });
  return true;
}

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
async function hostFile(path: string, bytes: Uint8Array, type: string): Promise<string | null> {
  const up = await fetch(`${SUPABASE_URL}/storage/v1/object/wa-media/${path}`, {
    method: "POST",
    headers: { apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}`, "Content-Type": type, "x-upsert": "true" },
    body: bytes,
  });
  if (!up.ok) return null;
  const s = await sb(`/storage/v1/object/sign/wa-media/${path}`, { method: "POST", body: JSON.stringify({ expiresIn: 7 * 86400 }) });
  if (!s.ok) return null;
  const { signedURL } = await s.json();
  return signedURL ? `${SUPABASE_URL}/storage/v1${signedURL}` : null;
}
function dataUrlBytes(u: string): { bytes: Uint8Array; type: string } | null {
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
    await deliver(id, [
      async () => {
        if (u.kind === "credits") await sendTemplate(to.phone, TPL.credits, [to.first, String(u.credits ?? "")]);
        else await sendTemplate(to.phone, TPL.page, [to.first, u.description.split(" · ")[0], u.link ?? SITE]);
      },
      () => wavoPost({ to: to.phone, type: "text", text: { body: lines.join("\n"), preview_url: true } }),
      async () => {
        if (!u.invoicePdf || !u.invoiceNo) return;
        const name = `${u.invoiceNo.replace(/\//g, "-")}.pdf`;
        const link = await hostFile(`${u.userId}/invoices/${name}`, u.invoicePdf, "application/pdf");
        if (link) await wavoPost({ to: to.phone, type: "document", document: { link, filename: name, caption: `Invoice ${u.invoiceNo}` } });
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
async function appName(toolId: string): Promise<string> {
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
    const message = [`✨ *Your ${name} result is ready*`, body, `Open it: ${link}`].filter(Boolean).join("\n\n");
    await deliver(id, [
      () => sendTemplate(to.phone, TPL.task, [to.first, name]),
      async () => {
        if (!image) return;
        let url: string | null = image;
        if (image.startsWith("data:")) {
          const f = dataUrlBytes(image);
          url = f ? await hostFile(`${t.userId}/results/${t.runId}.${f.type.split("/")[1] || "png"}`, f.bytes, f.type) : null;
        }
        if (url) await wavoPost({ to: to.phone, type: "image", image: { link: url, caption: `${name} · ezyourlife.com` } });
      },
      () => wavoPost({ to: to.phone, type: "text", text: { body: message, preview_url: false } }),
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
