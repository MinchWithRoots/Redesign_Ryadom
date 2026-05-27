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
  return `${iv.toString()}:${encrypted.ciphertext.toString(CryptoJS.enc.Base64)}`
}

// Decrypt data using AES-256-CBC
export function decryptData(encryptedData: string, keyHex: string): string {
  try {
    // Parse format: {iv_hex}:{ciphertext_base64}
    const parts = encryptedData.split(':')
    if (parts.length !== 2) {
      console.error('Invalid encrypted data format')
      return encryptedData // Return as-is if decryption fails (graceful degradation)
    }

    const [ivHex, ciphertextBase64] = parts

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

    return decrypted.toString(CryptoJS.enc.Utf8)
  } catch (err) {
    console.error('Decryption failed:', err)
    return encryptedData // Return as-is if decryption fails (graceful degradation)
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
    
    // Store in database
    const { error } = await supabase
      .from('chat_encryption_keys')
      .upsert(
        {
          chat_id: Number(chatId),
          user_id: userId,
          encrypted_key: encryptedKey,
        },
        {
          onConflict: 'chat_id,user_id',
        }
      )
    
    if (error) {
      console.error('Error storing encrypted chat key:', error)
      throw error
    }
  } catch (err) {
    console.error('Failed to store encrypted chat key:', err)
    throw err
  }
}

// Load encrypted chat key from database and decrypt
export async function loadChatKey(chatId: string | number, password: string): Promise<string> {
  const chatIdNum = Number(chatId)
  
  if (!state.userId) {
    throw new Error('Encryption service not initialized')
  }
  
  // Check cache first
  const cacheKey = `${chatIdNum}:${state.userId}`
  if (state.chatKeyCache.has(cacheKey)) {
    return state.chatKeyCache.get(cacheKey)!
  }
  
  try {
    // Fetch encrypted key from database
    const { data, error } = await supabase
      .from('chat_encryption_keys')
      .select('encrypted_key')
      .eq('chat_id', chatIdNum)
      .eq('user_id', state.userId)
      .single()
    
    if (error || !data) {
      console.error('Error loading chat encryption key:', error)
      throw new Error('Could not load encryption key for this chat')
    }
    
    // Derive the user's key from password
    if (!state.userSalt) {
      throw new Error('User salt not available')
    }
    
    const derivedKey = deriveKeyFromPassword(password, state.userSalt)
    
    // Decrypt the master key
    const masterKey = decryptData(data.encrypted_key, derivedKey)
    
    // Cache the master key
    state.chatKeyCache.set(cacheKey, masterKey)
    
    return masterKey
  } catch (err) {
    console.error('Failed to load chat key:', err)
    throw err
  }
}

// Encrypt a message
export function encryptMessage(messageText: string, masterKeyHex: string): string {
  return encryptData(messageText, masterKeyHex)
}

// Decrypt a message
export function decryptMessage(encryptedText: string, masterKeyHex: string): string {
  return decryptData(encryptedText, masterKeyHex)
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
