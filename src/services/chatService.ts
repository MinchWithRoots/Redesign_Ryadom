import { supabase } from '@/utils/supabase'

export async function createChat(
  userId: string,
  companionId: number
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
    return chatData
  } catch (err) {
    console.error('Failed to create chat:', err)
    throw err
  }
}
