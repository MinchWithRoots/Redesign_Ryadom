import { ref, computed } from 'vue'
import { supabase } from '@/utils/supabase'

export interface UserProfile {
  id: string
  email: string
  name: string
  age?: number
  bio?: string
  image?: string
  created_at?: string
}

const currentUser = ref<UserProfile | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)
const isLoggedIn = computed(() => !!currentUser.value)

// Sign up with email and password
export const signUp = async (email: string, password: string, name: string) => {
  try {
    isLoading.value = true
    error.value = null

    // Sign up with Supabase Auth
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    })

    if (signUpError) throw signUpError
    if (!data.user) throw new Error('Failed to create user')

    // Create user profile in database
    const { error: profileError } = await supabase
      .from('users')
      .insert([
        {
          id: data.user.id,
          email,
          name,
          age: null,
          bio: '',
          image: null,
        },
      ])

    if (profileError) throw profileError

    currentUser.value = {
      id: data.user.id,
      email,
      name,
    }

    return data.user
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to sign up'
    error.value = message
    throw err
  } finally {
    isLoading.value = false
  }
}

// Login with email and password
export const login = async (email: string, password: string) => {
  try {
    isLoading.value = true
    error.value = null

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) throw signInError
    if (!data.user) throw new Error('Failed to login')

    // Fetch user profile from database
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (profileError) throw profileError

    currentUser.value = {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      age: profile.age,
      bio: profile.bio,
      image: profile.image,
    }

    return data.user
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to login'
    error.value = message
    throw err
  } finally {
    isLoading.value = false
  }
}

// Logout
export const logout = async () => {
  try {
    isLoading.value = true
    error.value = null

    const { error: signOutError } = await supabase.auth.signOut()
    if (signOutError) throw signOutError

    currentUser.value = null
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to logout'
    error.value = message
    throw err
  } finally {
    isLoading.value = false
  }
}

// Get current user
export const getCurrentUser = async () => {
  try {
    isLoading.value = true
    error.value = null

    const { data } = await supabase.auth.getUser()

    if (!data.user) {
      currentUser.value = null
      return null
    }

    // Fetch user profile from database
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (profileError) {
      currentUser.value = null
      return null
    }

    currentUser.value = {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      age: profile.age,
      bio: profile.bio,
      image: profile.image,
    }

    return profile
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get current user'
    error.value = message
    currentUser.value = null
    return null
  } finally {
    isLoading.value = false
  }
}

// Update user profile
export const updateProfile = async (updates: Partial<UserProfile>) => {
  try {
    isLoading.value = true
    error.value = null

    if (!currentUser.value) throw new Error('No user logged in')

    const { data, error: updateError } = await supabase
      .from('users')
      .update(updates)
      .eq('id', currentUser.value.id)
      .select()
      .single()

    if (updateError) throw updateError

    currentUser.value = {
      ...currentUser.value,
      ...data,
    }

    return data
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update profile'
    error.value = message
    throw err
  } finally {
    isLoading.value = false
  }
}

export function useAuth() {
  return {
    currentUser,
    isLoading,
    error,
    isLoggedIn,
    signUp,
    login,
    logout,
    getCurrentUser,
    updateProfile,
  }
}
