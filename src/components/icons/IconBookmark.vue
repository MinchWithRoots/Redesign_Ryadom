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
      <linearGradient id="iconBookmarkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#C485FF" />
        <stop offset="100%" stop-color="#7C3AED" />
      </linearGradient>
    </defs>
    <!-- Bookmark shape -->
    <path
      d="M12 6C10.343 6 9 7.343 9 9V44L25 36L41 44V9C41 7.343 39.657 6 38 6H12Z"
      fill="url(#iconBookmarkGrad)"
    />
    <!-- Star/checkmark on bookmark -->
    <path
      d="M25 16L27.5 21.5H33.5L28.8 25L30.5 31L25 27.5L19.5 31L21.2 25L16.5 21.5H22.5L25 16Z"
      fill="white"
      fill-opacity="0.85"
    />
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ alt?: string }>(), { alt: 'bookmark icon' })
</script>
