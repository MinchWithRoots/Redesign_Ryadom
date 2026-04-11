-- ============================================================================
-- SUPABASE RLS FIX - Allow Anonymous User Registration
-- ============================================================================
-- Execute this in Supabase SQL Editor to fix the registration error:
-- "new row violates row-level security policy for table 'users'"
--
-- The issue: During signup, auth.uid() is not available, so strict RLS
-- policies block the INSERT. This fix allows anon users to insert.
-- ============================================================================

-- Step 1: Drop existing problematic policies (if any)
DROP POLICY IF EXISTS "Allow users to insert their own profile during signup" ON "public"."users";
DROP POLICY IF EXISTS "Allow anon users to insert profile" ON "public"."users";
DROP POLICY IF EXISTS "Allow users to update only their own profile" ON "public"."users";
DROP POLICY IF EXISTS "Allow users to view all profiles" ON "public"."users";

-- Step 2: Ensure RLS is enabled
ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;

-- Step 3: Create PERMISSIVE policy for INSERT (allow signup)
-- This allows anyone (including anon users) to insert new profiles
CREATE POLICY "Allow anyone to create a profile during signup"
ON "public"."users"
FOR INSERT
WITH CHECK (true);

-- Step 4: Create policy for SELECT (users can see all profiles)
CREATE POLICY "Allow users to view all profiles"
ON "public"."users"
FOR SELECT
USING (true);

-- Step 5: Create policy for UPDATE (users can update only their own profile)
-- Match by email since that's what your code uses for lookup
CREATE POLICY "Allow users to update their own profile by email"
ON "public"."users"
FOR UPDATE
USING (email = (SELECT email FROM auth.users WHERE auth.users.id = auth.uid() LIMIT 1))
WITH CHECK (email = (SELECT email FROM auth.users WHERE auth.users.id = auth.uid() LIMIT 1));

-- ============================================================================
-- ALTERNATIVE: If the UPDATE policy fails, use this simpler version:
-- ============================================================================
-- CREATE POLICY "Allow users to update their profile"
-- ON "public"."users"
-- FOR UPDATE
-- USING (true)
-- WITH CHECK (true);

-- ============================================================================
-- COMPANIONS TABLE (allow public access)
-- ============================================================================
DROP POLICY IF EXISTS "Allow users to view all companions" ON "public"."companions";
ALTER TABLE "public"."companions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to view all companions"
ON "public"."companions"
FOR SELECT
USING (true);

-- ============================================================================
-- Test Instructions:
-- ============================================================================
-- 1. Execute this entire SQL in Supabase SQL Editor
-- 2. Go to your app: http://localhost:5173
-- 3. Click "Регистрация" (Register)
-- 4. Fill in the form:
--    - Полное имя: Test User
--    - Email: test@example.com
--    - Пароль: password123
-- 5. Click "Создать аккаунт"
--
-- Expected result: Registration should succeed without RLS errors
-- ============================================================================

-- Step 6: Verify policies are set up correctly
-- You can check with:
-- SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check
-- FROM pg_policies 
-- WHERE tablename = 'users';
