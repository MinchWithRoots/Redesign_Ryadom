-- Fix RLS policy for users table to allow admins to update user roles
-- This is needed for the companion application approval workflow

-- Drop the broken UPDATE policy
DROP POLICY IF EXISTS "Users can update profiles" ON public.users;

-- Create a new UPDATE policy that:
-- 1. Allows users to update their own profile
-- 2. Allows admins to update ANY user profile
CREATE POLICY "Users can update profiles" ON public.users
  FOR UPDATE
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Verify the policy was created
-- Run this query to check:
-- SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check
-- FROM pg_policies
-- WHERE tablename = 'users' AND policyname = 'Users can update profiles';
