-- Add unique constraint on user_id so upsert works correctly
ALTER TABLE public.notebook_sessions ADD CONSTRAINT notebook_sessions_user_id_key UNIQUE (user_id);