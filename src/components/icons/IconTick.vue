<script setup lang="ts">
import iconSrc from '@/images/shield-tick.svg'

withDefaults(defineProps<{ alt?: string }>(), { alt: 'IconTick' })
</script>

<template>
  <img :src="iconSrc" :alt="alt" class="w-full h-full object-contain" v-bind="$attrs" />
</template>

