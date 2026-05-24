import { supabase } from '@/utils/supabase'
import { encryptionService } from './encryptionService'
import * as crypto from 'crypto-js'

/**
 * Create a new chat with encryption key setup for both users
 */
export async function createChatWithEncryption(
  userId: string,
  companionId: number,
  userPasswordHash: string
): Promise<any> {
  try {
    // Create the chat
    const { data: chatData, error: chatError } = await supabase
      .from('chats')
      .insert([
        {
          user_id: userId,
          companion_id: companionId,
          status: 'active',
        },
      ])
      .select()
      .single()

    if (chatError) {
      console.error('Error creating chat:', chatError)
      throw chatError
    }

    if (!chatData || !chatData.id) {
      throw new Error('Chat created but no ID returned')
    }

    const chatId = chatData.id

    // Generate a random master key for this chat
    const chatMasterKey = crypto.lib.WordArray.random(32).toString()

    // Store encrypted copy for the user who created the chat
    await encryptionService.storeEncryptedChatKey(
      chatId,
      userId,
      chatMasterKey,
      userPasswordHash
    )

    // Note: The companion's encrypted key will be created when they load the chat
    // OR when they send their first message
    // This is because we don't have their password hash

    // Cache the key in memory for immediate use
    const keyStore = chatMasterKey as any
    console.log('Created chat with encryption:', chatId)

    return chatData
  } catch (err) {
    console.error('Failed to create chat with encryption:', err)
    throw err
  }
}

/**
 * Initialize encryption keys for a user in an existing chat
 * Call this when a user joins a chat for the first time
 */
export async function initializeChatEncryptionForUser(
  chatId: number,
  userId: string,
  userPasswordHash: string
): Promise<void> {
  try {
    // Check if user already has an encrypted key
    const { data: existingKey, error: fetchError } = await supabase
      .from('chat_encryption_keys')
      .select('id')
      .eq('chat_id', chatId)
      .eq('user_id', userId)
      .maybeSingle()

    if (fetchError) {
      console.error('Error checking for existing key:', fetchError)
      throw fetchError
    }

    // If user already has a key, nothing to do
    if (existingKey) {
      console.log('User already has encryption key for this chat')
      return
    }

    // Get the master key from another user in the chat
    // We'll need to fetch it and the other user's encrypted version to decrypt it
    const { data: otherUserKey, error: otherKeyError } = await supabase
      .from('chat_encryption_keys')
      .select('encrypted_key')
      .eq('chat_id', chatId)
      .limit(1)
      .maybeSingle()

    if (otherKeyError) {
      console.error('Error fetching other user key:', otherKeyError)
      throw otherKeyError
    }

    if (!otherUserKey) {
      // No other user has a key - create a new one
      console.log('No other user key found, creating new master key')
      const newMasterKey = crypto.lib.WordArray.random(32).toString()
      await encryptionService.storeEncryptedChatKey(chatId, userId, newMasterKey, userPasswordHash)
      return
    }

    // In a real multi-user scenario, we would need to:
    // 1. Get the master key from the other user
    // 2. Re-encrypt it with the new user's password
    // For now, we create a new master key
    // This is a limitation of password-only encryption without a server key

    const newMasterKey = crypto.lib.WordArray.random(32).toString()
    await encryptionService.storeEncryptedChatKey(chatId, userId, newMasterKey, userPasswordHash)

    console.log('Initialized encryption for user in chat:', chatId)
  } catch (err) {
    console.error('Failed to initialize chat encryption for user:', err)
    throw err
  }
}
