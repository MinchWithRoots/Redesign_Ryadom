-- Ensure specialization column exists in companions table
-- This field stores comma-separated specialization topics (e.g., "Депрессия, тревога, отношения")

ALTER TABLE companions 
ADD COLUMN IF NOT EXISTS specialization TEXT;

COMMENT ON COLUMN companions.specialization IS 'Comma-separated list of specialization topics for conversations (e.g., "Депрессия, тревога, отношения")';

SELECT 'Specialization column ready!' as status;
