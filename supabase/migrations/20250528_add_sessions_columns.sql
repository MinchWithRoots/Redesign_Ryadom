-- Add sessions column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS sessions INTEGER DEFAULT 0;

-- Add sessions column to companions table
ALTER TABLE companions
ADD COLUMN IF NOT EXISTS sessions INTEGER DEFAULT 0;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_users_sessions ON users(sessions);
CREATE INDEX IF NOT EXISTS idx_companions_sessions ON companions(sessions);
