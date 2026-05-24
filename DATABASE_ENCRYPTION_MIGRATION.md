# Database Migration: Improved Encryption with PBKDF2

## Overview

This migration implements a more secure encryption scheme using PBKDF2 for key derivation. This ensures that:

1. **Deterministic Key Derivation**: Same password → same encryption key on any device
2. **Salt-based Protection**: Rainbow table attacks are prevented
3. **Proper IV Management**: Each encrypted message has its own IV
4. **Backward Compatibility**: Old plaintext messages continue to work

---

## Database Changes Required

### Step 1: Add Salt Column to Users Table

```sql
-- Add key derivation salt to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS key_derivation_salt TEXT NOT NULL DEFAULT gen_random_uuid()::text;

-- Add unique constraint (optional, but recommended for consistency)
ALTER TABLE public.users 
ADD CONSTRAINT users_key_derivation_salt_unique UNIQUE (key_derivation_salt);
```

**Why?** Each user needs a unique salt for PBKDF2 derivation. This salt is stored in the database and used to derive the same key from the password across all devices.

---

### Step 2: Update chat_encryption_keys Table (if it exists)

The `chat_encryption_keys` table structure should remain the same, but the `encrypted_key` format changes:

**Current format:**
```
encrypted_key: "base64_encrypted_data"
```

**New format:**
```
encrypted_key: "iv_hex:base64_encrypted_data"
```

The IV (Initialization Vector) is now prefixed to the encrypted data. **No schema change needed** — just a data format change.

If you need to migrate old data:

```sql
-- Optional: View existing keys (they'll still work, might need re-encryption)
SELECT COUNT(*) as old_key_count FROM chat_encryption_keys 
WHERE encrypted_key NOT LIKE '%:%';
```

---

### Step 3: Create Index on Key Derivation Salt (Optional)

```sql
-- Add index for faster lookups if needed
CREATE INDEX IF NOT EXISTS idx_users_key_derivation_salt 
ON public.users(key_derivation_salt);
```

---

## Migration SQL (All-in-One)

Run this complete migration in your Supabase SQL Editor:

```sql
-- Add key derivation salt column
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS key_derivation_salt TEXT NOT NULL DEFAULT gen_random_uuid()::text;

-- Update any NULL values (shouldn't exist, but just in case)
UPDATE public.users 
SET key_derivation_salt = gen_random_uuid()::text 
WHERE key_derivation_salt IS NULL;

-- Add unique constraint
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

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_key_derivation_salt 
ON public.users(key_derivation_salt);

-- Verify the migration
SELECT id, email, key_derivation_salt FROM public.users LIMIT 5;
```

---

## Implementation Details

### How PBKDF2 Key Derivation Works

1. **User logs in** with password
2. **Salt is fetched** from `users.key_derivation_salt`
3. **PBKDF2** derives a cryptographic key:
   ```
   derived_key = PBKDF2(password, salt, iterations=310000, keySize=256bits)
   ```
4. **This derived key** is used to encrypt/decrypt chat master keys
5. **Same password + same salt = same derived key on any device**

### PBKDF2 Parameters

- **Algorithm**: PBKDF2-SHA256
- **Iterations**: 310,000 (OWASP 2023 recommendation)
- **Key Size**: 256 bits (32 bytes)
- **Iteration count ensures**: ~100ms on modern hardware (good security-usability tradeoff)

### Key Derivation Flow

```
User Login:
┌─────────────┐
│  Password   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────┐
│ Fetch salt from users.id         │
│ key_derivation_salt              │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ PBKDF2(password, salt, 310k)    │
│ → 256-bit derived key           │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ Use derived_key to decrypt      │
│ chat_encryption_keys.encrypted_key │
│ → chat master key               │
└─────────────────────────────────┘
```

---

## What Changes in Code

### Before (Insecure)
```typescript
const passwordHash = crypto.SHA256(password).toString()
encryptionService.initializeWithPassword(passwordHash, userId)
```

**Problems:**
- SHA256 is not a key derivation function
- No salt → vulnerable to rainbow tables
- Not deterministic across devices

### After (Secure)
```typescript
const salt = profile.key_derivation_salt // From database
encryptionService.initializeWithPasswordAndSalt(userId, salt)
// Then load keys with password:
await encryptionService.loadChatKey(chatId, password)
```

