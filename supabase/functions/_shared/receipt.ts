// Payment receipts: a numbered invoice (PDF) and a thank-you email from ceo@ezyourlife.com,
// sent the moment a payment is confirmed. One invoice per Razorpay payment: calling this twice
// (client verify + webhook) records and sends it once.
//
// Mail goes out through Google Workspace SMTP (ezyourlife.com mail is hosted by Google).
// Secrets: SMTP_PASS (an App Password for SMTP_USER). Optional: SMTP_USER (default
// ceo@ezyourlife.com), SMTP_HOST (smtp.gmail.com), SMTP_PORT (465), INVOICE_SELLER_ADDRESS,
// INVOICE_GSTIN. If RESEND_API_KEY is set instead, Resend is used.
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";
// deno-lint-ignore no-explicit-any
type Supa = any;

export interface ReceiptInput {
  kind: "credits" | "page";
  userId: string;
  email?: string | null;
  name?: string | null;
  description: string;         // "180 credits" / "Wedding Invitation · rahul-priya"
  amountInr: number;
  paymentId: string;
  orderId?: string | null;
  link?: string | null;        // where to find what they bought
}

const SELLER = "EZYOURLIFE";
const FROM = () => Deno.env.get("SMTP_USER") ?? "ceo@ezyourlife.com";
const money = (n: number) => "Rs. " + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

async function invoicePdf(no: string, date: Date, r: ReceiptInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]); // A4
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.07, 0.09, 0.15), mute = rgb(0.38, 0.42, 0.5), brand = rgb(0.4, 0.33, 0.95);
  const t = (s: string, x: number, y: number, size = 10, f = font, c = ink) => page.drawText(s, { x, y, size, font: f, color: c });
  page.drawRectangle({ x: 0, y: 812, width: 595, height: 30, color: brand });
  t("EZYOURLIFE", 48, 772, 22, bold);
  t("Think It -> Done", 48, 756, 9, font, mute);
  t("INVOICE", 420, 772, 20, bold);
  t(`No. ${no}`, 420, 754, 10, font, mute);
  t(`Date: ${date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`, 420, 740, 10, font, mute);

  t("From", 48, 700, 9, bold, mute);
  t(SELLER, 48, 686, 11, bold);
  const addr = (Deno.env.get("INVOICE_SELLER_ADDRESS") ?? "Indore, Madhya Pradesh, India").split("\n");
  addr.forEach((l, i) => t(l, 48, 672 - i * 13, 10));
  const gstin = Deno.env.get("INVOICE_GSTIN");
  if (gstin) t(`GSTIN: ${gstin}`, 48, 672 - addr.length * 13, 10);
  t("ceo@ezyourlife.com · ezyourlife.com", 48, 658 - addr.length * 13 - (gstin ? 13 : 0), 10, font, mute);

  t("Billed to", 320, 700, 9, bold, mute);
  t((r.name || r.email || "Customer").slice(0, 48), 320, 686, 11, bold);
  if (r.email) t(r.email.slice(0, 52), 320, 672, 10);

  const y0 = 580;
  page.drawRectangle({ x: 48, y: y0, width: 499, height: 24, color: rgb(0.95, 0.95, 0.98) });
  t("Description", 58, y0 + 8, 10, bold); t("Qty", 380, y0 + 8, 10, bold); t("Amount", 470, y0 + 8, 10, bold);
  t(r.description.slice(0, 60), 58, y0 - 20, 10); t("1", 384, y0 - 20, 10); t(money(r.amountInr), 470, y0 - 20, 10);
  page.drawLine({ start: { x: 48, y: y0 - 36 }, end: { x: 547, y: y0 - 36 }, thickness: 0.6, color: rgb(0.85, 0.86, 0.9) });
  t("Total paid", 380, y0 - 58, 11, bold); t(money(r.amountInr), 470, y0 - 58, 11, bold);
  t(gstin ? "Amount is inclusive of applicable GST." : "Amount is inclusive of all applicable taxes.", 48, y0 - 90, 9, font, mute);

  t("Payment", 48, y0 - 130, 9, bold, mute);
  t(`Paid online via Razorpay · Payment ID ${r.paymentId}`, 48, y0 - 144, 10);
  if (r.orderId) t(`Order ID ${r.orderId}`, 48, y0 - 158, 10);
  t("Thank you for choosing EZYOURLIFE.", 48, 90, 12, bold, brand);
  t("This is a computer-generated invoice and does not need a signature.", 48, 72, 8, font, mute);
  return await pdf.save();
}

