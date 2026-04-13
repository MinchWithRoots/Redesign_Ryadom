<template>
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    v-bind="$attrs"
  >
    <!-- Rounded background -->
    <rect width="24" height="24" rx="6" fill="currentColor" opacity="0.1" />
    <!-- Bookmark icon -->
    <path
      d="M6 4C5.45 4 5 4.45 5 5V20C5 20.77 5.64 21.35 6.39 21.06L12 18.27L17.61 21.06C18.36 21.35 19 20.77 19 20V5C19 4.45 18.55 4 18 4H6Z"
      fill="currentColor"
    />
  </svg>
</template>

<script setup lang="ts">
defineProps<{ alt?: string }>()
</script>
