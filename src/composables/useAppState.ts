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
  gender?: string
  topics?: string[]
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
  is_available?: boolean
  topics?: string[]
  user_id?: string
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

export interface ChatRequest {
  id: string
  user_id: string
  companion_id: string
  status: 'pending' | 'approved' | 'rejected'
  rejection_reason?: string
  chat_id?: string
  created_at: string
  updated_at: string
  approved_at?: string
  rejected_at?: string
  user_name?: string
  user_image?: string
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
export const chatRequests = ref<ChatRequest[]>([])
export const userChatRequests = ref<ChatRequest[]>([])
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

// Get companion ID for current user (if they are a companion)
export const getCurrentCompanionId = async (): Promise<string | null> => {
  try {
    if (!currentUser.value) return null

    // Search for companion record where user_id matches current user
    const { data, error } = await supabase
      .from('companions')
      .select('id')
      .eq('user_id', currentUser.value.id)
      .maybeSingle()

    if (error) {
      console.error('Error fetching companion ID:', error)
      return null
    }

    return data?.id ? data.id.toString() : null
  } catch (err) {
    console.error('Error in getCurrentCompanionId:', err)
    return null
  }
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
      .maybeSingle()

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
        gender: undefined,
        topics: [],
      }
      return currentUser.value
    }

    // Handle case where profile doesn't exist yet
    if (!profile) {
      console.log('User profile not found, creating default...')
      currentUser.value = {
        id: userEmail,
        name: data.user.user_metadata?.full_name || 'User',
        email: userEmail,
        bio: '',
        role: 'user',
        gender: undefined,
        topics: [],
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
      gender: profile.gender,
      topics: profile.topics || [],
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
export const updateUserProfile = async (updates: {
  bio?: string
  image?: string
  age?: number
  gender?: string
  topics?: string[]
}) => {
  try {
    isLoading.value = true
    error.value = ''

    if (!currentUser.value) throw new Error('No user logged in')

    // Build update object, filtering out undefined values
    const updateData: Record<string, any> = {}
    if (updates.bio !== undefined) updateData.bio = updates.bio
    if (updates.image !== undefined) updateData.image = updates.image
    if (updates.age !== undefined) updateData.age = updates.age
    if (updates.gender !== undefined) updateData.gender = updates.gender
    if (updates.topics !== undefined) updateData.topics = updates.topics

    console.log('Updating user profile with data:', updateData)
    console.log('User email for update:', currentUser.value.email)

    // Update by email (not by id) to match our user lookup strategy
    // Use maybeSingle() instead of single() to handle 0 or 1 results gracefully
    const { data: profile, error: updateProfileError } = await supabase
      .from('users')
      .update(updateData)
      .eq('email', currentUser.value.email)
      .select()
      .maybeSingle()

    if (updateProfileError) {
      const errorMsg = updateProfileError instanceof Error
        ? updateProfileError.message
        : (updateProfileError as any)?.message || JSON.stringify(updateProfileError)
      console.error('Supabase update error details:', {
        code: (updateProfileError as any)?.code,
        message: errorMsg,
        hint: (updateProfileError as any)?.hint,
        fullError: updateProfileError
      })
      throw new Error(errorMsg)
    }

    if (!profile) {
      // If no profile was returned, try to fetch it instead
      console.warn('Update did not return profile, fetching updated user...')
      const { data: fetchedProfile, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('email', currentUser.value.email)
        .maybeSingle()

      if (fetchError) throw new Error(fetchError.message)
      if (!fetchedProfile) throw new Error('User not found after update')

      currentUser.value = fetchedProfile
      return fetchedProfile
    }

    currentUser.value = {
      ...currentUser.value,
      ...profile,
    }

    return profile
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to update profile'
    error.value = errorMessage
    console.error('Update profile error:', errorMessage)
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

    // Load companion_topics reference table and convert topic IDs to names
    const { data: allTopicsRef } = await supabase
      .from('companion_topics')
      .select('id, name')

    const topicIdToName = new Map<number, string>()
    if (allTopicsRef) {
      allTopicsRef.forEach((topicRecord: any) => {
        topicIdToName.set(topicRecord.id, topicRecord.name)
      })
    }

    if (data) {
      const topicIds = data.topics || []
      data.topics = topicIds
        .map((id: number) => topicIdToName.get(id))
        .filter((name: string | undefined) => name !== undefined)
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

    // Load companion_topics reference table (id -> name mapping)
    const { data: allTopicsRef } = await supabase
      .from('companion_topics')
      .select('id, name')

    // Create id -> name map
    const topicIdToName = new Map<number, string>()
    if (allTopicsRef) {
      allTopicsRef.forEach((topicRecord: any) => {
        topicIdToName.set(topicRecord.id, topicRecord.name)
      })
    }

    // Process companions - convert topic IDs to names
    const companionsWithData = (result || []).map((companion: any) => {
      const topicIds = companion.topics || []
      const topicNames = topicIds
        .map((id: number) => topicIdToName.get(id))
        .filter((name: string | undefined) => name !== undefined)

      return {
        ...companion,
        topics: topicNames,
        specializations: companion.specializations || []
      }
    })

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

    // Load companion_topics reference table (id -> name mapping)
    const { data: allTopicsRef, error: topicsRefError } = await supabase
      .from('companion_topics')
      .select('id, name')

    console.log('Loaded companion_topics reference:', { allTopicsRef, topicsRefError, count: allTopicsRef?.length || 0 })

    // Create id -> name map
    const topicIdToName = new Map<number, string>()
    if (allTopicsRef && allTopicsRef.length > 0) {
      allTopicsRef.forEach((topicRecord: any) => {
        topicIdToName.set(topicRecord.id, topicRecord.name)
      })
    }

    console.log('Topic ID->Name map created:', { mapSize: topicIdToName.size })

    // Process companions - convert topic IDs to names
    const companionsWithData = (result || []).map((companion: any) => {
      // companions.topics is JSONB array of topic IDs
      const topicIds = companion.topics || []
      const topicNames = topicIds
        .map((id: number) => topicIdToName.get(id))
        .filter((name: string | undefined) => name !== undefined)

      return {
        ...companion,
        topics: topicNames,
        specializations: companion.specializations || []
      }
    })

    console.log('Companions with data loaded:', { count: companionsWithData.length, sample: companionsWithData[0] })

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

    // Check if user is logged in BEFORE creating the request
    if (!currentUser.value) {
      const notLoggedInError = new Error('NOT_LOGGED_IN')
      throw notLoggedInError
    }

    const companionIdStr = companionId.toString()

    // Create a chat request (pending approval from companion)
    const { data: chatRequest, error: createRequestError } = await supabase
      .from('companion_chat_requests')
      .insert([
        {
          user_id: currentUser.value.id,
          companion_id: parseInt(companionIdStr),
          status: 'pending',
        },
      ])
      .select()
      .single()

    if (createRequestError) {
      const errorMsg = (createRequestError as any)?.message || JSON.stringify(createRequestError)
      console.error('Supabase error details:', {
        message: errorMsg,
        code: (createRequestError as any)?.code,
        hint: (createRequestError as any)?.hint,
        details: (createRequestError as any)?.details,
      })
      throw new Error(errorMsg)
    }

    return chatRequest
  } catch (err) {
    let errorMessage = 'Failed to send connection request'

    if (err instanceof Error) {
      errorMessage = err.message
    } else if (typeof err === 'object' && err !== null) {
      errorMessage = (err as any)?.message || JSON.stringify(err)
    }

    error.value = errorMessage
    console.error('Connection request error details:', {
      errorMessage,
      fullError: err,
      stack: err instanceof Error ? err.stack : undefined
    })
    throw new Error(errorMessage)
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
            .select('name, image')
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

// Chat Requests operations
export const loadChatRequests = async (companionId: string | number, statusFilter: string = 'pending') => {
  try {
    isLoading.value = true
    error.value = ''

    let query = supabase
      .from('companion_chat_requests')
      .select('*')
      .eq('companion_id', parseInt(companionId.toString()))

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    const { data: requests, error: loadError } = await query
      .order('created_at', { ascending: false })

    if (loadError) throw loadError

    // Fetch user info for each request
    const requestsWithUserInfo = await Promise.all(
      (requests || []).map(async (request: any) => {
        try {
          const { data: userData } = await supabase
            .from('users')
            .select('name, image')
            .eq('id', request.user_id)
            .single()

          return {
            ...request,
            user_name: userData?.name || 'Unknown',
            user_image: userData?.image || '',
          }
        } catch (err) {
          console.error(`Error fetching user info for request ${request.id}:`, err)
          return {
            ...request,
            user_name: 'Unknown',
            user_image: '',
          }
        }
      })
    )

    chatRequests.value = requestsWithUserInfo
    return requestsWithUserInfo
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to load chat requests'
    error.value = errorMessage
    console.error('Load chat requests error:', errorMessage)
    chatRequests.value = []
    throw err
  } finally {
    isLoading.value = false
  }
}

export const loadUserChatRequests = async (userId: string) => {
  try {
    isLoading.value = true
    error.value = ''

    const { data: requests, error: loadError } = await supabase
      .from('companion_chat_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (loadError) throw loadError

    // Fetch companion info for each request
    const requestsWithCompanionInfo = await Promise.all(
      (requests || []).map(async (request: any) => {
        try {
          const { data: companionData } = await supabase
            .from('companions')
            .select('name, image')
            .eq('id', request.companion_id)
            .single()

          return {
            ...request,
            user_name: companionData?.name || 'Unknown',
            user_image: companionData?.image || '',
          }
        } catch (err) {
          console.error(`Error fetching companion info for request ${request.id}:`, err)
          return {
            ...request,
            user_name: 'Unknown',
            user_image: '',
          }
        }
      })
    )

    userChatRequests.value = requestsWithCompanionInfo
    return requestsWithCompanionInfo
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to load user chat requests'
    error.value = errorMessage
    console.error('Load user chat requests error:', errorMessage)
    userChatRequests.value = []
    throw err
  } finally {
    isLoading.value = false
  }
}

export const approveChatRequest = async (requestId: string) => {
  try {
    isLoading.value = true
    error.value = ''

    // Get the request details
    const request = chatRequests.value.find(r => r.id === requestId)
    if (!request) throw new Error('Request not found')

    // Create a chat for both users
    const { data: chat, error: createChatError } = await supabase
      .from('chats')
      .insert([
        {
          user_id: request.user_id,
          companion_id: request.companion_id,
        },
      ])
      .select()
      .single()

    if (createChatError) throw createChatError

    // Update the request status and link the chat
    const { data: updatedRequest, error: updateError } = await supabase
      .from('companion_chat_requests')
      .update({
        status: 'approved',
        chat_id: chat.id,
        approved_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .select()
      .single()

    if (updateError) throw updateError

    // Update local state - remove from pending list
    const index = chatRequests.value.findIndex(r => r.id === requestId)
    if (index > -1) {
      chatRequests.value.splice(index, 1)
    }

    // Reload chats so the new chat appears in the list
    await loadChats()

    return { request: updatedRequest, chat }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to approve request'
    error.value = errorMessage
    console.error('Approve request error:', err)
    throw err
  } finally {
    isLoading.value = false
  }
}

export const rejectChatRequest = async (requestId: string, reason: string = '') => {
  try {
    isLoading.value = true
    error.value = ''

    // Update the request status
    const { data: updatedRequest, error: updateError } = await supabase
      .from('companion_chat_requests')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        rejected_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .select()
      .single()

    if (updateError) throw updateError

    // Update local state - remove from pending list
    const index = chatRequests.value.findIndex(r => r.id === requestId)
    if (index > -1) {
      chatRequests.value.splice(index, 1)
    }

    return updatedRequest
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to reject request'
    error.value = errorMessage
    console.error('Reject request error:', err)
    throw err
  } finally {
    isLoading.value = false
  }
}

// ============ TOPICS ============
export const topics = ref<string[]>([])

export const loadTopics = async () => {
  try {
    console.log('Starting to load topics from companion_topics reference table...')

    // companion_topics is now a reference table with (id, name, description, created_at)
    const { data, error: loadError } = await supabase
      .from('companion_topics')
      .select('id, name')
      .order('name', { ascending: true })

    console.log('Topics data from Supabase:', { data, error: loadError })

    if (loadError) {
      console.error('Supabase error loading topics:', {
        message: loadError.message,
        code: loadError.code,
        hint: loadError.hint,
      })
      throw loadError
    }

    // Extract topic names
    const topicNames = (data || []).map(item => item.name).filter(name => name)
    topics.value = topicNames

    console.log('Loaded topics:', topicNames)
    console.log('Topics ref value:', topics.value)
    return topicNames
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to load topics'
    console.error('Error loading topics:', errorMessage)
    topics.value = []
    return []
  }
}
