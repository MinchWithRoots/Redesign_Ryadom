<template>
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    v-bind="$attrs"
  >
    <!-- Rounded background -->
    <rect width="24" height="24" rx="6" fill="currentColor" opacity="0.1" />
    <!-- Bell icon -->
    <path
      d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.89 22 12 22ZM18 16V10C18 7.93 16.88 6.12 15.12 5.29V5C15.12 4.45 14.67 4 14.12 4C13.57 4 13.12 4.45 13.12 5V5.29C11.36 6.12 10.24 7.93 10.24 10V16L8 18V19H16V18L14 16H18Z"
      fill="currentColor"
    />
  </svg>
</template>

<script setup lang="ts">
defineProps<{ alt?: string }>()
</script>
