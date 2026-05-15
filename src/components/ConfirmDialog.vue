<template>
  <transition name="dialog-fade">
    <div v-if="isOpen" class="confirm-dialog-overlay">
      <div class="confirm-dialog" :class="{ 'confirm-dialog--danger': isDangerous }">
        <!-- Close button -->
        <button class="confirm-dialog__close" @click="$emit('cancel')">✕</button>

        <!-- Header -->
        <div class="confirm-dialog__header">
          <div class="confirm-dialog__icon-wrapper" :class="{ 'confirm-dialog__icon-wrapper--danger': isDangerous }">
            <span class="confirm-dialog__icon">{{ isDangerous ? '⚠️' : 'ℹ️' }}</span>
          </div>
          <h2 class="confirm-dialog__title">{{ title }}</h2>
        </div>

        <!-- Message -->
        <p class="confirm-dialog__message">{{ message }}</p>

        <!-- Actions -->
        <div class="confirm-dialog__actions">
          <button class="confirm-dialog__btn confirm-dialog__btn--cancel" @click="$emit('cancel')">
            {{ cancelText }}
          </button>
          <button
            class="confirm-dialog__btn confirm-dialog__btn--confirm"
            :class="{ 'confirm-dialog__btn--danger': isDangerous }"
            @click="$emit('confirm')"
          >
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
interface Props {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  isDangerous?: boolean
}

withDefaults(defineProps<Props>(), {
  confirmText: '✓ Подтвердить',
  cancelText: '✕ Отмена',
  isDangerous: false
})

defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<style scoped>
.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: all var(--transition-normal);
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}

.dialog-fade-enter-from .confirm-dialog,
.dialog-fade-leave-to .confirm-dialog {
  transform: scale(0.95);
}

.confirm-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: overlayFade 0.2s ease;
}

@keyframes overlayFade {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.confirm-dialog {
  background-color: var(--color-white);
  border-radius: var(--radius-2xl);
  padding: 2rem;
  max-width: 420px;
  width: 90%;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  position: relative;
  animation: dialogSlideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes dialogSlideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.confirm-dialog--danger {
  border-left: 4px solid #ef4444;
}

.confirm-dialog__close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--color-secondary-60);
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color var(--transition-fast);
  width: 2.5rem;
  height: 2.5rem;
}

.confirm-dialog__close:hover {
  color: var(--color-secondary);
}

.confirm-dialog__header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.confirm-dialog__icon-wrapper {
  width: 3rem;
  height: 3rem;
  border-radius: var(--radius-lg);
  background-color: rgba(255, 106, 47, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.confirm-dialog__icon-wrapper--danger {
  background-color: rgba(239, 68, 68, 0.1);
}

.confirm-dialog__icon {
  font-size: 1.5rem;
}

.confirm-dialog__title {
  font-family: 'Inter', sans-serif;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-secondary);
  margin: 0;
  padding-top: 0.25rem;
}

.confirm-dialog__message {
  font-family: 'Inter', sans-serif;
  font-size: var(--font-size-sm);
  color: var(--color-secondary-70);
  margin: 0 0 1.5rem 0;
  line-height: var(--line-height-relaxed);
  white-space: pre-wrap;
  word-wrap: break-word;
}

.confirm-dialog__actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.confirm-dialog__btn {
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: var(--radius-md);
  font-family: 'Inter', sans-serif;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.confirm-dialog__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.confirm-dialog__btn--cancel {
  background-color: transparent;
  color: var(--color-secondary-60);
  border: 1px solid var(--color-border);
}

.confirm-dialog__btn--cancel:hover:not(:disabled) {
  background-color: var(--color-light-bg);
  color: var(--color-secondary);
}

.confirm-dialog__btn--confirm {
  background-color: var(--color-primary);
  color: var(--color-white);
}

.confirm-dialog__btn--confirm:hover:not(:disabled) {
  background-color: #d32032;
  box-shadow: 0 4px 12px rgba(255, 106, 47, 0.3);
}

.confirm-dialog__btn--danger {
  background-color: #ef4444;
}

.confirm-dialog__btn--danger:hover:not(:disabled) {
  background-color: #dc2626;
}
</style>
