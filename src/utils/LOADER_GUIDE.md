# Loading Animations Guide

This project includes multiple loading animation options with colors from the site's design system.

## Available Loader Types

### 1. **LoaderAnimation Component** (Full-featured with multiple types)

A flexible component supporting 5+ animation styles.

```vue
<template>
  <LoaderAnimation type="pulse" size="lg" />
</template>

<script setup>
import LoaderAnimation from '@/components/LoaderAnimation.vue'
</script>
```

**Props:**
- `type`: 'dots' | 'path' | 'pulse' | 'gradient' | 'bars' | 'circle' (default: 'circle')
- `size`: 'sm' | 'md' | 'lg' (default: 'md')

**Available Types:**
- `dots`: Double border with rotating dots (like the example provided)
- `path`: Triangle path animation
- `pulse`: Expanding pulse rings
- `gradient`: Gradient spinner
- `bars`: Bouncing bars
- `circle`: Default rotating circle

### 2. **LoadingOverlay Component** (Full-screen loading)

Use for page-level loading operations.

```vue
<template>
  <LoadingOverlay :isLoading="isLoading" message="Загружаются сообщения..." />
</template>

<script setup>
import LoadingOverlay from '@/components/LoadingOverlay.vue'
import { ref } from 'vue'

const isLoading = ref(false)

const loadData = async () => {
  isLoading.value = true
  try {
    // Your async operation
  } finally {
    isLoading.value = false
  }
}
</script>
```

### 3. **LoadingSpinner Component** (Small inline spinner)

For lightweight inline indicators.

```vue
<template>
  <LoadingSpinner size="md" variant="primary" />
</template>

<script setup>
import LoadingSpinner from '@/components/LoadingSpinner.vue'
</script>
```

### 4. **CSS Inline Loaders** (Fastest option)

Use CSS classes for maximum performance with no Vue component overhead.

```html
<!-- Double border with dots loader -->
<div class="loader-inline">
  <div class="loader-inline__border"></div>
  <div class="loader-inline__dot"></div>
  <div class="loader-inline__dot"></div>
</div>

<!-- Pulse rings -->
<div class="loader-pulse-inline">
  <div class="loader-pulse-inline__ring"></div>
  <div class="loader-pulse-inline__ring"></div>
  <div class="loader-pulse-inline__ring"></div>
</div>

<!-- Bouncing dots -->
<div class="loader-bounce-inline">
  <div class="loader-bounce-inline__dot"></div>
  <div class="loader-bounce-inline__dot"></div>
  <div class="loader-bounce-inline__dot"></div>
</div>

<!-- Gradient spinner -->
<div class="loader-gradient-inline"></div>

<!-- Stripe animation -->
<div class="loader-stripe-inline">
  <div class="loader-stripe-inline__bar"></div>
  <div class="loader-stripe-inline__bar"></div>
  <div class="loader-stripe-inline__bar"></div>
</div>
```

### 5. **useLoader Composable** (State management)

Manage loading states with a composable.

```vue
<template>
  <div>
    <button @click="loadData">Load Data</button>
    <LoadingOverlay :isLoading="isLoading" :message="message" />
  </div>
</template>

<script setup>
import { useLoader } from '@/composables/useLoader'
import LoadingOverlay from '@/components/LoadingOverlay.vue'

const { isLoading, message, start, stop, setMessage } = useLoader('Загружается...')

const loadData = async () => {
  start('Загружаются сообщения...', 'pulse')
  try {
    // Your async operation
    setMessage('Обработка данных...')
  } finally {
    stop()
  }
}
</script>
```

## Color Scheme

All loaders use the site's primary colors:

- **Primary**: `#FF6A2F` (Orange)
- **Secondary**: `#5D5A88` (Blue-grey)
- **Accent**: `#FF725E` (Light orange)

Colors are configured via CSS variables: `var(--color-primary)`, `var(--color-secondary)`, `var(--color-accent-orange-light)`

## Usage Examples by Context

### Chat Messages Loading
```vue
<div v-if="isLoadingMessages" class="chat-loading">
  <LoaderAnimation type="dots" size="md" />
  <p>Загружаются сообщения...</p>
</div>
```

### Companions List Loading
```vue
<div v-if="isLoading" class="companions-loading">
  <LoaderAnimation type="pulse" size="lg" />
  <p>Загружаются спутники...</p>
</div>
```

### Reviews Slider Loading
```vue
<div v-if="isLoadingReviews" class="reviews-loading">
  <LoaderAnimation type="bars" size="md" />
  <p>Загружаются отзывы...</p>
</div>
```

### Session History Loading
```vue
<div v-if="isLoadingHistory" class="history-loading">
  <LoaderAnimation type="gradient" size="md" />
  <p>Загружается история...</p>
</div>
```

### Inline Loading (No space to spare)
```vue
<button :disabled="isLoading" @click="submit">
  <span v-if="!isLoading">Отправить</span>
  <span v-else class="loader-inline"></span>
</button>
```

## Animation Timing

- `dots`: 1s
- `path`: 1.5s
- `pulse`: 1.5s
- `gradient`: 2s
- `bars`: 1s
- `circle`: 3s
- Inline loaders: 0.8s - 1.2s

## Best Practices

1. **Use `pulse` for full-screen overlays** - Modern and eye-catching
2. **Use `dots` for section-level loading** - Distinctive and quick
3. **Use `bars` for progress-like operations** - Shows continuous activity
4. **Use CSS classes for inline spinners** - Minimal overhead
5. **Always show loading messages** - Helps users understand what's happening
6. **Keep animations under 2 seconds** - Faster feels more responsive

## Customization

To customize loader colors, update `src/assets/variables.css`:

```css
:root {
  --color-primary: #FF6A2F;
  --color-secondary: #5D5A88;
  --color-accent-orange-light: #FF725E;
}
```

All loaders automatically use these variables.
