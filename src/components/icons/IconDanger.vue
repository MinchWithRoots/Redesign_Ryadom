<template>
  <img
    :alt="alt"
    src="https://api.builder.io/api/v1/image/assets/TEMP/02fde8486730c41b46f6ffb2a7837774e7df6011?width=48"
    class="w-full h-full object-contain"
    v-bind="$attrs"
  />
</template>

<script setup lang="ts">
withDefaults(defineProps<{ alt?: string }>(), { alt: 'shield icon' })
</script>
