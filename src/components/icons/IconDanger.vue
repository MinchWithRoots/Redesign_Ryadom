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
      <linearGradient id="iconDangerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#C485FF" />
        <stop offset="100%" stop-color="#7C3AED" />
      </linearGradient>
    </defs>
    <!-- Shield shape -->
    <path
      d="M25 4L8 11V24C8 33.9 15.4 43.1 25 46C34.6 43.1 42 33.9 42 24V11L25 4Z"
      fill="url(#iconDangerGrad)"
    />
    <!-- Shield shine -->
    <path
      d="M25 4L14 9V24C14 30.3 18.2 36.8 25 40C25 40 14 33 14 24V11L25 6L36 11V24C36 33 25 40 25 40C31.8 36.8 36 30.3 36 24V9L25 4Z"
      fill="white"
      fill-opacity="0.15"
    />
    <!-- Lock icon inside shield -->
    <rect x="19" y="24" width="12" height="9" rx="2" fill="white" fill-opacity="0.9" />
    <path
      d="M20.5 24V21C20.5 18.5 22.2 17 25 17C27.8 17 29.5 18.5 29.5 21V24"
      stroke="white"
      stroke-opacity="0.9"
      stroke-width="2.5"
      stroke-linecap="round"
    />
    <circle cx="25" cy="28.5" r="1.5" fill="url(#iconDangerGrad)" />
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ alt?: string }>(), { alt: 'shield icon' })
</script>
