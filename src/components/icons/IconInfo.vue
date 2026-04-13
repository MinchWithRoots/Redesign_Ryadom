<template>
  <img
    :alt="alt"
    src="https://api.builder.io/api/v1/image/assets/TEMP/8565145ca999d040ac64aca430c4e41d47304dc1?width=48"
    class="w-full h-full object-contain"
    v-bind="$attrs"
  />
</template>

<script setup lang="ts">
withDefaults(defineProps<{ alt?: string }>(), { alt: 'support icon' })
</script>
