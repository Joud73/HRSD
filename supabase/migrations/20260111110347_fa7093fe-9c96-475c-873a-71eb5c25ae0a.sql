-- Add input validation constraints to profiles table
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_org_name_length CHECK (organization_name IS NULL OR length(organization_name) <= 255);

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_registration_number_length CHECK (registration_number IS NULL OR length(registration_number) <= 50);

-- Add input validation constraints to delegates table
ALTER TABLE public.delegates 
ADD CONSTRAINT delegates_email_format CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE public.delegates 
ADD CONSTRAINT delegates_full_name_length CHECK (full_name IS NULL OR length(full_name) <= 255);

ALTER TABLE public.delegates 
ADD CONSTRAINT delegates_id_number_length CHECK (id_number IS NULL OR length(id_number) <= 20);

ALTER TABLE public.delegates 
ADD CONSTRAINT delegates_mobile_length CHECK (mobile IS NULL OR length(mobile) <= 20);

ALTER TABLE public.delegates 
ADD CONSTRAINT delegates_login_name_length CHECK (login_name IS NULL OR length(login_name) <= 100);