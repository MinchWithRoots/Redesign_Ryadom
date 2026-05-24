import * as crypto from 'crypto-js'

export interface EncryptionKey {
  chatId: string
  key: string
  expiresAt?: number
}

class EncryptionService {
  private keyStore: Map<string, EncryptionKey> = new Map()
  private readonly STORAGE_PREFIX = 'chat_encryption_key_'

  /**
   * Generate a random encryption key for a chat
   */
  generateKey(chatId: string): string {
    const key = crypto.lib.WordArray.random(32).toString()
    this.keyStore.set(chatId, {
      chatId,
      key,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    })
    // Save to localStorage for persistence
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`${this.STORAGE_PREFIX}${chatId}`, key)
      }
    } catch (err) {
      console.warn('Failed to save encryption key to localStorage:', err)
    }
    return key
  }

  /**
   * Store encryption key for a chat
   */
  setKey(chatId: string, key: string): void {
    this.keyStore.set(chatId, {
      chatId,
      key,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    })
    // Save to localStorage for persistence
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`${this.STORAGE_PREFIX}${chatId}`, key)
      }
    } catch (err) {
      console.warn('Failed to save encryption key to localStorage:', err)
    }
  }

  /**
   * Get encryption key for a chat
   */
  getKey(chatId: string): string | null {
    // First check memory cache
    let keyObj = this.keyStore.get(chatId)

    // If not in memory, try to load from localStorage
    if (!keyObj) {
      try {
        if (typeof window !== 'undefined') {
          const storedKey = localStorage.getItem(`${this.STORAGE_PREFIX}${chatId}`)
          if (storedKey) {
            keyObj = {
              chatId,
              key: storedKey,
              expiresAt: Date.now() + 24 * 60 * 60 * 1000,
            }
            this.keyStore.set(chatId, keyObj)
          }
        }
      } catch (err) {
        console.warn('Failed to load encryption key from localStorage:', err)
      }
    }

    if (!keyObj) return null

    // Check if key expired
    if (keyObj.expiresAt && keyObj.expiresAt < Date.now()) {
      this.keyStore.delete(chatId)
      try {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(`${this.STORAGE_PREFIX}${chatId}`)
        }
      } catch (err) {
        console.warn('Failed to remove encryption key from localStorage:', err)
      }
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
      // Try to decrypt using the key
      const decrypted = crypto.AES.decrypt(encryptedText, key).toString(crypto.enc.Utf8)

      // If decryption result is empty, the encrypted text is likely not valid
      // This could mean the message wasn't encrypted or uses a different key
      if (!decrypted || decrypted.trim() === '') {
        // Return the original text if decryption fails - it might be plaintext
        return encryptedText
      }

      return decrypted
    } catch (err) {
      // If decryption fails entirely, treat as plaintext
      // This handles cases where the message format is incorrect or uses different encryption
      console.warn('Decryption failed, treating as plaintext:', err)
      return encryptedText
    }
  }

  /**
   * Clear key from memory and storage
   */
  clearKey(chatId: string): void {
    this.keyStore.delete(chatId)
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`${this.STORAGE_PREFIX}${chatId}`)
      }
    } catch (err) {
      console.warn('Failed to remove encryption key from localStorage:', err)
    }
  }

  /**
   * Clear all keys from memory and storage
   */
  clearAllKeys(): void {
    this.keyStore.clear()
    try {
      if (typeof window !== 'undefined') {
        const keysToDelete: string[] = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && key.startsWith(this.STORAGE_PREFIX)) {
            keysToDelete.push(key)
          }
        }
        keysToDelete.forEach(key => localStorage.removeItem(key))
      }
    } catch (err) {
      console.warn('Failed to clear encryption keys from localStorage:', err)
    }
  }

  /**
   * Check if key exists and is valid
   */
  hasKey(chatId: string): boolean {
    const keyObj = this.keyStore.get(chatId)
    if (!keyObj) return false

    if (keyObj.expiresAt && keyObj.expiresAt < Date.now()) {
      this.keyStore.delete(chatId)
      return false
    }

    return true
  }
}

export const encryptionService = new EncryptionService()
