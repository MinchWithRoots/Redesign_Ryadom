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
      <linearGradient id="iconTickGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#C485FF" />
        <stop offset="100%" stop-color="#7C3AED" />
      </linearGradient>
    </defs>
    <!-- Shield background -->
    <path
      d="M25 4L8 11V24C8 33.9 15.4 43.1 25 46C34.6 43.1 42 33.9 42 24V11L25 4Z"
      fill="url(#iconTickGrad)"
    />
    <!-- Shine overlay -->
    <path
      d="M25 4L14 9V24C14 30.3 18.2 36.8 25 40C18.2 36.8 14 30.3 14 24V11L25 6L36 11V24C36 30.3 31.8 36.8 25 40C31.8 36.8 36 30.3 36 24V9L25 4Z"
      fill="white"
      fill-opacity="0.15"
    />
    <!-- Check mark -->
    <path
      d="M16 25L22 31L34 19"
      stroke="white"
      stroke-width="3.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ alt?: string }>(), { alt: 'shield tick icon' })
</script>
