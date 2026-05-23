import { ref } from 'vue'
import * as supabaseService from '@/services/supabaseService'

export function useCompanions() {
  const companions = ref<any[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchCompanions = async () => {
    loading.value = true
    error.value = null
    try {
      const data = await supabaseService.getCompanions()
      if (data) {
        companions.value = data as any[]
      }
    } catch (err: any) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  const searchCompanions = async (query: string) => {
    loading.value = true
    error.value = null
    try {
      const data = await supabaseService.searchCompanions(query)
      if (data) {
        companions.value = data as any[]
      }
    } catch (err: any) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  return {
    companions,
    loading,
    error,
    fetchCompanions,
    searchCompanions
  }
}

export function useChat() {
  const chats = ref<any[]>([])
  const messages = ref<any[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchUserChats = async (userId: string | number) => {
    loading.value = true
    error.value = null
    try {
      const data = await supabaseService.getUserChats(String(userId))
      if (data) {
        chats.value = data
      }
    } catch (err: any) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  const fetchChatMessages = async (chatId: string | number) => {
    loading.value = true
    error.value = null
    try {
      const data = await supabaseService.getChatMessages(String(chatId))
      if (data) {
        messages.value = data
      }
    } catch (err: any) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  const sendMessage = async (
    chatId: string | number,
    senderId: string | number,
    text: string
  ) => {
    try {
      const data = await supabaseService.sendMessage(String(chatId), String(senderId), text)
      if (data) {
        messages.value.push(data)
      }
      return data
    } catch (err: any) {
      error.value = err.message
    }
  }

  const createNewChat = async (userId: string | number, companionId: string | number) => {
    try {
      const data = await supabaseService.createChat(String(userId), String(companionId))
      if (data) {
        chats.value.push(data)
      }
      return data
    } catch (err: any) {
      error.value = err.message
    }
  }

  return {
    chats,
    messages,
    loading,
    error,
    fetchUserChats,
    fetchChatMessages,
    sendMessage,
    createNewChat
  }
}

export function useFavorites() {
  const favorites = ref<any[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchFavorites = async (userId: string | number) => {
    loading.value = true
    error.value = null
    try {
      const data = await supabaseService.getUserFavorites(String(userId))
      if (data) {
        favorites.value = data
      }
    } catch (err: any) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  const addFavorite = async (userId: string | number, companionId: string | number) => {
    try {
      await supabaseService.addToFavorites(String(userId), String(companionId))
    } catch (err: any) {
      error.value = err.message
    }
  }

  const removeFavorite = async (userId: string | number, companionId: string | number) => {
    try {
      await supabaseService.removeFromFavorites(String(userId), String(companionId))
    } catch (err: any) {
      error.value = err.message
    }
  }

  return {
    favorites,
    loading,
    error,
    fetchFavorites,
    addFavorite,
    removeFavorite
  }
}
