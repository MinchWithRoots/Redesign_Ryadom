const CACHE_KEYS = {
  COMPANIONS: 'companions_cache',
  TOPICS: 'topics_cache',
  USERS: 'users_cache',
}

const CACHE_DURATION = {
  COMPANIONS: 5 * 60 * 1000, // 5 minutes
  TOPICS: 24 * 60 * 60 * 1000, // 24 hours
  USERS: 5 * 60 * 1000, // 5 minutes
}

interface CacheEntry<T> {
  data: T
  timestamp: number
}

class CacheManager {
  private memoryCache = new Map<string, CacheEntry<any>>()

  set<T>(key: string, data: T, duration: number = CACHE_DURATION.COMPANIONS): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
    }

    // Store in memory
    this.memoryCache.set(key, entry)

    // Store in localStorage (with size check)
    try {
      const serialized = JSON.stringify(entry)
      const currentSize = new Blob(Object.values(localStorage)).size
      const newSize = new Blob([serialized]).size

      if (currentSize + newSize < 5 * 1024 * 1024) { // Keep under 5MB
        localStorage.setItem(key, serialized)
      }
    } catch (e) {
      console.warn('LocalStorage full or unavailable:', e)
    }
  }

  get<T>(key: string, duration: number = CACHE_DURATION.COMPANIONS): T | null {
    // Check memory cache first (fastest)
    const memEntry = this.memoryCache.get(key)
    if (memEntry && Date.now() - memEntry.timestamp < duration) {
      return memEntry.data
    }

    // Check localStorage second
    try {
      const stored = localStorage.getItem(key)
      if (stored) {
        const entry: CacheEntry<T> = JSON.parse(stored)
        if (Date.now() - entry.timestamp < duration) {
          // Restore to memory cache
          this.memoryCache.set(key, entry)
          return entry.data
        } else {
          localStorage.removeItem(key)
        }
      }
    } catch (e) {
      console.warn('Error reading from localStorage:', e)
    }

    return null
  }

  clear(key?: string): void {
    if (key) {
      this.memoryCache.delete(key)
      try {
        localStorage.removeItem(key)
      } catch (e) {
        console.warn('Error clearing localStorage:', e)
      }
    } else {
      this.memoryCache.clear()
      Object.values(CACHE_KEYS).forEach(k => {
        try {
          localStorage.removeItem(k)
        } catch (e) {
          console.warn('Error clearing localStorage:', e)
        }
      })
    }
  }

  isExpired(key: string, duration: number = CACHE_DURATION.COMPANIONS): boolean {
    const entry = this.memoryCache.get(key) || 
      (() => {
        try {
          const stored = localStorage.getItem(key)
          return stored ? JSON.parse(stored) : null
        } catch {
          return null
        }
      })()

    if (!entry) return true
    return Date.now() - entry.timestamp > duration
  }
}

export const cacheManager = new CacheManager()
export { CACHE_KEYS, CACHE_DURATION }
