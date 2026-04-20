<script setup lang="ts">
import iconSrc from '@/images/globe-alt.svg'

withDefaults(defineProps<{ alt?: string }>(), { alt: 'IconEcosystem' })
</script>

<template>
  <img :src="iconSrc" :alt="alt" class="w-full h-full object-contain" v-bind="$attrs" />
</template>

