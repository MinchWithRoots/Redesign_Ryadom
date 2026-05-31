<template>
  <div class="loader-wrapper" :class="`loader-type-${type}`">
    <!-- LOADER TYPE 1: Double border with rotating dots -->
    <div v-if="type === 'dots'" class="loader-dots">
      <div class="loader-dots__border"></div>
      <div class="loader-dots__dot loader-dots__dot--1"></div>
      <div class="loader-dots__dot loader-dots__dot--2"></div>
    </div>

    <!-- LOADER TYPE 2: Path animation with SVG -->
    <div v-else-if="type === 'path'" class="loader-path">
      <div class="loader-path__dot"></div>
      <svg class="loader-path__svg" viewBox="0 0 48 48">
        <polygon points="24,2 46,46 2,46" />
      </svg>
    </div>

    <!-- LOADER TYPE 3: Pulse rings -->
    <div v-else-if="type === 'pulse'" class="loader-pulse">
      <div class="loader-pulse__ring"></div>
      <div class="loader-pulse__ring"></div>
      <div class="loader-pulse__ring"></div>
    </div>

    <!-- LOADER TYPE 4: Gradient spinner -->
    <div v-else-if="type === 'gradient'" class="loader-gradient">
      <svg class="loader-gradient__svg" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" :style="{ stopColor: colors.primary }" />
            <stop offset="100%" :style="{ stopColor: colors.secondary }" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="40" />
      </svg>
    </div>

    <!-- LOADER TYPE 5: Bouncing bars -->
    <div v-else-if="type === 'bars'" class="loader-bars">
      <div class="loader-bars__bar"></div>
      <div class="loader-bars__bar"></div>
      <div class="loader-bars__bar"></div>
    </div>

    <!-- Default: Rotating circle -->
    <div v-else class="loader-circle">
      <svg class="loader-circle__svg" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r="32" />
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    type?: 'dots' | 'path' | 'pulse' | 'gradient' | 'bars' | 'circle'
    size?: 'sm' | 'md' | 'lg'
  }>(),
  {
    type: 'circle',
    size: 'md'
  }
)

const colors = {
  primary: 'var(--color-primary)',
  secondary: 'var(--color-secondary)',
  accent: 'var(--color-accent-orange-light)'
}
</script>

<style scoped>
/* Size variants */
.loader-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.loader-wrapper[class*='loader-type'] {
  --loader-size: 44px;
}

.loader-wrapper[class*='sm'] {
  --loader-size: 24px;
}

.loader-wrapper[class*='md'] {
  --loader-size: 44px;
}

.loader-wrapper[class*='lg'] {
  --loader-size: 64px;
}

/* LOADER 1: Double border with dots */
.loader-dots {
  position: relative;
  width: var(--loader-size);
  height: var(--loader-size);
}

.loader-dots__border {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 4px double var(--color-primary);
  border-radius: 50%;
  animation: ball-turn 1s linear infinite;
}

.loader-dots__dot {
  position: absolute;
  width: 6px;
  height: 6px;
  background: var(--color-primary);
  border-radius: 50%;
  animation: dot-move 1s linear infinite;
}

.loader-dots__dot--1 {
  bottom: 0;
  right: calc(var(--loader-size) / 2 - 3px);
  animation-delay: 0s;
}

.loader-dots__dot--2 {
  top: 0;
  left: calc(var(--loader-size) / 2 - 3px);
  animation-delay: 0.5s;
}

