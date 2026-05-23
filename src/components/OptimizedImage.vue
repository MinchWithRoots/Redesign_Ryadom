<template>
  <div class="optimized-image-wrapper" :class="{ 'is-loading': isLoading }">
    <!-- Placeholder blur while loading -->
    <div v-if="isLoading && showPlaceholder" class="optimized-image-placeholder">
      <div class="placeholder-shimmer"></div>
    </div>

    <!-- Picture element with multiple formats -->
    <picture v-show="!isLoading || isLoaded">
      <!-- WebP format for modern browsers -->
      <source v-if="isWebPSupported && webpSrc" :srcset="webpSrc" type="image/webp" />
      <!-- Fallback JPEG -->
      <source v-if="jpegSrc" :srcset="jpegSrc" type="image/jpeg" />
      <!-- Actual image -->
      <img
        :src="currentSrc"
        :alt="alt"
        :width="width"
        :height="height"
        :class="['optimized-image', { 'is-loaded': isLoaded }]"
        :loading="lazyLoad ? 'lazy' : 'eager'"
        @load="handleLoad"
        @error="handleError"
      />
    </picture>

    <!-- Fallback when image fails -->
    <div v-if="showFallback" class="optimized-image-fallback">
      <svg class="optimized-image-fallback-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <circle cx="8.5" cy="8.5" r="1.5"></circle>
        <polyline points="21 15 16 10 5 21"></polyline>
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface Props {
  src?: string
  alt: string
  width?: number
  height?: number
  quality?: 'high' | 'medium' | 'low'
  lazyLoad?: boolean
  showPlaceholder?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  quality: 'high',
  lazyLoad: true,
  showPlaceholder: true,
})

const isLoading = ref(true)
const isLoaded = ref(false)
const showFallback = ref(false)
const isWebPSupported = ref(false)

// Detect WebP support once
onMounted(() => {
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  isWebPSupported.value = canvas.toDataURL('image/webp') !== 'data:image/webp'
})

const getOptimizedUrl = (url: string, format: 'webp' | 'jpeg'): string => {
  if (!url) return ''

  const qualityMap = {
    high: 90,
    medium: 75,
    low: 60,
  }

  const quality = qualityMap[props.quality]
  const params = [
    `width=${props.width || 500}`,
    `quality=${quality}`,
    `format=${format}`,
  ]

  // For Supabase URLs, append parameters
  if (url.includes('supabase')) {
    return `${url}?${params.join('&')}`
  }

  return url
}

const webpSrc = computed(() => 
  props.src ? getOptimizedUrl(props.src, 'webp') : ''
)

const jpegSrc = computed(() => 
  props.src ? getOptimizedUrl(props.src, 'jpeg') : ''
)

const currentSrc = computed(() => props.src || '')

const handleLoad = () => {
  isLoading.value = false
  isLoaded.value = true
  showFallback.value = false
}

const handleError = () => {
  isLoading.value = false
  showFallback.value = true
}
</script>

<style scoped>
.optimized-image-wrapper {
  position: relative;
  overflow: hidden;
  display: block;
}

.optimized-image-wrapper.is-loading {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.optimized-image-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  z-index: 1;
}

.placeholder-shimmer {
  width: 100%;
  height: 100%;
  animation: shimmer 1.5s infinite;
}

.optimized-image {
  display: block;
  width: 100%;
  height: auto;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.3s ease-in-out;
}

.optimized-image.is-loaded {
  opacity: 1;
}

.optimized-image-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 200px;
  background: #f5f5f5;
  color: #999;
}

.optimized-image-fallback-icon {
  width: 60px;
  height: 60px;
  opacity: 0.5;
}
</style>
