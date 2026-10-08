// Email from ceo@ezyourlife.com: Google Workspace SMTP (SMTP_PASS = App Password for SMTP_USER),
// or Resend when RESEND_API_KEY is set. Used for receipts and "your result is ready" emails.
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

export const MAIL_FROM = () => Deno.env.get("SMTP_USER") ?? "ceo@ezyourlife.com";
export const escHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

export interface Attachment { filename: string; content: Uint8Array; contentType: string }

export async function sendMail(to: string, subject: string, html: string, text: string, attachments: Attachment[] = []) {
  const resend = Deno.env.get("RESEND_API_KEY");
  if (resend) {
    const b64 = (u: Uint8Array) => { let bin = ""; u.forEach((b) => (bin += String.fromCharCode(b))); return btoa(bin); };
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resend}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: `EZYOURLIFE <${MAIL_FROM()}>`, to: [to], reply_to: MAIL_FROM(), subject, html, text,
        attachments: attachments.map((a) => ({ filename: a.filename, content: b64(a.content) })),
      }),
    });
    if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
    return;
  }
  const pass = Deno.env.get("SMTP_PASS");
  if (!pass) throw new Error("Email not configured: add the SMTP_PASS secret (Google App Password for ceo@ezyourlife.com)");
  const client = new SMTPClient({
    connection: {
      hostname: Deno.env.get("SMTP_HOST") ?? "smtp.gmail.com",
      port: Number(Deno.env.get("SMTP_PORT") ?? 465),
      tls: true,
      auth: { username: MAIL_FROM(), password: pass },
    },
  });
  try {
    await client.send({
      from: `EZYOURLIFE <${MAIL_FROM()}>`, to, replyTo: MAIL_FROM(), subject, content: text, html,
      attachments: attachments.map((a) => ({ filename: a.filename, content: a.content, encoding: "binary" as const, contentType: a.contentType })),
    });
  } finally {
    await client.close();
  }
}

/** The branded email shell shared by every EZYOURLIFE email. inner is trusted HTML. */
export function emailLayout(inner: string, cta?: { text: string; url: string }) {
  return `<!doctype html><html><body style="margin:0;background:#f5f6fa;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#111827">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" width="100%" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden" cellpadding="0" cellspacing="0">
<tr><td style="background:#6655f2;padding:22px 28px;color:#fff;font-size:20px;font-weight:700">EZYOURLIFE</td></tr>
<tr><td style="padding:28px">
${inner}
${cta ? `<p style="margin:22px 0 0"><a href="${escHtml(cta.url)}" style="display:inline-block;background:#6655f2;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600">${escHtml(cta.text)}</a></p>` : ""}
<p style="margin:24px 0 0;line-height:1.6;color:#374151">If anything doesn't look right, just reply to this email. It comes straight to me.</p>
<p style="margin:14px 0 0;color:#374151">Warmly,<br><strong>Abhijay Jain</strong><br><span style="color:#6b7280">Founder &amp; CEO, EZYOURLIFE</span></p>
</td></tr></table>
<p style="color:#9ca3af;font-size:12px;margin:16px 0 0">EZYOURLIFE · ezyourlife.com · <a href="https://ezyourlife.com/profile" style="color:#9ca3af">Email settings</a></p>
</td></tr></table></body></html>`;
}

/** Plain text (an app's result) as readable email HTML: paragraphs, line breaks, **bold**, headings. */
export function textToHtml(text: string) {
  return text.split(/\n{2,}/).map((para) => {
    const h = /^#{1,6}\s+(.*)$/.exec(para.trim());
    if (h && !para.includes("\n")) return `<p style="margin:16px 0 6px;font-size:16px;font-weight:700">${escHtml(h[1])}</p>`;
    const body = escHtml(para).replace(/^#{1,6}\s+/gm, "").replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br>");
    return `<p style="margin:0 0 12px;line-height:1.6;color:#1f2937">${body}</p>`;
  }).join("\n");
}
