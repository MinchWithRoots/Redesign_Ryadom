-- Create companion_applications table
CREATE TABLE IF NOT EXISTS companion_applications (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  age INTEGER,
  gender VARCHAR,
  experience VARCHAR, -- 'Начинающий' или 'Опытный специалист'
  bio TEXT,
  image VARCHAR,
  topics JSONB DEFAULT '[]'::jsonb, -- array of topic IDs
  message TEXT, -- motivation/additional message
  status VARCHAR DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  rejection_reason TEXT, -- reason if rejected
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ
);

-- Create index for faster queries
CREATE INDEX idx_companion_applications_user_id ON companion_applications(user_id);
CREATE INDEX idx_companion_applications_status ON companion_applications(status);
CREATE INDEX idx_companion_applications_created_at ON companion_applications(created_at);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_companion_applications_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_companion_applications_timestamp ON companion_applications;
CREATE TRIGGER update_companion_applications_timestamp
  BEFORE UPDATE ON companion_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_companion_applications_timestamp();
