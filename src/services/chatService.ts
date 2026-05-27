import { supabase } from '@/utils/supabase'
import * as encryptionService from '@/services/encryptionService'

export async function createChat(
  userId: string,
  companionId: number,
  userPassword?: string
): Promise<any> {
  try {
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

    console.log('Created chat:', chatData.id)

    // Initialize encryption for this chat if password is provided
    if (userPassword && userId) {
      try {
        await initializeChatEncryption(chatData.id, userId, companionId, userPassword)
      } catch (encErr) {
        console.error('Warning: Failed to initialize chat encryption:', encErr)
        // Don't fail the chat creation if encryption setup fails
      }
    }

    return chatData
  } catch (err) {
    console.error('Failed to create chat:', err)
    throw err
  }
}

// Initialize encryption keys for both users in a chat
export async function initializeChatEncryption(
  chatId: number,
  userId: string,
  companionId: number,
  userPassword: string
): Promise<void> {
  try {
    // Generate a random 32-byte master key for this chat
    const masterKey = encryptionService.generateMasterKey()

    // Get companion user data
    const { data: companionData, error: companionError } = await supabase
      .from('users')
      .select('id')
      .eq('id', companionId)
      .single()

    if (companionError || !companionData) {
      throw new Error('Could not fetch companion user data')
    }

    // For user: derive key from their password and store encrypted master key
    const userSalt = userId
    const userDerivedKey = encryptionService.deriveKeyFromPassword(userPassword, userSalt)
    await encryptionService.storeEncryptedChatKey(chatId, userId, masterKey, userDerivedKey)

    // For companion: we cannot derive their key without their password
    // Store encrypted master key using user's encryption (will be re-encrypted on companion's first access)
    // For now, skip companion's key - they will generate it on first message receipt
    console.log('Chat encryption initialized for user:', userId)
  } catch (err) {
    console.error('Failed to initialize chat encryption:', err)
    throw err
  }
}
