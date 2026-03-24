CREATE POLICY "Admins can view all events" ON public.meet_nudge_events FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all events" ON public.meet_nudge_events FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all contacts" ON public.meet_nudge_contacts FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all contacts" ON public.meet_nudge_contacts FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));