import * as crypto from 'crypto-js'

export interface EncryptionKey {
  chatId: string
  key: string
  expiresAt?: number
}

class EncryptionService {
  private keyStore: Map<string, EncryptionKey> = new Map()

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
  }

  /**
   * Get encryption key for a chat
   */
  getKey(chatId: string): string | null {
    const keyObj = this.keyStore.get(chatId)
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
      if (!decrypted) {
        throw new Error('Failed to decrypt message - empty result')
      }
      return decrypted
    } catch (err) {
      console.error('Decryption error:', err)
      throw new Error('Failed to decrypt message')
    }
  }

  /**
   * Clear key from memory
   */
  clearKey(chatId: string): void {
    this.keyStore.delete(chatId)
  }

  /**
   * Clear all keys
   */
  clearAllKeys(): void {
    this.keyStore.clear()
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
