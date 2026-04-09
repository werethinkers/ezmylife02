
-- Add nudge_id to meet_nudge_profiles
ALTER TABLE public.meet_nudge_profiles ADD COLUMN IF NOT EXISTS nudge_id text UNIQUE;

-- Add connected_via_host_id to meet_nudge_contacts
ALTER TABLE public.meet_nudge_contacts ADD COLUMN IF NOT EXISTS connected_via_host_id uuid;

-- Admin/mod RLS on meet_nudge_profiles
CREATE POLICY "Admins can view all profiles_mnp" ON public.meet_nudge_profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Moderators can view all profiles_mnp" ON public.meet_nudge_profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'moderator'::app_role));

-- Update premium_access check constraint to include 'complimentary'
ALTER TABLE public.premium_access DROP CONSTRAINT IF EXISTS premium_access_access_type_check;
ALTER TABLE public.premium_access ADD CONSTRAINT premium_access_access_type_check CHECK (access_type IN ('subscription', 'trial', 'coupon', 'complimentary'));

-- Allow service role to insert premium_access (for edge function)
-- The edge function uses service role key so RLS is bypassed, no extra policy needed

-- Allow service role to insert into meet_nudge_events for auto-created users
-- Service role bypasses RLS, so no extra policy needed
