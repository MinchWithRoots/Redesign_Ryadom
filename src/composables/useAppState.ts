import { ref, reactive } from 'vue'
import { authAPI, companionsAPI, chatsAPI, usersAPI, setAuthToken, getAuthToken, clearAuthToken } from '../services/api'


// Types
export interface User {
  id: number
  name: string
  email: string
  age: number
  bio: string
  image: string
}

export interface CompanionTopic {
  id?: number
  companion_id?: number
  topic: string
}

export interface Companion {
  id: number
  name: string
  age: number
  gender?: 'female' | 'male'
  specialization: string
  experience: string
  companion_topics?: CompanionTopic[] | { topic: string }[]
  topics?: string[] // Computed field from companion_topics
  image: string
  rating: number
  reviews: number
  bio: string
  created_at?: string
  updated_at?: string
}

export interface Chat {
  id: number
  name: string
  lastMessage: string
  time: string
  unread_count: number
  image: string
  status: 'active' | 'offline'
  companion_id: number
}

export interface Message {
  id: number
  sender_id: number
  text: string
  created_at: string
  author: string
  isMine: boolean
}

// Global state
export const currentUser = ref<User | null>(null)
export const companions = ref<Companion[]>([])
export const chats = ref<Chat[]>([])
export const messages = ref<Message[]>([])
export const currentChatId = ref<number | null>(null)
export const isLoading = ref(false)
export const error = ref('')

// Check if user is logged in
export const isLoggedIn = () => {
  return !!getAuthToken()
}

// User operations
export const loginUser = async (email: string, password: string) => {
  try {
    isLoading.value = true
    error.value = ''
    const response = await authAPI.login(email, password)
    setAuthToken(response.token)
    currentUser.value = response.user
    return true
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to login'
    error.value = errorMessage
    console.error('Login error:', err)
    return false
  } finally {
    isLoading.value = false
  }
}

export const registerUser = async (data: { fullName: string; email: string; password: string }) => {
  try {
    isLoading.value = true
    error.value = ''
    const response = await authAPI.register(data.fullName, data.email, data.password)
    setAuthToken(response.token)
    currentUser.value = response.user
    return response.user
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to register'
    error.value = errorMessage
    console.error('Registration error:', err)
    return null
  } finally {
    isLoading.value = false
  }
}

export const updateUserProfile = async (updates: { bio: string; image?: string }) => {
  try {
    isLoading.value = true
    error.value = ''
    const response = await usersAPI.updateProfile(updates.bio, updates.image)
    currentUser.value = response.user
    return response.user
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to update profile'
    error.value = errorMessage
    console.error('Update profile error:', err)
    throw err
  } finally {
    isLoading.value = false
  }
}

export const logoutUser = () => {
  clearAuthToken()
  currentUser.value = null
  chats.value = []
  messages.value = []
}

// Companion operations
export const getCompanionById = (id: number) => {
  return companions.value.find(c => c.id === id)
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
    const result = await companionsAPI.getAll(filters)
    // Transform API response to include topics array
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
    throw err
  } finally {
    isLoading.value = false
  }
}

export const loadCompanions = async () => {
  try {
    isLoading.value = true
    error.value = ''
    const result = await companionsAPI.getAll({})
    // Transform API response to include topics array
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

export const sendConnectionRequest = async (companionId: number) => {
  try {
    isLoading.value = true
    error.value = ''
    const response = await chatsAPI.create(companionId)

    // Add to chats list if new
    if (!chats.value.find(c => c.id === response.chat.id)) {
      const companion = companions.value.find(c => c.id === companionId)
      chats.value.push({
        id: response.chat.id,
        name: companion?.name || '',
        lastMessage: 'Новое соединение',
        time: 'только что',
        unread_count: 0,
        image: companion?.image || '',
        status: 'active' as const,
        companion_id: companionId,
      })
    }

    return response.chat
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to send connection request'
    error.value = errorMessage
    console.error('Connection request error:', err)
    throw err
  } finally {
    isLoading.value = false
  }
}

// Chat operations
export const loadChats = async () => {
  try {
    isLoading.value = true
    error.value = ''
    const result = await chatsAPI.getAll()
    chats.value = result || []
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

export const getChatById = (id: number) => {
  return chats.value.find(c => c.id === id)
}

export const getChatMessages = async (chatId: number) => {
  try {
    isLoading.value = true
    error.value = ''
    const result = await chatsAPI.getMessages(chatId)
    messages.value = result || []
    return result
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

export const sendMessage = async (chatId: number, text: string) => {
  try {
    isLoading.value = true
    error.value = ''
    const response = await chatsAPI.sendMessage(chatId, text)
    messages.value.push(response.message)

    // Update chat last message
    const chat = getChatById(chatId)
    if (chat) {
      chat.lastMessage = text
      chat.time = 'только что'
    }

    return response.message
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to send message'
    error.value = errorMessage
    console.error('Send message error:', err)
    throw err
  } finally {
    isLoading.value = false
  }
}

export const deleteChat = async (chatId: number) => {
  try {
    isLoading.value = true
    error.value = ''
    await chatsAPI.delete(chatId)
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

export const markChatAsRead = (chatId: number) => {
  const chat = getChatById(chatId)
  if (chat) {
    chat.unread_count = 0
  }
}

export const endSession = async (chatId: number) => {
  try {
    isLoading.value = true
    error.value = ''
    await chatsAPI.endSession(chatId)
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

// Load current user on app start
export const loadCurrentUser = async () => {
  if (!isLoggedIn()) return null

  try {
    isLoading.value = true
    error.value = ''
    const response = await authAPI.getCurrentUser()
    currentUser.value = response.user
    return response.user
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to load current user'
    error.value = errorMessage
    console.error('Load current user error:', err)
    return null
  } finally {
    isLoading.value = false
  }
}
