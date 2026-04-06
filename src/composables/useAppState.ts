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

export interface Companion {
  id: number
  name: string
  age: number
  specialization: string
  experience: string
  topics: string[]
  image: string
  rating: number
  reviews: number
  bio: string
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
    error.value = err instanceof Error ? err.message : 'Ошибка при входе'
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
    error.value = err instanceof Error ? err.message : 'Ошибка при регистрации'
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
    error.value = err instanceof Error ? err.message : 'Ошибка при обновлении профиля'
    return null
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
  ageMin?: number
  ageMax?: number
  experience?: string
  topic?: string
}) => {
  try {
    isLoading.value = true
    error.value = ''
    const result = await companionsAPI.getAll(filters)
    companions.value = result
    return result
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Ошибка при фильтрации'
    return []
  } finally {
    isLoading.value = false
  }
}

export const loadCompanions = async () => {
  try {
    isLoading.value = true
    const result = await companionsAPI.getAll({})
    companions.value = result
    return result
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Ошибка при загрузке собеседников'
    return []
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
    error.value = err instanceof Error ? err.message : 'Ошибка при отправке запроса'
    return null
  } finally {
    isLoading.value = false
  }
}

// Chat operations
export const loadChats = async () => {
  try {
    isLoading.value = true
    const result = await chatsAPI.getAll()
    chats.value = result
    return result
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Ошибка при загрузке чатов'
    return []
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
    const result = await chatsAPI.getMessages(chatId)
    messages.value = result
    return result
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Ошибка при загрузке сообщений'
    return []
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
    error.value = err instanceof Error ? err.message : 'Ошибка при отправке сообщения'
    return null
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
    error.value = err instanceof Error ? err.message : 'Ошибка при удалении чата'
    return false
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
    error.value = err instanceof Error ? err.message : 'Ошибка при завершении сессии'
    return false
  } finally {
    isLoading.value = false
  }
}

// Load current user on app start
export const loadCurrentUser = async () => {
  if (!isLoggedIn()) return null
  
  try {
    const response = await authAPI.getCurrentUser()
    currentUser.value = response.user
    return response.user
  } catch (err) {
    logoutUser()
    return null
  }
}
