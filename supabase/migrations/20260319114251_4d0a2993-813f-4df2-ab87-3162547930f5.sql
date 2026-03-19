
-- Meet Nudge Host Profiles (public readable for guests)
CREATE TABLE public.meet_nudge_profiles (
  host_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  occupation text,
  business_name text,
  business_url text,
  linkedin_url text,
  email text,
  phone text,
  bio text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.meet_nudge_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view host profiles" ON public.meet_nudge_profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.meet_nudge_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Users can update their own profile" ON public.meet_nudge_profiles FOR UPDATE TO authenticated USING (auth.uid() = host_id);

-- Meet Nudge Events
CREATE TABLE public.meet_nudge_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  date text,
  location text,
  slug text UNIQUE NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.meet_nudge_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view events by slug" ON public.meet_nudge_events FOR SELECT USING (true);
CREATE POLICY "Users can insert their own events" ON public.meet_nudge_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Users can update their own events" ON public.meet_nudge_events FOR UPDATE TO authenticated USING (auth.uid() = host_id);
CREATE POLICY "Users can delete their own events" ON public.meet_nudge_events FOR DELETE TO authenticated USING (auth.uid() = host_id);

-- Meet Nudge Contacts
CREATE TABLE public.meet_nudge_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id uuid REFERENCES public.meet_nudge_events(id) ON DELETE SET NULL,
  event_name text,
  name text NOT NULL,
  occupation text,
  business_name text,
  location text,
  website text,
  linkedin_url text,
  email text,
  phone text,
  fun_fact text,
  intro_sent boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.meet_nudge_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert contacts" ON public.meet_nudge_contacts FOR INSERT WITH CHECK (true);
CREATE POLICY "Hosts can view their contacts" ON public.meet_nudge_contacts FOR SELECT TO authenticated USING (auth.uid() = host_id);
CREATE POLICY "Hosts can update their contacts" ON public.meet_nudge_contacts FOR UPDATE TO authenticated USING (auth.uid() = host_id);
CREATE POLICY "Hosts can delete their contacts" ON public.meet_nudge_contacts FOR DELETE TO authenticated USING (auth.uid() = host_id);

-- Enable realtime on contacts
ALTER PUBLICATION supabase_realtime ADD TABLE public.meet_nudge_contacts;

-- Updated_at triggers
CREATE TRIGGER handle_meet_nudge_profiles_updated_at
  BEFORE UPDATE ON public.meet_nudge_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
