import { supabase } from '@/utils/supabase'
import { cacheManager, CACHE_KEYS, CACHE_DURATION } from '@/utils/cacheManager'
import * as encryptionService from '@/services/encryptionService'

// ============ COMPANIONS (Спутники) ============
export async function getCompanions() {
  // Check cache first
  const cached = cacheManager.get(CACHE_KEYS.COMPANIONS, CACHE_DURATION.COMPANIONS)
  if (cached) {
    console.log('Using cached companions data')
    return cached
  }

  try {
    const { data, error } = await supabase
      .from('companions')
      .select(
        `
        id,
        name,
        age,
        gender,
        bio,
        image,
        experience,
        is_available,
        created_at,
        companion_topics (topic),
        reviews_count:reviews(count),
        average_rating:reviews(rating)
      `
      )
      .eq('is_available', true)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Cache the result
    if (data) {
      cacheManager.set(CACHE_KEYS.COMPANIONS, data, CACHE_DURATION.COMPANIONS)
    }

    return data
  } catch (error) {
    console.error('Error fetching companions:', error)
    return null
  }
}

export async function getCompanionById(id: string) {
  try {
    const { data, error } = await supabase
      .from('companions')
      .select(
        `
        *,
        companion_topics (topic),
        reviews (rating, comment, title, users (name, image)),
        reviews_count:reviews(count)
      `
      )
      .eq('id', id)
      .single()

    if (error) throw error

    // Extract the count value from reviews_count array
    if (data && Array.isArray(data.reviews_count) && data.reviews_count.length > 0) {
      data.reviews_count = data.reviews_count[0].count
    } else if (!data.reviews_count) {
      data.reviews_count = 0
    }

    return data
  } catch (error) {
    console.error('Error fetching companion:', error)
    return null
  }
}

export async function searchCompanions(query: string) {
  const cacheKey = `search_${query.toLowerCase()}`

  // Check cache first
  const cached = cacheManager.get(cacheKey, 10 * 60 * 1000) // 10 min cache
  if (cached) {
    console.log(`Using cached search results for "${query}"`)
    return cached
  }

  try {
    const { data, error } = await supabase
      .from('companions')
      .select(
        `
        id,
        name,
        age,
        gender,
        bio,
        image,
        experience,
        is_available,
        companion_topics (topic),
        reviews_count:reviews(count),
        average_rating:reviews(rating)
      `
      )
      .or(
        `name.ilike.%${query}%,bio.ilike.%${query}%`
      )
      .eq('is_available', true)

    if (error) throw error

    // Cache search results
    if (data) {
      cacheManager.set(cacheKey, data, 10 * 60 * 1000)
    }

    return data
  } catch (error) {
    console.error('Error searching companions:', error)
    return null
  }
}

// ============ USERS (Пользователи) ============
export async function getUserProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return null
  }
}

export async function updateUserProfile(userId: string, updates: any) {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating user profile:', error)
    return null
  }
}

// ============ CHATS (Переписки) ============
export async function getUserChats(userId: string) {
  try {
    const { data, error } = await supabase
      .from('chats')
      .select(
        `
        *,
        companions (name, image)
      `
      )
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching chats:', error)
    return null
  }
}

export async function getChatMessages(chatId: string) {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*, users (name, image)')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching messages:', error)
    return null
  }
}

export async function sendMessage(
  chatId: string,
  senderId: string,
  text: string
) {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert([{ chat_id: chatId, sender_id: senderId, text }])
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error sending message:', error)
    return null
  }
}

export async function createChat(userId: string, companionId: string | number, userPassword?: string) {
  try {
    const companionIdNum = typeof companionId === 'string' ? parseInt(companionId) : companionId

    const { data, error } = await supabase
      .from('chats')
      .insert([{ user_id: userId, companion_id: companionIdNum }])
      .select()
      .single()

    if (error) throw error

    // Initialize encryption if password provided
    if (data && userPassword) {
      try {
        await initializeChatEncryption(data.id, userId, companionIdNum, userPassword)
      } catch (encErr) {
        console.warn('Failed to initialize chat encryption (table may not exist yet):', encErr)
        // Non-critical - chat can work without encryption
      }
    }

    return data
  } catch (error) {
    console.error('Error creating chat:', error)
    return null
  }
}

