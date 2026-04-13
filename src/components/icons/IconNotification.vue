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
      <linearGradient id="iconNotifGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#C485FF" />
        <stop offset="100%" stop-color="#7C3AED" />
      </linearGradient>
    </defs>
    <!-- Bell body -->
    <path
      d="M25 5C25 5 25 5 25 5C18.4 5 13 10.4 13 17V28L8 33V36H42V33L37 28V17C37 10.4 31.6 5 25 5Z"
      fill="url(#iconNotifGrad)"
    />
    <!-- Bell bottom clapper -->
    <ellipse cx="25" cy="36" rx="5" ry="2" fill="url(#iconNotifGrad)" />
    <!-- Clapper bell -->
    <path d="M21 36C21 38.2 22.8 40 25 40C27.2 40 29 38.2 29 36H21Z" fill="#7C3AED" />
    <!-- Shine -->
    <ellipse cx="20" cy="15" rx="3" ry="4" fill="white" fill-opacity="0.2" transform="rotate(-20 20 15)" />
    <!-- Notification dot -->
    <circle cx="36" cy="12" r="7" fill="#F472B6" />
    <circle cx="36" cy="12" r="5" fill="#EC4899" />
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ alt?: string }>(), { alt: 'notification icon' })
</script>
