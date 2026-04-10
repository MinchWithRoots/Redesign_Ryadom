import { ref, reactive } from 'vue'
import { authAPI, companionsAPI, chatsAPI, usersAPI, setAuthToken, getAuthToken, clearAuthToken } from '../services/api'

// Mock data for development (when backend is not running)
const MOCK_COMPANIONS: Companion[] = [
  {
    id: 1,
    name: 'Анна М.',
    age: 28,
    gender: 'female',
    specialization: 'В процессе личной терапии',
    experience: 'experienced',
    topics: ['Отношения', 'Тревожность'],
    image: 'https://images.pexels.com/photos/27603433/pexels-photo-27603433.jpeg',
    rating: 4.9,
    reviews: 42,
    bio: 'Прохожу терапию и хочу помочь другим. Люблю слушать и поддерживать.',
  },
  {
    id: 2,
    name: 'Виктор П.',
    age: 35,
    gender: 'male',
    specialization: 'На пути выздоровления',
    experience: 'experienced',
    topics: ['Карьера', 'Депрессия'],
    image: 'https://images.pexels.com/photos/11156392/pexels-photo-11156392.jpeg',
    rating: 4.8,
    reviews: 58,
    bio: 'Прошёл долгий путь в терапии, готов делиться опытом и помогать.',
  },
  {
    id: 3,
    name: 'Елена К.',
    age: 32,
    gender: 'female',
    specialization: 'Путь выздоровления',
    experience: 'experienced',
    topics: ['Отношения', 'Горе', 'Развитие'],
    image: 'https://images.pexels.com/photos/16574941/pexels-photo-16574941.jpeg',
    rating: 5.0,
    reviews: 76,
    bio: 'Верю в силу поддержки и понимания. Готова выслушать вас.',
  },
  {
    id: 4,
    name: 'Мария С.',
    age: 26,
    gender: 'female',
    specialization: 'В процессе терапии',
    experience: 'beginner',
    topics: ['Тревожность', 'Карьера'],
    image: 'https://images.pexels.com/photos/27603433/pexels-photo-27603433.jpeg',
    rating: 4.7,
    reviews: 23,
    bio: 'Начинаю свой путь и хочу помогать другим на их пути.',
  },
  {
    id: 5,
    name: 'Дмитрий О.',
    age: 38,
    gender: 'male',
    specialization: 'Опытный в терапии',
    experience: 'experienced',
    topics: ['Горе', 'Депрессия', 'Развитие'],
    image: 'https://images.pexels.com/photos/11156392/pexels-photo-11156392.jpeg',
    rating: 4.9,
    reviews: 92,
    bio: 'Длительный опыт в терапии помог мне вырасти. Готов помочь вам.',
  },
  {
    id: 6,
    name: 'Софья Л.',
    age: 29,
    gender: 'female',
    specialization: 'На пути выздоровления',
    experience: 'beginner',
    topics: ['Отношения', 'Развитие', 'Тревожность'],
    image: 'https://images.pexels.com/photos/16574941/pexels-photo-16574941.jpeg',
    rating: 4.8,
    reviews: 61,
    bio: 'Прошла через много. Верю, что общение помогает, и готова помочь.',
  },
]

const MOCK_CHATS = [
  {
    id: 1,
    name: 'Анна М.',
    lastMessage: 'Спасибо за поддержку, это много значит',
    time: '2 часа назад',
    unread_count: 0,
    image: 'https://images.pexels.com/photos/27603433/pexels-photo-27603433.jpeg',
    status: 'active' as const,
    companion_id: 1,
  },
  {
    id: 2,
    name: 'Виктор П.',
    lastMessage: 'Давайте поговорим об этом позже',
    time: '5 часов назад',
    unread_count: 2,
    image: 'https://images.pexels.com/photos/11156392/pexels-photo-11156392.jpeg',
    status: 'offline' as const,
    companion_id: 2,
  },
]

const MOCK_MESSAGES = [
  {
    id: 1,
    sender_id: 1,
    text: 'Привет! Как дела?',
    created_at: '2024-01-15T10:30:00',
    author: 'Анна',
    isMine: false,
  },
  {
    id: 2,
    sender_id: 0,
    text: 'Привет! Спасибо, что спросила. Сегодня было сложно, но я справляюсь.',
    created_at: '2024-01-15T10:32:00',
    author: 'Я',
    isMine: true,
  },
  {
    id: 3,
    sender_id: 1,
    text: 'Что-то в частности беспокоит?',
    created_at: '2024-01-15T10:33:00',
    author: 'Анна',
    isMine: false,
  },
  {
    id: 4,
    sender_id: 0,
    text: 'Да, работа была стрессной, но я пытаюсь не зацикливаться.',
    created_at: '2024-01-15T10:35:00',
    author: 'Я',
    isMine: true,
  },
]

