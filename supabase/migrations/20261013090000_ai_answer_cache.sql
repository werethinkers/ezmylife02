-- Shared answer cache for the ai-app function (supabase/functions/_shared/answerCache.ts).
-- Holds AI answers by a hash of app + model + instructions + inputs, so an identical request
-- from another person is served without a new model call. Only the service role touches it.
CREATE TABLE IF NOT EXISTS public.ai_answer_cache (
  key text PRIMARY KEY,
  tool_id text NOT NULL,
  output jsonb NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_answer_cache_created_at_idx ON public.ai_answer_cache (created_at);

ALTER TABLE public.ai_answer_cache ENABLE ROW LEVEL SECURITY;
-- No policies on purpose: browsers cannot read or write it.