@keyframes ball-turn {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes dot-move {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
  100% {
    opacity: 1;
  }
}

/* LOADER 2: Path animation */
.loader-path {
  position: relative;
  width: var(--loader-size);
  height: var(--loader-size);
}

.loader-path__dot {
  position: absolute;
  width: 4px;
  height: 4px;
  background: var(--color-primary);
  border-radius: 50%;
  top: 50%;
  left: 50%;
  margin-left: -2px;
  margin-top: -2px;
  animation: dot-triangle 1.5s cubic-bezier(0.785, 0.135, 0.15, 0.86) infinite;
}

.loader-path__svg {
  width: 100%;
  height: 100%;
  display: block;
  animation: spin-svg 1.5s linear infinite;
}

.loader-path__svg polygon {
  fill: none;
  stroke: var(--color-secondary);
  stroke-width: 2;
  stroke-linejoin: round;
  stroke-linecap: round;
  stroke-dasharray: 80 80;
  stroke-dashoffset: 0;
  animation: path-dash 1.5s cubic-bezier(0.785, 0.135, 0.15, 0.86) infinite;
}

@keyframes dot-triangle {
  33% {
    transform: translate(0, -8px);
  }
  66% {
    transform: translate(6px, 4px);
  }
  100% {
    transform: translate(-6px, 4px);
  }
}

@keyframes path-dash {
  33% {
    stroke-dashoffset: 40;
  }
  66% {
    stroke-dashoffset: 80;
  }
  100% {
    stroke-dashoffset: 120;
  }
}

@keyframes spin-svg {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* LOADER 3: Pulse rings */
.loader-pulse {
  position: relative;
  width: var(--loader-size);
  height: var(--loader-size);
}

.loader-pulse__ring {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  border: 2px solid var(--color-primary);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: pulse-ring 1.5s ease-out infinite;
}

.loader-pulse__ring:nth-child(2) {
  animation-delay: 0.3s;
}

.loader-pulse__ring:nth-child(3) {
  animation-delay: 0.6s;
}

@keyframes pulse-ring {
  0% {
    transform: translate(-50%, -50%) scale(0.8);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(1.8);
    opacity: 0;
  }
}

/* LOADER 4: Gradient spinner */
.loader-gradient {
  width: var(--loader-size);
  height: var(--loader-size);
  display: flex;
  align-items: center;
  justify-content: center;
}

.loader-gradient__svg {
  width: 100%;
  height: 100%;
  display: block;
  animation: spin-gradient 2s linear infinite;
}

.loader-gradient__svg circle {
  fill: none;
  stroke: url(#gradient);
  stroke-width: 6;
  stroke-linecap: round;
  stroke-dasharray: 188 251;
  stroke-dashoffset: 0;
  animation: gradient-dash 1.5s cubic-bezier(0.785, 0.135, 0.15, 0.86) infinite;
}

@keyframes spin-gradient {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes gradient-dash {
  0% {
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dashoffset: 50;
  }
  100% {
    stroke-dashoffset: 100;
  }
}

/* LOADER 5: Bouncing bars */
.loader-bars {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 3px;
  width: var(--loader-size);
  height: var(--loader-size);
}

.loader-bars__bar {
  width: 20%;
  height: 30%;
  background: linear-gradient(
    to top,
    var(--color-primary),
    var(--color-accent-orange-light)
  );
  border-radius: 2px;
  animation: bar-bounce 1s ease-in-out infinite;
}

.loader-bars__bar:nth-child(1) {
  animation-delay: -0.3s;
}

.loader-bars__bar:nth-child(2) {
  animation-delay: -0.15s;
}

.loader-bars__bar:nth-child(3) {
  animation-delay: 0s;
}

@keyframes bar-bounce {
  0%,
  100% {
    height: 30%;
  }
  50% {
    height: 80%;
  }
}

/* Default: Circle loader */
.loader-circle {
  width: var(--loader-size);
  height: var(--loader-size);
}

.loader-circle__svg {
  width: 100%;
  height: 100%;
  display: block;
  animation: spin-circle 3s linear infinite;
}

.loader-circle__svg circle {
  fill: none;
  stroke: var(--color-primary);
  stroke-width: 4;
  stroke-linecap: round;
  stroke-dasharray: 150.7 47.1;
  stroke-dashoffset: 0;
  animation: circle-dash 3s cubic-bezier(0.785, 0.135, 0.15, 0.86) infinite;
}

@keyframes spin-circle {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes circle-dash {
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
