# Session Counter Migration

The session counter feature requires adding a `sessions` column to the database. This file explains what was done and what you need to do.

## What Was Added

A new migration file has been created: `supabase/migrations/20250528_add_sessions_columns.sql`

This migration adds:
1. `sessions INTEGER DEFAULT 0` column to the `users` table
2. `sessions INTEGER DEFAULT 0` column to the `companions` table
3. Indexes for both columns for faster queries

## How to Apply the Migration

### Option 1: Via Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the SQL below:

```sql
-- Add sessions column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS sessions INTEGER DEFAULT 0;

-- Add sessions column to companions table
ALTER TABLE companions
ADD COLUMN IF NOT EXISTS sessions INTEGER DEFAULT 0;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_users_sessions ON users(sessions);
CREATE INDEX IF NOT EXISTS idx_companions_sessions ON companions(sessions);
```

5. Click **Run** to execute the query

### Option 2: Via Supabase CLI

If you have the Supabase CLI set up:

```bash
supabase migration up
```

This will automatically apply all pending migrations including the one we created.

## After Migration

Once the migration is applied:

1. **Refresh your browser** to reload the application
2. **Clear browser cache** if the changes don't appear
3. **Log into your profile** - the session counter should now display the correct count

The application will:
- Count all existing chats as sessions
- Increment the counter when new chats start (requests approved)
- Display the count on both user and companion profiles

## What The Code Does Now

**Session Sync (on profile load):**
- Counts all chats for the user/companion
- Updates the `sessions` column in the database
- Syncs the display in real-time

**Session Increment (when chat starts):**
- When a companion request is approved and chat starts
- Both user and companion sessions increase by 1
- Updates immediately in the database

**Session History:**
- Completed sessions are tracked in the History tab
- Chats with `status = 'offline'` are counted as completed

## Troubleshooting

If you still see "Error updating user/companion sessions":

1. **Check if the migration was applied:**
   - Go to Supabase Dashboard → SQL Editor
   - Run: `SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='sessions';`
   - You should see a result with 'sessions'

2. **Check table permissions:**
   - Ensure your Supabase user has permissions to modify the `users` and `companions` tables

3. **Clear application cache:**
   - Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)

## Session Counter Logic

```
Total Sessions = Number of Chats Created
  - Each approved request creates a chat
  - Each chat = 1 session
  - Counts both active and completed chats
```

For example:
- If a user has 3 chats (approved requests), their session count = 3
- When they approve a 4th request, the counter becomes 4
- Completed chats (offline status) still count toward the total
