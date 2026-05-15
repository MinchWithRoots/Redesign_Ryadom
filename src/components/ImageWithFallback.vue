<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  src?: string
  alt?: string
  class?: string
  imageClass?: string
  fallbackClass?: string
  iconClass?: string
}

const props = defineProps<Props>()
const imageError = ref(false)

const handleImageError = () => {
  imageError.value = true
}
</script>

<template>
  <div :class="props.class">
    <img
      v-if="src && !imageError"
      :src="src"
      :alt="alt || 'Image'"
      :class="props.imageClass"
      @error="handleImageError"
    />
    <div v-else :class="props.fallbackClass">
      <img
        src="/src/images/gallery.svg"
        alt="Gallery"
        :class="props.iconClass"
      />
    </div>
  </div>
</template>
