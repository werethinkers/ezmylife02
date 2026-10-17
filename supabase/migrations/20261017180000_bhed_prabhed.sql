-- Bhed Prabhed studio: a signed-in user's charts and their attached files, private to the owner.
-- Charts are also kept in the browser; this is the copy that follows the user to other devices.

CREATE TABLE IF NOT EXISTS public.bhed_charts (
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  id text NOT NULL CHECK (char_length(id) BETWEEN 1 AND 80),
  title text NOT NULL DEFAULT '',
  document text NOT NULL,
  created_ms bigint NOT NULL,
  updated_ms bigint NOT NULL,
  PRIMARY KEY (user_id, id)
);

CREATE INDEX IF NOT EXISTS bhed_charts_user_updated_idx ON public.bhed_charts (user_id, updated_ms DESC);

CREATE TABLE IF NOT EXISTS public.bhed_chart_media (
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  id text NOT NULL CHECK (char_length(id) BETWEEN 1 AND 80),
  chart_id text NOT NULL,
  name text NOT NULL,
  mime text NOT NULL,
  data_b64 text NOT NULL,
  PRIMARY KEY (user_id, id)
);

CREATE INDEX IF NOT EXISTS bhed_chart_media_chart_idx ON public.bhed_chart_media (user_id, chart_id);

ALTER TABLE public.bhed_charts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bhed_chart_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner reads own charts" ON public.bhed_charts FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Owner adds own charts" ON public.bhed_charts FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Owner updates own charts" ON public.bhed_charts FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Owner deletes own charts" ON public.bhed_charts FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Owner reads own chart files" ON public.bhed_chart_media FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Owner adds own chart files" ON public.bhed_chart_media FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Owner updates own chart files" ON public.bhed_chart_media FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Owner deletes own chart files" ON public.bhed_chart_media FOR DELETE TO authenticated USING (user_id = auth.uid());

-- 25 credits each time a new map is made (opening and editing saved maps is free).
INSERT INTO public.tool_pricing (tool_id, cost_inr, credit_cost)
VALUES ('bhed-prabhed', 7.5, 25)
ON CONFLICT (tool_id) DO NOTHING;
