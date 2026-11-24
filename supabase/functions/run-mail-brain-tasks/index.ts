// The "Auto-reply to all emails" automation (/mail-brain, Automation tab).
//
// Safety: this NEVER sends. It only drafts a reply and queues it in mail_brain_task_logs with
// status 'pending' — a person has to tap "Send" (send-mail-brain-reply) on each one, or "Send all",
// for anything to actually leave the account. That was a deliberate call, not an oversight: an
// unattended bot replying to a real inbox with no review is exactly the kind of thing that creates
// mail loops with other auto-responders, replies to spam/phishing senders, or gets the Gmail OAuth
// app flagged for abuse — all of that is avoided by keeping a human in the loop on the send step.
//
// Two callers:
//   - Supabase Cron, every few minutes, with the service-role key: runs every active task for
//     every user (see supabase/migrations for the cron.schedule statement to run once, manually).
//   - The "Run Now" button on the page, with the signed-in user's own token: runs only that user's
//     own active tasks, for trying the automation out without waiting for the schedule.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { corsHeaders, json } from "../_shared/http.ts";
import { identify, ensurePrice, startRun, finishRun } from "../_shared/billing.ts";
import { chat } from "../_shared/llm.ts";
import { AI_MODEL, cleanBody, googleAccessToken, pickBody, senderParts, sortMail } from "../_shared/mailDesk.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const db = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
// deno-lint-ignore no-explicit-any
type Row = Record<string, any>;
const fail = (status: number, error: string, extra: Row = {}) => json({ error, message: extra.message ?? error, ...extra }, status);

const MAX_PER_ACCOUNT = 25; // bounds one run's Gmail calls and AI spend, whether cron or "Run Now"
const AUTO_REPLY_TOOL = "mail-brain-auto-reply";

const hdr = (h: Row[], n: string) => h.find((x: Row) => String(x.name).toLowerCase() === n)?.value ?? "";

async function listCandidates(token: string, sinceIso: string | null): Promise<string[]> {
  const q = new URLSearchParams({ maxResults: String(MAX_PER_ACCOUNT) });
  const terms = ["in:inbox", "is:unread"];
  if (sinceIso) terms.push(`after:${Math.floor(new Date(sinceIso).getTime() / 1000)}`);
  q.set("q", terms.join(" "));
  const r = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?${q}`, { headers: { authorization: `Bearer ${token}` } });
  if (!r.ok) return [];
  const j = await r.json();
  return ((j.messages ?? []) as Row[]).map((m) => m.id);
}

async function getMessage(token: string, id: string): Promise<Row | null> {
  const r = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`, { headers: { authorization: `Bearer ${token}` } });
  return r.ok ? await r.json() : null;
}

async function aiReply(instruction: string, mail: { from: string; subject: string; body: string }): Promise<string> {
  const sys = `You write one short, ready-to-send email reply for the person who owns this inbox, following their instruction for tone and content exactly. Never invent facts, prices, availability or commitments that aren't in the instruction or the mail. Plain text only — no subject line, no "Dear X" unless the instruction asks for one, no sign-off (that is added separately).`;
  const user = `Instruction: ${instruction || "Be polite and brief."}\n\nMail from: ${mail.from}\nSubject: ${mail.subject}\nBody:\n${mail.body}`;
  const text = await chat([{ role: "system", content: sys }, { role: "user", content: user }], { model: AI_MODEL, maxTokens: 500, temperature: 0.4 });
  return text.trim();
}

/** Runs every active task belonging to `onlyUserId`, or every active task for every user when null (cron). */
async function runTasks(onlyUserId: string | null) {
  let q = db.from("mail_brain_tasks").select("*").eq("is_active", true);
  if (onlyUserId) q = q.eq("user_id", onlyUserId);
  const { data: tasks } = await q;
  const summary = { tasks_run: 0, drafted: 0, skipped: 0, errors: [] as string[] };

  for (const task of (tasks ?? []) as Row[]) {
    const runStartedAt = new Date().toISOString();
    try {
      const { data: accounts } = await db.from("mail_desk_accounts").select("*").eq("user_id", task.user_id).eq("connected", true);
      const { data: already } = await db.from("mail_brain_task_logs").select("gmail_thread_id").eq("task_id", task.id);
      const seenThreads = new Set((already ?? []).map((r: Row) => r.gmail_thread_id));
      let draftedThisTask = 0;

      for (const acct of (accounts ?? []) as Row[]) {
        let token: string;
        try { token = await googleAccessToken(db, acct.id); } catch { continue; } // this Gmail needs reconnecting; skip it, not the whole task

        const ids = await listCandidates(token, task.last_run_at);
        for (const id of ids) {
          const m = await getMessage(token, id);
          if (!m) continue;
          const h = m.payload?.headers ?? [];
          const from = senderParts(hdr(h, "from"));
          const threadId: string = m.threadId;
          if (seenThreads.has(threadId)) continue; // only once per thread, ever, for this task
          if (from.email === acct.email.toLowerCase()) continue; // never reply to ourselves (loop guard)

          if (task.skip_automated) {
            const kind = sortMail({ labels: m.labelIds ?? [], list_unsub: !!hdr(h, "list-unsubscribe"), precedence: String(hdr(h, "precedence")), from_email: from.email }).kind;
            if (kind !== "person") { summary.skipped++; continue; }
          }

          const subject = String(hdr(h, "subject")).slice(0, 300);
          const body = cleanBody(pickBody(m.payload) || String(m.snippet ?? ""));

          let draft: string;
          if (task.reply_mode === "ai") {
            await ensurePrice(AUTO_REPLY_TOOL, 2);
            const start = await startRun(task.user_id, AUTO_REPLY_TOOL).catch(() => null);
            if (!start?.ok) { summary.errors.push(`${task.name}: out of credits for AI replies`); break; } // stop this account's AI drafting, not the whole run
            try {
              draft = await aiReply(task.reply_template_or_prompt, { from: `${from.name} <${from.email}>`, subject, body });
              await finishRun(task.user_id, start.run_id as string, true);
            } catch (e) {
              await finishRun(task.user_id, start.run_id as string, false, e instanceof Error ? e.message : String(e)).catch(() => undefined);
              summary.errors.push(`${task.name}: ${e instanceof Error ? e.message : "AI draft failed"}`);
              continue;
            }
          } else {
            draft = String(task.reply_template_or_prompt || "").trim();
          }
          if (!draft) continue;

          const { error: insErr } = await db.from("mail_brain_task_logs").insert({
            task_id: task.id, user_id: task.user_id, account_id: acct.id,
            gmail_thread_id: threadId, gmail_message_id: m.id,
            sender_name: from.name, sender_email: from.email, subject, draft_reply: draft,
          });
          if (!insErr) { seenThreads.add(threadId); draftedThisTask++; summary.drafted++; }
        }
      }
      await db.from("mail_brain_tasks").update({ last_run_at: runStartedAt }).eq("id", task.id);
      summary.tasks_run++;
      if (draftedThisTask === 0 && !(accounts ?? []).length) summary.errors.push(`${task.name}: no connected Gmail`);
    } catch (e) {
      console.error("run-mail-brain-tasks", task.id, e);
      summary.errors.push(`${task.name}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  return summary;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const caller = await identify(req);
    if (!caller) return fail(401, "sign_in_required", { message: "Please sign in." });
    const summary = await runTasks(caller.internal ? null : caller.userId);
    return json({ ok: true, ...summary });
  } catch (e) {
    console.error("run-mail-brain-tasks", e);
    return fail(500, "server_error", { message: e instanceof Error ? e.message : String(e) });
  }
});
