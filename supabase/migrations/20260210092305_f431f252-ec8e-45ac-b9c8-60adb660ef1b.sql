
-- Create activity_logs table for tracking all user activity (admin-only viewing)
CREATE TABLE public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  action_type TEXT NOT NULL, -- 'tool_usage', 'profile_edit', 'login', 'signup', 'payment', 'subscription'
  action_details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Users can insert their own logs (for client-side tracking)
CREATE POLICY "Users can insert their own activity logs"
ON public.activity_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- No SELECT/UPDATE/DELETE for regular users - admin reads via service role
-- This ensures only admins (via service role key) can view logs

-- Create index for efficient querying by user and time
CREATE INDEX idx_activity_logs_user_id ON public.activity_logs (user_id);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs (created_at DESC);
CREATE INDEX idx_activity_logs_action_type ON public.activity_logs (action_type);
