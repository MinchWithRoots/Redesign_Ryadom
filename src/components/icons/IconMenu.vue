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
      <linearGradient id="iconMenuGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#C485FF" />
        <stop offset="100%" stop-color="#7C3AED" />
      </linearGradient>
      <linearGradient id="iconMenuGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#A855F7" stop-opacity="0.6" />
        <stop offset="100%" stop-color="#6D28D9" stop-opacity="0.6" />
      </linearGradient>
    </defs>
    <!-- Back bubble -->
    <path
      d="M38 8C41.866 8 45 11.134 45 15V29C45 32.866 41.866 36 38 36H36L34 42L30 36H22C18.134 36 15 32.866 15 29V27"
      fill="url(#iconMenuGrad2)"
      rx="10"
    />
    <!-- Main bubble -->
    <rect x="2" y="4" width="36" height="28" rx="10" fill="url(#iconMenuGrad)" />
    <!-- Tail -->
    <path d="M10 32L6 40L16 34" fill="url(#iconMenuGrad)" />
    <!-- Dots -->
    <circle cx="11" cy="18" r="2.5" fill="white" />
    <circle cx="20" cy="18" r="2.5" fill="white" />
    <circle cx="29" cy="18" r="2.5" fill="white" />
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ alt?: string }>(), { alt: 'messages icon' })
</script>
