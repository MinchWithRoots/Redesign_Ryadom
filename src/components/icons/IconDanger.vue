<template>
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    v-bind="$attrs"
  >
    <!-- Rounded background -->
    <rect width="24" height="24" rx="6" fill="currentColor" opacity="0.1" />
    <!-- Alert icon -->
    <path
      d="M1 21H23L12 2L1 21ZM13 18H11V16H13V18ZM13 14H11V10H13V14Z"
      fill="currentColor"
    />
  </svg>
</template>

<script setup lang="ts">
defineProps<{ alt?: string }>()
</script>
