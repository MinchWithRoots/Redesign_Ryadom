# Encryption Architecture & Data Flow

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Browser)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────┐        ┌──────────────────┐             │
│  │   User Inputs     │        │  Encryption      │             │
│  │   Password        │───────>│  Service (Vue)   │             │
│  │   Message Text    │        │                  │             │
│  └───────────────────┘        └────────┬─────────┘             │
│                                        │                       │
│                                        ▼                       │
│                    ┌──────────────────────────────┐             │
│                    │   PBKDF2 Key Derivation     │             │
│                    │                              │             │
│                    │  derived_key =               │             │
│                    │  PBKDF2(password,            │             │
│                    │         salt,                │             │
│                    │         310000 iterations)   │             │
│                    └────────────┬─────────────────┘             │
│                                 │                              │
│                    ┌────────────▼──────────────┐               │
│                    │   AES-256-CBC            │               │
│                    │   Encryption             │               │
│                    │                          │               │
│                    │  encrypted =             │               │
│                    │  AES.encrypt(data,       │               │
│                    │    derived_key,          │               │
│                    │    random_IV)            │               │
│                    └────────────┬──────────────┘               │
│                                 │                              │
│                                 ▼                              │
│                    ┌──────────────────────┐                    │
│                    │  Format: IV:Cipher   │                    │
│                    │  (hex:base64)        │                    │
│                    └──────────┬───────────┘                    │
│                               │                               │
└───────────────────────────────┼───────────────────────────────┘
                                │
                    ┌───────────▼────────────┐
                    │    HTTPS Network      │
                    │  (SSL/TLS Encrypted)  │
                    └───────────┬────────────┘
                                │
┌───────────────────────────────┼────────────────────────────────┐
│                   SUPABASE (Backend/Database)                  │
├───────────────────────────────┼────────────────────────────────┤
│                               │                               │
│                               ▼                               │
│                    ┌────────────────────┐                     │
│                    │  messages table    │                     │
│                    ├────────────────────┤                     │
│                    │ id: bigint         │                     │
│                    │ chat_id: bigint    │                     │
│                    │ sender_id: uuid    │                     │
│                    │ text: TEXT         │ ← ENCRYPTED         │
│                    │   (IV:Cipher)      │                     │
│                    │ created_at: ts     │                     │
│                    └────────────────────┘                     │
│                                                               │
│                    ┌────────────────────┐                     │
│                    │  users table       │                     │
│                    ├────────────────────┤                     │
│                    │ id: uuid           │                     │
│                    │ email: text        │                     │
│                    │ name: text         │                     │
│                    │ key_derivation_    │                     │
│                    │   salt: TEXT       │ ← UNIQUE SALT       │
│                    └────────────────────┘                     │
│                                                               │
│                    ┌────────────────────┐                     │
│                    │chat_encryption_keys│                     │
│                    ├────────────────────┤                     │
│                    │ chat_id: bigint    │                     │
│                    │ user_id: uuid      │                     │
│                    │encrypted_key: TEXT│ ← ENCRYPTED KEY     │
│                    │  (IV:Cipher)       │   (protected with   │
│                    │                    │    derived_key)     │
│                    └────────────────────┘                     │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

---

## Single Sign-In & Multi-Device Encryption Flow

### Device A (First Time)

