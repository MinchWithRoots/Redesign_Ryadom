import { supabase } from '@/utils/supabase'
import * as supabaseService from './supabaseService'

// Note: This API layer now delegates to Supabase directly
// The local backend is no longer used

// ============ AUTH ============
export const authAPI = {
  register: async (fullName: string, email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (error) throw error
      if (!data.user) throw new Error('Failed to create user')

      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert([
          {
            id: data.user.id,
            email,
            name: fullName,
            bio: '',
          },
        ])

      if (profileError) throw profileError

      return {
        user: {
          id: data.user.id,
          name: fullName,
          email,
        },
        token: data.session?.access_token || '',
      }
    } catch (error) {
      throw error
    }
  },

  login: async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
      if (!data.user) throw new Error('Failed to login')

      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single()

      if (profileError) throw profileError

      return {
        user: {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          age: profile.age,
          bio: profile.bio,
          image: profile.image,
        },
        token: data.session?.access_token || '',
      }
    } catch (error) {
      throw error
    }
  },

  getCurrentUser: async () => {
    try {
      const { data } = await supabase.auth.getUser()

      if (!data.user) {
        throw new Error('No user logged in')
      }

      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single()

      if (profileError) throw profileError

      return {
        user: {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          age: profile.age,
          bio: profile.bio,
          image: profile.image,
        },
      }
    } catch (error) {
      throw error
    }
  },
}

// ============ COMPANIONS ============
export const companionsAPI = {
  getAll: async (filters: { ageMin?: number; ageMax?: number; experience?: string; topic?: string }) => {
    try {
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

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      throw error
    }
  },

  getById: async (id: string) => {
    return supabaseService.getCompanionById(id)
  },
}

// ============ CHATS ============
export const chatsAPI = {
  getAll: async () => {
    try {
      const { data } = await supabase.auth.getUser()
      if (!data.user) throw new Error('No user logged in')

      const result = await supabaseService.getUserChats(data.user.id)
      return result || []
    } catch (error) {
      throw error
    }
  },

  create: async (companionId: string) => {
    try {
      const { data } = await supabase.auth.getUser()
      if (!data.user) throw new Error('No user logged in')

      const result = await supabaseService.createChat(data.user.id, companionId)

      return {
        chat: result,
      }
    } catch (error) {
      throw error
    }
  },

  getMessages: async (chatId: string) => {
    try {
      const result = await supabaseService.getChatMessages(chatId)
      return result || []
    } catch (error) {
      throw error
    }
  },

  sendMessage: async (chatId: string, text: string) => {
    try {
      const { data } = await supabase.auth.getUser()
      if (!data.user) throw new Error('No user logged in')

      const result = await supabaseService.sendMessage(chatId, data.user.id, text)

      return {
        message: result,
      }
    } catch (error) {
      throw error
    }
  },

  delete: async (chatId: string) => {
    try {
      const { error } = await supabase
        .from('chats')
        .delete()
        .eq('id', chatId)

      if (error) throw error
    } catch (error) {
      throw error
    }
  },

  endSession: async (chatId: string) => {
    try {
      const { error } = await supabase
        .from('chats')
        .update({ status: 'offline' })
        .eq('id', chatId)

      if (error) throw error
    } catch (error) {
      throw error
    }
  },

  acceptRequest: async (chatId: string) => {
    try {
      const result = await supabaseService.acceptConnectionRequest(chatId)
      return { success: !!result }
    } catch (error) {
      throw error
    }
  },

  rejectRequest: async (chatId: string) => {
    try {
      const result = await supabaseService.rejectConnectionRequest(chatId)
      return { success: result }
    } catch (error) {
      throw error
    }
  },
}

// ============ USERS ============
export const usersAPI = {
  getProfile: async () => {
    try {
      const { data } = await supabase.auth.getUser()
      if (!data.user) throw new Error('No user logged in')

      return supabaseService.getUserProfile(data.user.id)
    } catch (error) {
      throw error
    }
  },

  updateProfile: async (bio: string, image?: string) => {
    try {
      const { data } = await supabase.auth.getUser()
      if (!data.user) throw new Error('No user logged in')

      const result = await supabaseService.updateUserProfile(data.user.id, {
        bio,
        image,
      })

      return {
        user: result,
      }
    } catch (error) {
      throw error
    }
  },
}

// Auth token helpers (for backward compatibility)
let authToken: string | null = null

export const setAuthToken = (token: string) => {
  authToken = token
}

export const getAuthToken = () => {
  return authToken
}

export const clearAuthToken = () => {
  authToken = null
}
