<template>
  <img
    :alt="alt"
    src="https://api.builder.io/api/v1/image/assets/TEMP/75018131a27d134c1f68176e38f699391ae43aa0?width=48"
    class="w-full h-full object-contain"
    v-bind="$attrs"
  />
</template>

<script setup lang="ts">
withDefaults(defineProps<{ alt?: string }>(), { alt: 'Solana icon' })
</script>
