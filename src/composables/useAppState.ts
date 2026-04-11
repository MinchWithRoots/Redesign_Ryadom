import { ref, computed } from 'vue'
import { supabase } from '@/utils/supabase'

// Types
export interface User {
  id: string
  name: string
  email: string
  age?: number
  bio: string
  image?: string
}

export interface CompanionTopic {
  id?: number
  companion_id?: string
  topic: string
}

export interface Companion {
  id: string
  name: string
  age: number
  gender?: 'female' | 'male'
  specialization: string
  experience: string
  companion_topics?: CompanionTopic[] | { topic: string }[]
  topics?: string[]
  image: string
  rating: number
  reviews: number
  bio: string
  created_at?: string
  updated_at?: string
  is_available?: boolean
}

export interface Chat {
  id: string
  name: string
  lastMessage: string
  time: string
  unread_count: number
  image: string
  status: 'active' | 'offline'
  companion_id: string
  user_id: string
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  sender_id: string
  text: string
  created_at: string
  author: string
  isMine: boolean
  chat_id: string
}

// Global state
export const currentUser = ref<User | null>(null)
export const companions = ref<Companion[]>([])
export const chats = ref<Chat[]>([])
export const messages = ref<Message[]>([])
export const currentChatId = ref<string | null>(null)
export const isLoading = ref(false)
export const error = ref('')

// Check if user is logged in
export const isLoggedIn = () => {
  return !!currentUser.value
}

// Load current user
export const loadCurrentUser = async () => {
  try {
    isLoading.value = true
    error.value = ''

    const { data } = await supabase.auth.getUser()

    if (!data.user) {
      currentUser.value = null
      return null
    }

    // Fetch user profile
    const { data: profile, error: err } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (err) throw err

    currentUser.value = {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      age: profile.age,
      bio: profile.bio || '',
      image: profile.image,
    }

    return profile
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to load current user'
    error.value = errorMessage
    console.error('Load current user error:', err)
    return null
  } finally {
    isLoading.value = false
  }
}

// User operations
export const updateUserProfile = async (updates: { bio: string; image?: string }) => {
  try {
    isLoading.value = true
    error.value = ''

    if (!currentUser.value) throw new Error('No user logged in')

    const { data: profile, error: err } = await supabase
      .from('users')
      .update(updates)
      .eq('id', currentUser.value.id)
      .select()
      .single()

    if (err) throw err

    currentUser.value = {
      ...currentUser.value,
      ...profile,
    }

    return profile
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to update profile'
    error.value = errorMessage
    console.error('Update profile error:', err)
    throw err
  } finally {
    isLoading.value = false
  }
}

export const logoutUser = async () => {
  try {
    await supabase.auth.signOut()
    currentUser.value = null
    chats.value = []
    messages.value = []
  } catch (err) {
    console.error('Logout error:', err)
  }
}

// Companion operations
export const getCompanionById = async (id: string) => {
  try {
    const { data, error: err } = await supabase
      .from('companions')
      .select(
        `
        *,
        companion_topics (topic),
        reviews (rating, comment, user_id)
      `
      )
      .eq('id', id)
      .single()

    if (err) throw err
    return data
  } catch (err) {
    console.error('Error fetching companion:', err)
    return null
  }
}

export const filterCompanions = async (filters: {
  gender?: string
  ageMin?: number
  ageMax?: number
  experience?: string
  topic?: string
}) => {
  try {
    isLoading.value = true
    error.value = ''

    let query = supabase
      .from('companions')
      .select(
        `
        *,
        companion_topics (topic),
        reviews (rating)
      `
      )
      .eq('is_available', true)

    if (filters.ageMin) {
      query = query.gte('age', filters.ageMin)
    }
    if (filters.ageMax) {
      query = query.lte('age', filters.ageMax)
    }
    if (filters.experience) {
      query = query.eq('experience', filters.experience)
    }

    const { data: result, error: err } = await query

    if (err) throw err

    // Transform to include topics array
    const transformed = (result || []).map((c: any) => ({
      ...c,
      topics: Array.isArray(c.companion_topics)
        ? c.companion_topics.map((ct: any) => ct.topic)
        : []
    }))

    companions.value = transformed
    return transformed
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to filter companions'
    error.value = errorMessage
    console.error('Error filtering companions:', err)
    companions.value = []
    throw err
  } finally {
    isLoading.value = false
  }
}

export const loadCompanions = async () => {
  try {
    isLoading.value = true
    error.value = ''

    const { data: result, error: err } = await supabase
      .from('companions')
      .select(
        `
        *,
        companion_topics (topic),
        reviews (rating)
      `
      )
      .eq('is_available', true)
      .order('created_at', { ascending: false })

    if (err) throw err

    // Transform to include topics array
    const transformed = (result || []).map((c: any) => ({
      ...c,
      topics: Array.isArray(c.companion_topics)
        ? c.companion_topics.map((ct: any) => ct.topic)
        : []
    }))

    companions.value = transformed
    return transformed
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to load companions'
    error.value = errorMessage
    console.error('Error loading companions:', err)
    companions.value = []
    throw err
  } finally {
    isLoading.value = false
  }
}

