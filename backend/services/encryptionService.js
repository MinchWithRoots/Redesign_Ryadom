import CryptoJS from 'crypto-js'

const PBKDF2_ITERATIONS = 310000

// Encrypt data using AES-256-CBC
export function encryptData(plaintext, keyHex) {
  try {
    const key = CryptoJS.enc.Hex.parse(keyHex)
    const iv = CryptoJS.lib.WordArray.random(16)
    
    const encrypted = CryptoJS.AES.encrypt(plaintext, key, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    })
    
    return `${iv.toString()}:${encrypted.ciphertext.toString(CryptoJS.enc.Base64)}`
  } catch (err) {
    console.error('Encryption failed:', err)
    throw err
  }
}

// Decrypt data using AES-256-CBC
export function decryptData(encryptedData, keyHex) {
  try {
    const parts = encryptedData.split(':')
    if (parts.length !== 2) {
      console.error('Invalid encrypted data format')
      return null
    }

    const [ivHex, ciphertextBase64] = parts
    const key = CryptoJS.enc.Hex.parse(keyHex)
    const iv = CryptoJS.enc.Hex.parse(ivHex)
    const ciphertextStr = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Base64.parse(ciphertextBase64))

    const decrypted = CryptoJS.AES.decrypt(ciphertextStr, key, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    })

    return decrypted.toString(CryptoJS.enc.Utf8)
  } catch (err) {
    console.error('Decryption failed:', err)
    return null
  }
}

// Derive an encryption key from password using PBKDF2
export function deriveKeyFromPassword(password, salt) {
  try {
    const derived = CryptoJS.PBKDF2(password, salt, {
      keySize: 256 / 32,
      iterations: PBKDF2_ITERATIONS,
    })
    return derived.toString()
  } catch (err) {
    console.error('Key derivation failed:', err)
    throw err
  }
}

// Generate a random 32-byte master key
export function generateMasterKey() {
  return CryptoJS.lib.WordArray.random(32).toString()
}
