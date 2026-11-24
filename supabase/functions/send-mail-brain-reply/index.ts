// Sends a reply through the person's own connected Gmail. Free — the person wrote or approved the
// exact text themselves, so there's nothing to charge for (the AI draft that filled the textarea,
// if any, is a separate action: mail-brain-draft-reply, billed through the generic ai-app engine).
//
// Two ways in:
//   { mail_id, body }              — Feature 1: reply to one mail from the Mails list, right now.
//   { task_log_id }                — Feature 2: send a reply the auto-reply automation already
//                                     drafted and queued in mail_desk_task_logs (status 'pending').
//                                     Nothing here ever sends automatically; this only runs when a
//                                     person taps "Send" on a queued draft.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders, json } from "../_shared/http.ts";
import { identify } from "../_shared/billing.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { gmailThreadHeaders, googleAccessToken, sendGmailReply } from "../_shared/mailDesk.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const db = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
// deno-lint-ignore no-explicit-any
type Row = Record<string, any>;
const fail = (status: number, error: string, extra: Row = {}) => json({ error, message: extra.message ?? error, ...extra }, status);

async function sendForMail(uid: string, mailId: string, replyBody: string) {
  const { data: mail } = await db.from("mail_desk_mails").select("*").eq("id", mailId).eq("user_id", uid).maybeSingle();
  if (!mail) return fail(404, "not_found", { message: "That mail could not be found." });
  if (!mail.from_email) return fail(400, "no_sender", { message: "This mail has no reply address." });
  const { data: acct } = await db.from("mail_desk_accounts").select("*").eq("id", mail.account_id).maybeSingle();
  if (!acct?.connected) return fail(409, "not_connected", { message: "Connect this Gmail again to send replies." });

  let token: string;
  try { token = await googleAccessToken(db, acct.id); } catch (e) { return fail(409, "not_connected", { message: e instanceof Error ? e.message : "Connect this Gmail again." }); }

  const thread = await gmailThreadHeaders(token, mail.ext_id);
  const body = acct.sign_off ? `${replyBody.trim()}\n\n${acct.sign_off}` : replyBody.trim();
  if (!body) return fail(400, "empty_reply", { message: "Write something to send." });

  try {
    const sent = await sendGmailReply(token, { to: mail.from_email, subject: mail.subject || "", body, threadId: mail.thread_id || mail.ext_id, thread });
    return json({ ok: true, id: sent.id });
  } catch (e) {
    console.error("send-mail-brain-reply (mail)", e);
    return fail(502, "gmail_error", { message: e instanceof Error ? e.message : "Gmail did not accept the reply." });
  }
}

async function sendForTaskLog(uid: string, taskLogId: string) {
  const { data: row } = await db.from("mail_desk_task_logs").select("*").eq("id", taskLogId).eq("user_id", uid).maybeSingle();
  if (!row) return fail(404, "not_found", { message: "That queued reply could not be found." });
  if (row.status !== "pending") return fail(409, "already_handled", { message: "That reply was already sent or discarded." });
  const { data: acct } = await db.from("mail_desk_accounts").select("*").eq("id", row.account_id).maybeSingle();
  if (!acct?.connected) return fail(409, "not_connected", { message: "Connect this Gmail again to send replies." });

  let token: string;
  try { token = await googleAccessToken(db, acct.id); } catch (e) { return fail(409, "not_connected", { message: e instanceof Error ? e.message : "Connect this Gmail again." }); }

  const thread = await gmailThreadHeaders(token, row.gmail_message_id);
  const body = acct.sign_off ? `${String(row.draft_reply).trim()}\n\n${acct.sign_off}` : String(row.draft_reply).trim();

  try {
    const sent = await sendGmailReply(token, { to: row.sender_email, subject: row.subject || "", body, threadId: row.gmail_thread_id, thread });
    await db.from("mail_desk_task_logs").update({ status: "sent", replied_at: new Date().toISOString() }).eq("id", row.id);
    return json({ ok: true, id: sent.id });
  } catch (e) {
    console.error("send-mail-brain-reply (task log)", e);
    return fail(502, "gmail_error", { message: e instanceof Error ? e.message : "Gmail did not accept the reply." });
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const caller = await identify(req);
    if (!caller?.userId) return fail(401, "sign_in_required", { message: "Please sign in to send a reply." });
    const body = await req.json().catch(() => ({}));
    if (typeof body.task_log_id === "string" && body.task_log_id) return await sendForTaskLog(caller.userId, body.task_log_id);
    if (typeof body.mail_id === "string" && body.mail_id && typeof body.body === "string") return await sendForMail(caller.userId, body.mail_id, body.body);
    return fail(400, "bad_request", { message: "Need either { mail_id, body } or { task_log_id }." });
  } catch (e) {
    console.error("send-mail-brain-reply", e);
    return fail(500, "server_error", { message: e instanceof Error ? e.message : String(e) });
  }
});
