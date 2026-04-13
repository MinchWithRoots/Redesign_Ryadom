<template>
  <svg
    :alt="alt"
    :class="[
      'w-full h-full',
      $attrs.class
    ]"
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="none"
  >
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ alt?: string }>(), { alt: 'bookmark icon' })
</script>
