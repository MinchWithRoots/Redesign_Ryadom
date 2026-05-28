# Notification System Fix Guide

## Problem Summary

Users were not receiving real-time notifications when new messages arrived. The notification system was implemented but not working because the database lacked proper Row-Level Security (RLS) policies.

## Root Cause

Supabase Realtime relies on **Row-Level Security (RLS)** policies to determine which events should be broadcast to which clients. Without RLS enabled on the `messages`, `chats`, and `chat_read_status` tables, Supabase was not broadcasting change events to other users.

### Affected Tables:
- ❌ `messages` - **No RLS policy** (BLOCKED realtime notifications)
- ❌ `chats` - **No RLS policy** (BLOCKED realtime updates)
- ❌ `chat_read_status` - **No RLS policy** (BLOCKED read receipt updates)

### What Was Working:
- ✅ `companion_chat_requests` - Has RLS policies
- ✅ `companion_applications` - Has RLS policies
- ✅ `users` - Has RLS policies
- ✅ `reviews` - Has RLS policies
- ✅ `chat_encryption_keys` - Has RLS policies

## The Notification Flow

```
User A sends message
    ↓
Message inserted into messages table
    ↓
Supabase checks RLS policy: "Can User B see this message?"
    ↓
If YES → Broadcast INSERT event to User B's client
    ↓
useNotifications.ts receives postgres_changes event
    ↓
Notification appears in bell icon
```

**Before the fix:** Step 3 failed because no RLS policy existed → User B never received the event.

## Solution: New RLS Migrations

Created 3 new migration files:

### 1. **019-add-messages-rls-for-realtime.sql**
Adds RLS to the `messages` table with policies allowing:
- Users can **SELECT** messages from chats they participate in
- Users can **INSERT** messages they send to their chats
- Users can **UPDATE** their own messages
- Admins can **VIEW** and **DELETE** messages for moderation

### 2. **020-add-chat-read-status-rls.sql**
Adds RLS to the `chat_read_status` table with policies allowing:
- Users can **SELECT** read status for their chats
- Users can **INSERT/UPDATE** their own read status records

### 3. **021-add-chats-rls-for-realtime.sql**
Adds RLS to the `chats` table with policies allowing:
- Users can **SELECT** chats they created or participate in
- Users can **INSERT** new chats
- Users can **UPDATE** chats they're part of

## Implementation Details

### Message Access Logic
A user can see a message if they are a participant in the chat:
```sql
-- User is the chat initiator (regular user side)
c.user_id = auth.uid()
OR
-- User is the companion in the chat
EXISTS (
  SELECT 1 FROM companions comp
  WHERE comp.id = c.companion_id
  AND comp.user_id = auth.uid()
)
```

### Why This Matters for Realtime

When User A sends a message:
1. The INSERT is evaluated against RLS policy
2. For each connected client, Supabase asks: "Does this user's RLS policy allow them to SELECT this new message?"
3. User B's policy allows them to see messages from chats they're in → ✅ Broadcast event
4. Random User C cannot access this chat → ❌ No event broadcast

This **automatic permission checking** is what enables secure realtime updates.

## How to Apply These Migrations

### Option A: Supabase Dashboard (Recommended)
1. Go to your Supabase project
2. Click **SQL Editor**
3. Click **New Query**
4. Copy contents of `backend/migrations/019-add-messages-rls-for-realtime.sql`
5. Click **Run** (or Cmd+Enter)
6. Repeat for migrations 020 and 021

### Option B: Supabase CLI
```bash
# If you have supabase CLI installed
supabase db push

# Or manually run SQL files
psql -h your-host -U postgres -d your-db -f backend/migrations/019-add-messages-rls-for-realtime.sql
```

### Option C: Use existing migration runner
If your deployment already has a migration runner, it will pick up the new .sql files automatically.

## Testing the Fix

After applying the migrations:

1. **Login as User A** (companion/helper)
2. **Open chat in another browser/tab as User B** (regular user)
3. **User A sends a message** from their chat interface
4. **User B should see a notification** in the bell icon within 1-2 seconds
5. **Message should appear** in User B's chat window in real-time

### Verification Checklist
- [ ] Notification bell shows unread count
- [ ] Notification appears with sender name and message preview
- [ ] "Mark as read" button works
- [ ] Multiple notifications stack correctly
- [ ] Notification persists until dismissed
- [ ] Time display updates correctly ("just now", "2 min ago", etc.)

## What Changed in the Code

### No frontend code changes needed!
The frontend `useNotifications.ts` already has:
- ✅ Supabase realtime subscriptions set up
- ✅ Event handlers for new messages
- ✅ Notification display logic
- ✅ Read/unread tracking

The realtime listener was already there - it just wasn't receiving events because of the missing RLS policies.

## Common Issues & Troubleshooting

### Issue: Still no notifications after migration

**Check 1: Verify RLS is enabled**
```sql
-- Run in Supabase SQL Editor
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname IN ('messages', 'chats', 'chat_read_status');
```
Should show `t` (true) for all three.

**Check 2: Verify policies exist**
```sql
SELECT policyname, tablename 
FROM pg_policies 
WHERE tablename IN ('messages', 'chats', 'chat_read_status');
```

**Check 3: Check browser console for errors**
Open DevTools → Console tab, look for errors in notification setup.

**Check 4: Verify user roles**
Make sure both users have role = 'user' or are properly connected via companions table.

### Issue: Messages not showing in chat view

This might be a separate issue. The message delivery is controlled by:
1. RLS on `messages` table (now fixed)
2. Realtime listener in `ChatView.vue` (should already work)
3. Chat accessibility (user must be part of the chat)

### Issue: Notification shows but no message content

Check that:
- Message `text` field is populated (not just `encrypted_text`)
- User sending the message has a valid name in `users` table

## Performance Notes

These RLS policies use:
- `EXISTS` clauses (efficient) instead of `IN` subqueries
- **Indexes** on `chats(id)`, `companions(id)`, `companions(user_id)` (create if missing)
- Direct foreign key lookups without JOINs in RLS

For optimal performance, ensure these indexes exist:
```sql
CREATE INDEX IF NOT EXISTS idx_companions_user_id ON public.companions(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_user_id ON public.chats(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_companion_id ON public.chats(companion_id);
```

## Security Implications

✅ **Secure by default**: Users cannot see messages from chats they're not part of
✅ **Realtime privacy**: Only users with SELECT permission receive updates
✅ **Admin oversight**: Admins can view/delete all messages for moderation
✅ **No data leakage**: Encrypted fields are still encrypted in transit

## Database Changes Summary

| Table | Before | After |
|-------|--------|-------|
| messages | No RLS | RLS enabled with 5 policies |
| chats | No RLS | RLS enabled with 4 policies |
| chat_read_status | No RLS | RLS enabled with 3 policies |

**Total new policies created**: 12 policies across 3 tables

## Next Steps

1. ✅ Run migrations 019, 020, 021 in Supabase
2. ✅ Test notifications with two browsers
3. ✅ Monitor browser console for errors
4. ✅ Check Supabase Logs for any RLS denials
5. ⭐ Celebrate working real-time notifications!

---

**Questions?** Check the migration files themselves for detailed SQL comments.
