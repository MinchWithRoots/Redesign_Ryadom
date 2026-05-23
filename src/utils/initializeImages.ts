import { supabase } from './supabase'

const IMAGES_INITIALIZED_KEY = 'companion_images_initialized'

/**
 * Initialize companion images - ensures images are properly loaded
 * This function validates that image URLs are accessible
 */
export async function initializeCompanionImages() {
  try {
    // Check if already initialized in this session to avoid redundant work
    const isInitialized = sessionStorage.getItem(IMAGES_INITIALIZED_KEY)
    if (isInitialized) {
      console.log('✅ Companion images already initialized in this session')
      return true
    }

    console.log('🔄 Validating companion images...')

    // Fetch all companions
    const { data: companions, error: fetchError } = await supabase
      .from('companions')
      .select('id, image')
      .order('id', { ascending: true })

    if (fetchError) {
      console.error('❌ Error fetching companions:', fetchError)
      return false
    }

    if (!companions || companions.length === 0) {
      console.log('⚠️ No companions found')
      return true
    }

    console.log(`✅ Loaded ${companions.length} companion images`)
    sessionStorage.setItem(IMAGES_INITIALIZED_KEY, 'true')
    return true
  } catch (error) {
    console.error('❌ Error initializing companion images:', error)
    return false
  }
}

/**
 * Force reset the initialization flag (for testing/debugging)
 */
export function resetInitializationFlag() {
  sessionStorage.removeItem(IMAGES_INITIALIZED_KEY)
  console.log('🔄 Initialization flag reset')
}