**Improvements:**
- PBKDF2 is designed for key derivation
- Each user has unique salt
- Deterministic across devices
- Password is only used to derive keys (not stored)

---

## Multi-Device Support

### Device A (Log in for the first time)
1. User enters password
2. System fetches `users.key_derivation_salt` from DB
3. PBKDF2 derives key: `KEY = PBKDF2(password, salt, 310k)`
4. Key decrypts all `chat_encryption_keys` entries

### Device B (Log in later)
1. User enters **same password**
2. System fetches **same salt** from DB
3. PBKDF2 derives **same key**: `KEY = PBKDF2(password, salt, 310k)`
4. Key decrypts **same chat messages** ✓

---

## Backward Compatibility

### Old Messages (Plaintext)
Messages stored without encryption continue to work:
- `decryptMessage()` checks format and returns plaintext if not encrypted
- No migration needed

### Old Encrypted Keys (Different Format)
Old keys stored without IV prefix (before this migration) still work:
- `decryptWithKey()` handles both formats
- Can optionally re-encrypt old keys with new format (advanced)

---

## Rollout Steps

### Step 1: Apply Database Migration
1. Go to Supabase Dashboard → SQL Editor
2. Run the SQL migration above
3. Verify: `SELECT COUNT(*) FROM public.users WHERE key_derivation_salt IS NOT NULL`
4. All users should have a salt

### Step 2: Deploy Updated Code
1. Update `encryptionService.ts` with PBKDF2 logic
2. Update `useAuth.ts` to use `initializeWithPasswordAndSalt()`
3. Update `ChatView.vue` to pass password to `loadChatKey()`
4. Deploy to production

### Step 3: Test
1. **Single Device**: Log in, send message, verify it's encrypted in DB
2. **Multi-Device**: 
   - Log in on Device A, send message
   - Log in on Device B with same credentials
   - Verify you can read the message from Device A ✓

---

## Security Considerations

### What's Protected
✅ Message content is encrypted with AES-256-CBC  
✅ Encryption keys are encrypted with PBKDF2-derived keys  
✅ Each user has unique salt for key derivation  
✅ Each message has unique IV  
✅ 310,000 iterations make brute-force attacks impractical  

### What's NOT Protected (By Design)
❌ Metadata (timestamps, sender ID, read status, chat existence)  
❌ User profiles and names  
❌ Chat list (other users can see you had a chat)  

This is normal for chat applications — even Signal and WhatsApp expose metadata.

### What Happens If User Forgets Password
- ❌ All old messages are permanently inaccessible
- ✅ User can create new chats with new password
- This is intentional: password is the only way to decrypt keys

---

## Monitoring & Logs

After deployment, monitor:
1. **Encryption errors** in console logs
2. **Key loading failures** when users switch devices
3. **Performance**: PBKDF2 should take ~100ms per login

---

## Troubleshooting

### Error: "Decrypted key is empty"
- Salt might be wrong
- Password might be wrong
- Old encrypted key format (not compatible)

**Solution**: Re-encrypt the key or delete and create new chat

### Error: "User salt not initialized"
- User not logged in
- `initializeWithPasswordAndSalt()` not called

**Solution**: Ensure login flow calls initialization

### Messages decrypt to gibberish
- Wrong password used
- Wrong user accessing another user's encrypted key
- Database was modified

**Solution**: Check password, verify user_id matches

### Performance slow during login
- PBKDF2 with 310k iterations takes ~100ms
- This is expected and secure
- Consider implementing loading UI

---

## Future Improvements

1. **Key Rotation**: Periodically rotate chat keys (requires versioning)
2. **Group Chats**: Extend encryption to group conversations
3. **Message Recovery**: Allow users to export encrypted backup
4. **Biometric Auth**: Use fingerprint/face to store password (instead of entering each time)
5. **Social Key Recovery**: Allow recovery codes or trusted contacts

---

## References

- OWASP PBKDF2 Recommendations: https://owasp.org/www-community/attacks/Brute_force_attack
- NIST Password Hashing: https://pages.nist.gov/800-63-3/sp800-63b.html
- crypto-js PBKDF2: https://cryptojs.gitbook.io/docs/#pbkdf2
