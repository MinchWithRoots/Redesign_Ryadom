import { supabase } from '@/utils/supabase'

// ============ COMPANIONS (Спутники) ============
export async function getCompanions() {
  try {
    const { data, error } = await supabase
      .from('companions')
      .select(
        `
        *,
        companion_topics (topic),
        reviews (rating, comment, user_id)
      `
      )
      .eq('is_available', true)

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching companions:', error)
    return null
  }
}

export async function getCompanionById(id: number) {
  try {
    const { data, error } = await supabase
      .from('companions')
      .select(
        `
        *,
        companion_topics (topic),
        reviews (rating, comment, title)
      `
      )
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching companion:', error)
    return null
  }
}

export async function searchCompanions(query: string) {
  try {
    const { data, error } = await supabase
      .from('companions')
      .select(
        `
        *,
        companion_topics (topic)
      `
      )
      .or(
        `name.ilike.%${query}%,specialization.ilike.%${query}%,bio.ilike.%${query}%`
      )

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error searching companions:', error)
    return null
  }
}

// ============ USERS (Пользователи) ============
export async function getUserProfile(userId: number) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select(
        `
        *,
        user_preferences (*)
      `
      )
      .eq('id', userId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return null
  }
}

export async function updateUserProfile(userId: number, updates: any) {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating user profile:', error)
    return null
  }
}

// ============ CHATS (Переписки) ============
export async function getUserChats(userId: number) {
  try {
    const { data, error } = await supabase
      .from('chats')
      .select(
        `
        *,
        companions (*),
        messages (count),
        chat_read_status (unread_count)
      `
      )
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching chats:', error)
    return null
  }
}

export async function getChatMessages(chatId: number) {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*, users (name, image)')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching messages:', error)
    return null
  }
}

export async function sendMessage(
  chatId: number,
  senderId: number,
  text: string
) {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert([{ chat_id: chatId, sender_id: senderId, text }])
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error sending message:', error)
    return null
  }
}

export async function createChat(userId: number, companionId: number) {
  try {
    const { data, error } = await supabase
      .from('chats')
      .insert([{ user_id: userId, companion_id: companionId }])
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creating chat:', error)
    return null
  }
}

// ============ FAVORITES (Избранное) ============
export async function addToFavorites(userId: number, companionId: number) {
  try {
    const { data, error } = await supabase
      .from('favorites')
      .insert([{ user_id: userId, companion_id: companionId }])

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error adding to favorites:', error)
    return null
  }
}

export async function removeFromFavorites(userId: number, companionId: number) {
  try {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('companion_id', companionId)

    if (error) throw error
  } catch (error) {
    console.error('Error removing from favorites:', error)
  }
}

export async function getUserFavorites(userId: number) {
  try {
    const { data, error } = await supabase
      .from('favorites')
      .select('companions (*)')
      .eq('user_id', userId)

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching favorites:', error)
    return null
  }
}

// ============ REVIEWS (Отзывы) ============
export async function addReview(
  companionId: number,
  userId: number,
  rating: number,
  title: string,
  comment: string
) {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .upsert([
        {
          companion_id: companionId,
          user_id: userId,
          rating,
          title,
          comment
        }
      ])
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error adding review:', error)
    return null
  }
}

export async function getCompanionReviews(companionId: number) {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, users (name, image)')
      .eq('companion_id', companionId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return null
  }
}
