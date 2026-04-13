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
      <linearGradient id="iconSettingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#C485FF" />
        <stop offset="100%" stop-color="#7C3AED" />
      </linearGradient>
    </defs>
    <!-- Gear outer -->
    <path
      d="M25 5L28.5 8.5C29.5 8.8 30.5 9.2 31.4 9.7L36 8L42 14L40.3 18.6C40.8 19.5 41.2 20.5 41.5 21.5L45 25L41.5 28.5C41.2 29.5 40.8 30.5 40.3 31.4L42 36L36 42L31.4 40.3C30.5 40.8 29.5 41.2 28.5 41.5L25 45L21.5 41.5C20.5 41.2 19.5 40.8 18.6 40.3L14 42L8 36L9.7 31.4C9.2 30.5 8.8 29.5 8.5 28.5L5 25L8.5 21.5C8.8 20.5 9.2 19.5 9.7 18.6L8 14L14 8L18.6 9.7C19.5 9.2 20.5 8.8 21.5 8.5L25 5Z"
      fill="url(#iconSettingGrad)"
    />
    <!-- Center circle (cutout effect) -->
    <circle cx="25" cy="25" r="8" fill="white" fill-opacity="0.9" />
    <circle cx="25" cy="25" r="5" fill="url(#iconSettingGrad)" />
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ alt?: string }>(), { alt: 'settings icon' })
</script>
