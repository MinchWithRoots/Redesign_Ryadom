<template>
  <transition name="fade">
    <div v-if="isVisible" class="loading-overlay">
      <div class="loading-overlay__content">
        <LoaderAnimation type="pulse" size="lg" />
        <p v-if="message" class="loading-overlay__message">{{ message }}</p>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import LoaderAnimation from './LoaderAnimation.vue'

interface Props {
  isLoading: boolean
  message?: string
}

const props = defineProps<Props>()

const isVisible = computed(() => props.isLoading)
</script>

<style scoped>
.loading-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  backdrop-filter: blur(2px);
}

.loading-overlay__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.loading-overlay__message {
  font-family: 'Inter', sans-serif;
  font-size: var(--font-size-sm);
  color: var(--color-secondary);
  margin: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--transition-normal);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
