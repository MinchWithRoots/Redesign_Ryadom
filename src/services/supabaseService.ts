import { supabase } from '@/utils/supabase'

// ============ COMPANIONS (Спутники) ============
export async function getCompanions() {
  try {
    const { data, error } = await supabase
      .from('companions')
      .select(
        `
        *,
        companion_topics (topic),
        reviews (rating, comment, user_id)
      `
      )
      .eq('is_available', true)
      .order('created_at', { ascending: false })

    if (error) throw error
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
        reviews (rating, comment, title, users (name, image))
      `
      )
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching companion:', error)
    return null
  }
}

export async function searchCompanions(query: string) {
  try {
    const { data, error } = await supabase
      .from('companions')
      .select(
        `
        *,
        companion_topics (topic)
      `
      )
      .or(
        `name.ilike.%${query}%,bio.ilike.%${query}%`
      )
      .eq('is_available', true)

    if (error) throw error
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

export async function createChat(userId: string, companionId: string) {
  try {
    const { data, error } = await supabase
      .from('chats')
      .insert([{ user_id: userId, companion_id: companionId }])
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creating chat:', error)
    return null
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
  comment: string
) {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .upsert([
        {
          companion_id: companionId,
          user_id: userId,
          rating,
          title,
          comment,
          published: true,
        }
      ])
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error adding review:', error)
    return null
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
          specialization: applicationData.specialization,
          message: applicationData.message,
          status: 'pending',
        }
      ])
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error submitting companion application:', error)
    return null
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
          created_at: new Date().toISOString(),
        }
      ])
      .select()
      .single()

    if (companionError) throw companionError

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
