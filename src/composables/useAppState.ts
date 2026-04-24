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
  role?: string // 'user' or 'admin'
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
  experience?: 'beginner' | 'experienced' | 'expert'
  reviews_count?: number
  image: string
  bio: string
  specialization?: string // Legacy: comma-separated string
  specializations?: Specialization[] // New: array of Specialization objects
  is_available?: boolean
  topics?: string[]
  created_at?: string
  updated_at?: string
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

// Check if user is admin
export const isAdmin = () => {
  return currentUser.value?.role === 'admin'
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

    // Get user email from auth
    const userEmail = data.user.email
    if (!userEmail) {
      currentUser.value = null
      return null
    }

    // Fetch user profile by email (not by UUID id)
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('email', userEmail)
      .single()

    if (profileError) {
      console.error('Error loading user profile:', {
        message: profileError.message,
        code: profileError.code,
        hint: profileError.hint,
      })
      // User is authenticated but profile doesn't exist yet (new user)
      // This is normal for newly created users
      currentUser.value = {
        id: userEmail, // Use email as fallback
        name: data.user.user_metadata?.full_name || 'User',
        email: userEmail,
        bio: '',
        role: 'user',
      }
      return currentUser.value
    }

    currentUser.value = {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      age: profile.age,
      bio: profile.bio || '',
      image: profile.image,
      role: profile.role || 'user',
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

    // Update by email (not by id) to match our user lookup strategy
    const { data: profile, error: updateProfileError } = await supabase
      .from('users')
      .update(updates)
      .eq('email', currentUser.value.email)
      .select()
      .single()

    if (updateProfileError) throw updateProfileError

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
    const companionId = parseInt(id)

    const { data, error: companionFetchError } = await supabase
      .from('companions')
      .select('*')
      .eq('id', companionId)
      .single()

    if (companionFetchError) {
      console.error('Supabase error fetching companion:', {
        message: companionFetchError.message,
        code: companionFetchError.code,
        hint: companionFetchError.hint,
        companionId,
      })
      throw companionFetchError
    }

    // Fetch companion topics separately
    const { data: topicsData } = await supabase
      .from('companion_topics')
      .select('topic')
      .eq('companion_id', companionId)

    if (data) {
      data.topics = topicsData ? topicsData.map((item: any) => item.topic) : []
    }

    return data
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    console.error('Error fetching companion:', errorMessage)
    return null
  }
}

