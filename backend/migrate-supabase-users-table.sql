-- Migration for Supabase users table
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/YOUR_PROJECT/sql/new
-- This script:
-- 1. Drops the existing users table (if needed)
-- 2. Creates the correct users table with proper fields
-- 3. Sets up indexes and defaults

-- IMPORTANT: Only run this if you have backed up your data!

-- Step 1: Drop existing table (CAUTION: This will delete all data!)
-- Uncomment only if needed:
-- DROP TABLE IF EXISTS public.users CASCADE;

-- Step 2: Create the users table with correct schema
CREATE TABLE IF NOT EXISTS public.users (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  age INTEGER,
  gender VARCHAR(50),
  bio TEXT,
  image VARCHAR(500),
  topics JSONB DEFAULT '[]'::jsonb,
  role VARCHAR(20) DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users USING BTREE (email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users USING BTREE (created_at);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users USING BTREE (role);

-- Step 4: Enable RLS (Row Level Security) for Supabase
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies
-- Allow users to view all profiles (for search/discovery)
CREATE POLICY "Users can view all profiles" ON public.users
  FOR SELECT
  USING (true);

-- Allow authenticated users to insert their profile
CREATE POLICY "Users can insert their profile" ON public.users
  FOR INSERT
  WITH CHECK (true);

-- Allow users to update profiles (by email which is unique)
CREATE POLICY "Users can update profiles" ON public.users
  FOR UPDATE
  WITH CHECK (true);

-- Note: Do not allow DELETE by policy (soft delete via is_active)
-- Admins can delete if needed through direct database access

-- Step 6: Verify the table structure
-- Run this query to verify:
-- SELECT * FROM information_schema.columns 
-- WHERE table_schema = 'public' AND table_name = 'users'
-- ORDER BY ordinal_position;
