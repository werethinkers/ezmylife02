-- Schedules run-mail-brain-tasks every 5 minutes. This drafts and queues auto-replies for review
-- only — see the big comment at the top of supabase/functions/run-mail-brain-tasks/index.ts for
-- why it never sends anything by itself.
--
-- MANUAL STEP FIRST (once, outside this file): store the service role key in Vault instead of
-- writing it into this SQL file, so it never sits in plain text in the migration history or in
-- cron.job. In the SQL editor:
--   select vault.create_secret('<your service_role key>', 'mail_brain_cron_service_role');
-- Then run the rest of this file. If pg_cron/pg_net aren't enabled yet, turn them on first under
-- Database -> Extensions in the dashboard (the CREATE EXTENSION lines below are a no-op once they are).

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Replace <project-ref> with this project's ref (the subdomain in its Supabase URL) before running.
SELECT cron.schedule(
  'mail-brain-run-tasks',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://<project-ref>.supabase.co/functions/v1/run-mail-brain-tasks',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'mail_brain_cron_service_role')
    ),
    body := '{}'::jsonb
  );
  $$
);

-- To change the schedule later: select cron.alter_job((select jobid from cron.job where jobname = 'mail-brain-run-tasks'), schedule := '*/2 * * * *');
-- To stop it: select cron.unschedule('mail-brain-run-tasks');
