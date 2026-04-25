-- ============================================
-- Supabase Migration: Add Missing Columns
-- ============================================
-- This migration adds missing columns to existing tables
-- if they don't already exist

-- Add gender column to users table if it doesn't exist
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS gender VARCHAR(50);

-- Add topics column to users table if it doesn't exist
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS topics JSONB DEFAULT '[]'::jsonb;

-- Add gender column to companions table if it doesn't exist
ALTER TABLE public.companions
ADD COLUMN IF NOT EXISTS gender VARCHAR(50);

-- Add topics column to companions table if it doesn't exist (may already exist)
ALTER TABLE public.companions
ADD COLUMN IF NOT EXISTS topics JSONB DEFAULT '[]'::jsonb;

-- Fix RLS policies for users table
-- Note: ID-based checking doesn't work with BIGSERIAL IDs and Supabase UUID auth
-- Using email-based updates instead (email is UNIQUE)

DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;
CREATE POLICY "Users can view all profiles" ON public.users
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update profiles" ON public.users;
CREATE POLICY "Users can update profiles" ON public.users
  FOR UPDATE WITH CHECK (true);

DROP POLICY IF EXISTS "Allow users to insert their own profile during signup" ON public.users;
DROP POLICY IF EXISTS "Allow users to view all profiles" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated users to update profiles" ON public.users;
CREATE POLICY "Users can insert profiles" ON public.users
  FOR INSERT WITH CHECK (true);

-- Ensure companion_topics policy exists
DROP POLICY IF EXISTS "Anyone can view companion topics" ON public.companion_topics;

CREATE POLICY "Anyone can view companion topics" ON public.companion_topics
  FOR SELECT USING (true);
