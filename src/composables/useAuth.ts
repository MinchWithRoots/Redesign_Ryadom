import { ref, computed } from 'vue'
import { supabase } from '@/utils/supabase'
import { encryptionService } from '@/services/encryptionService'
import * as crypto from 'crypto-js'

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
  role?: string // 'user' or 'admin'
  gender?: string | null
  topics?: string[] | null
}

const currentUser = ref<UserProfile | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)
const isLoggedIn = computed(() => !!currentUser.value)
let sessionPassword: string = '' // Store password for current session (cleared on logout)

// Helper function to extract error message
const getErrorMessage = (err: any): string => {
  try {
    if (typeof err === 'string') return err

    // Handle Error objects
    if (err instanceof Error) return err.message

    // Handle Supabase auth errors
    if (err?.message) return err.message
    if (err?.error_description) return err.error_description
    if (err?.msg) return err.msg
    if (err?.error) return typeof err.error === 'string' ? err.error : err.error?.message || 'Unknown error'

    // For Supabase errors, try to extract from response
    if (err?.response?.data?.msg) return err.response.data.msg
    if (err?.response?.data?.error_description) return err.response.data.error_description

    // Last resort - try to stringify
    return JSON.stringify(err)
  } catch {
    return 'An unknown error occurred'
  }
}

