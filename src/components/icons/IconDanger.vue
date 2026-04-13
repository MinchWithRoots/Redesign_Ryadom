<template>
  <img
    :src="iconUrl"
    :alt="alt"
    class="w-full h-full object-contain"
    v-bind="$attrs"
  />
</template>

<script setup lang="ts">
interface Props {
  alt?: string
}

withDefaults(defineProps<Props>(), {
  alt: 'Danger icon',
})

const iconUrl = 'https://cdn.builder.io/api/v1/image/assets%2F4b9bcc88186042bd97cdfb19b0955a4d%2Fd08671566c2b4bd799b194e4bf6d64d6?format=webp&width=800&height=1200'
</script>
