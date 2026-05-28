# RLS Verification Checklist

Run these queries in your Supabase SQL Editor to verify everything is set up correctly.

## 1. Check if RLS is enabled on messages table

```sql
SELECT tablename, relrowsecurity 
FROM pg_class
JOIN information_schema.tables ON information_schema.tables.table_name = pg_class.relname
WHERE tablename = 'messages';
```

**Expected result:** `relrowsecurity = t` (true)

---

## 2. Check if all RLS policies exist

```sql
SELECT policyname, tablename, permissive, cmd 
FROM pg_policies 
WHERE tablename IN ('messages', 'chats', 'chat_read_status')
ORDER BY tablename, policyname;
```

**Expected result:** Should show policies like:
- `Users can view their chat messages` on `messages`
- `Users can insert messages in their chats` on `messages`
- `Users can view their chats` on `chats`
- `Users can view read status for their chats` on `chat_read_status`
- etc.

---

## 3. Verify a specific user can access messages from their chat

Replace `<user-id>` with an actual user ID from your database:

```sql
-- As admin, check if user can SELECT their chat messages
-- This simulates what Supabase realtime would check
SELECT m.id, m.text, m.sender_id, c.user_id, c.companion_id
FROM messages m
JOIN chats c ON m.chat_id = c.id
WHERE c.id = 1  -- Replace with actual chat ID
LIMIT 1;
```

---

## 4. Check if migrations 019, 020, 021 were applied

```sql
-- List all recent migration files applied
SELECT datname, filename, success, installed_on
FROM _sqlc_migrations
WHERE filename LIKE '019%' OR filename LIKE '020%' OR filename LIKE '021%'
ORDER BY installed_on DESC;
```

**Note:** If this query fails, your database might not track migrations with a `_sqlc_migrations` table. That's okay - just verify the policies exist with query #2.

---

## 5. Test RLS policy: Create a temporary test

This tests if realtime events would be broadcast:

```sql
-- First, verify current user ID
SELECT auth.uid() as current_user;

-- Then check if you can see messages from one of your chats
SELECT m.id, m.text
FROM messages m
JOIN chats c ON m.chat_id = c.id
WHERE c.user_id = auth.uid()
   OR EXISTS (
     SELECT 1 FROM companions comp
     WHERE comp.id = c.companion_id
     AND comp.user_id = auth.uid()
   )
LIMIT 5;
```

**If you see results**, the RLS policy is working correctly!

---

## If Something is Wrong

### Issue: Policies not found
**Solution:** Run migrations 019, 020, 021 again:
1. Go to Supabase Dashboard → SQL Editor
2. Create new query
3. Copy migration file contents
4. Click Run

### Issue: RLS not enabled
**Solution:** Run this:
```sql
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_read_status ENABLE ROW LEVEL SECURITY;
```

### Issue: Wrong policy logic
If policies are there but RLS check #5 returns no results, the policy condition might be wrong. Check that:
1. The chat table has correct `user_id` and `companion_id` values
2. The companions table has correct `user_id` values for companions
3. Both tables have proper foreign key relationships

---

## What Happens Next

Once RLS is verified:
1. Messages sent to chat will trigger `postgres_changes` events
2. Supabase checks if recipient can SELECT the new message (RLS policy)
3. If YES → realtime event is broadcast to their client
4. `useNotifications.ts` receives the event → notification appears

**No code changes needed.** The frontend is already listening!