// Chat operations
export const sendConnectionRequest = async (companionId: string) => {
  try {
    isLoading.value = true
    error.value = ''

    if (!currentUser.value) throw new Error('No user logged in')

    // Create chat
    const { data: chat, error: err } = await supabase
      .from('chats')
      .insert([
        {
          user_id: currentUser.value.id,
          companion_id: companionId,
        },
      ])
      .select()
      .single()

    if (err) throw err

    // Get companion info
    const companion = companions.value.find(c => c.id === companionId)

    const newChat: Chat = {
      id: chat.id,
      name: companion?.name || '',
      lastMessage: 'Новое соединение',
      time: 'только что',
      unread_count: 0,
      image: companion?.image || '',
      status: 'active' as const,
      companion_id: companionId,
      user_id: currentUser.value.id,
      created_at: chat.created_at,
      updated_at: chat.updated_at,
    }

    if (!chats.value.find(c => c.id === chat.id)) {
      chats.value.push(newChat)
    }

    return chat
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to send connection request'
    error.value = errorMessage
    console.error('Connection request error:', err)
    throw err
  } finally {
    isLoading.value = false
  }
}

export const loadChats = async () => {
  try {
    isLoading.value = true
    error.value = ''

    if (!currentUser.value) throw new Error('No user logged in')

    const { data: result, error: err } = await supabase
      .from('chats')
      .select(
        `
        *,
        companions (name, image, specialization)
      `
      )
      .eq('user_id', currentUser.value.id)
      .order('updated_at', { ascending: false })

    if (err) throw err

    // Transform chats with companion info
    chats.value = (result || []).map((chat: any) => ({
      id: chat.id,
      name: chat.companions?.name || '',
      lastMessage: chat.last_message || '',
      time: new Date(chat.updated_at).toLocaleString('ru-RU'),
      unread_count: chat.unread_count || 0,
      image: chat.companions?.image || '',
      status: chat.status || 'active',
      companion_id: chat.companion_id,
      user_id: chat.user_id,
      created_at: chat.created_at,
      updated_at: chat.updated_at,
    }))

    return result
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to load chats'
    error.value = errorMessage
    console.error('Load chats error:', err)
    chats.value = []
    throw err
  } finally {
    isLoading.value = false
  }
}

export const getChatById = (id: string) => {
  return chats.value.find(c => c.id === id)
}

export const getChatMessages = async (chatId: string) => {
  try {
    isLoading.value = true
    error.value = ''

    const { data: result, error: err } = await supabase
      .from('messages')
      .select('*, users (name, image)')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true })

    if (err) throw err

    messages.value = (result || []).map((msg: any) => ({
      id: msg.id,
      sender_id: msg.sender_id,
      text: msg.text,
      created_at: msg.created_at,
      author: msg.users?.name || 'Unknown',
      isMine: msg.sender_id === currentUser.value?.id,
      chat_id: msg.chat_id,
    }))

    return messages.value
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to load messages'
    error.value = errorMessage
    console.error('Load messages error:', err)
    messages.value = []
    throw err
  } finally {
    isLoading.value = false
  }
}

export const sendMessage = async (chatId: string, text: string) => {
  try {
    isLoading.value = true
    error.value = ''

    if (!currentUser.value) throw new Error('No user logged in')

    // Insert message
    const { data: messageData, error: err } = await supabase
      .from('messages')
      .insert([
        {
          chat_id: chatId,
          sender_id: currentUser.value.id,
          text,
        },
      ])
      .select('*, users (name, image)')
      .single()

    if (err) throw err

    // Update chat last_message
    const { error: updateErr } = await supabase
      .from('chats')
      .update({
        last_message: text,
        updated_at: new Date().toISOString(),
      })
      .eq('id', chatId)

    if (updateErr) throw updateErr

    const message: Message = {
      id: messageData.id,
      sender_id: messageData.sender_id,
      text: messageData.text,
      created_at: messageData.created_at,
      author: messageData.users?.name || 'Unknown',
      isMine: true,
      chat_id: messageData.chat_id,
    }

    messages.value.push(message)

    // Update chat in chats list
    const chat = getChatById(chatId)
    if (chat) {
      chat.lastMessage = text
      chat.time = new Date().toLocaleString('ru-RU')
    }

    return message
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to send message'
    error.value = errorMessage
    console.error('Send message error:', err)
    throw err
  } finally {
    isLoading.value = false
  }
}

export const deleteChat = async (chatId: string) => {
  try {
    isLoading.value = true
    error.value = ''

    const { error: err } = await supabase
      .from('chats')
      .delete()
      .eq('id', chatId)

    if (err) throw err

    const index = chats.value.findIndex(c => c.id === chatId)
    if (index > -1) {
      chats.value.splice(index, 1)
    }

    return true
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to delete chat'
    error.value = errorMessage
    console.error('Delete chat error:', err)
    throw err
  } finally {
    isLoading.value = false
  }
}

export const markChatAsRead = (chatId: string) => {
  const chat = getChatById(chatId)
  if (chat) {
    chat.unread_count = 0
  }
}

export const endSession = async (chatId: string) => {
  try {
    isLoading.value = true
    error.value = ''

    const { error: err } = await supabase
      .from('chats')
      .update({ status: 'offline' })
      .eq('id', chatId)

    if (err) throw err

    const chat = getChatById(chatId)
    if (chat) {
      chat.status = 'offline'
      chat.lastMessage = 'Сессия завершена'
    }

    return true
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to end session'
    error.value = errorMessage
    console.error('End session error:', err)
    throw err
  } finally {
    isLoading.value = false
  }
}
