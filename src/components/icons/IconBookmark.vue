<script setup lang="ts">
import iconSrc from '@/images/heart-add.svg'

withDefaults(defineProps<{ alt?: string }>(), { alt: 'IconBookmark' })
</script>

<template>
  <img :src="iconSrc" :alt="alt" class="w-full h-full object-contain" v-bind="$attrs" />
</template>