export const filterCompanions = async (filters: {
  gender?: string
  ageMin?: number
  ageMax?: number
  experience?: string
}) => {
  try {
    isLoading.value = true
    error.value = ''

    let query = supabase
      .from('companions')
      .select('*')

    if (filters.gender && filters.gender !== 'all') {
      query = query.eq('gender', filters.gender)
    }
    if (filters.ageMin) {
      query = query.gte('age', filters.ageMin)
    }
    if (filters.ageMax) {
      query = query.lte('age', filters.ageMax)
    }
    if (filters.experience && filters.experience !== 'all') {
      query = query.eq('experience', filters.experience)
    }

    const { data: result, error: filterError } = await query

    if (filterError) throw filterError

    // Load ALL topics once for efficiency
    const { data: allTopics } = await supabase
      .from('companion_topics')
      .select('*')
      .limit(1000)

    // Create a map of topics by companion_id (normalize keys to strings)
    const topicsByCompanionId = new Map<string, string[]>()
    if (allTopics) {
      allTopics.forEach((topicRecord: any) => {
        const cid = String(topicRecord.companion_id)
        if (!topicsByCompanionId.has(cid)) {
          topicsByCompanionId.set(cid, [])
        }
        topicsByCompanionId.get(cid)?.push(topicRecord.topic)
      })
    }

    // Fetch companion topics and specializations separately
    const companionsWithData = await Promise.all(
      (result || []).map(async (companion: any) => {
        try {
          // Match by string ID
          const companionIdStr = String(companion.id)
          const topicsData = topicsByCompanionId.get(companionIdStr) || []

          // Try both raw ID and parsed ID for specializations
          let specData = null
          const specResult1 = await supabase
            .from('companion_specializations')
            .select('specializations(id, name)')
            .eq('companion_id', companion.id)

          specData = specResult1.data

          // If no results, try with parsed ID
          if (!specData || specData.length === 0) {
            const companionId = parseInt(companion.id.toString())
            const specResult2 = await supabase
              .from('companion_specializations')
              .select('specializations(id, name)')
              .eq('companion_id', companionId)
            specData = specResult2.data
          }

          return {
            ...companion,
            topics: topicsData,
            specializations: specData ? specData.map((s: any) => s.specializations) : []
          }
        } catch (err) {
          console.error(`Error fetching data for companion ${companion.id}:`, err)
          return {
            ...companion,
            topics: [],
            specializations: []
          }
        }
      })
    )

    companions.value = companionsWithData
    return companionsWithData
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

    const { data: result, error: loadCompanionsError } = await supabase
      .from('companions')
      .select('*')
      .order('created_at', { ascending: false })

    if (loadCompanionsError) {
      console.error('Supabase error loading companions:', {
        message: loadCompanionsError.message,
        code: loadCompanionsError.code,
        hint: loadCompanionsError.hint,
      })
      throw loadCompanionsError
    }

    // First, load ALL companion topics for mapping
    const { data: allTopics, error: topicsError } = await supabase
      .from('companion_topics')
      .select('*')
      .limit(1000)

    console.log('Loaded companion_topics:', { allTopics, topicsError, count: allTopics?.length || 0 })

    // Create a map of topics by companion_id for faster lookup (normalize keys to strings)
    const topicsByCompanionId = new Map<string, string[]>()
    if (allTopics && allTopics.length > 0) {
      allTopics.forEach((topicRecord: any) => {
        const cid = String(topicRecord.companion_id)
        if (!topicsByCompanionId.has(cid)) {
          topicsByCompanionId.set(cid, [])
        }
        topicsByCompanionId.get(cid)?.push(topicRecord.topic)
      })
    }

    console.log('Topics map created:', { mapSize: topicsByCompanionId.size, topicsMap: Array.from(topicsByCompanionId.entries()) })

    // Fetch companion topics and specializations separately
    const companionsWithData = await Promise.all(
      (result || []).map(async (companion: any) => {
        try {
          // Match by string ID
          const companionIdStr = String(companion.id)
          const topicsData = topicsByCompanionId.get(companionIdStr) || []

          // Try both raw ID and parsed ID for specializations
          let specData = null
          const specResult1 = await supabase
            .from('companion_specializations')
            .select('specializations(id, name)')
            .eq('companion_id', companion.id)

          specData = specResult1.data

          // If no results, try with parsed ID
          if (!specData || specData.length === 0) {
            const companionId = parseInt(companion.id.toString())
            const specResult2 = await supabase
              .from('companion_specializations')
              .select('specializations(id, name)')
              .eq('companion_id', companionId)
            specData = specResult2.data
          }

          return {
            ...companion,
            topics: topicsData,
            specializations: specData ? specData.map((s: any) => s.specializations) : []
          }
        } catch (err) {
          console.error(`Error fetching data for companion ${companion.id}:`, err)
          return {
            ...companion,
            topics: [],
            specializations: []
          }
        }
      })
    )

    companions.value = companionsWithData
    return companionsWithData
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to load companions'
    error.value = errorMessage
    console.error('Error loading companions:', errorMessage)
    companions.value = []
    throw err
  } finally {
    isLoading.value = false
  }
}