// Sign up with email and password
export const signUp = async (email: string, password: string, name: string) => {
  try {
    isLoading.value = true
    error.value = null

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase()
    const normalizedName = name.trim()

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(normalizedEmail)) {
      throw new Error('Email address is invalid. Please check the format.')
    }

    console.log('Attempting sign up with email:', normalizedEmail)

    // Sign up with Supabase Auth
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          full_name: normalizedName,
        },
      },
    })

    if (signUpError) {
      const errorMessage = getErrorMessage(signUpError)
      console.error('Sign up error details:', {
        originalError: signUpError,
        message: errorMessage,
        code: signUpError.code,
        status: signUpError.status,
      })
      // Provide user-friendly error messages
      if (errorMessage.includes('already registered')) {
        throw new Error('Этот email уже зарегистрирован. Пожалуйста, войдите или используйте другой email.')
      }
      throw new Error(errorMessage)
    }
    if (!data.user) throw new Error('Failed to create user')

    console.log('Supabase Auth user created successfully')

    // Create user profile with the auth UUID as the ID (immutable identifier)
    const authUUID = data.user.id
    if (!authUUID) {
      throw new Error('Failed to get auth UUID for new user')
    }

    const { error: profileError } = await supabase
      .from('users')
      .insert([
        {
          id: authUUID,
          email: normalizedEmail,
          name: normalizedName,
        },
      ])

    if (profileError) {
      const errorMessage = getErrorMessage(profileError)
      console.error('Error creating user profile:', {
        message: errorMessage,
        code: profileError.code,
        fullError: profileError,
      })
      throw new Error(errorMessage)
    }

    console.log('User profile created in database with UUID:', authUUID)

    // Fetch the created user profile
    const { data: profile, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUUID)
      .maybeSingle()

    if (fetchError) {
      console.error('Error fetching user profile:', fetchError)
      throw new Error('Failed to fetch created user profile')
    }

    if (!profile) {
      throw new Error('User profile not found after creation')
    }

    currentUser.value = {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      age: profile.age,
      gender: profile.gender,
      bio: profile.bio,
      image: profile.image,
      topics: profile.topics,
    }

    return data.user
  } catch (err) {
    const message = getErrorMessage(err)
    error.value = message
    console.error('Sign up error:', message, { originalError: err })
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

    console.log('Attempting login with email:', email)

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })

    if (signInError) {
      const errorMessage = getErrorMessage(signInError)
      console.error('Sign in error details:', {
        originalError: signInError,
        message: errorMessage,
        code: signInError.code,
        status: signInError.status,
      })
      // Provide user-friendly error messages
      if (errorMessage.includes('Invalid login credentials')) {
        throw new Error('Неверный email или пароль. Пожалуйста, проверьте ваши данные.')
      }
      throw new Error(errorMessage)
    }
    if (!data.user) throw new Error('Failed to login')

    // Get the auth user UUID (sub) - this never changes even if email is updated
    const authUUID = data.user.id
    if (!authUUID) throw new Error('User UUID not found in auth session')

    console.log('Auth successful, fetching user profile with UUID:', authUUID)

    // Fetch user profile from database using auth UUID instead of email
    // The UUID is immutable and is stored in the users table as the id
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUUID)
      .maybeSingle()

    if (profileError) {
      const errorMessage = getErrorMessage(profileError)
      console.error('Error fetching user profile:', {
        message: errorMessage,
        code: profileError.code,
      })
      throw new Error(errorMessage)
    }

    if (!profile) {
      // Profile doesn't exist, create it with the auth email
      console.log('User profile does not exist, creating new one...')
      const currentAuthEmail = data.user.email
      if (!currentAuthEmail) throw new Error('User email not found in auth session')

      const { data: newProfile, error: createError } = await supabase
        .from('users')
        .insert([
          {
            id: authUUID,
            email: currentAuthEmail,
            name: data.user.user_metadata?.full_name || 'User',
          },
        ])
        .select()
        .maybeSingle()

      if (createError) {
        throw new Error(getErrorMessage(createError))
      }
      if (!newProfile) {
        throw new Error('Failed to create user profile')
      }

      currentUser.value = {
      id: newProfile.id,
      email: newProfile.email,
      name: newProfile.name,
      age: newProfile.age,
      gender: newProfile.gender,
      bio: newProfile.bio,
      image: newProfile.image,
      topics: newProfile.topics,
    }

    // Initialize encryption service with user ID and salt for PBKDF2 key derivation
    const salt = newProfile.key_derivation_salt || authUUID // Use stored salt or generate from UUID
    encryptionService.initializeWithPasswordAndSalt(newProfile.id, salt)
    sessionPassword = password // Store password for current session
    console.log('Encryption service initialized for user:', newProfile.id)

      return data.user
    }

    // Profile exists - use the latest data from database
    currentUser.value = {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      age: profile.age,
      gender: profile.gender,
      bio: profile.bio,
      image: profile.image,
      topics: profile.topics,
    }

    // Initialize encryption service with user ID and salt for PBKDF2 key derivation
    const salt = profile.key_derivation_salt || authUUID // Use stored salt or generate from UUID
    encryptionService.initializeWithPasswordAndSalt(profile.id, salt)
    sessionPassword = password // Store password for current session
    console.log('Encryption service initialized for user:', profile.id)

    return data.user
  } catch (err) {
    const message = getErrorMessage(err)
    error.value = message
    console.error('Login error:', message, { originalError: err })
    throw new Error(message)
  } finally {
    isLoading.value = false
  }
}

// Get session password (for loading encrypted chat keys)
export const getSessionPassword = (): string => {
  return sessionPassword
}

// Logout
export const logout = async () => {
  try {
    isLoading.value = true
    error.value = null

    const { error: signOutError } = await supabase.auth.signOut()
    if (signOutError) throw new Error(getErrorMessage(signOutError))

    currentUser.value = null
    sessionPassword = '' // Clear password from memory
    encryptionService.clearAllKeys()
    console.log('Encryption keys cleared on logout')
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

    // Use auth UUID instead of email - UUID never changes even if email is updated in DB
    const authUUID = data.user.id
    if (!authUUID) {
      currentUser.value = null
      return null
    }

    // Fetch user profile from database using auth UUID (immutable identifier)
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUUID)
      .maybeSingle()

    if (profileError) {
      console.error('Error fetching user profile:', getErrorMessage(profileError))
      currentUser.value = null
      return null
    }

    if (!profile) {
      console.log('User profile not found in database for UUID:', authUUID)
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

    // Update by UUID (immutable identifier) instead of email
    const { data, error: updateError } = await supabase
      .from('users')
      .update(updates)
      .eq('id', currentUser.value.id)
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
