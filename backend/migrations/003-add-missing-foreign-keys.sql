-- Remove the problematic FK constraints first
-- This allows us to clean up and add proper constraints later

ALTER TABLE public.companion_topics
DROP CONSTRAINT IF EXISTS companion_topics_companion_id_fkey;

ALTER TABLE public.favorites
DROP CONSTRAINT IF EXISTS favorites_companion_id_fkey;

ALTER TABLE public.chats
DROP CONSTRAINT IF EXISTS chats_companion_id_fkey;

ALTER TABLE public.reviews
DROP CONSTRAINT IF EXISTS reviews_companion_id_fkey;

ALTER TABLE public.reports
DROP CONSTRAINT IF EXISTS reports_companion_id_fkey;
