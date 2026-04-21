-- Create companion_specializations table
-- This table stores the relationship between companions and their specializations

CREATE TABLE IF NOT EXISTS companion_specializations (
  id BIGSERIAL PRIMARY KEY,
  companion_id BIGINT NOT NULL REFERENCES companions(id) ON DELETE CASCADE,
  specialization TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(companion_id, specialization)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_companion_specializations_id ON companion_specializations(companion_id);
CREATE INDEX IF NOT EXISTS idx_companion_specializations_name ON companion_specializations(specialization);

-- Add comment
COMMENT ON TABLE companion_specializations IS 'Stores specialization areas for each companion (e.g., Depression, Anxiety, Relationships)';
COMMENT ON COLUMN companion_specializations.specialization IS 'Specialization area (e.g., Депрессия, Тревога, Отношения)';
