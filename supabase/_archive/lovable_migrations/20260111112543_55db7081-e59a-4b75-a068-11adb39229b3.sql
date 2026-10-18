-- Add mobile format validation to delegates table
ALTER TABLE public.delegates 
ADD CONSTRAINT delegates_mobile_format 
CHECK (mobile IS NULL OR mobile ~ '^[0-9+\-\s()]+$');