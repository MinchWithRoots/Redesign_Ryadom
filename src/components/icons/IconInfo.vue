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
      <linearGradient id="iconInfoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#60A5FA" />
        <stop offset="100%" stop-color="#7C3AED" />
      </linearGradient>
    </defs>
    <!-- Circle background -->
    <circle cx="25" cy="25" r="22" fill="url(#iconInfoGrad)" />
    <!-- Shine -->
    <ellipse cx="18" cy="16" rx="6" ry="4" fill="white" fill-opacity="0.2" transform="rotate(-30 18 16)" />
    <!-- i dot -->
    <circle cx="25" cy="16" r="2.5" fill="white" />
    <!-- i body -->
    <rect x="22.5" y="22" width="5" height="14" rx="2.5" fill="white" />
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ alt?: string }>(), { alt: 'info icon' })
</script>
