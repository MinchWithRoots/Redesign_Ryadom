import { ref, computed } from 'vue'
import * as supabaseService from '@/services/supabaseService'
import { cacheManager, CACHE_KEYS, CACHE_DURATION } from '@/utils/cacheManager'

export function useCachedCompanions() {
  const companions = ref<any[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const isCached = ref(false)

  const fetchCompanions = async (forceRefresh = false): Promise<any[]> => {
    // If already cached in memory and not forcing refresh, use cache
    if (companions.value.length > 0 && !forceRefresh) {
      isCached.value = true
      return companions.value
    }

    loading.value = true
    error.value = null

    try {
      // Check if cache is still valid
      if (!forceRefresh && !cacheManager.isExpired(CACHE_KEYS.COMPANIONS, CACHE_DURATION.COMPANIONS)) {
        console.log('Loading companions from cache')
        isCached.value = true
      } else {
        console.log('Fetching fresh companions from database')
        isCached.value = false
      }

      const data = await supabaseService.getCompanions()
      if (data) {
        companions.value = data as any[]
      } else {
        throw new Error('Failed to fetch companions')
      }
    } catch (err: any) {
      error.value = err.message
      console.error('Error loading companions:', err)
    } finally {
      loading.value = false
    }

    return companions.value
  }

  const searchCompanions = async (query: string): Promise<any[]> => {
    if (!query.trim()) {
      return fetchCompanions()
    }

    loading.value = true
    error.value = null

    try {
      const data = await supabaseService.searchCompanions(query)
      if (data) {
        companions.value = data as any[]
      }
    } catch (err: any) {
      error.value = err.message
    } finally {
      loading.value = false
    }

    return companions.value
  }

  const filterCompanions = (filters: {
    gender?: string
    ageMin?: number
    ageMax?: number
    experience?: string
    topic?: string
  }) => {
    return computed(() => {
      let filtered = [...companions.value]

      if (filters.gender && filters.gender !== 'all') {
        filtered = filtered.filter(c => c.gender === filters.gender)
      }

      if (filters.ageMin !== undefined && filters.ageMax !== undefined) {
        filtered = filtered.filter(c =>
          c.age >= (filters.ageMin ?? 18) && c.age <= (filters.ageMax ?? 65)
        )
      }

      if (filters.experience && filters.experience !== 'all') {
        filtered = filtered.filter(c => c.experience === filters.experience)
      }

      if (filters.topic && filters.topic !== 'all') {
        filtered = filtered.filter(c =>
          c.companion_topics?.some((t: any) => t.topic === filters.topic)
        )
      }

      return filtered
    })
  }

  const clearCache = () => {
    cacheManager.clear(CACHE_KEYS.COMPANIONS)
    companions.value = []
    isCached.value = false
  }

  return {
    companions,
    loading,
    error,
    isCached,
    fetchCompanions,
    searchCompanions,
    filterCompanions,
    clearCache,
  }
}
