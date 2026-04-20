<script setup lang="ts">
import iconSrc from '@/images/lock.svg'

withDefaults(defineProps<{ alt?: string }>(), { alt: 'IconDanger' })
</script>

<template>
  <img :src="iconSrc" :alt="alt" class="w-full h-full object-contain" v-bind="$attrs" />
</template>

