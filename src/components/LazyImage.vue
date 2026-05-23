<template>
  <div class="lazy-image-wrapper" :class="{ 'is-loading': isLoading }">
    <!-- Placeholder blur while loading -->
    <div v-if="isLoading" class="lazy-image-placeholder">
      <div class="lazy-image-spinner"></div>
    </div>

    <!-- Actual image with lazy loading -->
    <img
      v-show="!isLoading"
      :src="currentSrc"
      :alt="alt"
      :class="['lazy-image', { 'is-loaded': isLoaded }]"
      @load="handleLoad"
      @error="handleError"
      loading="lazy"
    />

    <!-- Fallback when image fails -->
    <div v-if="showFallback" class="lazy-image-fallback">
      <svg class="lazy-image-fallback-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
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
}

const props = withDefaults(defineProps<Props>(), {
  quality: 'high',
})

const isLoading = ref(true)
const isLoaded = ref(false)
const showFallback = ref(false)
const isWebPSupported = ref(false)

// Check WebP support once
onMounted(() => {
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  isWebPSupported.value = canvas.toDataURL('image/webp') !== 'data:image/webp'
})

const currentSrc = computed(() => {
  if (!props.src) return ''
  
  // Convert Supabase image URLs to optimized versions
  if (props.src.includes('supabase.co')) {
    return optimizeSupabaseUrl(props.src)
  }
  
  return props.src
})

const optimizeSupabaseUrl = (url: string): string => {
  // Supabase storage optimization with transform parameters
  const qualityMap = {
    high: 100,
    medium: 80,
    low: 60,
  }
  
  const quality = qualityMap[props.quality]
  const transforms = [
    'width=' + (props.width || 500),
    'height=' + (props.height || 500),
    'quality=' + quality,
    'resize=cover',
  ]
  
  // Add format parameter if WebP is supported
  if (isWebPSupported.value) {
    transforms.push('format=webp')
  }
  
  return url + '?' + transforms.join('&')
}

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
.lazy-image-wrapper {
  position: relative;
  overflow: hidden;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.lazy-image-wrapper.is-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.lazy-image-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.lazy-image-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-top-color: rgba(0, 0, 0, 0.3);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.lazy-image {
  display: block;
  width: 100%;
  height: auto;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.3s ease-in-out;
}

.lazy-image.is-loaded {
  opacity: 1;
}

.lazy-image-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 200px;
  background: #f5f5f5;
  color: #999;
}

.lazy-image-fallback-icon {
  width: 60px;
  height: 60px;
  opacity: 0.5;
}
</style>