// Initialize encryption for BOTH users in the chat
async function initializeChatEncryption(chatId: number, userId: string, companionId: number, userPassword: string) {
  try {
    // Get companion's user_id from the companions table
    const { data: companionData, error: companionError } = await supabase
      .from('companions')
      .select('user_id')
      .eq('id', companionId)
      .single()

    if (companionError || !companionData?.user_id) {
      console.warn('Could not fetch companion user_id, encryption will not be initialized:', companionError)
      throw new Error('Companion user not found')
    }

    const companionUserId = companionData.user_id

    // Generate a random master key for this chat
    const masterKey = encryptionService.generateMasterKey()

    // Derive user's key from their password (using userId as salt)
    const userDerivedKey = encryptionService.deriveKeyFromPassword(userPassword, userId)
    const encryptedMasterKeyForUser = encryptionService.encryptData(masterKey, userDerivedKey)

    // Derive companion's key from the same password (using companionUserId as salt)
    const companionDerivedKey = encryptionService.deriveKeyFromPassword(userPassword, companionUserId)
    const encryptedMasterKeyForCompanion = encryptionService.encryptData(masterKey, companionDerivedKey)

    // Store encrypted keys in database for BOTH users
    try {
      const { error } = await supabase
        .from('chat_encryption_keys')
        .insert([
          {
            chat_id: chatId,
            user_id: userId,
            encrypted_key: encryptedMasterKeyForUser,
          },
          {
            chat_id: chatId,
            user_id: companionUserId,
            encrypted_key: encryptedMasterKeyForCompanion,
          }
        ])

      if (error) throw error

      console.log('Chat encryption initialized for both users for chat:', chatId)
    } catch (storeErr) {
      console.warn('Could not store encryption keys:', storeErr)
      throw storeErr
    }

    // Return the master key so caller can use it immediately
    return masterKey
  } catch (err) {
    console.error('Failed to initialize chat encryption:', err)
    throw err
  }
}

// ============ FAVORITES (Избранное) ============
export async function addToFavorites(userId: string, companionId: string) {
  try {
    const { data, error } = await supabase
      .from('favorites')
      .insert([{ user_id: userId, companion_id: companionId }])

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error adding to favorites:', error)
    return null
  }
}

export async function removeFromFavorites(userId: string, companionId: string) {
  try {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('companion_id', companionId)

    if (error) throw error
  } catch (error) {
    console.error('Error removing from favorites:', error)
  }
}

export async function getUserFavorites(userId: string) {
  try {
    const { data, error } = await supabase
      .from('favorites')
      .select('companions (*)')
      .eq('user_id', userId)

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching favorites:', error)
    return null
  }
}

// ============ REVIEWS (Отзывы) ============
export async function addReview(
  companionId: string,
  userId: string,
  rating: number,
  title: string,
  comment: string,
  chatId?: string,
  isAnonymous?: boolean
) {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .insert([
        {
          companion_id: companionId,
          user_id: userId,
          rating,
          title,
          comment,
          published: true,
          chat_id: chatId || null,
          is_anonymous: isAnonymous || false,
        }
      ])
      .select()
      .single()

    if (error) {
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error)
      console.error('Error adding review - Supabase error:', errorMessage, error)
      throw error
    }
    return data
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Error adding review:', errorMessage, error)
    throw error
  }
}

export async function getCompanionReviews(companionId: string) {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, users (name, image)')
      .eq('companion_id', companionId)
      .eq('published', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return null
  }
}

