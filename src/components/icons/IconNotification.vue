<template>
  <img
    :alt="alt"
    src="https://api.builder.io/api/v1/image/assets/TEMP/464136a664cc2f328e0eac65f4c6ab300814fcc9?width=48"
    class="w-full h-full object-contain"
    v-bind="$attrs"
  />
</template>

<script setup lang="ts">
withDefaults(defineProps<{ alt?: string }>(), { alt: 'NFT add icon' })
</script>
