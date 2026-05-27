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
    // Get companion user data from companions table (which has user_id field)
    const { data: companionData, error: companionError } = await supabase
      .from('companions')
      .select('user_id')
      .eq('id', companionId)
      .single()

    if (companionError || !companionData?.user_id) {
      throw new Error('Could not fetch companion user data: companion has no associated user')
    }

    const companionUserId = companionData.user_id

    // Generate a random 32-byte master key for this chat
    const masterKey = encryptionService.generateMasterKey()

    // For user: derive key from their password and store encrypted master key
    const userDerivedKey = encryptionService.deriveKeyFromPassword(userPassword, userId)
    await encryptionService.storeEncryptedChatKey(chatId, userId, masterKey, userDerivedKey)

    // For companion: we cannot derive their key without their password
    // Store encrypted master key using companion user ID for the same password salt
    const companionDerivedKey = encryptionService.deriveKeyFromPassword(userPassword, companionUserId)
    await encryptionService.storeEncryptedChatKey(chatId, companionUserId, masterKey, companionDerivedKey)

    console.log('Chat encryption initialized for both user and companion')
  } catch (err) {
    console.error('Failed to initialize chat encryption:', err)
    throw err
  }
}