// Chat operations
export const sendConnectionRequest = async (companionId: string | number) => {
  try {
    isLoading.value = true
    error.value = ''

    if (!currentUser.value) throw new Error('No user logged in')

    const companionIdStr = companionId.toString()

    // Create chat
    const { data: chat, error: createChatError } = await supabase
      .from('chats')
      .insert([
        {
          user_id: currentUser.value.id,
          companion_id: parseInt(companionIdStr),
        },
      ])
      .select()
      .single()

    if (createChatError) throw createChatError

    // Get companion info
    const selectedCompanion = companions.value.find(companionItem => companionItem.id === companionIdStr)

    const newChat: Chat = {
      id: chat.id,
      name: selectedCompanion?.name || '',
      lastMessage: 'Новое соединение',
      time: 'только что',
      unread_count: 0,
      image: selectedCompanion?.image || '',
      status: 'active' as const,
      companion_id: companionIdStr,
      user_id: currentUser.value.id,
      created_at: chat.created_at,
      updated_at: chat.updated_at,
    }

    if (!chats.value.find(chatItem => chatItem.id === chat.id)) {
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

    const { data: result, error: loadChatsError } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', currentUser.value.id)
      .order('updated_at', { ascending: false })

    if (loadChatsError) {
      console.error('Supabase error loading chats:', {
        message: loadChatsError.message,
        code: loadChatsError.code,
        hint: loadChatsError.hint,
      })
      throw loadChatsError
    }

    // Fetch companion info for each chat separately
    const chatsWithCompanions = await Promise.all(
      (result || []).map(async (chat: any) => {
        try {
          const { data: companionData } = await supabase
            .from('companions')
            .select('name, image, specialization')
            .eq('id', chat.companion_id)
            .single()

          return {
            id: chat.id,
            name: companionData?.name || '',
            lastMessage: chat.last_message || '',
            time: new Date(chat.updated_at).toLocaleString('ru-RU'),
            unread_count: chat.unread_count || 0,
            image: companionData?.image || '',
            status: chat.status || 'active',
            companion_id: chat.companion_id,
            user_id: chat.user_id,
            created_at: chat.created_at,
            updated_at: chat.updated_at,
          }
        } catch (err) {
          console.error(`Error fetching companion info for chat ${chat.id}:`, err)
          return {
            id: chat.id,
            name: '',
            lastMessage: chat.last_message || '',
            time: new Date(chat.updated_at).toLocaleString('ru-RU'),
            unread_count: chat.unread_count || 0,
            image: '',
            status: chat.status || 'active',
            companion_id: chat.companion_id,
            user_id: chat.user_id,
            created_at: chat.created_at,
            updated_at: chat.updated_at,
          }
        }
      })
    )

    chats.value = chatsWithCompanions

    return result
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to load chats'
    error.value = errorMessage
    console.error('Load chats error:', errorMessage)
    chats.value = []
    throw err
  } finally {
    isLoading.value = false
  }
}

export const getChatById = (id: string) => {
  return chats.value.find(chatItem => chatItem.id === id)
}

export const getChatMessages = async (chatId: string) => {
  try {
    isLoading.value = true
    error.value = ''

    const { data: result, error: loadMessagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true })

    if (loadMessagesError) {
      console.error('Supabase error loading messages:', {
        message: loadMessagesError.message,
        code: loadMessagesError.code,
        hint: loadMessagesError.hint,
        chatId,
      })
      throw loadMessagesError
    }

    // Fetch sender info for each message separately
    const messagesWithSenders = await Promise.all(
      (result || []).map(async (messageItem: any) => {
        try {
          const { data: senderData } = await supabase
            .from('users')
            .select('name, image')
            .eq('id', messageItem.sender_id)
            .single()

          return {
            id: messageItem.id,
            sender_id: messageItem.sender_id,
            text: messageItem.text,
            created_at: messageItem.created_at,
            author: senderData?.name || 'Unknown',
            isMine: messageItem.sender_id === currentUser.value?.id,
            chat_id: messageItem.chat_id,
          }
        } catch (err) {
          console.error(`Error fetching sender info for message ${messageItem.id}:`, err)
          return {
            id: messageItem.id,
            sender_id: messageItem.sender_id,
            text: messageItem.text,
            created_at: messageItem.created_at,
            author: 'Unknown',
            isMine: messageItem.sender_id === currentUser.value?.id,
            chat_id: messageItem.chat_id,
          }
        }
      })
    )

    messages.value = messagesWithSenders

    return messages.value
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to load messages'
    error.value = errorMessage
    console.error('Load messages error:', errorMessage)
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
    const { data: messageData, error: sendMessageError } = await supabase
      .from('messages')
      .insert([
        {
          chat_id: chatId,
          sender_id: currentUser.value.id,
          text,
        },
      ])
      .select()
      .single()

    if (sendMessageError) {
      console.error('Supabase error sending message:', {
        message: sendMessageError.message,
        code: sendMessageError.code,
        hint: sendMessageError.hint,
        chatId,
      })
      throw sendMessageError
    }

    // Update chat last_message
    const { error: updateErr } = await supabase
      .from('chats')
      .update({
        last_message: text,
        updated_at: new Date().toISOString(),
      })
      .eq('id', chatId)

    if (updateErr) {
      console.error('Error updating chat last message:', {
        message: updateErr.message,
        code: updateErr.code,
      })
      // Don't throw - message was saved, just chat update failed
    }

    const message: Message = {
      id: messageData.id,
      sender_id: messageData.sender_id,
      text: messageData.text,
      created_at: messageData.created_at,
      author: currentUser.value.name || 'Unknown',
      isMine: true,
      chat_id: messageData.chat_id,
    }

    messages.value.push(message)

    // Update chat in chats list
    const currentChat = getChatById(chatId)
    if (currentChat) {
      currentChat.lastMessage = text
      currentChat.time = new Date().toLocaleString('ru-RU')
    }

    return message
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to send message'
    error.value = errorMessage
    console.error('Send message error:', errorMessage)
    throw err
  } finally {
    isLoading.value = false
  }
}

