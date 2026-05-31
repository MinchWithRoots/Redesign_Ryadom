<template>
  <div :class="['async-loader', `async-loader--${type}`, `async-loader--${size}`]">
    <!-- SPINNER TYPE -->
    <div v-if="type === 'spinner'" class="loader-spinner-primary" :class="`loader-spinner-primary--${size}`"></div>

    <!-- CIRCLE TYPE -->
    <div v-else-if="type === 'circle'" class="loader-circle-gradient" :class="`loader-circle-gradient--${size}`">
      <svg viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" />
        <circle cx="50" cy="50" r="40" />
      </svg>
    </div>

    <!-- BARS TYPE -->
    <div v-else-if="type === 'bars'" class="loader-bars" :class="`loader-bars--${size}`">
      <div class="loader-bars__item"></div>
      <div class="loader-bars__item"></div>
      <div class="loader-bars__item"></div>
    </div>

    <!-- RINGS TYPE -->
    <div v-else-if="type === 'rings'" class="loader-rings" :class="`loader-rings--${size}`">
      <div class="loader-rings__ring"></div>
      <div class="loader-rings__ring"></div>
      <div class="loader-rings__ring"></div>
    </div>

    <!-- TRIANGLE TYPE -->
    <div v-else-if="type === 'triangle'" class="loader-triangle" :class="`loader-triangle--${size}`">
      <svg viewBox="0 0 48 48">
        <polygon points="24,2 46,46 2,46" />
      </svg>
    </div>

    <!-- TEXT TYPE -->
    <div v-else-if="type === 'text'" class="loader-text">
      <span>{{ text }}</span>
      <span class="loader-text__dot"></span>
      <span class="loader-text__dot"></span>
      <span class="loader-text__dot"></span>
    </div>

    <!-- MESSAGE SKELETON TYPE -->
    <div v-else-if="type === 'message-skeleton'" class="chat-message-loading">
      <div class="chat-message-loading__avatar"></div>
      <div class="chat-message-loading__bubble">
        <div class="chat-message-loading__dot"></div>
        <div class="chat-message-loading__dot"></div>
        <div class="chat-message-loading__dot"></div>
      </div>
    </div>

    <!-- CONTAINER TYPE -->
    <div v-else-if="type === 'container'" class="loader-container">
      <div class="loader-bars loader-bars--sm">
        <div class="loader-bars__item"></div>
        <div class="loader-bars__item"></div>
        <div class="loader-bars__item"></div>
      </div>
      <span v-if="text" class="loader-container__text">{{ text }}</span>
    </div>

    <!-- DEFAULT: CENTERED WITH TEXT -->
    <div v-else class="loader-centered">
      <div class="loader-spinner-primary" :class="`loader-spinner-primary--${size}`"></div>
      <span v-if="text" class="loader-text">
        {{ text }}
        <span class="loader-text__dot"></span>
        <span class="loader-text__dot"></span>
        <span class="loader-text__dot"></span>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    type?: 'spinner' | 'circle' | 'bars' | 'rings' | 'triangle' | 'text' | 'message-skeleton' | 'container' | 'default'
    size?: 'sm' | 'md' | 'lg'
    text?: string
  }>(),
  {
    type: 'default',
    size: 'md',
    text: undefined
  }
)
</script>

<style scoped>
.async-loader {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.async-loader--default {
  flex-direction: column;
  gap: var(--spacing-lg);
}

.async-loader--container {
  width: 100%;
}

.async-loader--message-skeleton {
  width: 100%;
}
</style>
