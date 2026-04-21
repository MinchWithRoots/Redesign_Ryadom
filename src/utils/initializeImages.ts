import { supabase } from './supabase'

const IMAGES_INITIALIZED_KEY = 'companion_images_initialized'
let initializationPromise: Promise<boolean> | null = null

/**
 * Initialize companion images by updating the database with local image paths
 * This function should be called once during app initialization
 */
export async function initializeCompanionImages() {
  try {
    // Check if already initialized in this session to avoid multiple updates
    const isInitialized = sessionStorage.getItem(IMAGES_INITIALIZED_KEY)
    if (isInitialized) {
      console.log('✅ Companion images already initialized in this session')
      return true
    }

    // Prevent multiple concurrent initializations
    if (initializationPromise) {
      return initializationPromise
    }

    initializationPromise = (async () => {
      console.log('🔄 Initializing companion images from local folder...')

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
        console.log('⚠️  No companions found to initialize')
        return true
      }

      // Check if images need updating (check first companion)
      const firstCompanion = companions[0]
      const expectedPath = `./src/images/users/id${firstCompanion.id}-image.jpg`

      if (firstCompanion?.image === expectedPath) {
        console.log('✅ Companion images are already using local paths')
        sessionStorage.setItem(IMAGES_INITIALIZED_KEY, 'true')
        return true
      }

      console.log('📝 Found companions with external image URLs, updating to local paths...')

      // Update each companion with the correct image path based on their ID
      const updates = companions.map((companion: any) => ({
        id: companion.id,
        image: `./src/images/users/id${companion.id}-image.jpg`
      }))

      let successCount = 0
      for (const update of updates) {
        const { error: updateError } = await supabase
          .from('companions')
          .update({ image: update.image })
          .eq('id', update.id)

        if (updateError) {
          console.error(`❌ Error updating companion ${update.id}:`, updateError)
        } else {
          console.log(`✅ Updated companion ${update.id} → ${update.image}`)
          successCount++
        }
      }

      if (successCount === updates.length) {
        sessionStorage.setItem(IMAGES_INITIALIZED_KEY, 'true')
        console.log(`✅ Successfully initialized ${successCount} companion images`)
        return true
      } else {
        console.warn(`⚠️  Partially initialized: ${successCount}/${updates.length} companions`)
        return true
      }
    })()

    return initializationPromise
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
  initializationPromise = null
  console.log('🔄 Initialization flag reset')
}
