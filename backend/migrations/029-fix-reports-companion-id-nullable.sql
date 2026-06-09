-- Make companion_id nullable in reports table since companion can complain about user

-- First, alter the column to allow NULL values
ALTER TABLE public.reports
ALTER COLUMN companion_id DROP NOT NULL;

-- This allows reports where:
-- - User complains about Companion: companion_id = companion's id, reported_companion_id = companion's id, reported_user_id = NULL
-- - Companion complains about User: companion_id = NULL, reported_user_id = user's id, reported_companion_id = NULL
