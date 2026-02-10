-- Re-create the trigger for new user profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Re-create the updated_at trigger for profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Insert missing profile for existing user
INSERT INTO public.profiles (id, email, display_name, full_name, auth_provider)
SELECT 
  id,
  email,
  coalesce(raw_user_meta_data->>'display_name', split_part(email, '@', 1)),
  coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name'),
  coalesce(raw_app_meta_data->>'provider', 'email')
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);