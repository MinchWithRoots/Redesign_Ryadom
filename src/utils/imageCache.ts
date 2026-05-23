/**
 * Image cache utility using browser's Cache API
 * Stores images in background for faster loading on revisits
 */

const CACHE_NAME = 'image-cache-v1'
const MAX_CACHE_SIZE = 50 * 1024 * 1024 // 50MB

let cacheInstance: Cache | null = null

async function getCache(): Promise<Cache | null> {
  if (!('caches' in window)) return null

  if (cacheInstance) return cacheInstance

  try {
    cacheInstance = await caches.open(CACHE_NAME)
    return cacheInstance
  } catch (error) {
    console.warn('Failed to access Cache API:', error)
    return null
  }
}

async function getCacheSize(): Promise<number> {
  if (!('caches' in window)) return 0

  try {
    const cacheNames = await caches.keys()
    let totalSize = 0

    for (const name of cacheNames) {
      const cache = await caches.open(name)
      const keys = await cache.keys()

      for (const request of keys) {
        const response = await cache.match(request)
        if (response) {
          const blob = await response.blob()
          totalSize += blob.size
        }
      }
    }

    return totalSize
  } catch (error) {
    console.warn('Failed to get cache size:', error)
    return 0
  }
}

async function clearOldCache(): Promise<void> {
  const size = await getCacheSize()
  if (size > MAX_CACHE_SIZE) {
    console.log('Cache size exceeded, clearing old entries')
    const cache = await getCache()
    if (cache) {
      const keys = await cache.keys()
      // Remove oldest entries (simple FIFO)
      for (const request of keys.slice(0, Math.ceil(keys.length * 0.2))) {
        await cache.delete(request)
      }
    }
  }
}

export async function cacheImage(url: string): Promise<void> {
  if (!url || !('caches' in window)) return

  try {
    const cache = await getCache()
    if (!cache) return

    // Check if already cached
    const cached = await cache.match(url)
    if (cached) return

    // Fetch and cache the image
    const response = await fetch(url)
    if (response.ok) {
      await cache.put(url, response.clone())
      await clearOldCache()
    }
  } catch (error) {
    console.warn(`Failed to cache image ${url}:`, error)
  }
}

export async function getCachedImage(url: string): Promise<string | null> {
  if (!url || !('caches' in window)) return null

  try {
    const cache = await getCache()
    if (!cache) return null

    const cached = await cache.match(url)
    if (cached) {
      const blob = await cached.blob()
      return URL.createObjectURL(blob)
    }
  } catch (error) {
    console.warn(`Failed to get cached image ${url}:`, error)
  }

  return null
}

export async function preloadImages(urls: string[]): Promise<void> {
  // Preload images in background using requestIdleCallback if available
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      urls.forEach(url => {
        if (url) cacheImage(url)
      })
    })
  } else {
    // Fallback: load after a short delay
    setTimeout(() => {
      urls.forEach(url => {
        if (url) cacheImage(url)
      })
    }, 2000)
  }
}

export async function clearImageCache(): Promise<void> {
  if (!('caches' in window)) return

  try {
    await caches.delete(CACHE_NAME)
    cacheInstance = null
  } catch (error) {
    console.warn('Failed to clear image cache:', error)
  }
}

export async function getImageCacheStats(): Promise<{ size: number; count: number }> {
  if (!('caches' in window)) {
    return { size: 0, count: 0 }
  }

  try {
    const cache = await getCache()
    if (!cache) return { size: 0, count: 0 }

    const keys = await cache.keys()
    let totalSize = 0

    for (const request of keys) {
      const response = await cache.match(request)
      if (response) {
        const blob = await response.blob()
        totalSize += blob.size
      }
    }

    return { size: totalSize, count: keys.length }
  } catch (error) {
    console.warn('Failed to get cache stats:', error)
    return { size: 0, count: 0 }
  }
}
