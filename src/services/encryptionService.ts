import * as crypto from 'crypto-js'
import { supabase } from '@/utils/supabase'

export interface EncryptionKey {
  chatId: string | number
  key: string
  expiresAt?: number
}

interface KeyDerivationParams {
  iterations: number
  keySize: number
}

// Constants for key derivation
const KEY_DERIVATION_PARAMS: KeyDerivationParams = {
  iterations: 310000, // OWASP 2023 recommendation for PBKDF2-SHA256
  keySize: 256 / 32, // 256 bits = 32 bytes
}

class EncryptionService {
  private keyStore: Map<string | number, EncryptionKey> = new Map()
  private currentUserId: string = ''
  private userSalt: string = '' // User-specific salt for key derivation

  /**
   * Initialize encryption with user credentials
   * Call this after successful login with the password and user's salt
   * The salt is stored in the database to ensure consistent key derivation across devices
   */
  initializeWithPasswordAndSalt(userId: string, salt: string): void {
    this.currentUserId = userId
    this.userSalt = salt
    console.log('Encryption service initialized for user:', userId)
  }

  /**
   * Check if encryption service is initialized (for debugging/fallback)
   */
  isInitialized(): boolean {
    return !!(this.currentUserId && this.userSalt)
  }

  /**
   * Derive a cryptographic key from password using PBKDF2
   * This is deterministic: same password + same salt = same key on all devices
   * Used for encrypting/decrypting the chat master keys
   */
  private deriveKeyFromPassword(password: string): string {
    if (!this.userSalt) {
      throw new Error('User salt not initialized. Call initializeWithPasswordAndSalt first.')
    }

    try {
      // PBKDF2 with SHA256: deterministic derivation
      const derivedKey = crypto.PBKDF2(password, this.userSalt, {
        keySize: KEY_DERIVATION_PARAMS.keySize,
        iterations: KEY_DERIVATION_PARAMS.iterations,
      }).toString()

      return derivedKey
    } catch (err) {
      console.error('Failed to derive key from password:', err)
      throw new Error('Key derivation failed')
    }
  }

  /**
   * Generate a random chat master key
   * Should be called once when chat is created
   */
  private generateRandomKey(): string {
    return crypto.lib.WordArray.random(32).toString()
  }

  /**
   * Generate a random IV (Initialization Vector) for AES encryption
   */
  private generateRandomIV(): string {
    return crypto.lib.WordArray.random(16).toString()
  }

  /**
   * Encrypt a value with a key and random IV
   * Returns: IV + encrypted data (both base64)
   * This allows proper decryption on any device
   */
  private encryptWithKey(plaintext: string, key: string): string {
    try {
      const iv = this.generateRandomIV()

      // Encrypt using AES-256-CBC with the derived key
      const encrypted = crypto.AES.encrypt(plaintext, key, {
        iv: crypto.enc.Hex.parse(iv),
        mode: crypto.mode.CBC,
        padding: crypto.pad.Pkcs7,
      }).toString()

      // Return: IV (hex) + encrypted data (base64)
      // Format: "iv:encrypted" for easy parsing
      return `${iv}:${encrypted}`
    } catch (err) {
      console.error('Encryption error:', err)
      throw new Error('Failed to encrypt data')
    }
  }

  /**
   * Decrypt a value that was encrypted with encryptWithKey
   * Expects format: "iv:encrypted"
   */
  private decryptWithKey(encrypted: string, key: string): string {
    try {
      // Parse: IV + encrypted data
      const [ivHex, encryptedData] = encrypted.split(':')

      if (!ivHex || !encryptedData) {
        throw new Error('Invalid encryption format')
      }

      // Decrypt using AES-256-CBC
      const decrypted = crypto.AES.decrypt(encryptedData, key, {
        iv: crypto.enc.Hex.parse(ivHex),
        mode: crypto.mode.CBC,
        padding: crypto.pad.Pkcs7,
      }).toString(crypto.enc.Utf8)

      if (!decrypted || decrypted.trim() === '') {
        throw new Error('Decrypted data is empty')
      }

      return decrypted
    } catch (err) {
      console.error('Decryption error:', err)
      throw new Error('Failed to decrypt data')
    }
  }

