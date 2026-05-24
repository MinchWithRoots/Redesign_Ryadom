# 🚀 Encryption Quick Start (5 Minutes)

## TL;DR

1. **Run SQL migration** (2 minutes)
2. **Code is ready** (already updated)
3. **Test locally** (3 minutes)
4. **Deploy**

---

## Step 1: SQL Migration (Copy-Paste)

Go to **Supabase Dashboard → SQL Editor** and run:

```sql
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS key_derivation_salt TEXT NOT NULL DEFAULT gen_random_uuid()::text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'users' AND constraint_name = 'users_key_derivation_salt_unique'
  ) THEN
    ALTER TABLE public.users 
    ADD CONSTRAINT users_key_derivation_salt_unique UNIQUE (key_derivation_salt);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_key_derivation_salt 
ON public.users(key_derivation_salt);
```

**Verify it worked:**
```sql
SELECT COUNT(*) FROM public.users WHERE key_derivation_salt IS NOT NULL;
```

✅ All users should have a salt.

---

## Step 2: Code Changes (Done!)

These files have been updated:
- ✅ `src/services/encryptionService.ts` — PBKDF2 + AES-256-CBC
- ✅ `src/composables/useAuth.ts` — Salt-based initialization
- ✅ `src/views/ChatView.vue` — Password passing

**No additional code changes needed!**

---

## Step 3: Test Locally

```bash
# Start dev server
npm run dev
```

**Test in browser:**

1. **Sign up** a new user
   - Email: alice@test.com
   - Password: testpass123

2. **Create a chat** and send message
   - Message: "Hello World"

3. **Check Supabase** (Supabase Dashboard)
   - Go to `messages` table
   - Find your message
   - Text should be encrypted: `abc123def:xyz789...` (not plaintext)

4. **Test multi-device:**
   - Open **incognito tab** or **different browser**
   - Log in as same user: alice@test.com / testpass123
   - Create/open same chat
   - Message should be decrypted and readable ✓

---

## Step 4: Check Console (Optional)

Open **browser Developer Tools** (F12) and check for messages:

```
✅ "Encryption service initialized for user: abc-123-def"
✅ "Loaded encryption key for chat from database"
```

If you see errors, check:
1. Is migration applied? (`key_derivation_salt` in users table)
2. Is user logged in? (Check `currentUser` in console)
3. Is password being passed? (Check network tab)

---

## Step 5: Deploy

Push to your branch and deploy normally. Code changes are backward compatible.

```bash
git push origin your-branch
```

---

## 🎯 What's Happening Behind the Scenes

```
User logs in with password
    ↓
Fetch salt from users.key_derivation_salt
    ↓
PBKDF2(password, salt, 310000 iterations) = derived_key
    ↓
derived_key decrypts messages in chat_encryption_keys
    ↓
master_key decrypts all messages in chat
    ↓
Message displays in UI
```

---

## 🔒 Security Benefits

| Before | After |
|--------|-------|
| SHA-256 hash | PBKDF2 (310k iterations) |
| No salt | Unique salt per user |
| No multi-device support | ✅ Works on all devices with same password |
| Vulnerable to rainbow tables | ✅ Protected |
| Fast brute-force | ✅ 100ms per attempt |

---

## ⚠️ Important Notes

### Passwords Not Stored
- Password is **only used during login**
- Not stored in database
- Not stored in localStorage
- Cleared on logout

### Multi-Device Access
- Same password on Device A and Device B
- Same salt fetched from database
- Same derived key calculated
- Same messages decrypted ✓

### If User Forgets Password
- ❌ Cannot recover old messages
- ✅ Can create new account
- This is intentional (security vs. recovery trade-off)

---

## 🧪 Quick Test Checklist

- [ ] SQL migration applied
- [ ] `key_derivation_salt` exists in users table
- [ ] Dev server starts without errors
- [ ] Can sign up new user
- [ ] Can send message
- [ ] Message is encrypted in Supabase
- [ ] Can log in on different device and read message
- [ ] No console errors

---

## 📚 Need More Details?

- **Detailed DB migration**: Read `DATABASE_ENCRYPTION_MIGRATION.md`
- **Deployment steps**: Read `ENCRYPTION_IMPLEMENTATION_CHECKLIST.md`
- **Architecture diagrams**: Read `ENCRYPTION_ARCHITECTURE.md`
- **Everything explained**: Read `ENCRYPTION_SUMMARY.md`

---

## 🆘 Troubleshooting

| Error | Fix |
|-------|-----|
| "User salt not initialized" | Log out and log back in |
| Message won't decrypt | Check password is correct on all devices |
| "Invalid encryption format" | Old unencrypted message (will work as fallback) |
| PBKDF2 slow | This is normal (100ms = secure) |

---

## ✅ Done!

Your chat application now has **production-grade encryption** with multi-device support.

🔐 Messages are encrypted in database  
🔑 Keys are protected with PBKDF2  
📱 Works across all devices  
⚡ Minimal performance impact  