```
Device A (Desktop - Chrome)
┌──────────────────────────┐
│  User inputs:            │
│  email: alice@example.com│
│  password: securePass123 │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────────────┐
│  Supabase Auth                  │
│  (verifies email + password)    │
└────────────┬─────────────────────┘
             │
             ▼
┌──────────────────────────────────┐
│  Fetch user profile:             │
│  - id: abc-123-def               │
│  - email: alice@example.com      │
│  - key_derivation_salt: xyz-789  │ ◄── FETCH FROM DB
└────────────┬─────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│  Initialize Encryption:             │
│  encryptionService.                 │
│    initializeWithPasswordAndSalt(    │
│      userId: 'abc-123-def',         │
│      salt: 'xyz-789'                │
│    )                                │
└────────────┬────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│  Store in memory:                   │
│  sessionPassword = 'securePass123'  │ ◄── SESSION ONLY
└──────────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│  User sends message: "Hello Bob"     │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────┐
│  Derived Key = PBKDF2(                          │
│    password: 'securePass123',                   │
│    salt: 'xyz-789',                             │
│    iterations: 310000                           │
│  ) → 256-bit key                                │
└────────────┬────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────┐
│  Load chat master key:                          │
│  encrypted_master_key = fetch from DB for this │
│                         chat + user             │
│                                                 │
│  master_key = AES.decrypt(                      │
│    encrypted_master_key,                        │
│    derived_key                                  │
│  )                                              │
└────────────┬────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────┐
│  Encrypt message:                               │
│  encrypted_msg = AES.encrypt(                   │
│    "Hello Bob",                                 │
│    master_key,                                  │
│    random_IV                                    │
│  )                                              │
│  → "abc123def:xyz789..."                        │
└────────────┬────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────┐
│  Store in Supabase:                             │
│  INSERT INTO messages                           │
│  VALUES (                                       │
│    chat_id: 456,                                │
│    sender_id: 'abc-123-def',                    │
│    text: 'abc123def:xyz789...'  ◄── ENCRYPTED │
│  )                                              │
└─────────────────────────────────────────────────┘
```

### Device B (Later - Mobile)

```
Device B (Mobile - Safari)
┌──────────────────────────────────────┐
│  User inputs:                        │
│  email: alice@example.com            │
│  password: securePass123             │
│  (SAME password as Device A)         │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│  Supabase Auth                       │
│  (verifies email + password)         │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│  Fetch user profile:                 │
│  - id: abc-123-def (SAME)            │
│  - key_derivation_salt: xyz-789      │ ◄── SAME SALT!
│                (SAME!)               │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────────────┐
│  Initialize Encryption:                             │
│  encryptionService.                                 │
│    initializeWithPasswordAndSalt(                   │
│      userId: 'abc-123-def',                         │
│      salt: 'xyz-789'    ◄── SAME SALT              │
│    )                                                │
└────────────┬───────────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────────────┐
│  Derive Key:                                        │
│  derived_key = PBKDF2(                              │
│    password: 'securePass123',  ◄── SAME PASSWORD   │
│    salt: 'xyz-789',            ◄── SAME SALT       │
│    iterations: 310000                              │
│  ) → SAME 256-bit key!                             │
└────────────┬───────────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────────────┐
│  Load chat master key:                              │
│  encrypted_master_key = fetch from DB               │
│                                                     │
│  master_key = AES.decrypt(                          │
│    encrypted_master_key,                            │
│    derived_key  ◄── SAME KEY → CAN DECRYPT! ✓    │
│  )                                                  │
└────────────┬───────────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────────────┐
│  Decrypt Device A's message:                        │
│  decrypted = AES.decrypt(                           │
│    'abc123def:xyz789...',  ◄── Device A's message  │
│    master_key  ◄── SAME MASTER KEY                 │
│  )                                                  │
│  → "Hello Bob"  ✓ READABLE!                        │
└──────────────────────────────────────────────────────┘
```

---

## Key Exchange Problem & Solution

### ❌ Problem With Simple Password Hash (Old Way)

```
Device A:
  password = "securePass123"
  password_hash = SHA256("securePass123") = "abc123..."
  
Device B:
  password = "securePass123"
  password_hash = SHA256("securePass123") = "abc123..."  ✓ Same!

BUT: If database is stolen, attackers have password_hash
Rainbow table attack:
  RAINBOW_TABLE["abc123..."] = "securePass123" ← FOUND!
```

**Problems:**
- ❌ No salt → vulnerable to rainbow tables
- ❌ Hash function is fast → easy to brute force
- ❌ Not designed for key derivation

### ✅ Solution: PBKDF2 + Unique Salt

