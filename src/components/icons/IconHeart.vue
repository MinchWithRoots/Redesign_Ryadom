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
      <linearGradient id="iconHeartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#F472B6" />
        <stop offset="100%" stop-color="#9333EA" />
      </linearGradient>
    </defs>
    <path
      d="M25 42L8.5 26.5C4.5 22.5 4.5 15.5 8.5 11.5C12.5 7.5 19 7.5 23 11.5L25 13.5L27 11.5C31 7.5 37.5 7.5 41.5 11.5C45.5 15.5 45.5 22.5 41.5 26.5L25 42Z"
      fill="url(#iconHeartGrad)"
    />
    <!-- Inner shine -->
    <ellipse cx="18" cy="18" rx="4" ry="3" fill="white" fill-opacity="0.25" transform="rotate(-30 18 18)" />
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ alt?: string }>(), { alt: 'heart icon' })
</script>
