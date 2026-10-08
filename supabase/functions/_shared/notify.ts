// "Your result is ready" on every channel at once: whenever something finishes on the platform
// (an app run, a card or website going live, a bulk job), the customer gets a WhatsApp message
// AND an email with the same content. Purchases do the same through receipt.ts.
//
// Each channel dedupes on its own (one message/email per run) and chat-style apps are throttled
// to one update per app every 10 minutes. Customers can turn either channel off in their profile.
import { appName, dataUrlBytes, extractOutput, hostFile, shortRef, whatsappTaskDone } from "./whatsapp.ts";
import { emailLayout, escHtml, sendMail, textToHtml, type Attachment } from "./mailer.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const SITE = "https://ezyourlife.com";
const THROTTLE_MIN = 10;

const sb = (path: string, init: RequestInit = {}) =>
  fetch(`${SUPABASE_URL}${path}`, {
    ...init,
    headers: { apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
  });

export interface TaskDone {
  userId: string;
  toolId: string;
  runId: string;
  output: unknown;      // the app's response body, plain text, or { output, image }
  link?: string;        // where to see it (defaults to the app's page)
  name?: string;        // display name (defaults to the app's catalogue name)
  throttle?: boolean;   // false for one-off completions (bulk jobs, pages going live)
}

/** WhatsApp + email for a finished task. Never throws. */
export async function notifyTaskDone(t: TaskDone): Promise<void> {
  try {
    // Work out the result once for both channels: its text, and the image hosted at a link.
    const raw = typeof t.output === "string" ? { text: t.output, image: null } : extractOutput(t.output);
    let imageUrl: string | null = raw.image;
    let imageFile: Attachment | null = null;
    if (raw.image?.startsWith("data:")) {
      const f = dataUrlBytes(raw.image);
      const ext = f?.type.split("/")[1]?.replace("jpeg", "jpg") || "png";
      imageUrl = f ? await hostFile(`${t.userId}/results/${t.runId}.${ext}`, f.bytes, f.type, 30) : null;
      if (f && f.bytes.length < 8_000_000) imageFile = { filename: `${t.toolId}-result.${ext}`, content: f.bytes, contentType: f.type };
    }
    const name = t.name ?? await appName(t.toolId);
    const link = t.link ?? `${SITE}/tool/${t.toolId}`;
    const shared = { ...t, name, link };
    await Promise.all([
      whatsappTaskDone({ ...shared, output: { output: raw.text, image: imageUrl } }),
      emailTaskDone({ ...shared, text: raw.text, imageUrl, imageFile }),
    ]);
  } catch (e) {
    console.error("notifyTaskDone", e);
  }
}

async function emailTaskDone(t: TaskDone & { name: string; link: string; text: string; imageUrl: string | null; imageFile: Attachment | null }) {
  try {
    const [pr, ur] = await Promise.all([
      sb(`/rest/v1/profiles?id=eq.${encodeURIComponent(t.userId)}&select=full_name,display_name,email_updates`),
      sb(`/auth/v1/admin/users/${encodeURIComponent(t.userId)}`),
    ]);
    const p = pr.ok ? ((await pr.json()) as Array<{ full_name: string | null; display_name: string | null; email_updates: boolean | null }>)[0] : undefined;
    if (p?.email_updates === false) return;
    const u = ur.ok ? await ur.json() : null;
    const email: string | undefined = u?.email;
    if (!email) return;
    const first = String(p?.full_name || p?.display_name || u?.user_metadata?.full_name || u?.user_metadata?.name || "").trim().split(/\s+/)[0] || "there";

    if (t.throttle !== false) {
      const since = new Date(Date.now() - THROTTLE_MIN * 60_000).toISOString();
      const recent = await sb(`/rest/v1/email_notifications?user_id=eq.${t.userId}&kind=eq.task&topic=eq.${encodeURIComponent(t.toolId)}&created_at=gte.${since}&select=id&limit=1`);
      if (recent.ok && ((await recent.json()) as unknown[]).length) return;
    }
    const claim = await sb("/rest/v1/email_notifications?on_conflict=kind,ref", {
      method: "POST",
      headers: { Prefer: "resolution=ignore-duplicates,return=representation" },
      body: JSON.stringify({ kind: "task", ref: t.runId, topic: t.toolId, user_id: t.userId, email }),
    });
    if (!claim.ok) throw new Error(`email_notifications insert ${claim.status}`);
    const id = ((await claim.json()) as Array<{ id: string }>)[0]?.id;
    if (!id) return; // already emailed for this run

    const ref = shortRef(t.runId);
    const result = t.text.length > 30_000 ? t.text.slice(0, 30_000) + "\n\n…(see the full result in the app)" : t.text;
    const inner = `
<p style="font-size:18px;font-weight:700;margin:0 0 6px">Hi ${escHtml(first)}, your ${escHtml(t.name)} result is ready</p>
<p style="margin:0 0 18px;color:#6b7280;font-size:13px">Request ${escHtml(ref)} · ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })}</p>
${t.imageUrl ? `<p style="margin:0 0 16px"><img src="${escHtml(t.imageUrl)}" alt="${escHtml(t.name)} result" style="max-width:100%;border-radius:12px;border:1px solid #e5e7eb"></p>` : ""}
${result ? `<div style="border:1px solid #e5e7eb;border-radius:12px;padding:16px 18px;background:#fafafa">${textToHtml(result)}</div>` : ""}`;
    const text = [`Hi ${first}, your ${t.name} result is ready (request ${ref}).`, result, t.imageUrl ? `Image: ${t.imageUrl}` : "", `Open it: ${t.link}`, "", "Abhijay Jain, Founder & CEO, EZYOURLIFE"].filter((x) => x !== "").join("\n\n");
    try {
      await sendMail(email, `Your ${t.name} result is ready`, emailLayout(inner, { text: "Open result", url: t.link }), text, t.imageFile ? [t.imageFile] : []);
      await sb(`/rest/v1/email_notifications?id=eq.${id}`, { method: "PATCH", body: JSON.stringify({ status: "sent" }) });
    } catch (e) {
      await sb(`/rest/v1/email_notifications?id=eq.${id}`, { method: "PATCH", body: JSON.stringify({ status: "failed", error: String(e instanceof Error ? e.message : e).slice(0, 500) }) });
      throw e;
    }
  } catch (e) {
    console.error("emailTaskDone", e);
  }
}
