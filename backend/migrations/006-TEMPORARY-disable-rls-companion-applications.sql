-- TEMPORARY FIX: Disable RLS on companion_applications table
-- This is a temporary solution while we set up proper RLS policies
-- Once the 006-add-rls-policies-companion-applications.sql migration is applied,
-- you can re-enable RLS with proper policies

ALTER TABLE companion_applications DISABLE ROW LEVEL SECURITY;

-- Note: After applying the proper RLS policies migration (006-add-rls-policies-companion-applications.sql),
-- run this to re-enable RLS:
-- ALTER TABLE companion_applications ENABLE ROW LEVEL SECURITY;
