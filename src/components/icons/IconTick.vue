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
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ alt?: string }>(), { alt: 'shield tick icon' })
</script>
