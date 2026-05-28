import CryptoJS from 'crypto-js'
import { supabase } from '@/utils/supabase'

// PBKDF2 iterations (OWASP 2023 recommendation)
const PBKDF2_ITERATIONS = 310000

interface EncryptionState {
  userId?: string
  userSalt?: string
  sessionPassword?: string
  chatKeyCache: Map<string, string>
}

const state: EncryptionState = {
  chatKeyCache: new Map(),
}

// Generate a random salt for PBKDF2
export function generateSalt(): string {
  return CryptoJS.lib.WordArray.random(32).toString()
}

// Generate a random 32-byte master key
export function generateMasterKey(): string {
  return CryptoJS.lib.WordArray.random(32).toString()
}

// Derive an encryption key from password using PBKDF2
export function deriveKeyFromPassword(password: string, salt: string): string {
  const derived = CryptoJS.PBKDF2(password, salt, {
    keySize: 256 / 32,
    iterations: PBKDF2_ITERATIONS,
  })
  return derived.toString()
}

// Encrypt data using AES-256-CBC
export function encryptData(plaintext: string, keyHex: string): string {
  // Convert hex key to WordArray
  const key = CryptoJS.enc.Hex.parse(keyHex)

  // Generate random IV
  const iv = CryptoJS.lib.WordArray.random(16)

  // Encrypt
  const encrypted = CryptoJS.AES.encrypt(plaintext, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  })

  // Format: {iv_hex}:{ciphertext_base64}
  const result = `${iv.toString()}:${encrypted.ciphertext.toString(CryptoJS.enc.Base64)}`
  console.log('[encryptData] Encrypted successfully:', {
    plaintextLength: plaintext.length,
    resultLength: result.length,
    resultSample: result.substring(0, 60) + '...'
  })
  return result
}

// Decrypt data using AES-256-CBC
export function decryptData(encryptedData: string, keyHex: string): string {
  try {
    // Handle null/undefined
    if (!encryptedData) {
      console.error('[decryptData] No encrypted data provided')
      return ''
    }

    // Ensure it's a string
    let dataStr = encryptedData
    if (typeof dataStr !== 'string') {
      console.warn('[decryptData] Input is not a string, converting:', typeof dataStr)
      dataStr = String(dataStr)
    }

    // Trim whitespace
    dataStr = dataStr.trim()

    // Parse format: {iv_hex}:{ciphertext_base64}
    // Split only on the first colon since base64 ciphertext might contain colons
    const colonIndex = dataStr.indexOf(':')
    if (colonIndex === -1) {
      console.error('[decryptData] Invalid encrypted data format: no colon found', {
        dataLength: dataStr.length,
        dataType: typeof dataStr,
        dataSample: dataStr.substring(0, 100),
        note: 'Text appears to be unencrypted or malformed'
      })
      // Return as-is - this might be plaintext or corrupted data
      return dataStr
    }

    const ivHex = dataStr.substring(0, colonIndex)
    const ciphertextBase64 = dataStr.substring(colonIndex + 1)

    // Validate hex format
    if (!/^[0-9a-f]*$/i.test(ivHex)) {
      console.error('[decryptData] Invalid IV format (not hex):', ivHex.substring(0, 30))
      return dataStr
    }

    console.log('[decryptData] Decrypting:', {
      ivLength: ivHex.length,
      ciphertextLength: ciphertextBase64.length,
      ivSample: ivHex.substring(0, 20) + '...',
      ciphertextSample: ciphertextBase64.substring(0, 30) + '...'
    })

    // Convert hex/base64 to WordArray
    const key = CryptoJS.enc.Hex.parse(keyHex)
    const iv = CryptoJS.enc.Hex.parse(ivHex)
    const ciphertextStr = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Base64.parse(ciphertextBase64))

    // Decrypt - pass ciphertext as string
    const decrypted = CryptoJS.AES.decrypt(ciphertextStr, key, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    })

    const result = decrypted.toString(CryptoJS.enc.Utf8)

    if (!result) {
      console.warn('[decryptData] Decryption returned empty result')
      return dataStr
    }

    console.log('[decryptData] Decryption successful, result length:', result.length)
    return result
  } catch (err) {
    console.error('[decryptData] Decryption failed:', err, {
      input: typeof encryptedData,
      sample: String(encryptedData).substring(0, 100),
      errorMessage: err instanceof Error ? err.message : String(err)
    })
    // Return original data - it might be plaintext that we couldn't decrypt
    return String(encryptedData)
  }
}

// Initialize encryption service with user password
export function initializeWithPasswordAndSalt(userId: string, password: string, salt: string): void {
  state.userId = userId
  state.userSalt = salt
  state.sessionPassword = password
  state.chatKeyCache.clear()
}

