<script setup lang="ts">
import iconSrc from '@/images/message-add-alt.svg'

withDefaults(defineProps<{ alt?: string }>(), { alt: 'IconNotification' })
</script>

<template>
  <img :src="iconSrc" :alt="alt" class="w-full h-full object-contain" v-bind="$attrs" />
</template>

