-- Mail Desk: a person's Gmail accounts, their sorted mails, tasks and reply drafts.
--
-- Nothing here touches the wallet, prices or credit-charging code. Credits are charged by the
-- existing start_tool_run / complete_tool_run functions (through _shared/billing.ts), in runs of up to
-- 25 mails: tool "mail-desk-12" (1 credit) and "mail-desk-25" (2 credits). Those two price rows are
-- created by the first charge (ensurePrice); see docs/mail-desk.md.
--
-- The browser may read its own rows. Every write goes through the mail-desk function (service role),
-- except a few settings the person can change themselves (column grants below).
-- Gmail login tokens live in their own table with no policy, so the browser can never read them.

CREATE TABLE IF NOT EXISTS public.mail_desk_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  include_in_fetch boolean NOT NULL DEFAULT true,
  display_name text,
  sign_off text,
  reply_lang text NOT NULL DEFAULT 'same' CHECK (reply_lang IN ('same', 'en', 'hi')),
  read_updates boolean NOT NULL DEFAULT false,
  connected boolean NOT NULL DEFAULT false,
  sync_cursor text,
  last_synced_at timestamptz,
  last_fetched_at timestamptz,
  scope_floor text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, email)
);

CREATE TABLE IF NOT EXISTS public.mail_desk_tokens (
  account_id uuid PRIMARY KEY REFERENCES public.mail_desk_accounts(id) ON DELETE CASCADE,
  access_token text,
  refresh_token text,
  expiry bigint
);

CREATE TABLE IF NOT EXISTS public.mail_desk_mails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  account_id uuid NOT NULL REFERENCES public.mail_desk_accounts(id) ON DELETE CASCADE,
  ext_id text NOT NULL,
  thread_id text,
  from_name text,
  from_email text,
  subject text,
  snippet text,
  body text,
  received_at timestamptz NOT NULL,
  labels text[] NOT NULL DEFAULT '{}',
  list_unsub boolean NOT NULL DEFAULT false,
  precedence text NOT NULL DEFAULT '',
  kind text,
  segmented_at timestamptz,
  ai_done boolean NOT NULL DEFAULT false,
  summary text,
  reply_label text,
  run_id uuid,
  claim_id uuid,
  claimed_at timestamptz,
  UNIQUE (account_id, ext_id)
);
CREATE INDEX IF NOT EXISTS mail_desk_mails_pending ON public.mail_desk_mails (user_id, account_id, received_at DESC) WHERE segmented_at IS NULL;
CREATE INDEX IF NOT EXISTS mail_desk_mails_read ON public.mail_desk_mails (user_id, received_at DESC) WHERE segmented_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.mail_desk_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  account_id uuid NOT NULL REFERENCES public.mail_desk_accounts(id) ON DELETE CASCADE,
  mail_id uuid REFERENCES public.mail_desk_mails(id) ON DELETE CASCADE,
  title text NOT NULL,
  kind text NOT NULL DEFAULT 'ask',
  due date,
  done boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (mail_id, title)
);

CREATE TABLE IF NOT EXISTS public.mail_desk_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  mail_id uuid NOT NULL UNIQUE REFERENCES public.mail_desk_mails(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- One row per charged run of up to 25 mails: what it cost the person and a rough estimate of what the AI cost us.
CREATE TABLE IF NOT EXISTS public.mail_desk_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tool_run_id uuid,
  tool_id text NOT NULL,
  mails int NOT NULL,
  mails_ai int NOT NULL DEFAULT 0,
  mails_free int NOT NULL DEFAULT 0,
  credits_charged int NOT NULL DEFAULT 0,
  est_ai_cost_inr numeric NOT NULL DEFAULT 0,
  account_ids uuid[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'succeeded' CHECK (status IN ('succeeded', 'failed')),
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.mail_desk_accounts, public.mail_desk_tokens, public.mail_desk_mails, public.mail_desk_tasks, public.mail_desk_drafts, public.mail_desk_runs TO service_role;

ALTER TABLE public.mail_desk_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mail_desk_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mail_desk_mails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mail_desk_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mail_desk_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mail_desk_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read own mail desk accounts" ON public.mail_desk_accounts FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Change own mail desk settings" ON public.mail_desk_accounts FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
-- The Gmail the person signed up with is the default account and cannot be removed.
CREATE POLICY "Remove own extra mail desk accounts" ON public.mail_desk_accounts FOR DELETE TO authenticated USING (user_id = auth.uid() AND NOT is_default);
CREATE POLICY "Read own mails" ON public.mail_desk_mails FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Read own tasks" ON public.mail_desk_tasks FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Tick own tasks" ON public.mail_desk_tasks FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Read own drafts" ON public.mail_desk_drafts FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Read own runs" ON public.mail_desk_runs FOR SELECT TO authenticated USING (user_id = auth.uid());
-- mail_desk_tokens: no policy on purpose.

-- The browser may change only these columns.
REVOKE ALL ON public.mail_desk_tokens FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.mail_desk_accounts, public.mail_desk_mails, public.mail_desk_tasks, public.mail_desk_drafts, public.mail_desk_runs FROM anon, authenticated;
GRANT UPDATE (display_name, sign_off, reply_lang, include_in_fetch, read_updates) ON public.mail_desk_accounts TO authenticated;
GRANT DELETE ON public.mail_desk_accounts TO authenticated;
GRANT UPDATE (done) ON public.mail_desk_tasks TO authenticated;
GRANT SELECT ON public.mail_desk_accounts, public.mail_desk_mails, public.mail_desk_tasks, public.mail_desk_drafts, public.mail_desk_runs TO authenticated;