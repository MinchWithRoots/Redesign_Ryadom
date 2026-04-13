<template>
  <img
    :alt="alt"
    src="https://api.builder.io/api/v1/image/assets/TEMP/d8f1b6cd2b198819050dc1bc9af29c04c02b707a?width=48"
    class="w-full h-full object-contain"
    v-bind="$attrs"
  />
</template>

<script setup lang="ts">
withDefaults(defineProps<{ alt?: string }>(), { alt: 'Ethereum icon' })
</script>
