-- Helper functions for companion role management
-- This migration adds utility functions to check and manage companion roles

-- Create or replace a helper function to check if a user is a companion
CREATE OR REPLACE FUNCTION is_user_a_companion(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = user_id AND role = 'companion'
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create or replace a helper function to get companion by user_id
CREATE OR REPLACE FUNCTION get_companion_by_user_id(user_id UUID)
RETURNS TABLE(id BIGINT, name VARCHAR, age INTEGER, gender VARCHAR, experience VARCHAR, bio TEXT, image VARCHAR, topics JSONB) AS $$
BEGIN
  RETURN QUERY
  SELECT c.id, c.name, c.age, c.gender, c.experience, c.bio, c.image, c.topics
  FROM public.companions c
  WHERE c.user_id = get_companion_by_user_id.user_id
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;
