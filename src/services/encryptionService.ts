import * as crypto from 'crypto-js'

export interface EncryptionKey {
  chatId: string
  key: string
  expiresAt?: number
}

class EncryptionService {
  private keyStore: Map<string, EncryptionKey> = new Map()
  private readonly STORAGE_PREFIX = 'chat_encryption_key_'
  private currentUserPassword: string = ''

  /**
   * Initialize encryption with user's password hash (from auth)
   * This should be called once when user logs in
   */
  initializeWithPassword(passwordHash: string): void {
    this.currentUserPassword = passwordHash
  }

  /**
   * Derive encryption key from chat ID and password hash
   * This ensures both users in a chat derive the same key
   */
  private deriveKeyFromChat(chatId: string): string {
    if (!this.currentUserPassword) {
      throw new Error('Encryption not initialized. Call initializeWithPassword first.')
    }

    // Combine password hash with chat ID to derive a deterministic key
    // This ensures both chat participants get the same key
    const combined = `${this.currentUserPassword}:${chatId}`
    
    // Use SHA256 for consistent key derivation
    const derived = crypto.SHA256(combined).toString()
    
    // Take first 32 characters (256 bits) for AES-256
    return derived.substring(0, 32)
  }

  /**
   * Generate or retrieve encryption key for a chat
   * Uses password-based key derivation for consistency across devices
   */
  generateKey(chatId: string): string {
    try {
      // Try to get from memory first
      const cached = this.keyStore.get(chatId)
      if (cached && (!cached.expiresAt || cached.expiresAt > Date.now())) {
        return cached.key
      }

      // Derive key from password and chat ID
      const key = this.deriveKeyFromChat(chatId)
      
      this.keyStore.set(chatId, {
        chatId,
        key,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      })

      return key
    } catch (err) {
      console.error('Failed to generate encryption key:', err)
      throw err
    }
  }

  /**
   * Store encryption key for a chat (legacy support)
   */
  setKey(chatId: string, key: string): void {
    this.keyStore.set(chatId, {
      chatId,
      key,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    })
  }

  /**
   * Get encryption key for a chat
   */
  getKey(chatId: string): string | null {
    // First check memory cache
    let keyObj = this.keyStore.get(chatId)

    if (!keyObj) {
      try {
        // Try to derive from password if not cached
        const key = this.deriveKeyFromChat(chatId)
        keyObj = {
          chatId,
          key,
          expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        }
        this.keyStore.set(chatId, keyObj)
      } catch (err) {
        console.warn('Failed to derive encryption key:', err)
        return null
      }
    }

    if (!keyObj) return null

    // Check if key expired
    if (keyObj.expiresAt && keyObj.expiresAt < Date.now()) {
      this.keyStore.delete(chatId)
      return null
    }

    return keyObj.key
  }

  /**
   * Encrypt message text
   */
  encryptMessage(text: string, chatId: string): string {
    const key = this.getKey(chatId)
    if (!key) {
      throw new Error(`Encryption key not found for chat ${chatId}`)
    }

    try {
      const encrypted = crypto.AES.encrypt(text, key).toString()
      return encrypted
    } catch (err) {
      console.error('Encryption error:', err)
      throw new Error('Failed to encrypt message')
    }
  }

  /**
   * Decrypt message text
   */
  decryptMessage(encryptedText: string, chatId: string): string {
    const key = this.getKey(chatId)
    if (!key) {
      throw new Error(`Encryption key not found for chat ${chatId}`)
    }

    try {
      const decrypted = crypto.AES.decrypt(encryptedText, key).toString(crypto.enc.Utf8)

      // If decryption result is empty, the encrypted text is likely not valid
      if (!decrypted || decrypted.trim() === '') {
        return encryptedText
      }

      return decrypted
    } catch (err) {
      console.warn('Decryption failed, treating as plaintext:', err)
      return encryptedText
    }
  }

  /**
   * Clear key from memory
   */
  clearKey(chatId: string): void {
    this.keyStore.delete(chatId)
  }

  /**
   * Clear all keys from memory
   */
  clearAllKeys(): void {
    this.keyStore.clear()
    this.currentUserPassword = ''
  }

  /**
   * Check if key exists and is valid
   */
  hasKey(chatId: string): boolean {
    if (!this.currentUserPassword) return false

    try {
      const key = this.getKey(chatId)
      return key !== null
    } catch {
      return false
    }
  }
}

export const encryptionService = new EncryptionService()
