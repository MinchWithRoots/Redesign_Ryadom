import { ref, computed } from 'vue'
import { supabase } from '@/utils/supabase'

export interface UserProfile {
  id: string | number
  email: string
  name: string
  age?: number | null
  bio?: string | null
  image?: string | null
  phone?: string | null
  city?: string | null
  created_at?: string
}

const currentUser = ref<UserProfile | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)
const isLoggedIn = computed(() => !!currentUser.value)

// Helper function to extract error message
const getErrorMessage = (err: any): string => {
  if (typeof err === 'string') return err
  if (err?.message) return err.message
  if (err?.error_description) return err.error_description
  if (err?.msg) return err.msg
  return 'An unknown error occurred'
}

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

    if (signUpError) {
      const errorMessage = getErrorMessage(signUpError)
      console.error('Sign up error:', {
        message: errorMessage,
        code: signUpError.code,
        status: signUpError.status,
      })
      throw new Error(errorMessage)
    }
    if (!data.user) throw new Error('Failed to create user')

    // Note: For Supabase, the user ID is auto-generated (BIGSERIAL)
    // We only store the email and name, other fields use defaults
    const { error: profileError } = await supabase
      .from('users')
      .insert([
        {
          email,
          name,
        },
      ])

    if (profileError) {
      const errorMessage = getErrorMessage(profileError)
      console.error('Error creating user profile:', {
        message: errorMessage,
        code: profileError.code,
      })
      throw new Error(errorMessage)
    }

    // Fetch the created user profile to get the correct ID
    const { data: profile, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (fetchError || !profile) {
      throw new Error('Failed to fetch created user profile')
    }

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
    const message = getErrorMessage(err)
    error.value = message
    console.error('Sign up error:', message)
    throw new Error(message)
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

    if (signInError) {
      const errorMessage = getErrorMessage(signInError)
      console.error('Sign in error:', {
        message: errorMessage,
        code: signInError.code,
        status: signInError.status,
      })
      throw new Error(errorMessage)
    }
    if (!data.user) throw new Error('Failed to login')

    // Fetch user profile from database by email
    const userEmail = data.user.email
    if (!userEmail) throw new Error('User email not found')

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('email', userEmail)
      .single()

    if (profileError) {
      const errorMessage = getErrorMessage(profileError)
      console.error('Error fetching user profile:', {
        message: errorMessage,
        code: profileError.code,
      })
      // Profile might not exist yet, use auth data
      currentUser.value = {
        id: userEmail, // Use email as fallback ID
        email: userEmail,
        name: data.user.user_metadata?.full_name || 'User',
      }
      return data.user
    }

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
    const message = getErrorMessage(err)
    error.value = message
    console.error('Login error:', message)
    throw new Error(message)
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
    if (signOutError) throw new Error(getErrorMessage(signOutError))

    currentUser.value = null
  } catch (err) {
    const message = getErrorMessage(err)
    error.value = message
    console.error('Logout error:', message)
    throw new Error(message)
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

    // Fetch user profile from database by email
    const userEmail = data.user.email
    if (!userEmail) {
      currentUser.value = null
      return null
    }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('email', userEmail)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', getErrorMessage(profileError))
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
    const message = getErrorMessage(err)
    error.value = message
    console.error('Get current user error:', message)
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

    // Update by email to ensure we're updating the right user
    const { data, error: updateError } = await supabase
      .from('users')
      .update(updates)
      .eq('email', currentUser.value.email)
      .select()
      .single()

    if (updateError) throw new Error(getErrorMessage(updateError))

    currentUser.value = {
      ...currentUser.value,
      ...data,
    }

    return data
  } catch (err) {
    const message = getErrorMessage(err)
    error.value = message
    console.error('Update profile error:', message)
    throw new Error(message)
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
