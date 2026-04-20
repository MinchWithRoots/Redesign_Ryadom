<script setup lang="ts">
import iconSrc from '@/images/user-story.svg'

withDefaults(defineProps<{ alt?: string }>(), { alt: 'IconMenu' })
</script>

<template>
  <img :src="iconSrc" :alt="alt" class="w-full h-full object-contain" v-bind="$attrs" />
</template>

