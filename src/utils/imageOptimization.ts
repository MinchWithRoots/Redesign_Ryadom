/**
 * Image optimization utilities for Supabase Storage
 * Generates optimized URLs with proper format selection and sizing
 */

interface ImageOptimizationOptions {
  width?: number
  height?: number
  quality?: number
  format?: 'webp' | 'jpeg' | 'png'
  resize?: 'contain' | 'cover' | 'fill'
}

/**
 * Detect WebP support once and cache the result
 */
let webpSupported: boolean | null = null

function supportsWebP(): boolean {
  if (webpSupported !== null) return webpSupported

  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  webpSupported = canvas.toDataURL('image/webp') !== 'data:image/webp'
  return webpSupported
}

/**
 * Optimize Supabase image URL
 */
export function optimizeSupabaseImageUrl(
  url: string,
  options: ImageOptimizationOptions = {}
): string {
  if (!url) return ''

  const {
    width = 500,
    height = 500,
    quality = 80,
    format,
    resize = 'cover',
  } = options

  // If not a Supabase URL, return as is
  if (!url.includes('supabase')) {
    return url
  }

  // Build query parameters
  const params = new URLSearchParams()
  params.append('width', String(width))
  params.append('height', String(height))
  params.append('quality', String(quality))
  params.append('resize', resize)

  // Use WebP if supported, otherwise use provided format or JPEG
  if (!format) {
    params.append('format', supportsWebP() ? 'webp' : 'jpeg')
  } else {
    params.append('format', format)
  }

  // Return URL with parameters
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}${params.toString()}`
}

/**
 * Generate multiple image URLs for responsive srcset
 */
export function generateImageSrcSet(url: string, sizes: number[] = [300, 600, 900]): string {
  if (!url) return ''

  return sizes
    .map(size => {
      const optimized = optimizeSupabaseImageUrl(url, {
        width: size,
        quality: 80,
      })
      return `${optimized} ${size}w`
    })
    .join(', ')
}

/**
 * Get appropriate image size based on container
 */
export function getResponsiveImageSize(containerWidth: number): number {
  // Add some padding and round up to nearest 100
  const size = containerWidth * window.devicePixelRatio
  return Math.ceil(size / 100) * 100
}

/**
 * Preload an image optimally
 */
export function preloadImageOptimized(url: string, sizes?: number[]): void {
  if (!url) return

  const link = document.createElement('link') as any
  link.rel = 'preload'
  link.as = 'image'

  if (sizes && sizes.length > 0) {
    link.imagesrcset = generateImageSrcSet(url, sizes)
    link.imagesizes = '(max-width: 600px) 300px, 600px'
  } else {
    link.href = optimizeSupabaseImageUrl(url, {
      width: 600,
      quality: 80,
    })
  }

  document.head.appendChild(link)
}

/**
 * Create a picture element with optimized sources
 */
export function createOptimizedPicture(
  url: string,
  alt: string,
  options: ImageOptimizationOptions = {}
): HTMLPictureElement {
  const picture = document.createElement('picture')

  // WebP source for modern browsers
  if (supportsWebP()) {
    const webpSource = document.createElement('source')
    webpSource.srcset = optimizeSupabaseImageUrl(url, { ...options, format: 'webp' })
    webpSource.type = 'image/webp'
    picture.appendChild(webpSource)
  }

  // JPEG fallback
  const jpegSource = document.createElement('source')
  jpegSource.srcset = optimizeSupabaseImageUrl(url, { ...options, format: 'jpeg' })
  jpegSource.type = 'image/jpeg'
  picture.appendChild(jpegSource)

  // Fallback img element
  const img = document.createElement('img')
  img.src = optimizeSupabaseImageUrl(url, options)
  img.alt = alt
  img.loading = 'lazy'
  picture.appendChild(img)

  return picture
}
