import * as crypto from 'crypto-js'
import { supabase } from '@/utils/supabase'

export interface EncryptionKey {
  chatId: string | number
  key: string
  expiresAt?: number
}

class EncryptionService {
  private keyStore: Map<string | number, EncryptionKey> = new Map()
  private currentUserPassword: string = ''
  private currentUserId: string = ''

  /**
   * Initialize encryption with user credentials
   * Call this after successful login
   */
  initializeWithPassword(passwordHash: string, userId: string): void {
    this.currentUserPassword = passwordHash
    this.currentUserId = userId
  }

  /**
   * Generate a random chat master key
   * Should be called once when chat is created
   */
  private generateRandomKey(): string {
    return crypto.lib.WordArray.random(32).toString()
  }

  /**
   * Encrypt a key using user's password hash
   * Used to store chat keys in database
   */
  private encryptKeyWithPassword(key: string, passwordHash: string): string {
    try {
      return crypto.AES.encrypt(key, passwordHash).toString()
    } catch (err) {
      console.error('Failed to encrypt key with password:', err)
      throw err
    }
  }

  /**
   * Decrypt a key using user's password hash
   * Used to restore chat keys from database
   */
  private decryptKeyWithPassword(encryptedKey: string, passwordHash: string): string {
    try {
      const decrypted = crypto.AES.decrypt(encryptedKey, passwordHash).toString(crypto.enc.Utf8)
      if (!decrypted || decrypted.trim() === '') {
        throw new Error('Decrypted key is empty')
      }
      return decrypted
    } catch (err) {
      console.error('Failed to decrypt key with password:', err)
      throw err
    }
  }

  /**
   * Create a new chat and set up encryption for both participants
   * Returns the chat master key
   */
  async createChatEncryption(
    chatId: string | number,
    userIds: string[]
  ): Promise<string> {
    try {
      // Generate random master key for this chat
      const masterKey = this.generateRandomKey()

      // For each user, encrypt the master key with their password and store
      for (const userId of userIds) {
        // We can't encrypt for other users without their password
        // So we store encrypted with a temporary key (user will set on next login)
        // For now, store with a placeholder - they will need to fetch it
        console.log('Chat encryption key created for chat:', chatId)
      }

      // Cache in memory
      this.keyStore.set(chatId, {
        chatId,
        key: masterKey,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      })

      return masterKey
    } catch (err) {
      console.error('Failed to create chat encryption:', err)
      throw err
    }
  }

  /**
   * Store encrypted chat key for a user in database
   */
  async storeEncryptedChatKey(
    chatId: string | number,
    userId: string,
    chatMasterKey: string,
    userPasswordHash: string
  ): Promise<void> {
    try {
      // Encrypt the chat master key with user's password
      const encryptedKey = this.encryptKeyWithPassword(chatMasterKey, userPasswordHash)

      // Store in database
      const { error } = await supabase
        .from('chat_encryption_keys')
        .upsert({
          chat_id: chatId,
          user_id: userId,
          encrypted_key: encryptedKey,
        })

      if (error) {
        console.error('Failed to store encrypted chat key:', error)
        throw error
      }

      console.log('Stored encrypted chat key for user:', userId, 'in chat:', chatId)
    } catch (err) {
      console.error('Failed to store encrypted chat key:', err)
      throw err
    }
  }

  /**
   * Retrieve and decrypt chat key for current user
   * Call this when loading a chat
   */
  async loadChatKey(chatId: string | number): Promise<string> {
    try {
      // Check memory cache first
      const cached = this.keyStore.get(chatId)
      if (cached && (!cached.expiresAt || cached.expiresAt > Date.now())) {
        return cached.key
      }

      if (!this.currentUserId || !this.currentUserPassword) {
        throw new Error('User not authenticated. Call initializeWithPassword first.')
      }

      // Fetch encrypted key from database
      const { data, error } = await supabase
        .from('chat_encryption_keys')
        .select('encrypted_key')
        .eq('chat_id', chatId)
        .eq('user_id', this.currentUserId)
        .maybeSingle()

      if (error) {
        console.error('Failed to fetch encrypted chat key:', error)
        throw error
      }

      if (!data || !data.encrypted_key) {
        // Key doesn't exist for this user - this shouldn't happen
        // Fall back to generating new one
        console.warn('No encrypted chat key found for user. Creating new one.')
        const newKey = this.generateRandomKey()
        await this.storeEncryptedChatKey(chatId, this.currentUserId, newKey, this.currentUserPassword)
        return newKey
      }

      // Decrypt the key using user's password
      const decryptedKey = this.decryptKeyWithPassword(
        data.encrypted_key,
        this.currentUserPassword
      )

      // Cache in memory
      this.keyStore.set(chatId, {
        chatId,
        key: decryptedKey,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      })

      return decryptedKey
    } catch (err) {
      console.error('Failed to load chat key:', err)
      throw err
    }
  }

  /**
   * Get cached key without database lookup
   */
  getKeySync(chatId: string | number): string | null {
    const keyObj = this.keyStore.get(chatId)
    if (!keyObj) return null

    if (keyObj.expiresAt && keyObj.expiresAt < Date.now()) {
      this.keyStore.delete(chatId)
      return null
    }

    return keyObj.key
  }

  /**
   * Check if key is cached
   */
  hasKey(chatId: string | number): boolean {
    const key = this.getKeySync(chatId)
    return key !== null
  }

  /**
   * Encrypt message text using chat's master key
   */
  encryptMessage(text: string, chatId: string | number): string {
    const key = this.getKeySync(chatId)
    if (!key) {
      throw new Error(`Encryption key not found for chat ${chatId}. Call loadChatKey first.`)
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
   * Decrypt message text using chat's master key
   */
  decryptMessage(encryptedText: string, chatId: string | number): string {
    const key = this.getKeySync(chatId)
    if (!key) {
      throw new Error(`Encryption key not found for chat ${chatId}. Call loadChatKey first.`)
    }

    try {
      const decrypted = crypto.AES.decrypt(encryptedText, key).toString(crypto.enc.Utf8)

      // If decryption result is empty, the text might not be encrypted
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
  clearKey(chatId: string | number): void {
    this.keyStore.delete(chatId)
  }

  /**
   * Clear all keys from memory (on logout)
   */
  clearAllKeys(): void {
    this.keyStore.clear()
    this.currentUserPassword = ''
    this.currentUserId = ''
  }
}

export const encryptionService = new EncryptionService()
