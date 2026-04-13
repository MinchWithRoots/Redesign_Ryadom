<template>
  <img 
    :src="iconUrl" 
    :alt="alt"
    :class="iconClass"
    v-bind="$attrs"
  />
</template>

<script setup lang="ts">
interface Props {
  alt?: string
  class?: string
}

withDefaults(defineProps<Props>(), {
  alt: 'Info icon',
  class: 'w-6 h-6',
})

const iconUrl = 'https://cdn.builder.io/api/v1/image/assets%2F4b9bcc88186042bd97cdfb19b0955a4d%2F1199ed5162644c8b9108d058fcf9371a?format=webp&width=800&height=1200'
const iconClass = 'w-6 h-6'
</script>
