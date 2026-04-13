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
  alt: 'Tick icon',
})

const iconUrl = 'https://cdn.builder.io/api/v1/image/assets%2F4b9bcc88186042bd97cdfb19b0955a4d%2F22b1f3fa71364c349ce7aef2619c1bf9?format=webp&width=800&height=1200'
</script>
