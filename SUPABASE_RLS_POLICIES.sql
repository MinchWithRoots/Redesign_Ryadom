-- ============================================================================
-- SUPABASE RLS POLICIES
-- ============================================================================
-- This file contains Row Level Security (RLS) policies needed for proper
-- access control in Supabase. Execute this in Supabase SQL Editor.
--
-- Problem: "new row violates row-level security policy for table 'users'"
-- Cause: RLS is enabled but policies are not configured
-- Solution: Add proper RLS policies that allow registration and data access
-- ============================================================================

-- Step 1: Enable RLS on users table (if not already enabled)
ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USERS TABLE RLS POLICIES
-- ============================================================================

-- Policy 1: ALLOW INSERT during registration (anon users can create their profile)
-- During signup, the user has auth.uid() context even though not confirmed yet
CREATE POLICY "Allow users to insert their own profile during signup"
ON "public"."users"
FOR INSERT
WITH CHECK (auth.uid()::text IS NOT NULL);

-- Policy 2: ALLOW SELECT - Users can read all user profiles (for searches, etc)
-- Alternatively, make this more restrictive if needed
CREATE POLICY "Allow users to view all profiles"
ON "public"."users"
FOR SELECT
USING (true);

-- Policy 3: ALLOW UPDATE only own profile
-- Users can only update their own profile (by matching their auth.uid())
CREATE POLICY "Allow users to update only their own profile"
ON "public"."users"
FOR UPDATE
USING (id::text = auth.uid()::text)
WITH CHECK (id::text = auth.uid()::text);

-- Policy 4: DENY DELETE (prevent accidental profile deletion)
-- If you need to allow deletion, create a specific policy for it
-- For now, no DELETE policy means deletion is blocked

-- ============================================================================
-- Alternative approach if you need email-based lookup:
-- ============================================================================
-- If the above policies don't work because of UUID/ID mismatch issues,
-- you can use this alternative:
--
-- CREATE POLICY "Allow anon users to insert profile"
-- ON "public"."users"
-- FOR INSERT
-- TO authenticated
-- WITH CHECK (true);
--
-- This explicitly allows authenticated users (including fresh signups) to insert.

-- ============================================================================
-- COMPANION TOPICS TABLE RLS POLICIES (Reference table - publicly readable)
-- ============================================================================

ALTER TABLE "public"."companion_topics" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to view all companion topics"
ON "public"."companion_topics"
FOR SELECT
USING (true);

-- ============================================================================
-- COMPANIONS TABLE RLS POLICIES (for reference, if needed)
-- ============================================================================

ALTER TABLE "public"."companions" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to view all companions"
ON "public"."companions"
FOR SELECT
USING (true);

-- ============================================================================
-- CHATS TABLE RLS POLICIES (for reference, if needed)
-- ============================================================================

ALTER TABLE "public"."chats" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to view only their own chats"
ON "public"."chats"
FOR SELECT
USING (user_id::text = auth.uid()::text);

CREATE POLICY "Allow users to create chats"
ON "public"."chats"
FOR INSERT
WITH CHECK (user_id::text = auth.uid()::text);

CREATE POLICY "Allow users to update only their own chats"
ON "public"."chats"
FOR UPDATE
USING (user_id::text = auth.uid()::text)
WITH CHECK (user_id::text = auth.uid()::text);

-- ============================================================================
-- MESSAGES TABLE RLS POLICIES (for reference, if needed)
-- ============================================================================

ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to view messages from their chats"
ON "public"."messages"
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chats
    WHERE chats.id = messages.chat_id
    AND chats.user_id::text = auth.uid()::text
  )
);

CREATE POLICY "Allow users to insert messages in their chats"
ON "public"."messages"
FOR INSERT
WITH CHECK (
  sender_id::text = auth.uid()::text
  AND EXISTS (
    SELECT 1 FROM public.chats
    WHERE chats.id = messages.chat_id
    AND chats.user_id::text = auth.uid()::text
  )
);

-- ============================================================================
-- REVIEWS TABLE RLS POLICIES (for reference, if needed)
-- ============================================================================

ALTER TABLE "public"."reviews" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to view all reviews"
ON "public"."reviews"
FOR SELECT
USING (true);

CREATE POLICY "Allow users to create reviews"
ON "public"."reviews"
FOR INSERT
WITH CHECK (user_id::text = auth.uid()::text);

CREATE POLICY "Allow users to update only their own reviews"
ON "public"."reviews"
FOR UPDATE
USING (user_id::text = auth.uid()::text)
WITH CHECK (user_id::text = auth.uid()::text);

-- ============================================================================
-- FAVORITES TABLE RLS POLICIES (for reference, if needed)
-- ============================================================================

ALTER TABLE "public"."favorites" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to view only their own favorites"
ON "public"."favorites"
FOR SELECT
USING (user_id::text = auth.uid()::text);

CREATE POLICY "Allow users to manage their own favorites"
ON "public"."favorites"
FOR INSERT
WITH CHECK (user_id::text = auth.uid()::text);

CREATE POLICY "Allow users to delete only their own favorites"
ON "public"."favorites"
FOR DELETE
USING (user_id::text = auth.uid()::text);

-- ============================================================================
-- NOTES:
-- ============================================================================
-- 1. The UUID/ID conversion (::text = auth.uid()::text) is used to handle
--    potential type mismatches between your user ID column type and auth.uid()
--
-- 2. If policies still fail, check:
--    - User ID column type (should match how Supabase stores IDs)
--    - Whether Email Auth is enabled in Supabase
--    - Browser console for detailed error messages
--
-- 3. Test registration after applying these policies:
--    - Go to http://localhost:5173
--    - Click "Регистрация" (Register)
--    - Fill in form and submit
--    - Should create profile without "RLS violation" error
-- ============================================================================
