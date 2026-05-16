-- Increase the image field limit from VARCHAR to TEXT (no limit)
-- This is needed because image URLs (especially from Supabase Storage) can be long

-- Alter the companions table
ALTER TABLE public.companions
ALTER COLUMN image TYPE TEXT;

-- Also increase the limit in companion_applications table for consistency
ALTER TABLE public.companion_applications
ALTER COLUMN image TYPE TEXT;

-- Increase in users table if it exists
ALTER TABLE public.users
ALTER COLUMN image TYPE TEXT;
