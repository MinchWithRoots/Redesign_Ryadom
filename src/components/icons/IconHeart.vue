<script setup lang="ts">
import iconSrc from '@/images/heart.svg'

withDefaults(defineProps<{ alt?: string }>(), { alt: 'IconHeart' })
</script>

<template>
  <img :src="iconSrc" :alt="alt" class="w-full h-full object-contain" v-bind="$attrs" />
</template>

