-- Force RLS on profiles and delegates tables to prevent privileged users from bypassing policies
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.delegates FORCE ROW LEVEL SECURITY;