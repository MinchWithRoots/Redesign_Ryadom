<template>
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    v-bind="$attrs"
  >
    <!-- Rounded background -->
    <rect width="24" height="24" rx="6" fill="currentColor" opacity="0.1" />
    <!-- Menu/Grid icon -->
    <g>
      <rect x="4" y="4" width="6" height="6" rx="2" fill="currentColor" />
      <rect x="14" y="4" width="6" height="6" rx="2" fill="currentColor" />
      <rect x="4" y="14" width="6" height="6" rx="2" fill="currentColor" />
      <rect x="14" y="14" width="6" height="6" rx="2" fill="currentColor" />
    </g>
  </svg>
</template>

<script setup lang="ts">
defineProps<{ alt?: string }>()
</script>
