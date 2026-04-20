<script setup lang="ts">
import iconSrc from '@/images/smile.svg'

withDefaults(defineProps<{ alt?: string }>(), { alt: 'IconStar' })
</script>

<template>
  <img :src="iconSrc" :alt="alt" class="w-full h-full object-contain" v-bind="$attrs" />
</template>

