# Critical Fix: Companion Role Update Not Working

## Problem
After approving a companion application in the admin panel:
1. ✅ The companion record IS created
2. ✅ The application status IS updated to 'approved'  
3. ❌ **The user's role is NOT changed from 'user' to 'companion'**

## Root Cause
The Supabase RLS (Row Level Security) policy on the `users` table has an incomplete UPDATE policy:

```sql
CREATE POLICY "Users can update profiles" ON public.users
  FOR UPDATE
  WITH CHECK (true);  -- ❌ Missing USING clause - doesn't check who can update
```

Without a proper `USING` clause, Postgres RLS cannot determine:
- Whether the admin is allowed to update this user
- Which rows can be selected for update

**Result**: The UPDATE query silently fails to match any rows, so no error is thrown, but the role is never updated.

## Solution
Update the RLS policy to allow admins to update ANY user's role while restricting regular users to only update their own profiles.

### Migration File
A new migration has been created: **`backend/migrations/015-fix-users-rls-for-admin-role-update.sql`**

This migration:
1. Drops the broken UPDATE policy
2. Creates a new policy that:
   - Allows users to update their own profile (`auth.uid() = id`)
   - Allows admins (users with `role = 'admin'`) to update ANY user's profile

### What Changed
**In your codebase:**
- `src/views/AdminDashboardView.vue` - No code changes needed (role update logic is intact)
- `backend/migrations/015-fix-users-rls-for-admin-role-update.sql` - **NEW** migration file

## Steps to Apply the Fix

### Step 1: Apply the Supabase Migration
You MUST run this SQL in your Supabase project:

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**  
3. Create a new query
4. Copy and paste the contents of `backend/migrations/015-fix-users-rls-for-admin-role-update.sql`
5. Run the query

**SQL to execute:**
```sql
DROP POLICY IF EXISTS "Users can update profiles" ON public.users;

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
```

### Step 2: Verify the Fix
After running the migration:

1. Go to your admin panel
2. Find a pending companion application
3. Click "Approve"
4. Check the result:
   - ✅ Application should show as "Approved"
   - ✅ Companion should be added to the companions table
   - ✅ **User's role should change from "user" to "companion"** ← This was the bug

### Step 3: Test with an existing user
You can verify the fix works by:
1. Checking the `users` table directly in Supabase
2. Finding a user whose application was approved
3. Confirming their `role` column now says `'companion'` instead of `'user'`

## Technical Details

### What the New RLS Policy Does
```sql
USING (
  auth.uid() = id                          -- Users can update themselves
  OR EXISTS (                              -- OR
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'  -- Admins can update anyone
  )
)
```

This checks:
1. Is the authenticated user updating their own record? (allow)
2. Is the authenticated user an admin? (allow)
3. Otherwise, deny

### Why This Fixes the Issue
- **Before**: No `USING` clause → Postgres couldn't find matching rows → Update failed silently
- **After**: Proper `USING` clause → Admin can be matched → Update succeeds

## Rollback (If Needed)
If you need to revert this change, you can drop the policy and create the old one:

```sql
DROP POLICY IF EXISTS "Users can update profiles" ON public.users;

CREATE POLICY "Users can update profiles" ON public.users
  FOR UPDATE
  WITH CHECK (true);
```

⚠️ **Warning**: Reverting will break admin role updates again.

## Files Modified
- `backend/migrations/015-fix-users-rls-for-admin-role-update.sql` - NEW migration file

## No Code Changes Required
The admin panel code in `AdminDashboardView.vue` was already correct. This fix only addresses the database RLS configuration.