const MOCK_CURRENT_USER: User = {
  id: 0,
  name: 'Ты',
  email: 'user@example.com',
  age: 27,
  bio: 'Я на пути личного развития и ищу понимание',
  image: 'https://images.pexels.com/photos/14904695/pexels-photo-14904695.jpeg',
}

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
  gender: 'female' | 'male'
  specialization: string
  experience: 'beginner' | 'experienced'
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
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    console.warn('API login failed, using mock login for development:', errorMessage)

    // Mock login - accept any email/password for development
    if (email && password) {
      const mockToken = 'mock-token-' + Math.random().toString(36).substr(2, 9)
      setAuthToken(mockToken)
      currentUser.value = {
        ...MOCK_CURRENT_USER,
        email: email,
        name: email.split('@')[0],
      }
      // Show warning about mock mode
      console.warn('⚠️ ВНИМАНИЕ: Используется режим разработки (mock auth). Данные не сохраняются в БД. Для настройки реального backend смотри DATABASE_SETUP.md')
      error.value = 'Режим разработки: данные не сохраняются. ' + errorMessage
      return true
    }
    error.value = 'Пожалуйста, заполните все поля'
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
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    console.warn('API register failed, using mock registration for development:', errorMessage)

    // Mock registration for development
    const mockToken = 'mock-token-' + Math.random().toString(36).substr(2, 9)
    setAuthToken(mockToken)
    const newUser = {
      ...MOCK_CURRENT_USER,
      name: data.fullName,
      email: data.email,
    }
    currentUser.value = newUser
    // Show warning about mock mode
    console.warn('⚠️ ВНИМАНИЕ: Используется режим разработки (mock registration). Данные не сохраняются в БД. Для настройки реального backend смотри DATABASE_SETUP.md')
    error.value = 'Режим разработки: данные не сохраняются. ' + errorMessage
    return newUser
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
    console.warn('API call failed, updating profile locally:', err)
    // Mock update - just update locally
    if (currentUser.value) {
      currentUser.value.bio = updates.bio
      if (updates.image) {
        currentUser.value.image = updates.image
      }
      return currentUser.value
    }
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
    companions.value = result
    return result
  } catch (err) {
    console.warn('API call failed, filtering mock data:', err)
    // Filter mock data when backend is not available
    let filtered = [...MOCK_COMPANIONS]

    if (filters.gender && filters.gender !== 'all') {
      filtered = filtered.filter(c => c.gender === filters.gender)
    }
    if (filters.ageMin) {
      filtered = filtered.filter(c => c.age >= filters.ageMin!)
    }
    if (filters.ageMax) {
      filtered = filtered.filter(c => c.age <= filters.ageMax!)
    }
    if (filters.experience && filters.experience !== 'all') {
      filtered = filtered.filter(c => c.experience === filters.experience)
    }
    if (filters.topic) {
      filtered = filtered.filter(c => c.topics.includes(filters.topic!))
    }

    companions.value = filtered
    return filtered
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
    console.warn('API call failed, using mock data:', err)
    // Use mock data as fallback when backend is not available
    companions.value = MOCK_COMPANIONS
    return MOCK_COMPANIONS
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
    console.warn('API call failed, creating mock chat:', err)
    // Mock connection request
    const companion = companions.value.find(c => c.id === companionId)
    const newChatId = Math.max(...chats.value.map(c => c.id), 0) + 1

    const newChat = {
      id: newChatId,
      name: companion?.name || 'Собеседник',
      lastMessage: 'Новое соединение',
      time: 'только что',
      unread_count: 0,
      image: companion?.image || '',
      status: 'active' as const,
      companion_id: companionId,
    }

    chats.value.push(newChat)
    return newChat
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
    console.warn('API call failed, using mock chats:', err)
    // Use mock chats as fallback
    chats.value = MOCK_CHATS
    return MOCK_CHATS
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
    console.warn('API call failed, using mock messages:', err)
    // Use mock messages as fallback
    messages.value = MOCK_MESSAGES
    return MOCK_MESSAGES
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
    console.warn('API call failed, adding message locally:', err)
    // Mock send - add message locally
    const newMessage: Message = {
      id: messages.value.length + 1,
      sender_id: 0,
      text: text,
      created_at: new Date().toISOString(),
      author: 'Я',
      isMine: true,
    }
    messages.value.push(newMessage)

    // Update chat last message
    const chat = getChatById(chatId)
    if (chat) {
      chat.lastMessage = text
      chat.time = 'только что'
    }

    return newMessage
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
    console.warn('API call failed, deleting chat locally:', err)
    // Mock delete - remove locally
    const index = chats.value.findIndex(c => c.id === chatId)
    if (index > -1) {
      chats.value.splice(index, 1)
    }
    return true
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
    console.warn('API call failed, ending session locally:', err)
    // Mock end session - update locally
    const chat = getChatById(chatId)
    if (chat) {
      chat.status = 'offline'
      chat.lastMessage = 'Сессия завершена'
    }
    return true
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
    console.warn('API call failed, using mock user:', err)
    // Use mock user if API fails
    currentUser.value = MOCK_CURRENT_USER
    return MOCK_CURRENT_USER
  }
}