  /**
   * Create a new chat and set up encryption
   * Generates a unique master key for the chat
   */
  async createChatEncryption(chatId: string | number, userIds: string[]): Promise<string> {
    try {
      // Generate random master key for this chat
      const masterKey = this.generateRandomKey()

      // For the current user, encrypt and store the master key
      // Other users will encrypt it with their own password when they join the chat
      if (userIds.includes(this.currentUserId)) {
        const derivedKey = this.deriveKeyFromPassword(this.currentUserId)
        await this.storeEncryptedChatKey(chatId, this.currentUserId, masterKey, derivedKey)
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
   * password should be the derived key (from deriveKeyFromPassword)
   */
  async storeEncryptedChatKey(
    chatId: string | number,
    userId: string,
    chatMasterKey: string,
    derivedKey: string
  ): Promise<void> {
    try {
      // Encrypt the chat master key with user's derived key
      const encryptedKey = this.encryptWithKey(chatMasterKey, derivedKey)

      // Store in database
      const { error } = await supabase.from('chat_encryption_keys').upsert({
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
   * Password parameter: optional for backward compatibility, but required for proper decryption
   */
  async loadChatKey(chatId: string | number, password?: string): Promise<string> {
    try {
      // Check memory cache first
      const cached = this.keyStore.get(chatId)
      if (cached && (!cached.expiresAt || cached.expiresAt > Date.now())) {
        return cached.key
      }

      if (!this.currentUserId || !this.userSalt) {
        throw new Error(
          'User not authenticated. Call initializeWithPasswordAndSalt first. ' +
          'This usually happens on page refresh - try logging out and logging back in.'
        )
      }

      // Password is required for proper key derivation
      if (!password) {
        console.warn(
          'No password provided to loadChatKey. User will need to re-login to decrypt messages. ' +
          'This happens on page refresh - password is not persisted for security reasons.'
        )
        // Throw error to prompt re-authentication
        throw new Error(
          'Session password lost. Please refresh the page or log in again to access encrypted messages.'
        )
      }

      const derivedKey = this.deriveKeyFromPassword(password)

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
        // Key doesn't exist for this user
        // This might be a new user joining an existing chat
        // We'll create a new master key for them
        console.warn('No encrypted chat key found for user. Creating new one.')
        const newKey = this.generateRandomKey()
        await this.storeEncryptedChatKey(chatId, this.currentUserId, newKey, derivedKey)
        return newKey
      }

      // Decrypt the key using user's password
      const decryptedKey = this.decryptWithKey(data.encrypted_key, derivedKey)

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
   * Includes IV in the output for proper decryption
   */
  encryptMessage(text: string, chatId: string | number): string {
    const key = this.getKeySync(chatId)
    if (!key) {
      throw new Error(`Encryption key not found for chat ${chatId}. Call loadChatKey first.`)
    }

    try {
      const iv = this.generateRandomIV()

      // Encrypt using AES-256-CBC
      const encrypted = crypto.AES.encrypt(text, key, {
        iv: crypto.enc.Hex.parse(iv),
        mode: crypto.mode.CBC,
        padding: crypto.pad.Pkcs7,
      }).toString()

      // Return: IV (hex) + encrypted data (base64)
      return `${iv}:${encrypted}`
    } catch (err) {
      console.error('Encryption error:', err)
      throw new Error('Failed to encrypt message')
    }
  }

  /**
   * Decrypt message text using chat's master key
   * Expects format: "iv:encrypted"
   */
  decryptMessage(encryptedText: string, chatId: string | number): string {
    const key = this.getKeySync(chatId)
    if (!key) {
      throw new Error(`Encryption key not found for chat ${chatId}. Call loadChatKey first.`)
    }

    try {
      // Check if format matches encryption format
      if (!encryptedText.includes(':')) {
        // Old plaintext or incompatible format
        return encryptedText
      }

      const [ivHex, encryptedData] = encryptedText.split(':')

      if (!ivHex || !encryptedData) {
        // Invalid format, treat as plaintext
        return encryptedText
      }

      // Decrypt using AES-256-CBC
      const decrypted = crypto.AES.decrypt(encryptedData, key, {
        iv: crypto.enc.Hex.parse(ivHex),
        mode: crypto.mode.CBC,
        padding: crypto.pad.Pkcs7,
      }).toString(crypto.enc.Utf8)

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
    this.currentUserId = ''
    this.userSalt = ''
  }

  /**
   * Get the number of PBKDF2 iterations used for key derivation
   * Useful for displaying security info to users
   */
  getKeyDerivationIterations(): number {
    return KEY_DERIVATION_PARAMS.iterations
  }
}

export const encryptionService = new EncryptionService()
