-- Fix reports table to support both user->companion and companion->user complaints
-- Add columns to track who is reporting and who is being reported

-- First, add columns if they don't exist
ALTER TABLE public.reports
ADD COLUMN IF NOT EXISTS reporter_type VARCHAR(20),
ADD COLUMN IF NOT EXISTS reported_type VARCHAR(20),
ADD COLUMN IF NOT EXISTS reported_user_id UUID,
ADD COLUMN IF NOT EXISTS reported_companion_id BIGINT;

-- Update existing reports to have proper type and fill reported fields
-- Assume all existing reports are user->companion complaints
UPDATE public.reports
SET
  reporter_type = COALESCE(reporter_type, 'user'),
  reported_type = COALESCE(reported_type, 'companion'),
  reported_companion_id = COALESCE(reported_companion_id, companion_id),
  reported_user_id = COALESCE(reported_user_id, NULL)
WHERE TRUE;

-- Drop existing constraints if they exist (to avoid conflicts)
ALTER TABLE public.reports
DROP CONSTRAINT IF EXISTS reports_reported_user_id_fkey,
DROP CONSTRAINT IF EXISTS reports_reported_companion_id_fkey,
DROP CONSTRAINT IF EXISTS check_reporter_type,
DROP CONSTRAINT IF EXISTS check_reported_type;

-- Add foreign key for reported_user_id
ALTER TABLE public.reports
ADD CONSTRAINT reports_reported_user_id_fkey
FOREIGN KEY (reported_user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Add foreign key for reported_companion_id
ALTER TABLE public.reports
ADD CONSTRAINT reports_reported_companion_id_fkey
FOREIGN KEY (reported_companion_id) REFERENCES companions(id) ON DELETE CASCADE;

-- Add check constraints to ensure valid type combinations
ALTER TABLE public.reports
ADD CONSTRAINT check_reporter_type CHECK (reporter_type IN ('user', 'companion')),
ADD CONSTRAINT check_reported_type CHECK (reported_type IN ('user', 'companion'));

-- Create index on reporter_type and reported_type for faster queries
CREATE INDEX IF NOT EXISTS reports_reporter_type_idx ON public.reports(reporter_type);
CREATE INDEX IF NOT EXISTS reports_reported_type_idx ON public.reports(reported_type);
CREATE INDEX IF NOT EXISTS reports_reported_user_id_idx ON public.reports(reported_user_id);
CREATE INDEX IF NOT EXISTS reports_reported_companion_id_idx ON public.reports(reported_companion_id);
