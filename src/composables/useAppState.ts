import { ref, computed } from 'vue'
import { supabase } from '@/utils/supabase'
import * as encryptionService from '@/services/encryptionService'

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
  sessions?: number
  reviews_count?: number
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
  experience?: 'до года' | '1-3 года' | 'более 3 лет'
  reviews_count?: number
  average_rating?: number
  image: string
  bio: string
  is_available?: boolean
  topics?: string[]
  user_id?: string
  created_at?: string
  updated_at?: string
  sessions?: number
}

export interface Chat {
  id: string
  name: string
  lastMessage: string
  time: string
  unread_count: number
  image: string
  status: 'active' | 'offline' | 'blocked'
  companion_id: string
  user_id: string
  created_at: string
  updated_at: string
  blocked_by?: string | null
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
  id: string | number
  sender_id: string
  text: string
  created_at: string
  author: string
  image?: string
  isMine: boolean
  chat_id: string
  time?: string
  isRead?: boolean
  isSent?: boolean
}

export interface Review {
  id: string
  companion_id: string
  user_id: string
  rating: number
  title: string
  comment: string
  published: boolean
  created_at: string
  updated_at: string
  user_name?: string
  user_image?: string
  chat_id?: string
  chat_created_at?: string
  is_anonymous?: boolean
}

