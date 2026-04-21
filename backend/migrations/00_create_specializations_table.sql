-- Create specializations table
CREATE TABLE IF NOT EXISTS specializations (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create companion_specializations junction table
CREATE TABLE IF NOT EXISTS companion_specializations (
  id BIGSERIAL PRIMARY KEY,
  companion_id BIGINT NOT NULL,
  specialization_id BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (companion_id) REFERENCES companions(id) ON DELETE CASCADE,
  FOREIGN KEY (specialization_id) REFERENCES specializations(id) ON DELETE CASCADE,
  UNIQUE(companion_id, specialization_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_companion_specializations_companion_id 
  ON companion_specializations(companion_id);

CREATE INDEX IF NOT EXISTS idx_companion_specializations_specialization_id 
  ON companion_specializations(specialization_id);
