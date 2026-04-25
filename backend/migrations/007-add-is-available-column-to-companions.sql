-- Add is_available column to companions table if it doesn't exist
ALTER TABLE public.companions
ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true;

-- Update existing companions to be available
UPDATE public.companions
SET is_available = true
WHERE is_available IS NULL;

-- Add a comment to document the column
COMMENT ON COLUMN public.companions.is_available IS 'Whether this companion is available for new connections';