```
Device A:
  password = "securePass123"
  salt = "550e8400-e29b-41d4-a716-446655440000" (unique per user)
  derived_key = PBKDF2(password, salt, 310000 iterations)
               = "xyz789..."

Device B:
  password = "securePass123"
  salt = "550e8400-e29b-41d4-a716-446655440000" (same from DB!)
  derived_key = PBKDF2(password, salt, 310000 iterations)
               = "xyz789..."  ✓ SAME!

If database is stolen, attackers have:
  - encrypted_key (protected)
  - salt (useless without password)
  - Even with password, 310,000 iterations make brute force impractical
    → 1 attempt = 100ms
    → 1,000,000 attempts = 27 hours
```

**Benefits:**
- ✅ Unique salt per user → no rainbow tables
- ✅ 310,000 iterations → slow brute force
- ✅ PBKDF2 designed for key derivation
- ✅ Deterministic → same key on all devices

---

## Message Encryption & Decryption Cycle

### Send Flow

```
User in Chat:
┌──────────────────┐
│  Type: "Hello"   │
│  Click Send      │
└────────┬─────────┘
         │
         ▼
┌────────────────────────────────────────┐
│  Check if chat master key is cached    │
└────────┬──────────────────────────────┘
         │
         ├─ YES: Use cached key
         │
         └─ NO: Load from DB
            │
            ▼
         ┌──────────────────────────────────┐
         │  Derived key = PBKDF2(password,  │
         │    salt, 310000)                 │
         │                                  │
         │  master_key = AES.decrypt(       │
         │    encrypted_master_key_from_DB, │
         │    derived_key)                  │
         └──────────┬───────────────────────┘
                    │
         ┌──────────▼───────────┐
         │  Cache in memory     │
         │  (24 hour TTL)       │
         └──────────┬───────────┘
                    │
         ┌──────────▼──────────────────────────┐
         │  AES.encrypt(                       │
         │    plaintext: "Hello",              │
         │    key: master_key,                 │
         │    iv: random_16_bytes              │
         │  ) → ciphertext                     │
         └──────────┬──────────────────────────┘
                    │
         ┌──────────▼──────────────────────────┐
         │  Format: "iv_hex:ciphertext_base64" │
         │  E.g.: "a1b2c3d4...:xyz789..."     │
         └──────────┬──────────────────────────┘
                    │
         ┌──────────▼──────────────────────────┐
         │  INSERT INTO messages               │
         │  VALUES (                           │
         │    chat_id: 123,                    │
         │    sender_id: "abc-123",            │
         │    text: "a1b2c3d4...:xyz789..."   │
         │  )                                  │
         └────────────────────────────────────┘
```

### Receive Flow

```
Auto-refresh / Real-time subscription:
┌──────────────────────────────────┐
│  Fetch from messages table        │
│  WHERE chat_id = 123              │
└────────┬─────────────────────────┘
         │
         ▼
┌────────────────────────────────────────┐
│  For each message:                     │
│  Check if chat key is cached           │
└────────┬───────────────────────────────┘
         │
         ├─ YES: Use cached key
         │
         └─ NO: Load from DB
            │
            ▼
         ┌──────────────────────────────┐
         │  Derived key = PBKDF2(...)   │
         │  master_key = AES.decrypt(..)│
         └──────────┬───────────────────┘
                    │
         ┌──────────▼──────────────────────────┐
         │  Parse message.text:                │
         │  "a1b2c3d4...:xyz789..."           │
         │  → iv = "a1b2c3d4..."              │
         │  → ciphertext = "xyz789..."        │
         └──────────┬──────────────────────────┘
                    │
         ┌──────────▼──────────────────────────┐
         │  AES.decrypt(                       │
         │    ciphertext: "xyz789...",         │
         │    key: master_key,                 │
         │    iv: "a1b2c3d4..."                │
         │  ) → plaintext: "Hello"             │
         └──────────┬──────────────────────────┘
                    │
         ┌──────────▼──────────────────────────┐
         │  Display in UI:                     │
         │  ┌────────────────────┐             │
         │  │ Alice: "Hello" ✓   │             │
         │  │ Bob: "Hi Alice!" ✓ │             │
         │  └────────────────────┘             │
         └────────────────────────────────────┘
```

