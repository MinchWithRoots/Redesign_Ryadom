<template>
  <svg
    viewBox="0 0 50 50"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    class="w-full h-full"
    v-bind="$attrs"
    :aria-label="alt"
  >
    <defs>
      <linearGradient id="iconStarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FCD34D" />
        <stop offset="100%" stop-color="#F59E0B" />
      </linearGradient>
    </defs>
    <!-- Star shape -->
    <path
      d="M25 5L30.5 18.5H45L33.5 27L38 41L25 33L12 41L16.5 27L5 18.5H19.5L25 5Z"
      fill="url(#iconStarGrad)"
    />
    <!-- Shine -->
    <path
      d="M25 8L28 16H22L25 8Z"
      fill="white"
      fill-opacity="0.3"
    />
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ alt?: string }>(), { alt: 'star icon' })
</script>