export const deleteChat = async (chatId: string) => {
  try {
    isLoading.value = true
    error.value = ''

    const { error: deleteChatError } = await supabase
      .from('chats')
      .delete()
      .eq('id', chatId)

    if (deleteChatError) throw deleteChatError

    const chatIndex = chats.value.findIndex(chatItem => chatItem.id === chatId)
    if (chatIndex > -1) {
      chats.value.splice(chatIndex, 1)
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

    const { error: endSessionError } = await supabase
      .from('chats')
      .update({ status: 'offline' })
      .eq('id', chatId)

    if (endSessionError) throw endSessionError

    const currentChat = getChatById(chatId)
    if (currentChat) {
      currentChat.status = 'offline'
      currentChat.lastMessage = 'Сессия завершена'
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

// ============ TOPICS ============
export const topics = ref<string[]>([])

export const loadTopics = async () => {
  try {
    // Use raw SQL query to get distinct topics with better performance
    console.log('Starting to load topics from companion_topics table...')

    const { data, error: loadError } = await supabase
      .from('companion_topics')
      .select('*')

    console.log('Raw topics data from Supabase:', { data, error: loadError })

    if (loadError) {
      console.error('Supabase error loading topics:', {
        message: loadError.message,
        code: loadError.code,
        hint: loadError.hint,
      })
      throw loadError
    }

    // Get unique topics from the result
    const uniqueTopicsSet = new Set<string>()
    data?.forEach(item => {
      if (item.topic) {
        uniqueTopicsSet.add(item.topic)
      }
    })

    const uniqueTopics = Array.from(uniqueTopicsSet).sort()
    topics.value = uniqueTopics

    console.log('Processed unique topics:', uniqueTopics)
    console.log('Topics ref value:', topics.value)
    return uniqueTopics
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to load topics'
    console.error('Error loading topics:', errorMessage)
    topics.value = []
    return []
  }
}

// ============ SPECIALIZATIONS ============
export interface Specialization {
  id: number
  name: string
  created_at?: string
}

export const specializations = ref<Specialization[]>([])

export const loadSpecializations = async () => {
  try {
    const { data, error: loadError } = await supabase
      .from('specializations')
      .select('*')
      .order('name', { ascending: true })

    if (loadError) throw loadError

    specializations.value = data || []
    return specializations.value
  } catch (err) {
    console.error('Error loading specializations:', err)
    return []
  }
}

export const getCompanionSpecializations = async (companionId: number) => {
  try {
    const { data, error: loadError } = await supabase
      .from('companion_specializations')
      .select('specialization_id, specializations(id, name)')
      .eq('companion_id', companionId)

    if (loadError) throw loadError

    return data?.map(item => ({
      id: (item.specializations as any).id,
      name: (item.specializations as any).name
    })) || []
  } catch (err) {
    console.error('Error loading companion specializations:', err)
    return []
  }
}

export const updateCompanionSpecializations = async (companionId: number, specializationIds: number[]) => {
  try {
    // Delete existing
    const { error: deleteError } = await supabase
      .from('companion_specializations')
      .delete()
      .eq('companion_id', companionId)

    if (deleteError) throw deleteError

    // Insert new
    if (specializationIds.length > 0) {
      const { error: insertError } = await supabase
        .from('companion_specializations')
        .insert(
          specializationIds.map(specId => ({
            companion_id: companionId,
            specialization_id: specId
          }))
        )

      if (insertError) throw insertError
    }

    return true
  } catch (err) {
    console.error('Error updating companion specializations:', err)
    throw err
  }
}