// Store encrypted chat key in database
export async function storeEncryptedChatKey(
  chatId: string | number,
  userId: string,
  masterKey: string,
  derivedKey: string
): Promise<void> {
  try {
    // Encrypt the master key using the derived key
    const encryptedKey = encryptData(masterKey, derivedKey)

    console.log('[storeEncryptedChatKey] Storing key for chat:', chatId, 'user:', userId, {
      masterKeyLength: masterKey.length,
      derivedKeyLength: derivedKey.length,
      encryptedKeyLength: encryptedKey.length
    })

    // Store in database using insert (simpler, better for debugging)
    const { error } = await supabase
      .from('chat_encryption_keys')
      .insert({
        chat_id: Number(chatId),
        user_id: userId,
        encrypted_key: encryptedKey,
      })

    if (error) {
      const errorMsg = (error as any)?.message || String(error)
      console.error('[storeEncryptedChatKey] Error storing encrypted chat key:', {
        message: errorMsg,
        code: (error as any)?.code,
        hint: (error as any)?.hint,
        details: (error as any)?.details,
        status: (error as any)?.status,
        chatId: Number(chatId),
        userId,
        encryptedKeyLength: encryptedKey?.length
      })
      throw error
    }

    console.log('[storeEncryptedChatKey] Successfully stored key for chat:', chatId)
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    console.error('[storeEncryptedChatKey] Failed to store encrypted chat key:', {
      message: errorMsg,
      stack: err instanceof Error ? err.stack : undefined,
      error: err,
      errorType: typeof err
    })
    throw err
  }
}

// Load encrypted chat key from database and decrypt
// Returns null if no encryption key exists for this chat (unencrypted chat)
export async function loadChatKey(chatId: string | number, password?: string): Promise<string | null> {
  const chatIdNum = Number(chatId)

  if (!state.userId) {
    console.warn('[loadChatKey] Encryption service not initialized, returning null')
    return null
  }

  console.log('[loadChatKey] Looking for key - chatId:', chatIdNum, 'userId:', state.userId, 'password provided:', !!password)

  // Check cache first
  const cacheKey = `${chatIdNum}:${state.userId}`
  if (state.chatKeyCache.has(cacheKey)) {
    console.log('[loadChatKey] Found key in cache')
    return state.chatKeyCache.get(cacheKey) || null
  }

  try {
    // Fetch encrypted key from database
    const { data, error } = await supabase
      .from('chat_encryption_keys')
      .select('encrypted_key')
      .eq('chat_id', chatIdNum)
      .eq('user_id', state.userId)
      .maybeSingle()

    console.log('[loadChatKey] Query result - found data:', !!data, 'error:', error?.message)

    if (error) {
      console.error('[loadChatKey] Error loading chat encryption key:', error)
      return null
    }

    if (!data) {
      console.log('[loadChatKey] No encryption key found for chat, treating as unencrypted')
      return null
    }

    // Log what we got from database
    console.log('[loadChatKey] Retrieved encrypted_key:', {
      type: typeof data.encrypted_key,
      isString: typeof data.encrypted_key === 'string',
      isObject: typeof data.encrypted_key === 'object',
      length: data.encrypted_key?.length,
      sample: typeof data.encrypted_key === 'string' ? data.encrypted_key.substring(0, 60) : JSON.stringify(data.encrypted_key).substring(0, 60)
    })

    // Use provided password or fall back to session password
    const pwd = password || state.sessionPassword
    if (!pwd) {
      console.warn('[loadChatKey] No password available to decrypt chat key')
      return null
    }

    console.log('[loadChatKey] Deriving key from password...')

    // Derive the user's key from password (use userId as salt)
    const userSalt = state.userId
    const derivedKey = deriveKeyFromPassword(pwd, userSalt)

    // Ensure encrypted_key is a string
    let encryptedKeyStr = data.encrypted_key
    if (typeof encryptedKeyStr !== 'string') {
      console.warn('[loadChatKey] encrypted_key is not a string, converting:', typeof encryptedKeyStr)
      encryptedKeyStr = JSON.stringify(encryptedKeyStr)
    }

    // Decrypt the master key
    const masterKey = decryptData(encryptedKeyStr, derivedKey)

    if (!masterKey) {
      console.error('[loadChatKey] Failed to decrypt master key')
      return null
    }

    console.log('[loadChatKey] Successfully decrypted master key, length:', masterKey.length)

    // Cache the master key
    state.chatKeyCache.set(cacheKey, masterKey)

    return masterKey
  } catch (err) {
    console.error('[loadChatKey] Failed to load chat key:', err)
    return null
  }
}

// Encrypt a message
export function encryptMessage(messageText: string, masterKeyHex: string): string {
  console.log('[encryptMessage] Encrypting message:', {
    textLength: messageText.length,
    keyLength: masterKeyHex.length
  })
  const result = encryptData(messageText, masterKeyHex)
  console.log('[encryptMessage] Result:', {
    length: result.length,
    sample: result.substring(0, 80) + '...'
  })
  return result
}

// Decrypt a message
export function decryptMessage(encryptedText: string, masterKeyHex: string): string {
  console.log('[decryptMessage] Attempting to decrypt:', {
    textLength: encryptedText?.length || 0,
    textType: typeof encryptedText,
    textSample: String(encryptedText).substring(0, 80) + '...',
    keyLength: masterKeyHex.length
  })
  const result = decryptData(encryptedText, masterKeyHex)
  console.log('[decryptMessage] Decryption result length:', result.length)
  return result
}

// Clear all cached keys (on logout)
export function clearAllKeys(): void {
  state.chatKeyCache.clear()
  state.userId = undefined
  state.userSalt = undefined
  state.sessionPassword = undefined
}

// Get session password (for UI that needs it)
export function getSessionPassword(): string | undefined {
  return state.sessionPassword
}
