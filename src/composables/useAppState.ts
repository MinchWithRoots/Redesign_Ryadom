import { ref, reactive } from 'vue'

// Types
export interface User {
  id: number
  name: string
  email: string
  password: string
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
  unread: number
  image: string
  status: 'active' | 'offline'
  companionId: number
}

export interface Message {
  id: number
  chatId: number
  author: string
  text: string
  time: string
  isMine: boolean
}

// Global state
export const currentUser = ref<User | null>({
  id: 1,
  name: 'Александр К.',
  email: 'alexander@example.com',
  password: 'password123',
  age: 29,
  bio: 'Ищу поддержку и помощь в развитии',
  image: 'https://images.pexels.com/photos/31422830/pexels-photo-31422830.png',
})

export const companions = ref<Companion[]>([
  {
    id: 1,
    name: 'Мария К.',
    age: 28,
    specialization: 'Психолог',
    experience: 'Опытный специалист',
    topics: ['Отношения', 'Тревожность', 'Стресс'],
    image: 'https://images.pexels.com/photos/27603433/pexels-photo-27603433.jpeg',
    rating: 4.9,
    reviews: 127,
    bio: 'Специализируюсь на работе с молодежью и вопросами личных отношений',
  },
  {
    id: 2,
    name: 'Алексей М.',
    age: 32,
    specialization: 'Counselor',
    experience: 'Опытный специалист',
    topics: ['Карьера', 'Развитие', 'Мотивация'],
    image: 'https://images.pexels.com/photos/31422830/pexels-photo-31422830.png',
    rating: 4.8,
    reviews: 95,
    bio: 'Помогу разобраться в карьерных целях и найти свой путь',
  },
  {
    id: 3,
    name: 'Елена В.',
    age: 35,
    specialization: 'Терапевт',
    experience: 'Опытный специалист',
    topics: ['Горе', 'Потеря', 'Восстановление'],
    image: 'https://images.pexels.com/photos/20860595/pexels-photo-20860595.jpeg',
    rating: 5.0,
    reviews: 156,
    bio: 'Специалист по работе с жизненными кризисами и горем',
  },
  {
    id: 4,
    name: 'Игорь С.',
    age: 26,
    specialization: 'Слушатель',
    experience: 'Начинающий',
    topics: ['Личные проблемы', 'Поддержка', 'Общение'],
    image: 'https://images.pexels.com/photos/966067/pexels-photo-966067.jpeg',
    rating: 4.7,
    reviews: 43,
    bio: 'Готов выслушать и поддержать в любой жизненной ситуации',
  },
])

export const chats = ref<Chat[]>([
  {
    id: 1,
    name: 'Мария К.',
    lastMessage: 'Спасибо за помощь!',
    time: '2 часа назад',
    unread: 2,
    image: 'https://images.pexels.com/photos/27603433/pexels-photo-27603433.jpeg',
    status: 'active',
    companionId: 1,
  },
  {
    id: 2,
    name: 'Алексей М.',
    lastMessage: 'Давайте попробуем завтра',
    time: '5 часов назад',
    unread: 0,
    image: 'https://images.pexels.com/photos/31422830/pexels-photo-31422830.png',
    status: 'active',
    companionId: 2,
  },
  {
    id: 3,
    name: 'Елена В.',
    lastMessage: 'Сессия завершена',
    time: 'вчера',
    unread: 0,
    image: 'https://images.pexels.com/photos/20860595/pexels-photo-20860595.jpeg',
    status: 'offline',
    companionId: 3,
  },
])

export const messages = ref<Message[]>([
  {
    id: 1,
    chatId: 1,
    author: 'Мария К.',
    text: 'Привет! Как дела? Я хотела обсудить свои проблемы с доверием в отношениях.',
    time: '14:30',
    isMine: false,
  },
  {
    id: 2,
    chatId: 1,
    author: 'Ты',
    text: 'Привет! Я слушаю, расскажи подробнее.',
    time: '14:32',
    isMine: true,
  },
  {
    id: 3,
    chatId: 1,
    author: 'Мария К.',
    text: 'Спасибо. Мне кажется, я часто беспокоюсь без причины и это портит мои отношения.',
    time: '14:35',
    isMine: false,
  },
  {
    id: 4,
    chatId: 1,
    author: 'Мария К.',
    text: 'Я не знаю, как научиться доверять.',
    time: '14:36',
    isMine: false,
  },
  {
    id: 5,
    chatId: 1,
    author: 'Ты',
    text: 'Это очень распространённая проблема. Давайте поговорим о корнях этого беспокойства. Когда оно началось?',
    time: '14:38',
    isMine: true,
  },
  {
    id: 6,
    chatId: 1,
    author: 'Мария К.',
    text: 'Спасибо за помощь! Это действительно помогает разговаривать об этом.',
    time: '14:45',
    isMine: false,
  },
])

