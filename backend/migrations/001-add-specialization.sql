-- Migration: Add specialization field to companions table
-- Date: 2024
-- Description: Adds specialization field to store companion specialization information

-- Add specialization column if it doesn't exist
ALTER TABLE companions 
ADD COLUMN IF NOT EXISTS specialization TEXT;

-- Add comment to the column
COMMENT ON COLUMN companions.specialization IS 'Professional specialization of the companion (e.g., Psychotherapy, Coaching, etc.)';

-- Create index for faster searches
CREATE INDEX IF NOT EXISTS idx_companions_specialization ON companions(specialization);

-- Display confirmation
SELECT 'Specialization column added successfully!' as status;