function emailHtml(no: string, r: ReceiptInput) {
  const first = (r.name || "").split(" ")[0] || "there";
  return `<!doctype html><html><body style="margin:0;background:#f5f6fa;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#111827">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden" cellpadding="0" cellspacing="0">
<tr><td style="background:#6655f2;padding:22px 28px;color:#fff;font-size:20px;font-weight:700">EZYOURLIFE</td></tr>
<tr><td style="padding:28px">
<p style="font-size:18px;font-weight:700;margin:0 0 10px">Thank you, ${esc(first)}!</p>
<p style="margin:0 0 18px;line-height:1.6;color:#374151">Your payment went through. Your invoice is attached, and here's a summary.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:12px">
<tr><td style="padding:12px 16px;color:#6b7280;font-size:13px">Invoice</td><td style="padding:12px 16px;text-align:right;font-weight:600">${esc(no)}</td></tr>
<tr><td style="padding:12px 16px;color:#6b7280;font-size:13px;border-top:1px solid #e5e7eb">For</td><td style="padding:12px 16px;text-align:right;border-top:1px solid #e5e7eb">${esc(r.description)}</td></tr>
<tr><td style="padding:12px 16px;color:#6b7280;font-size:13px;border-top:1px solid #e5e7eb">Amount paid</td><td style="padding:12px 16px;text-align:right;font-weight:700;border-top:1px solid #e5e7eb">₹${r.amountInr.toLocaleString("en-IN")}</td></tr>
<tr><td style="padding:12px 16px;color:#6b7280;font-size:13px;border-top:1px solid #e5e7eb">Payment ID</td><td style="padding:12px 16px;text-align:right;font-size:13px;border-top:1px solid #e5e7eb">${esc(r.paymentId)}</td></tr>
</table>
${r.link ? `<p style="margin:22px 0 0"><a href="${esc(r.link)}" style="display:inline-block;background:#6655f2;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600">${r.kind === "page" ? "Open your page" : "Use your credits"}</a></p>` : ""}
<p style="margin:24px 0 0;line-height:1.6;color:#374151">If anything doesn't look right, just reply to this email. It comes straight to me.</p>
<p style="margin:14px 0 0;color:#374151">Warmly,<br><strong>Abhijay Jain</strong><br><span style="color:#6b7280">Founder &amp; CEO, EZYOURLIFE</span></p>
</td></tr></table>
<p style="color:#9ca3af;font-size:12px;margin:16px 0 0">EZYOURLIFE · ezyourlife.com</p>
</td></tr></table></body></html>`;
}

async function sendMail(to: string, subject: string, html: string, text: string, pdf: Uint8Array, fileName: string) {
  const resend = Deno.env.get("RESEND_API_KEY");
  if (resend) {
    let bin = ""; pdf.forEach((b) => (bin += String.fromCharCode(b)));
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resend}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: `EZYOURLIFE <${FROM()}>`, to: [to], reply_to: FROM(), subject, html, text, attachments: [{ filename: fileName, content: btoa(bin) }] }),
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
      auth: { username: FROM(), password: pass },
    },
  });
  try {
    await client.send({
      from: `EZYOURLIFE <${FROM()}>`, to, replyTo: FROM(), subject, content: text, html,
      attachments: [{ filename: fileName, content: pdf, encoding: "binary", contentType: "application/pdf" }],
    });
  } finally {
    await client.close();
  }
}

/** Records the invoice and emails it with a thank-you. Safe to call more than once per payment. */
export async function sendPaymentReceipt(supabase: Supa, r: ReceiptInput): Promise<void> {
  try {
    let email = r.email, name = r.name;
    if (!email || !name) {
      const { data } = await supabase.auth.admin.getUserById(r.userId);
      email = email || data?.user?.email;
      name = name || data?.user?.user_metadata?.full_name || data?.user?.user_metadata?.name || null;
    }
    const { data: inv, error } = await supabase.rpc("issue_payment_invoice", {
      _kind: r.kind, _user_id: r.userId, _email: email ?? null, _customer: name ?? null,
      _description: r.description, _amount: r.amountInr, _payment_id: r.paymentId, _order_id: r.orderId ?? null,
    });
    if (error) throw new Error(error.message);
    if (!inv || inv.emailed || !email) return; // already sent, or no address to send to
    const no = inv.invoice_no as string;
    const pdf = await invoicePdf(no, new Date(inv.created_at), { ...r, email, name });
    const subject = `Thank you for your payment · Invoice ${no}`;
    const text = `Thank you${name ? ", " + name.split(" ")[0] : ""}! Your payment of Rs. ${r.amountInr} for ${r.description} went through.\nInvoice: ${no}\nPayment ID: ${r.paymentId}\n${r.link ? r.link + "\n" : ""}\nReply to this email if you need anything.\nAbhijay Jain, Founder & CEO, EZYOURLIFE`;
    try {
      await sendMail(email, subject, emailHtml(no, { ...r, name }), text, pdf, `${no.replace(/\//g, "-")}.pdf`);
      await supabase.from("payment_invoices").update({ emailed_at: new Date().toISOString(), email_error: null }).eq("id", inv.id);
    } catch (e) {
      console.error("receipt email failed", e);
      await supabase.from("payment_invoices").update({ email_error: String(e instanceof Error ? e.message : e).slice(0, 500) }).eq("id", inv.id);
    }
  } catch (e) {
    console.error("sendPaymentReceipt", e);
  }
}

/** Runs the receipt after the response is sent, so the customer isn't kept waiting. */
export function receiptInBackground(supabase: Supa, r: ReceiptInput) {
  const p = sendPaymentReceipt(supabase, r);
  // deno-lint-ignore no-explicit-any
  const rt = (globalThis as any).EdgeRuntime;
  if (rt?.waitUntil) rt.waitUntil(p);
  return p;
}

/** Sends a sample receipt (no invoice is recorded). Used only for testing mail delivery. */
export async function sendSampleReceipt(to: string, r: ReceiptInput, no: string) {
  const pdf = await invoicePdf(no, new Date(), { ...r, email: to });
  await sendMail(to, `Thank you for your payment · Invoice ${no}`, emailHtml(no, r),
    `Sample receipt ${no} for ${r.description}, Rs. ${r.amountInr}`, pdf, `${no.replace(/\//g, "-")}.pdf`);
}
