<script setup lang="ts">
import iconSrc from '@/images/support.svg'

withDefaults(defineProps<{ alt?: string }>(), { alt: 'IconSupport' })
</script>

<template>
  <img :src="iconSrc" :alt="alt" class="w-full h-full object-contain" v-bind="$attrs" />
</template>

