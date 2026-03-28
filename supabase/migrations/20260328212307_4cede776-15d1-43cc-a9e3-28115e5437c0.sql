-- Allow moderators to view activity logs
CREATE POLICY "Moderators can view all activity logs"
ON public.activity_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'moderator'));

-- Allow moderators to view all profiles
CREATE POLICY "Moderators can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'moderator'));

-- Allow moderators to view all premium access
CREATE POLICY "Moderators can view all premium access"
ON public.premium_access
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'moderator'));

-- Allow moderators to view all roles
CREATE POLICY "Moderators can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'moderator'));

-- Allow moderators to view tool requests
CREATE POLICY "Moderators can view all tool requests"
ON public.tool_requests
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'moderator'));

-- Allow moderators to view all events
CREATE POLICY "Moderators can view all events"
ON public.meet_nudge_events
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'moderator'));

-- Allow moderators to view all contacts
CREATE POLICY "Moderators can view all contacts"
ON public.meet_nudge_contacts
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'moderator'));