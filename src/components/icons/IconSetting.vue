<script setup lang="ts">
import iconSrc from '@/images/settings.svg'

withDefaults(defineProps<{ alt?: string }>(), { alt: 'IconSetting' })
</script>

<template>
  <img :src="iconSrc" :alt="alt" class="w-full h-full object-contain" v-bind="$attrs" />
</template>