---

## Database Storage Layout

### Secure Encrypted Storage

```sql
-- USERS TABLE
SELECT * FROM users WHERE email = 'alice@example.com';

┌────────────────────────────────────────────────────────┐
│ id  | email           | name  | key_derivation_salt   │
├────────────────────────────────────────────────────────┤
│ abc | alice@example.. | Alice │ 550e8400-e29b-41d4... │ ◄── SALT
└────────────────────────────────────────────────────────┘
                                         ▲
                    ┌────────────────────┘
                    │ (unique per user, prevents rainbow tables)

-- MESSAGES TABLE
SELECT * FROM messages WHERE chat_id = 456;

┌──────────────────────────────────────────────────────────────┐
│ id  | chat_id | sender_id | text                             │
├──────────────────────────────────────────────────────────────┤
│ 1   | 456     | abc       │ a1b2c3d4...:xyz789xyz789xyz7...  │ ◄── ENCRYPTED
│ 2   | 456     | def       │ b2c3d4e5...:uvwabcuvwabcuvwa...  │ ◄── ENCRYPTED
│ 3   | 456     | abc       │ c3d4e5f6...:pqrstuvpqrstuvpqr... │ ◄── ENCRYPTED
└──────────────────────────────────────────────────────────────┘
       ▲                      ▲
       │                      │
    Chat ID               Each has unique IV (random)
                         Format: iv_hex:ciphertext_base64

-- CHAT_ENCRYPTION_KEYS TABLE
SELECT * FROM chat_encryption_keys WHERE chat_id = 456;

┌─────────────────────────────────────────────────────────────┐
│ chat_id | user_id | encrypted_key                           │
├─────────────────────────────────────────────────────────────┤
│ 456     | abc     │ d1e2f3g4...:pqrstuv123pqrstuv123pqrs... │ ◄── KEY
│ 456     | def     │ e2f3g4h5...:abcdef456abcdef456abcde... │ ◄── KEY
└─────────────────────────────────────────────────────────────┘
                     ▲
                     │
        Master key encrypted with user's derived key
        Format: iv_hex:ciphertext_base64
```

**If entire database is stolen:**
- ❌ **Plaintext**: None (all messages encrypted)
- ❌ **Password**: Not stored (only derived key is used)
- ⚠️ **Salt**: Visible but useless without password
- ⚠️ **Encrypted key**: Encrypted again with derived key
- ⚠️ **Encrypted message**: Encrypted with master key (which is protected by encrypted key)

**Attack difficulty:**
1. Get password from user somehow
2. Use password + salt to derive key (310,000 iterations = 100ms)
3. Use derived key to decrypt master key
4. Use master key to decrypt messages

→ Multi-layer defense: password → derived key → master key → message

---

## Security Summary

| Layer | What | How | Protected |
|-------|------|-----|-----------|
| 1 | User Password | Stored in memory only | ✅ Not in DB |
| 2 | Key Derivation | PBKDF2 (310k iter) | ✅ Brute-force resistant |
| 3 | Derived Key | AES decrypts master key | ✅ Unique per user |
| 4 | Master Key | AES encrypts messages | ✅ Different per chat |
| 5 | Message | AES-256-CBC with IV | ✅ Unique IV per message |

---

## Comparison: Before vs After

| Aspect | Before | After |
|--------|--------|-------|
| **Key Derivation** | SHA256 hash | PBKDF2 (310k iterations) |
| **Salt** | None | Unique per user |
| **AES Mode** | ECB (weaker) | CBC (stronger) |
| **IV** | Fixed/random | Random per message |
| **Multi-device** | ❌ No | ✅ Yes (same password = same key) |
| **Rainbow Tables** | ❌ Vulnerable | ✅ Protected |
| **Brute Force** | Fast | ~100ms per attempt |
| **Message Format** | Base64 only | IV:Base64 (iv in plaintext) |