export async function getPublishedReviewsForHome(limit: number = 6) {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        id,
        title,
        comment,
        created_at,
        companion_id,
        companions (id, name),
        users (name, image)
      `)
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error)
      console.error('Error fetching published reviews:', errorMessage, error)
      throw error
    }
    return data || []
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Error fetching published reviews - catch block:', errorMessage)
    return []
  }
}

export async function getUserReviews(userId: string) {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        companions (name, image, id)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error)
      console.error('Error fetching user reviews:', errorMessage, error)
      throw error
    }
    return data
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Error fetching user reviews - catch block:', errorMessage)
    return []
  }
}

export async function deleteReview(reviewId: string) {
  try {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting review:', error)
    return false
  }
}

// ============ REPORTS (Отчеты о нарушениях) ============
export async function submitReport(
  chatId: string,
  userId: string,
  companionId: string,
  reason: string,
  message: string
) {
  try {
    const { data, error } = await supabase
      .from('reports')
      .insert([
        {
          chat_id: chatId,
          user_id: userId,
          companion_id: companionId,
          reason,
          message,
          status: 'pending',
        }
      ])
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error submitting report:', error)
    return null
  }
}

// ============ COMPANION APPLICATIONS ============
export async function submitCompanionApplication(
  userId: string,
  applicationData: any
) {
  try {
    console.log('Submitting companion application with data:', {
      userId,
      name: applicationData.name,
      age: applicationData.age,
      gender: applicationData.gender,
      experience: applicationData.experience,
      bio: applicationData.bio?.substring(0, 50),
      topics: applicationData.topics,
    })

    const { data, error } = await supabase
      .from('companion_applications')
      .insert([
        {
          user_id: userId,
          name: applicationData.name,
          age: applicationData.age,
          gender: applicationData.gender,
          experience: applicationData.experience,
          bio: applicationData.bio,
          image: applicationData.image,
          topics: applicationData.topics || [],
          message: applicationData.message,
          status: 'pending',
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', {
        message: error.message,
        code: error.code,
        hint: (error as any).hint,
        details: (error as any).details,
      })
      throw error
    }

    console.log('Application submitted successfully:', data)
    return data
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : JSON.stringify(error)
    console.error('Error submitting companion application:', errorMsg)
    console.error('Full error:', error)
    // Re-throw the error so the caller can handle it
    throw error
  }
}

export async function getCompanionApplications(status?: string) {
  try {
    let query = supabase
      .from('companion_applications')
      .select('*, users (name, email)')

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching applications:', error)
    return null
  }
}

export async function getCompanionApplicationById(applicationId: string) {
  try {
    const { data, error } = await supabase
      .from('companion_applications')
      .select('*, users (name, email)')
      .eq('id', applicationId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching application:', error)
    return null
  }
}

export async function approveCompanionApplication(applicationId: string) {
  try {
    // Get the application data
    const application = await getCompanionApplicationById(applicationId)
    if (!application) throw new Error('Application not found')

    // Create a new companion from the application
    const { data: companionData, error: companionError } = await supabase
      .from('companions')
      .insert([
        {
          name: application.name,
          age: application.age,
          gender: application.gender,
          experience: application.experience,
          bio: application.bio,
          image: application.image,
          topics: application.topics,
          is_available: true,
          user_id: application.user_id,
          created_at: new Date().toISOString(),
        }
      ])
      .select()
      .single()

    if (companionError) throw companionError

    // Update user role to 'companion'
    const { error: userRoleError } = await supabase
      .from('users')
      .update({ role: 'companion' })
      .eq('id', application.user_id)

    if (userRoleError) {
      console.error('Error updating user role:', userRoleError)
      // Don't throw - companion was created, role update is secondary
    }

    // Update the application status
    const { data: updatedApp, error: updateError } = await supabase
      .from('companion_applications')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
      })
      .eq('id', applicationId)
      .select()
      .single()

    if (updateError) throw updateError
    return updatedApp
  } catch (error) {
    console.error('Error approving application:', error)
    return null
  }
}

export async function rejectCompanionApplication(
  applicationId: string,
  rejectionReason: string
) {
  try {
    const { data, error } = await supabase
      .from('companion_applications')
      .update({
        status: 'rejected',
        rejection_reason: rejectionReason,
        rejected_at: new Date().toISOString(),
      })
      .eq('id', applicationId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error rejecting application:', error)
    return null
  }
}

export async function getUserApplication(userId: string) {
  try {
    const { data, error } = await supabase
      .from('companion_applications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) throw error
    return data && data.length > 0 ? data[0] : null
  } catch (error) {
    console.error('Error fetching user application:', error)
    return null
  }
}

// ============ UPDATE COMPANION IMAGES ============
export async function updateCompanionImages() {
  try {
    // Fetch all companions to get their IDs
    const { data: companions, error: fetchError } = await supabase
      .from('companions')
      .select('id, name')
      .order('created_at', { ascending: true })

    if (fetchError) throw fetchError

    // Update each companion with the correct image path based on their ID
    const updates = companions?.map((companion: any, index: number) => ({
      id: companion.id,
      image: `/images/users/id${index + 1}-image.jpg`
    })) || []

    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('companions')
        .update({ image: update.image })
        .eq('id', update.id)

      if (updateError) {
        console.error(`Error updating companion ${update.id}:`, updateError)
      } else {
        console.log(`✅ Updated companion ${update.id} with image: ${update.image}`)
      }
    }

    return true
  } catch (error) {
    console.error('Error updating companion images:', error)
    return false
  }
}
