-- Increase the image field limit in companions table from VARCHAR(500) to VARCHAR(2000)
-- This is needed because Supabase Storage URLs can be longer than 500 characters

-- Alter the companions table
ALTER TABLE public.companions
ALTER COLUMN image TYPE VARCHAR(2000);

-- Also increase the limit in companion_applications table for consistency
ALTER TABLE public.companion_applications
ALTER COLUMN image TYPE VARCHAR(2000);

-- Increase in users table if it exists
ALTER TABLE public.users
ALTER COLUMN image TYPE VARCHAR(2000);
