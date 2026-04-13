<template>
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    v-bind="$attrs"
  >
    <!-- Rounded background -->
    <rect width="24" height="24" rx="6" fill="currentColor" opacity="0.1" />
    <!-- Star icon -->
    <path
      d="M12 17.27L18.18 21L16.54 14.81L22 10.24L15.81 10.13L12 4.26L8.19 10.13L2 10.24L7.46 14.81L5.82 21L12 17.27Z"
      fill="currentColor"
    />
  </svg>
</template>

<script setup lang="ts">
defineProps<{ alt?: string }>()
</script>
