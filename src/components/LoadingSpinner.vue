<template>
  <div class="loading-spinner" :class="[size, variant]">
    <svg viewBox="0 0 80 80">
      <circle cx="40" cy="40" r="32"></circle>
    </svg>
  </div>
</template>

<script setup lang="ts">
interface Props {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary'
}

withDefaults(defineProps<Props>(), {
  size: 'md',
  variant: 'primary'
})
</script>

<style scoped>
.loading-spinner {
  --spinner-color: var(--color-primary);
  --spinner-duration: 3s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.loading-spinner.sm {
  width: 24px;
  height: 24px;
}

.loading-spinner.md {
  width: 44px;
  height: 44px;
}

.loading-spinner.lg {
  width: 64px;
  height: 64px;
}

.loading-spinner.secondary {
  --spinner-color: var(--color-secondary);
}

.loading-spinner svg {
  display: block;
  width: 100%;
  height: 100%;
  animation: spin var(--spinner-duration) linear infinite;
}

.loading-spinner circle {
  fill: none;
  stroke: var(--spinner-color);
  stroke-width: 10px;
  stroke-linecap: round;
  stroke-dasharray: 150.7 47.1;
  stroke-dashoffset: 0;
  animation: pathCircle var(--spinner-duration) cubic-bezier(0.785, 0.135, 0.15, 0.86) infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes pathCircle {
  25% {
    stroke-dashoffset: 125;
  }
  50% {
    stroke-dashoffset: 175;
  }
  75% {
    stroke-dashoffset: 225;
  }
  100% {
    stroke-dashoffset: 275;
  }
}
</style>
