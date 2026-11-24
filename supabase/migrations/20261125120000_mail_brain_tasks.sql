-- Mail Brain automation: "Auto-reply to all emails" and other future task types.
--
-- Safety decision: the automation never sends unattended. run-mail-brain-tasks only drafts a
-- reply and logs it here with status 'pending'; a person approves (or discards) each one from the
-- UI, which is what actually calls Gmail's send (through send-mail-brain-reply). The unique
-- constraint on (task_id, gmail_thread_id) is what stops the same thread being drafted twice.
--
-- Task config (mail_brain_tasks) is the person's own preference data, so unlike mail_desk_*, the
-- browser may insert/update/delete its own rows directly (RLS-scoped) rather than going through a
-- function. mail_brain_task_logs can only be read and marked 'skipped' directly; moving a row to
-- 'sent' happens only inside send-mail-brain-reply (service role), after Gmail actually accepts it.

CREATE TABLE IF NOT EXISTS public.mail_brain_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_type text NOT NULL DEFAULT 'auto_reply_all' CHECK (task_type IN ('auto_reply_all')),
  name text NOT NULL DEFAULT 'Auto-reply to all emails',
  is_active boolean NOT NULL DEFAULT true,
  reply_mode text NOT NULL DEFAULT 'fixed' CHECK (reply_mode IN ('fixed', 'ai')),
  reply_template_or_prompt text NOT NULL DEFAULT '',
  skip_automated boolean NOT NULL DEFAULT true,
  last_run_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.mail_brain_task_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.mail_brain_tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.mail_desk_accounts(id) ON DELETE CASCADE,
  gmail_thread_id text NOT NULL,
  gmail_message_id text NOT NULL,
  sender_name text,
  sender_email text,
  subject text,
  draft_reply text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'skipped')),
  replied_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (task_id, gmail_thread_id)
);
CREATE INDEX IF NOT EXISTS mail_brain_task_logs_pending ON public.mail_brain_task_logs (user_id, created_at DESC) WHERE status = 'pending';

ALTER TABLE public.mail_brain_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mail_brain_task_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read own automation tasks" ON public.mail_brain_tasks FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Create own automation tasks" ON public.mail_brain_tasks FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Change own automation tasks" ON public.mail_brain_tasks FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Remove own automation tasks" ON public.mail_brain_tasks FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Read own automation queue" ON public.mail_brain_task_logs FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Discard own automation queue" ON public.mail_brain_task_logs FOR UPDATE TO authenticated USING (user_id = auth.uid() AND status = 'pending') WITH CHECK (user_id = auth.uid() AND status = 'skipped');

REVOKE ALL ON public.mail_brain_tasks, public.mail_brain_task_logs FROM anon, authenticated;
GRANT SELECT, INSERT, DELETE ON public.mail_brain_tasks TO authenticated;
-- last_run_at is the automation's own bookkeeping; the browser may change everything else about a task.
GRANT UPDATE (name, is_active, reply_mode, reply_template_or_prompt, skip_automated) ON public.mail_brain_tasks TO authenticated;
GRANT SELECT ON public.mail_brain_task_logs TO authenticated;
-- "Discard" is the only self-service write here; "Send" always goes through send-mail-brain-reply
-- (service role), which is what moves a row to 'sent' once Gmail has actually accepted it.
GRANT UPDATE (status) ON public.mail_brain_task_logs TO authenticated;