// Global state
export const currentUser = ref<User | null>(null)
export const companions = ref<Companion[]>([])
export const currentCompanion = ref<Companion | null>(null)
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

    // Use auth UUID (sub) instead of email - this is immutable even if email is changed in DB
    const authUUID = data.user.id
    if (!authUUID) {
      currentUser.value = null
      return null
    }

    // Fetch user profile by UUID (immutable identifier)
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUUID)
      .maybeSingle()

    if (profileError) {
      console.error('Error loading user profile:', {
        message: profileError.message,
        code: profileError.code,
        hint: profileError.hint,
        authUUID,
      })
      // User is authenticated but profile doesn't exist yet (new user)
      // This is normal for newly created users
      const userEmail = data.user.email || ''
      currentUser.value = {
        id: authUUID,
        name: data.user.user_metadata?.full_name || 'User',
        email: userEmail,
        bio: '',
        role: 'user',
        gender: undefined,
        topics: [],
        reviews_count: 0,
      }
      return currentUser.value
    }

    // Handle case where profile doesn't exist yet
    if (!profile) {
      console.log('User profile not found, creating default with UUID:', authUUID)
      const userEmail = data.user.email || ''
      currentUser.value = {
        id: authUUID,
        name: data.user.user_metadata?.full_name || 'User',
        email: userEmail,
        bio: '',
        role: 'user',
        gender: undefined,
        topics: [],
        reviews_count: 0,
      }
      return currentUser.value
    }

    // Profile found - always use the latest data from database
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
      sessions: profile.sessions || 0,
      reviews_count: profile.reviews_count || 0,
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
    console.log('User UUID for update:', currentUser.value.id)

    // Update by UUID (immutable identifier) instead of email
    // Use maybeSingle() instead of single() to handle 0 or 1 results gracefully
    const { data: profile, error: updateProfileError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', currentUser.value.id)
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
        .eq('id', currentUser.value.id)
        .maybeSingle()

      if (fetchError) throw new Error(fetchError.message)
      if (!fetchedProfile) throw new Error('User not found after update')

      currentUser.value = fetchedProfile

      // If this user is a companion, sync all profile data to companion record
      if (fetchedProfile.role === 'companion') {
        await syncCompanionProfile(fetchedProfile.id, updateData, fetchedProfile)
      }

      return fetchedProfile
    }

    currentUser.value = {
      ...currentUser.value,
      ...profile,
    }

    // If this user is a companion, sync all profile data to companion record
    if (profile.role === 'companion') {
      await syncCompanionProfile(profile.id, updateData, profile)
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

// Sync all companion profile data when user updates their profile
const syncCompanionProfile = async (userId: string, updates: Record<string, any>, userProfile: User) => {
  try {
    if (!Object.keys(updates).length) {
      console.log('No updates to sync for companion')
      return
    }

    console.log('Syncing companion profile data for user:', userId)

    // Find companion record by user_id
    const { data: companion, error: fetchError } = await supabase
      .from('companions')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    if (fetchError) {
      console.error('Error fetching companion:', fetchError)
      return
    }

    if (!companion) {
      console.log('No companion record found for user:', userId)
      return
    }

    // Build companion update data from user updates
    const companionUpdates: Record<string, any> = {
      updated_at: new Date().toISOString()
    }

    // Sync each field that was updated
    if (updates.bio !== undefined) {
      // Truncate bio to avoid index size issues (max ~500 chars to be safe)
      const bioTruncated = updates.bio.substring(0, 500)
      companionUpdates.bio = bioTruncated
      console.log('Bio length:', updates.bio.length, '-> truncated to:', bioTruncated.length)
    }
    if (updates.image !== undefined && !updates.image.startsWith('data:')) {
      // Only sync valid URLs, not base64
      companionUpdates.image = updates.image
    }
    if (updates.age !== undefined) {
      companionUpdates.age = updates.age
    }
    if (updates.gender !== undefined) {
      companionUpdates.gender = updates.gender
    }
    if (updates.topics !== undefined && Array.isArray(updates.topics)) {
      // Convert topic names to IDs before saving
      const { data: allTopicsRef } = await supabase
        .from('companion_topics')
        .select('id, name')

      const topicNameToId = new Map<string, number>()
      if (allTopicsRef) {
        allTopicsRef.forEach((topic: any) => {
          topicNameToId.set(topic.name, topic.id)
        })
      }

      const topicIds = updates.topics
        .map((name: string) => topicNameToId.get(name))
        .filter((id: number | undefined) => id !== undefined) as number[]

      companionUpdates.topics = topicIds
    }

    console.log('Syncing companion with updates:', companionUpdates)

    // Update companion record
    const { error: updateError } = await supabase
      .from('companions')
      .update(companionUpdates)
      .eq('id', companion.id)

    if (updateError) {
      console.error('Error syncing companion profile:', updateError)
      // Don't throw - this is a secondary update
      return
    }

    console.log('Companion profile synced successfully')
  } catch (err) {
    console.error('Error in syncCompanionProfile:', err)
    // Don't throw - this is a secondary operation
  }
}

// Sync companion photo when user updates their profile photo
const syncCompanionPhoto = async (userId: string, imageUrl: string) => {
  try {
    if (!imageUrl) {
      console.log('No image URL provided, skipping sync')
      return
    }

    console.log('Syncing companion photo for user:', userId)

    // Find companion record by user_id
    const { data: companion, error: fetchError } = await supabase
      .from('companions')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    if (fetchError) {
      console.error('Error fetching companion:', fetchError)
      return
    }

    if (!companion) {
      console.log('No companion record found for user:', userId)
      return
    }

    // Update companion's image - ensure it's a valid URL (not base64)
    const imageToSync = imageUrl.startsWith('data:') ? undefined : imageUrl

    if (!imageToSync) {
      console.warn('Image is base64 data, skipping sync to avoid corrupting companion record')
      return
    }

    const { error: updateError } = await supabase
      .from('companions')
      .update({
        image: imageToSync,
        updated_at: new Date().toISOString()
      })
      .eq('id', companion.id)

    if (updateError) {
      console.error('Error syncing companion photo:', updateError)
      // Don't throw - this is a secondary update
      return
    }

    console.log('Companion photo synced successfully:', imageToSync.substring(0, 50))
  } catch (err) {
    console.error('Error in syncCompanionPhoto:', err)
    // Don't throw - this is a secondary operation
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
      .select('*, reviews_count:reviews(count)')
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

    if (!data) {
      return null
    }

    // Sync profile data from user only if needed (don't block on this)
    if (data.user_id) {
      try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('image, bio, age, gender, topics, sessions')
          .eq('id', data.user_id)
          .maybeSingle()

        if (!userError && userData) {
          // Always use sessions from users table (source of truth)
          if (userData.sessions !== undefined) {
            data.sessions = userData.sessions
          }

          // Check if any critical profile data differs
          const needsSync =
            userData.image !== data.image ||
            userData.bio !== data.bio ||
            userData.age !== data.age ||
            userData.gender !== data.gender

          if (needsSync) {
            console.log('Profile data differs, syncing from user record')
            // Use user's current data
            data.image = userData.image || data.image
            data.bio = userData.bio || data.bio
            data.age = userData.age || data.age
            data.gender = userData.gender || data.gender

            // Sync topics if they differ
            if (userData.topics && Array.isArray(userData.topics) && userData.topics.length > 0) {
              // Load topic mapping
              const { data: allTopicsRef } = await supabase
                .from('companion_topics')
                .select('id, name')

              const topicNameToId = new Map<string, number>()
              if (allTopicsRef) {
                allTopicsRef.forEach((topic: any) => {
                  topicNameToId.set(topic.name, topic.id)
                })
              }

              const userTopicIds = userData.topics
                .map((name: string) => topicNameToId.get(name))
                .filter((id: number | undefined) => id !== undefined) as number[]

              if (JSON.stringify(userTopicIds) !== JSON.stringify(data.topics)) {
                data.topics = userTopicIds
              }
            }

            // Update companion record in background (non-blocking)
            console.log('Queueing background sync of companion profile data')
            // Fire and forget - don't block on this update
            supabase
              .from('companions')
              .update({
                image: data.image,
                bio: data.bio,
                age: data.age,
                gender: data.gender,
                topics: data.topics || [],
                sessions: data.sessions,
                updated_at: new Date().toISOString()
              })
              .eq('id', companionId)
          }
        }
      } catch (err) {
        // Non-blocking error - log but don't fail
        console.warn('Could not sync user profile (non-blocking):', err instanceof Error ? err.message : String(err))
      }
    }

    // Load companion_topics reference table and convert topic IDs to names
    const { data: allTopicsRef, error: topicsError } = await supabase
      .from('companion_topics')
      .select('id, name')

    if (topicsError) {
      console.warn('Could not load topics reference:', topicsError.message)
    }

    const topicIdToName = new Map<number, string>()
    if (allTopicsRef) {
      allTopicsRef.forEach((topicRecord: any) => {
        topicIdToName.set(topicRecord.id, topicRecord.name)
      })
    }

    if (data && data.topics) {
      const topicIds = Array.isArray(data.topics) ? data.topics : []
      data.topics = topicIds
        .map((id: number) => topicIdToName.get(id))
        .filter((name: string | undefined) => name !== undefined)
    }

    // Extract the count value from reviews_count array
    if (data && Array.isArray(data.reviews_count) && data.reviews_count.length > 0) {
      data.reviews_count = data.reviews_count[0].count
    } else if (!data.reviews_count) {
      data.reviews_count = 0
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

    // Load companions with topics mapping in single query
    const { data: result, error: loadCompanionsError } = await supabase
      .from('companions')
      .select('*')
      .eq('is_available', true)
      .order('created_at', { ascending: false })

    if (loadCompanionsError) {
      console.error('Supabase error loading companions:', {
        message: loadCompanionsError.message,
        code: loadCompanionsError.code,
        hint: loadCompanionsError.hint,
      })
      throw loadCompanionsError
    }

    // Load companion_topics reference table (id -> name mapping) - with caching
    let allTopicsRef = (await import('@/utils/cacheManager').then(m => m.cacheManager.get('topics_cache', 24 * 60 * 60 * 1000))) as any[]

    if (!allTopicsRef) {
      const { data: topics, error: topicsRefError } = await supabase
        .from('companion_topics')
        .select('id, name')

      if (topicsRefError) throw topicsRefError

      allTopicsRef = topics || []
      const { cacheManager } = await import('@/utils/cacheManager')
      cacheManager.set('topics_cache', allTopicsRef, 24 * 60 * 60 * 1000)
    }

    const topicIdToName = new Map<number, string>()
    allTopicsRef?.forEach((t: any) => topicIdToName.set(t.id, t.name))

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

    // OPTIMIZATION: Fetch all users in one batch query instead of N individual queries
    const userIds = (result || [])
      .filter((c: any) => c.user_id)
      .map((c: any) => c.user_id)

    let usersData: any[] = []
    if (userIds.length > 0) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, image, bio, age, gender, name, topics, sessions')
        .in('id', userIds)

      if (!userError && userData) {
        usersData = userData
      }
    }

    // Create user lookup map for O(1) access
    const userMap = new Map(usersData.map(u => [u.id, u]))

    // Sync profile data from user records (non-blocking background sync)
    const syncPromises = (result || [])
      .filter((c: any) => c.user_id && userMap.has(c.user_id))
      .map(async (companion: any) => {
        const userData = userMap.get(companion.user_id)

        const needsSync =
          userData.image !== companion.image ||
          userData.bio !== companion.bio ||
          userData.age !== companion.age ||
          userData.gender !== companion.gender ||
          userData.name !== companion.name

        if (!needsSync) return

        const topicNameToId = new Map<string, number>()
        allTopicsRef?.forEach((t: any) => topicNameToId.set(t.name, t.id))

        const userTopicIds = (userData.topics || [])
          .map((name: string) => topicNameToId.get(name))
          .filter((id: number | undefined) => id !== undefined) as number[]

        // Background sync - don't block UI
        return supabase
          .from('companions')
          .update({
            image: userData.image,
            bio: userData.bio,
            age: userData.age,
            gender: userData.gender,
            name: userData.name,
            topics: userTopicIds,
            sessions: userData.sessions,
            updated_at: new Date().toISOString()
          })
          .eq('id', companion.id)
      })

    // Start background sync but don't wait
    Promise.allSettled(syncPromises).catch(() => {})

    // Load review stats in parallel for better performance
    const companionsWithReviews = await Promise.all(
      companionsWithData.map(async (companion: any) => {
        try {
          const { averageRating, reviewCount } = await getCompanionRatingStats(companion.id.toString())
          // Get sessions from user data (source of truth)
          let companionSessions = companion.sessions || 0
          if (companion.user_id && userMap.has(companion.user_id)) {
            const userData = userMap.get(companion.user_id)
            if (userData?.sessions !== undefined) {
              companionSessions = userData.sessions
            }
          }
          return {
            ...companion,
            average_rating: averageRating,
            reviews_count: reviewCount,
            sessions: companionSessions
          }
        } catch (err) {
          return {
            ...companion,
            average_rating: 0,
            reviews_count: 0
          }
        }
      })
    )

    companions.value = companionsWithReviews
    return companionsWithReviews
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
      const errorDetails = {
        message: errorMsg,
        code: (createRequestError as any)?.code,
        hint: (createRequestError as any)?.hint,
        details: (createRequestError as any)?.details,
        status: (createRequestError as any)?.status,
      }
      console.error('Supabase error details:', errorDetails)
      console.error('Full error object:', createRequestError)
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
      errorType: typeof err,
      stack: err instanceof Error ? err.stack : undefined
    })
    if (err instanceof Error) {
      console.error('Error trace:', err)
    } else {
      console.error('Error object:', JSON.stringify(err, null, 2))
    }
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

    console.log('Loading chats for user:', currentUser.value.id, 'Role:', currentUser.value.role)

    // Fetch chats where user is the "user" side
    const { data: userChats, error: userChatsError } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', currentUser.value.id)
      .order('updated_at', { ascending: false })

    if (userChatsError) {
      console.error('Supabase error loading user chats:', {
        message: userChatsError.message,
        code: userChatsError.code,
        hint: userChatsError.hint,
      })
      throw userChatsError
    }

    let allChats = userChats || []

    // If user is a companion, also fetch chats where they are the "companion" side
    if (currentUser.value.role === 'companion') {
      console.log('User is a companion, fetching companion-side chats')

      try {
        const companionId = await getCurrentCompanionId()
        if (companionId) {
          const { data: companionChats, error: companionChatsError } = await supabase
            .from('chats')
            .select('*')
            .eq('companion_id', parseInt(companionId))
            .order('updated_at', { ascending: false })

          if (companionChatsError) {
            console.error('Error loading companion chats:', companionChatsError)
            // Don't throw - continue with user chats only
          } else {
            console.log('Loaded companion chats:', companionChats?.length || 0)
            // Merge and deduplicate chats
            allChats = [...(userChats || []), ...(companionChats || [])]
            // Sort by updated_at
            allChats.sort((a: any, b: any) =>
              new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
            )
          }
        }
      } catch (err) {
        console.error('Error fetching companion chats:', err)
        // Continue with user chats only
      }
    }

    console.log('Total chats loaded:', allChats.length)

    // Fetch companion/user info for each chat
    const chatsWithInfo = await Promise.all(
      allChats.map(async (chat: any) => {
        try {
          // If chat.user_id is current user, fetch companion info
          // If chat.companion_id belongs to current user, fetch user info
          const isCurrentUserTheUser = chat.user_id === currentUser.value?.id

          let name = ''
          let image = ''

          if (isCurrentUserTheUser) {
            // Current user is the user side, fetch companion info
            const { data: companionData } = await supabase
              .from('companions')
              .select('name, image')
              .eq('id', chat.companion_id)
              .single()
            name = companionData?.name || ''
            image = companionData?.image || ''
          } else {
            // Current user is the companion side, fetch user info
            const { data: userData } = await supabase
              .from('users')
              .select('name, image')
              .eq('id', chat.user_id)
              .single()
            name = userData?.name || ''
            image = userData?.image || ''
          }

          return {
            id: chat.id,
            name: name,
            lastMessage: chat.last_message || '',
            time: new Date(chat.updated_at).toLocaleString('ru-RU'),
            unread_count: chat.unread_count || 0,
            image: image,
            status: chat.status || 'active',
            companion_id: chat.companion_id,
            user_id: chat.user_id,
            created_at: chat.created_at,
            updated_at: chat.updated_at,
            blocked_by: chat.blocked_by || null,
          }
        } catch (err) {
          console.error(`Error fetching info for chat ${chat.id}:`, err)
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
            blocked_by: chat.blocked_by || null,
          }
        }
      })
    )

    chats.value = chatsWithInfo

    return allChats
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

    // Load encryption key if available for this chat
    let decryptionKey: string | null = null
    if (currentUser.value) {
      try {
        // Try to load encryption key for current user
        const { data: keyData } = await supabase
          .from('chat_encryption_keys')
          .select('encrypted_key')
          .eq('chat_id', chatId)
          .eq('user_id', currentUser.value.id)
          .maybeSingle()

        if (keyData?.encrypted_key) {
          // Get the chat to find the companion ID for password derivation
          const chat = getChatById(chatId)
          if (chat) {
            const autoPassword = chat.companion_id.toString()
            const userDerivedKey = encryptionService.deriveKeyFromPassword(autoPassword, currentUser.value.id)
            decryptionKey = encryptionService.decryptData(keyData.encrypted_key, userDerivedKey)
            console.log('[getChatMessages] Loaded encryption key for decryption')
          }
        }
      } catch (encErr) {
        console.warn('[getChatMessages] Could not load encryption key:', encErr)
        // Continue without encryption
      }
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

          // Decrypt text if encryption key is available
          let displayText = messageItem.text
          if (decryptionKey && messageItem.text && messageItem.text.includes(':') && /^[0-9a-f]+:/.test(messageItem.text)) {
            try {
              displayText = encryptionService.decryptData(messageItem.text, decryptionKey)
            } catch (decErr) {
              console.warn('[getChatMessages] Failed to decrypt message:', decErr)
              displayText = messageItem.text
            }
          }

          return {
            id: messageItem.id,
            sender_id: messageItem.sender_id,
            text: displayText,
            created_at: messageItem.created_at,
            author: senderData?.name || 'Unknown',
            image: senderData?.image || '',
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
            image: '',
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

    // Try to load encryption key for this chat
    let encryptionKey: string | null = null
    let encryptedText: string | null = null
    let isEncrypted = false

    try {
      const chat = getChatById(chatId)
      if (chat) {
        // Load encryption key for current user
        const { data: keyData } = await supabase
          .from('chat_encryption_keys')
          .select('encrypted_key')
          .eq('chat_id', chatId)
          .eq('user_id', currentUser.value.id)
          .maybeSingle()

        if (keyData?.encrypted_key) {
          const autoPassword = chat.companion_id.toString()
          const userDerivedKey = encryptionService.deriveKeyFromPassword(autoPassword, currentUser.value.id)
          encryptionKey = encryptionService.decryptData(keyData.encrypted_key, userDerivedKey)

          if (encryptionKey) {
            // Encrypt the message
            encryptedText = encryptionService.encryptData(text, encryptionKey)
            isEncrypted = true
            console.log('[sendMessage] Message encrypted')
          }
        } else {
          // No encryption key exists for this chat yet, generate one
          console.log('[sendMessage] No encryption key found, generating one')
          const masterKey = encryptionService.generateMasterKey()
          const userDerivedKey = encryptionService.deriveKeyFromPassword(chat.companion_id.toString(), currentUser.value.id)

          try {
            await encryptionService.storeEncryptedChatKey(chatId, currentUser.value.id, masterKey, userDerivedKey)
            console.log('[sendMessage] Encryption key stored')

            encryptionKey = masterKey
            encryptedText = encryptionService.encryptData(text, encryptionKey)
            isEncrypted = true
          } catch (storeErr) {
            console.error('[sendMessage] Failed to store encryption key:', storeErr)
            // Continue without encryption
          }
        }
      }
    } catch (encErr) {
      console.warn('[sendMessage] Could not set up encryption:', encErr)
      // Continue without encryption
    }

    // Insert message with encryption if available
    const messageToInsert: any = {
      chat_id: chatId,
      sender_id: currentUser.value.id,
      text: encryptedText || text,
    }

    if (isEncrypted) {
      messageToInsert.encrypted_text = encryptedText
      messageToInsert.is_encrypted = true
    }

    const { data: messageData, error: sendMessageError } = await supabase
      .from('messages')
      .insert([messageToInsert])
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

    // Update chat last_message (store plaintext for last message display)
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
      text: text,
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

    if (!companionId) {
      throw new Error('Companion ID is required')
    }

    let retries = 2
    let lastError: any = null

    while (retries >= 0) {
      try {
        let query = supabase
          .from('companion_chat_requests')
          .select('*')
          .eq('companion_id', parseInt(companionId.toString()))

        if (statusFilter !== 'all') {
          query = query.eq('status', statusFilter)
        }

        const { data: requests, error: loadError } = await query
          .order('created_at', { ascending: false })

        if (loadError) {
          lastError = loadError
          if (retries > 0) {
            console.warn(`Load failed, retrying... (${retries} retries left)`, loadError.message)
            retries--
            await new Promise(r => setTimeout(r, 1000))
            continue
          }
          throw loadError
        }

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
        lastError = err
        if (retries > 0) {
          console.warn(`Request failed, retrying... (${retries} retries left)`)
          retries--
          await new Promise(r => setTimeout(r, 1000))
        } else {
          throw err
        }
      }
    }

    throw lastError
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to load chat requests'
    error.value = errorMessage
    console.error('Load chat requests error:', {
      message: errorMessage,
      error: err,
      companionId,
      type: (err as any)?.code || 'unknown'
    })
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

export const approveChatRequest = async (requestId: string, encryptionPassword?: string) => {
  try {
    isLoading.value = true
    error.value = ''

    console.log('Starting to approve chat request:', requestId)

    // Get the request details
    const request = chatRequests.value.find(r => r.id === requestId)
    if (!request) {
      throw new Error('Request not found in local state')
    }

    if (!request.user_id || !request.companion_id) {
      throw new Error(`Invalid request data: user_id=${request.user_id}, companion_id=${request.companion_id}`)
    }

    console.log('Found request:', {
      id: request.id,
      user_id: request.user_id,
      companion_id: request.companion_id,
      status: request.status,
    })

    // Create a chat for both users
    const chatData = {
      user_id: request.user_id,
      companion_id: request.companion_id,
      status: 'active',
      total_messages: 0,
    }

    console.log('Creating chat with data:', chatData)

    const { data: chat, error: createChatError } = await supabase
      .from('chats')
      .insert([chatData])
      .select()
      .single()

    if (createChatError) {
      const errorDetails = {
        message: createChatError.message,
        code: (createChatError as any).code,
        hint: (createChatError as any).hint,
        details: (createChatError as any).details,
        status: (createChatError as any).status,
      }
      console.error('Chat creation error details:', errorDetails)
      console.error('Full error:', createChatError)
      throw new Error(`Failed to create chat: ${createChatError.message || 'Unknown error'}`)
    }

    if (!chat) {
      throw new Error('Chat creation returned no data')
    }

    console.log('Chat created successfully:', chat)

    // Always initialize encryption for this chat
    // Store encryption key for the companion (current user approving the request)
    // The user who created the request will store their own key when they first access the chat
    if (chat && currentUser.value) {
      try {
        // Get the companion's user_id (current user is the companion approving the request)
        const { data: companionData, error: companionError } = await supabase
          .from('companions')
          .select('user_id')
          .eq('id', request.companion_id)
          .single()

        if (companionError || !companionData?.user_id) {
          console.warn('Could not fetch companion user_id for encryption:', companionError)
          // Non-critical - keys can be generated on first chat load
        } else {
          const companionUserId = companionData.user_id

          // Generate a random master key for this chat - will be shared by both users
          const masterKey = encryptionService.generateMasterKey()

          // Use provided password or derive from companion ID (deterministic)
          const password = encryptionPassword || request.companion_id.toString()

          // Derive the companion's (current user's) key from password
          const companionDerivedKey = encryptionService.deriveKeyFromPassword(password, companionUserId)
          const encryptedMasterKeyForCompanion = encryptionService.encryptData(masterKey, companionDerivedKey)

          // Derive the requesting user's key from password
          const userDerivedKey = encryptionService.deriveKeyFromPassword(password, request.user_id)
          const encryptedMasterKeyForUser = encryptionService.encryptData(masterKey, userDerivedKey)

          // Store encryption keys for BOTH users with the SAME master key
          // Store separately to get better error details and handle one user at a time
          try {
            console.log('[approveChatRequest] Storing encryption keys for both users', {
              chatId: chat.id,
              companionUserId,
              requestingUserId: request.user_id,
              masterKeyLength: masterKey.length,
              encryptedMasterKeyForCompanionLength: encryptedMasterKeyForCompanion.length,
              encryptedMasterKeyForUserLength: encryptedMasterKeyForUser.length
            })

            // Store key for companion (current user approving request)
            console.log('[approveChatRequest] Storing key for companion user:', companionUserId)
            const { error: companionErr } = await supabase
              .from('chat_encryption_keys')
              .insert({
                chat_id: Number(chat.id),
                user_id: companionUserId,
                encrypted_key: encryptedMasterKeyForCompanion,
              })

            if (companionErr) {
              const errorMsg = (companionErr as any)?.message || String(companionErr)
              console.error('Failed to store companion encryption key:', {
                message: errorMsg,
                code: (companionErr as any)?.code,
                hint: (companionErr as any)?.hint,
                details: (companionErr as any)?.details,
                status: (companionErr as any)?.status,
                chatId: chat.id,
                userId: companionUserId
              })
            } else {
              console.log('[approveChatRequest] Successfully stored key for companion user:', companionUserId)
            }

            // Store key for requesting user
            console.log('[approveChatRequest] Storing key for requesting user:', request.user_id)
            const { error: userErr } = await supabase
              .from('chat_encryption_keys')
              .insert({
                chat_id: Number(chat.id),
                user_id: request.user_id,
                encrypted_key: encryptedMasterKeyForUser,
              })

            if (userErr) {
              const errorMsg = (userErr as any)?.message || String(userErr)
              console.error('Failed to store requesting user encryption key:', {
                message: errorMsg,
                code: (userErr as any)?.code,
                hint: (userErr as any)?.hint,
                details: (userErr as any)?.details,
                status: (userErr as any)?.status,
                chatId: chat.id,
                userId: request.user_id
              })
            } else {
              console.log('[approveChatRequest] Successfully stored key for requesting user:', request.user_id)
            }

            if (!companionErr && !userErr) {
              console.log('[approveChatRequest] Encryption keys stored successfully for both users for chat:', chat.id)
            }
          } catch (storeErr) {
            const errorMsg = storeErr instanceof Error ? storeErr.message : String(storeErr)
            console.error('Exception while storing encryption keys:', {
              message: errorMsg,
              stack: storeErr instanceof Error ? storeErr.stack : undefined,
              error: storeErr
            })
          }
        }
      } catch (encErr) {
        console.warn('Failed to initialize chat encryption:', encErr)
        // Non-critical - encryption can be set up later
      }
    }

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

    if (updateError) {
      console.error('Request update error details:', {
        message: updateError.message,
        code: (updateError as any).code,
        hint: (updateError as any).hint,
      })
      throw new Error(`Failed to update request: ${updateError.message}`)
    }

    console.log('Request updated successfully:', updatedRequest)

    // Update local state - remove from pending list
    const index = chatRequests.value.findIndex(r => r.id === requestId)
    if (index > -1) {
      chatRequests.value.splice(index, 1)
    }

    // Increase session count for both users when chat starts
    try {
      console.log('Incrementing sessions for user:', request.user_id)
      await incrementUserSessions(request.user_id)
      console.log('Incrementing sessions for companion:', request.companion_id)
      await incrementCompanionSessions(request.companion_id)
    } catch (sessionErr) {
      console.warn('Warning: Failed to increment sessions, but chat was created:', sessionErr)
      // Non-critical error - don't throw
    }

    // Reload chats so the new chat appears in the list
    console.log('Reloading chats...')
    try {
      await loadChats()
    } catch (reloadErr) {
      console.warn('Warning: Failed to reload chats list:', reloadErr)
      // Non-critical error - don't throw
    }

    console.log('Chat request approved successfully')
    return { request: updatedRequest, chat }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to approve request'
    error.value = errorMessage
    console.error('Full approve request error:', {
      message: errorMessage,
      errorType: typeof err,
      errorString: String(err),
      stack: err instanceof Error ? err.stack : undefined,
      details: err instanceof Error ? err : JSON.stringify(err),
    })
    console.error('Full error object:', err)
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

export const getCompanionReviews = async (companionId: string): Promise<Review[]> => {
  try {
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('companion_id', companionId)
      .eq('published', true)
      .order('created_at', { ascending: false })

    if (error) throw error

    const reviewsWithUsers = await Promise.all(
      (reviews || []).map(async (review: any) => {
        try {
          const { data: userData } = await supabase
            .from('users')
            .select('name, image')
            .eq('id', review.user_id)
            .single()

          let chatCreatedAt = null
          if (review.chat_id) {
            try {
              const { data: chatData } = await supabase
                .from('chats')
                .select('created_at')
                .eq('id', review.chat_id)
                .single()
              chatCreatedAt = chatData?.created_at || null
            } catch (chatErr) {
              console.error(`Error fetching chat info for review ${review.id}:`, chatErr)
            }
          }

          return {
            ...review,
            user_name: userData?.name || 'Unknown',
            user_image: userData?.image || '',
            chat_created_at: chatCreatedAt,
          }
        } catch (err) {
          console.error(`Error enriching review ${review.id}:`, err)
          return {
            ...review,
            user_name: 'Unknown',
            user_image: '',
            chat_created_at: null,
          }
        }
      })
    )

    return reviewsWithUsers
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to load reviews'
    console.error('Error loading reviews:', errorMessage)
    return []
  }
}

export const getReviewsFromCompanion = async (companionId: string): Promise<Review[]> => {
  try {
    // Get the companion's user_id
    const { data: companionData, error: companionError } = await supabase
      .from('companions')
      .select('user_id')
      .eq('id', parseInt(companionId))
      .single()

    if (companionError || !companionData?.user_id) {
      console.error('Error fetching companion user_id:', companionError)
      return []
    }

    // Fetch reviews written by this companion (where user_id = companion's user_id)
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('user_id', companionData.user_id)
      .eq('published', true)
      .order('created_at', { ascending: false })

    if (error) throw error

    const reviewsWithUsers = await Promise.all(
      (reviews || []).map(async (review: any) => {
        try {
          // Get the companion being reviewed (whose profile the review is about)
          const { data: companionReviewedData } = await supabase
            .from('companions')
            .select('name')
            .eq('id', review.companion_id)
            .single()

          let chatCreatedAt = null
          if (review.chat_id) {
            try {
              const { data: chatData } = await supabase
                .from('chats')
                .select('created_at')
                .eq('id', review.chat_id)
                .single()
              chatCreatedAt = chatData?.created_at || null
            } catch (chatErr) {
              console.error(`Error fetching chat info for review ${review.id}:`, chatErr)
            }
          }

          return {
            ...review,
            user_name: currentUser.value?.name || 'Unknown',
            user_image: currentUser.value?.image,
            chat_created_at: chatCreatedAt,
            is_anonymous: false,
            companion_name: companionReviewedData?.name || 'Unknown'
          }
        } catch (err) {
          console.error(`Error processing review ${review.id}:`, err)
          return {
            ...review,
            user_name: currentUser.value?.name || 'Unknown',
            user_image: currentUser.value?.image,
            chat_created_at: null,
            is_anonymous: false
          }
        }
      })
    )

    return reviewsWithUsers
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to load reviews from companion'
    console.error('Error loading reviews from companion:', errorMessage)
    return []
  }
}

export const getCompanionRatingStats = async (companionId: string): Promise<{ averageRating: number; reviewCount: number }> => {
  try {
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('rating')
      .eq('companion_id', companionId)
      .eq('published', true)

    if (error) throw error

    const reviewList = reviews || []
    const reviewCount = reviewList.length

    if (reviewCount === 0) {
      return { averageRating: 0, reviewCount: 0 }
    }

    const totalRating = reviewList.reduce((sum, review) => sum + (review.rating || 0), 0)
    const averageRating = Math.round((totalRating / reviewCount) * 10) / 10

    return { averageRating, reviewCount }
  } catch (err) {
    console.error('Error fetching companion rating stats:', err)
    return { averageRating: 0, reviewCount: 0 }
  }
}

// Increment user sessions count
export const incrementUserSessions = async (userId: string) => {
  try {
    // Get current session count
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('sessions')
      .eq('id', userId)
      .maybeSingle()

    if (fetchError) {
      console.error('Error fetching user sessions:', fetchError)
      return
    }

    const currentSessions = user?.sessions || 0
    const newSessions = currentSessions + 1

    // Update session count
    const { error: updateError } = await supabase
      .from('users')
      .update({ sessions: newSessions })
      .eq('id', userId)

    if (updateError) {
      console.error('Error updating user sessions on increment:', {
        message: updateError.message,
        code: (updateError as any).code,
        hint: (updateError as any).hint,
        details: (updateError as any).details,
        status: (updateError as any).status,
        userId,
        newSessions,
      })
      return
    }

    // Update local state
    if (currentUser.value && currentUser.value.id === userId) {
      currentUser.value = {
        ...currentUser.value,
        sessions: newSessions,
      }
    }

    console.log(`Sessions incremented for user ${userId}: ${newSessions}`)
  } catch (err) {
    console.error('Error in incrementUserSessions:', err)
  }
}

// Increment companion sessions count
export const incrementCompanionSessions = async (companionId: string | number) => {
  try {
    const companionIdStr = companionId.toString()

    // First, get the companion's user_id
    const { data: companion, error: companionError } = await supabase
      .from('companions')
      .select('user_id')
      .eq('id', parseInt(companionIdStr))
      .single()

    if (companionError || !companion?.user_id) {
      console.error('Error fetching companion user_id:', companionError)
      return
    }

    // Get current session count from users table (source of truth)
    const { data: userData, error: userFetchError } = await supabase
      .from('users')
      .select('sessions')
      .eq('id', companion.user_id)
      .single()

    if (userFetchError) {
      console.error('Error fetching user sessions:', userFetchError)
      return
    }

    const currentSessions = userData?.sessions || 0
    const newSessions = currentSessions + 1

    // Update user sessions (source of truth)
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({ sessions: newSessions })
      .eq('id', companion.user_id)

    if (userUpdateError) {
      console.error('Error updating user sessions:', {
        message: userUpdateError.message,
        code: (userUpdateError as any).code,
        hint: (userUpdateError as any).hint,
        details: (userUpdateError as any).details,
        status: (userUpdateError as any).status,
        userId: companion.user_id,
        newSessions,
      })
      return
    }

    // Also update companion sessions for consistency
    const { error: companionUpdateError } = await supabase
      .from('companions')
      .update({ sessions: newSessions })
      .eq('id', parseInt(companionIdStr))

    if (companionUpdateError) {
      console.error('Error updating companion sessions:', {
        message: companionUpdateError.message,
        code: (companionUpdateError as any).code,
        hint: (companionUpdateError as any).hint,
        details: (companionUpdateError as any).details,
        status: (companionUpdateError as any).status,
        companionId: companionIdStr,
        newSessions,
      })
      return
    }

    // Update local state in companions array
    const index = companions.value.findIndex(c => c.id.toString() === companionIdStr)
    if (index !== -1) {
      companions.value[index] = {
        ...companions.value[index],
        sessions: newSessions,
      }
    }

    // Update currentCompanion if it's the one being incremented
    if (currentCompanion.value && currentCompanion.value.id.toString() === companionIdStr) {
      currentCompanion.value = {
        ...currentCompanion.value,
        sessions: newSessions,
      }
    }

    console.log(`Sessions incremented for companion ${companionIdStr} (user ${companion.user_id}): ${newSessions}`)
  } catch (err) {
    console.error('Error in incrementCompanionSessions:', err)
  }
}

// Sync session counts based on actual chats (for existing chats)
export const syncSessionCounts = async (userId: string) => {
  try {
    // Count unique companions the user has chatted with (each chat = 1 session)
    const { count: userChatsCount, error: userChatsError } = await supabase
      .from('chats')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (userChatsError) {
      console.error('Error fetching user chats for sync:', userChatsError)
      return
    }

    let userSessionCount = userChatsCount || 0

    // If user is a companion, also count chats where they are the companion
    if (currentUser.value && currentUser.value.id === userId && currentUser.value.role === 'companion') {
      try {
        const companionId = await getCurrentCompanionId()
        if (companionId) {
          const { count: companionChatsCount, error: companionChatsError } = await supabase
            .from('chats')
            .select('id', { count: 'exact', head: true })
            .eq('companion_id', parseInt(companionId.toString()))

          if (!companionChatsError && companionChatsCount) {
            // Merge both sets of chats (no duplicates expected since they have different user_id/companion_id)
            userSessionCount += companionChatsCount
          }
        }
      } catch (err) {
        console.error('Error fetching companion chats for session count:', err)
        // Continue with user chats only
      }
    }

    // Update user sessions
    const { error: updateUserError } = await supabase
      .from('users')
      .update({ sessions: userSessionCount })
      .eq('id', userId)

    if (updateUserError) {
      console.error('Error updating user sessions:', {
        message: updateUserError.message,
        code: (updateUserError as any).code,
        hint: (updateUserError as any).hint,
        details: (updateUserError as any).details,
        status: (updateUserError as any).status,
      })
      return
    }

    // Update local state
    if (currentUser.value && currentUser.value.id === userId) {
      currentUser.value = {
        ...currentUser.value,
        sessions: userSessionCount,
      }
    }

    console.log(`Session count synced for user ${userId}: ${userSessionCount}`)
  } catch (err) {
    console.error('Error in syncSessionCounts:', err)
  }
}

// Sync companion session counts
export const syncCompanionSessionCounts = async (companionId: string | number) => {
  try {
    const companionIdStr = companionId.toString()
    const companionIdNum = parseInt(companionIdStr)

    // Count chats where companion_id equals this companion
    const { data: chats, error: chatsError } = await supabase
      .from('chats')
      .select('id', { count: 'exact' })
      .eq('companion_id', companionIdNum)

    if (chatsError) {
      console.error('Error fetching companion chats count:', chatsError)
      return
    }

    const sessionCount = chats?.length || 0
    console.log(`Fetched ${sessionCount} sessions (chats) for companion ${companionIdStr}`)

    // Update companion sessions
    const { error: updateError } = await supabase
      .from('companions')
      .update({ sessions: sessionCount })
      .eq('id', companionIdNum)

    if (updateError) {
      console.error('Error updating companion sessions:', {
        message: updateError.message,
        code: (updateError as any).code,
        hint: (updateError as any).hint,
        details: (updateError as any).details,
        status: (updateError as any).status,
      })
      return
    }

    // Update local state in companions array
    const index = companions.value.findIndex(c => Number(c.id) === companionIdNum)
    if (index !== -1) {
      companions.value[index] = {
        ...companions.value[index],
        sessions: sessionCount,
      }
    }

    // Update currentCompanion if it's the one being synced
    if (currentCompanion.value && Number(currentCompanion.value.id) === companionIdNum) {
      currentCompanion.value = {
        ...currentCompanion.value,
        sessions: sessionCount,
      }
    }

    console.log(`Session count synced for companion ${companionIdStr}: ${sessionCount}`)
  } catch (err) {
    console.error('Error in syncCompanionSessionCounts:', err)
  }
}

// Sync all companion session counts (admin function)
export const syncAllCompanionSessionCounts = async () => {
  try {
    console.log('Starting sync of all companion session counts...')

    if (companions.value.length === 0) {
      await loadCompanions()
    }

    for (const companion of companions.value) {
      await syncCompanionSessionCounts(companion.id)
    }

    console.log('All companion session counts synced successfully')
    return true
  } catch (err) {
    console.error('Error syncing all companion session counts:', err)
    return false
  }
}

// Refresh companion data to update review counts and ratings
export const refreshCompanionData = async (companionId: string | number) => {
  try {
    const companionIdStr = companionId.toString()
    const updatedCompanion = await getCompanionById(companionIdStr)

    if (updatedCompanion) {
      // Also fetch updated review stats
      const { averageRating, reviewCount } = await getCompanionRatingStats(companionIdStr)
      const companionWithStats = {
        ...updatedCompanion,
        average_rating: averageRating,
        reviews_count: reviewCount
      }

      const index = companions.value.findIndex(c => c.id.toString() === companionIdStr)
      if (index !== -1) {
        companions.value[index] = companionWithStats
      }
    }
  } catch (err) {
    console.error('Error refreshing companion data:', err)
  }
}
