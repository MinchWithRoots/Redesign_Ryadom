-- Cleanup base64 image data that was incorrectly saved and causes index row size errors
-- The image columns now only store Supabase Storage URLs, not base64 data

-- Clean up users table
UPDATE public.users
SET image = NULL
WHERE image ~ '^data:';

-- Clean up companions table
UPDATE public.companions
SET image = NULL
WHERE image ~ '^data:';

-- Clean up companion_applications table
UPDATE public.companion_applications
SET image = NULL
WHERE image ~ '^data:';