export const currentChatId = ref<number | null>(null)

// User operations
export const loginUser = (email: string, password: string) => {
  // Simple mock login
  if (email && password) {
    console.log('User logged in:', email)
    return true
  }
  return false
}

export const registerUser = (data: { fullName: string; email: string; password: string }) => {
  const newUser: User = {
    id: (currentUser.value?.id || 0) + 1,
    name: data.fullName,
    email: data.email,
    password: data.password,
    age: 25,
    bio: '',
    image: 'https://images.pexels.com/photos/31422830/pexels-photo-31422830.png',
  }
  currentUser.value = newUser
  return newUser
}

export const updateUserProfile = (updates: Partial<User>) => {
  if (currentUser.value) {
    currentUser.value = { ...currentUser.value, ...updates }
    return currentUser.value
  }
}

export const logoutUser = () => {
  currentUser.value = null
}

// Companion operations
export const getCompanionById = (id: number) => {
  return companions.value.find(c => c.id === id)
}

export const filterCompanions = (filters: {
  gender?: string
  ageMin?: number
  ageMax?: number
  experience?: string
  topic?: string
}) => {
  return companions.value.filter(c => {
    if (filters.ageMin && c.age < filters.ageMin) return false
    if (filters.ageMax && c.age > filters.ageMax) return false
    if (filters.experience && filters.experience !== 'all') {
      const isExperienced = c.experience === 'Опытный специалист'
      const filterIsExperienced = filters.experience === 'experienced'
      if (isExperienced !== filterIsExperienced) return false
    }
    if (filters.topic && filters.topic !== 'Все' && !c.topics.includes(filters.topic)) {
      return false
    }
    return true
  })
}

export const sendConnectionRequest = (companionId: number) => {
  const companion = getCompanionById(companionId)
  if (companion) {
    // Create or update chat
    let chat = chats.value.find(c => c.companionId === companionId)
    if (!chat) {
      chat = {
        id: chats.value.length + 1,
        name: companion.name,
        lastMessage: 'Новое соединение',
        time: 'только что',
        unread: 0,
        image: companion.image,
        status: 'active',
        companionId: companionId,
      }
      chats.value.push(chat)
    }
    return chat
  }
}

// Chat operations
export const getChatById = (id: number) => {
  return chats.value.find(c => c.id === id)
}

export const getChatMessages = (chatId: number) => {
  return messages.value.filter(m => m.chatId === chatId)
}

export const sendMessage = (chatId: number, text: string) => {
  const newMessage: Message = {
    id: messages.value.length + 1,
    chatId,
    author: 'Ты',
    text,
    time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
    isMine: true,
  }
  messages.value.push(newMessage)

  // Update last message in chat
  const chat = getChatById(chatId)
  if (chat) {
    chat.lastMessage = text
    chat.time = 'только что'
  }

  return newMessage
}

export const deleteChat = (chatId: number) => {
  const index = chats.value.findIndex(c => c.id === chatId)
  if (index > -1) {
    chats.value.splice(index, 1)
    // Also delete messages from this chat
    const messageIndices = messages.value
      .map((m, i) => m.chatId === chatId ? i : -1)
      .filter(i => i > -1)
    messageIndices.reverse().forEach(i => messages.value.splice(i, 1))
    return true
  }
  return false
}

export const markChatAsRead = (chatId: number) => {
  const chat = getChatById(chatId)
  if (chat) {
    chat.unread = 0
  }
}

export const endSession = (chatId: number) => {
  const chat = getChatById(chatId)
  if (chat) {
    chat.status = 'offline'
    chat.lastMessage = 'Сессия завершена'
    const endMessage: Message = {
      id: messages.value.length + 1,
      chatId,
      author: 'Система',
      text: 'Сессия завершена. Спасибо за использование нашего сервиса!',
      time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      isMine: false,
    }
    messages.value.push(endMessage)
    return true
  }
  return false
}
