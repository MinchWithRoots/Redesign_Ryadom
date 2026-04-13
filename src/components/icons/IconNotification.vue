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
  alt: 'Notification icon',
})

const iconUrl = 'https://cdn.builder.io/api/v1/image/assets%2F4b9bcc88186042bd97cdfb19b0955a4d%2F7df7af3116db4b5e9be549829cd92c8c?format=webp&width=800&height=1200'
</script>
