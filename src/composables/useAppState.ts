import { ref, computed } from 'vue'
import { supabase } from '@/utils/supabase'

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
  experience?: 'beginner' | 'experienced' | 'expert'
  reviews_count?: number
  average_rating?: number
  image: string
  bio: string
  is_available?: boolean
  topics?: string[]
  user_id?: string
  created_at?: string
  updated_at?: string
}

export interface Chat {
  id: string
  name: string
  lastMessage: string
  time: string
  unread_count: number
  image: string
  status: 'active' | 'offline'
  companion_id: string
  user_id: string
  created_at: string
  updated_at: string
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
  id: string
  sender_id: string
  text: string
  created_at: string
  author: string
  image?: string
  isMine: boolean
  chat_id: string
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
      .select('*')
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
          .select('image, bio, age, gender, topics')
          .eq('id', data.user_id)
          .maybeSingle()

        if (!userError && userData) {
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

    // Load companion_topics reference table (id -> name mapping)
    const { data: allTopicsRef, error: topicsRefError } = await supabase
      .from('companion_topics')
      .select('id, name')

    console.log('Loaded companion_topics reference:', { allTopicsRef, topicsRefError, count: allTopicsRef?.length || 0 })

    // Create id -> name map
    const topicIdToName = new Map<number, string>()
    if (allTopicsRef && allTopicsRef.length > 0) {
      allTopicsRef.forEach((topicRecord: any) => {
        topicIdToName.set(topicRecord.id, topicRecord.name)
      })
    }

    console.log('Topic ID->Name map created:', { mapSize: topicIdToName.size })

    // Process companions - convert topic IDs to names (sync happens in background, non-blocking)
    const companionsWithData = (result || []).map((companion: any) => {
      // companions.topics is JSONB array of topic IDs
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

    // Sync profile data from user records (blocking - wait for completion)
    for (let idx = 0; idx < (result || []).length; idx++) {
      const companion = result![idx]
      if (!companion.user_id) continue

      try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('image, bio, age, gender, name, topics')
          .eq('id', companion.user_id)
          .maybeSingle()

        if (userError) {
          console.warn(`Could not fetch user ${companion.user_id}:`, userError.message)
          continue
        }

        if (!userData) {
          continue
        }

        // Check if any data differs
        const needsSync =
          userData.image !== companion.image ||
          userData.bio !== companion.bio ||
          userData.age !== companion.age ||
          userData.gender !== companion.gender ||
          userData.name !== companion.name

        if (!needsSync) {
          continue
        }

        console.log(`Syncing: Updating companion ${companion.name}`)

        // Convert user's topic names to IDs
        let userTopicIds: number[] = []
        if (userData.topics && Array.isArray(userData.topics) && userData.topics.length > 0) {
          const topicNameToId = new Map<string, number>()
          if (allTopicsRef) {
            allTopicsRef.forEach((topic: any) => {
              topicNameToId.set(topic.name, topic.id)
            })
          }

          userTopicIds = userData.topics
            .map((name: string) => topicNameToId.get(name))
            .filter((id: number | undefined) => id !== undefined) as number[]
        }

        // Update the in-memory companion data first
        const companionIdx = companionsWithData.findIndex(c => c.id === companion.id)
        if (companionIdx !== -1) {
          companionsWithData[companionIdx] = {
            ...companionsWithData[companionIdx],
            image: userData.image,
            bio: userData.bio,
            age: userData.age,
            gender: userData.gender,
            name: userData.name,
            topics: userTopicIds
              .map((id: number) => topicIdToName.get(id))
              .filter((name: string | undefined) => name !== undefined) as string[]
          }
          console.log(`Updated companion in-memory: ${companion.name}`)
        }

        // Update in database
        const { error: updateError } = await supabase
          .from('companions')
          .update({
            image: userData.image,
            bio: userData.bio,
            age: userData.age,
            gender: userData.gender,
            name: userData.name,
            topics: userTopicIds,
            updated_at: new Date().toISOString()
          })
          .eq('id', companion.id)

        if (updateError) {
          console.warn(`Sync failed for companion ${companion.name}:`, updateError.message)
        }
      } catch (err) {
        console.warn(`Sync error for companion ${companion.id}:`, err instanceof Error ? err.message : String(err))
      }
    }

    // Load review stats for each companion
    const companionsWithReviews = await Promise.all(
      companionsWithData.map(async (companion: any) => {
        try {
          const { averageRating, reviewCount } = await getCompanionRatingStats(companion.id.toString())
          return {
            ...companion,
            average_rating: averageRating,
            reviews_count: reviewCount
          }
        } catch (err) {
          console.warn(`Error loading review stats for companion ${companion.id}:`, err)
          return {
            ...companion,
            average_rating: 0,
            reviews_count: 0
          }
        }
      })
    )

    console.log('Companions with data loaded:', { count: companionsWithReviews.length, sample: companionsWithReviews[0] })

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

    // Fetch sender info for each message separately
    const messagesWithSenders = await Promise.all(
      (result || []).map(async (messageItem: any) => {
        try {
          const { data: senderData } = await supabase
            .from('users')
            .select('name, image')
            .eq('id', messageItem.sender_id)
            .single()

          return {
            id: messageItem.id,
            sender_id: messageItem.sender_id,
            text: messageItem.text,
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

    // Insert message
    const { data: messageData, error: sendMessageError } = await supabase
      .from('messages')
      .insert([
        {
          chat_id: chatId,
          sender_id: currentUser.value.id,
          text,
        },
      ])
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

    // Update chat last_message
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
      text: messageData.text,
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

export const approveChatRequest = async (requestId: string) => {
  try {
    isLoading.value = true
    error.value = ''

    console.log('Starting to approve chat request:', requestId)

    // Get the request details
    const request = chatRequests.value.find(r => r.id === requestId)
    if (!request) {
      throw new Error('Request not found in local state')
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
      console.error('Chat creation error details:', {
        message: createChatError.message,
        code: (createChatError as any).code,
        hint: (createChatError as any).hint,
        details: (createChatError as any).details,
      })
      throw new Error(`Failed to create chat: ${createChatError.message}`)
    }

    if (!chat) {
      throw new Error('Chat creation returned no data')
    }

    console.log('Chat created successfully:', chat)

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

    // Increase session count for both users
    if (currentUser.value && currentUser.value.id === request.user_id) {
      // Current user is the user who made the request
      await incrementUserSessions(request.user_id)
    }

    // Reload chats so the new chat appears in the list
    console.log('Reloading chats...')
    await loadChats()

    console.log('Chat request approved successfully')
    return { request: updatedRequest, chat }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to approve request'
    error.value = errorMessage
    console.error('Full approve request error:', {
      message: errorMessage,
      error: err,
      stack: err instanceof Error ? err.stack : undefined,
    })
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
      console.error('Error updating sessions:', updateError)
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
