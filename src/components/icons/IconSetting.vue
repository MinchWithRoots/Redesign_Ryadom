<template>
  <svg
    :alt="alt"
    :class="[
      'w-full h-full',
      $attrs.class
    ]"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m5.08 5.08l4.24 4.24M1 12h6m6 0h6M4.22 19.78l4.24-4.24m5.08-5.08l4.24-4.24"></path>
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ alt?: string }>(), { alt: 'settings icon' })
</script>
