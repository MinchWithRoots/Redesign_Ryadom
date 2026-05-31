<template>
  <transition name="dialog-fade">
    <div v-if="isOpen" class="confirm-dialog-overlay">
      <div class="confirm-dialog">
        <!-- Close button -->
        <button class="confirm-dialog__close" @click="$emit('cancel')">✕</button>

        <!-- Center section with title and message -->
        <div class="confirm-dialog__center">
          <h2 class="confirm-dialog__title">{{ title }}</h2>
          <p class="confirm-dialog__message">{{ message }}</p>
        </div>

        <!-- Actions -->
        <div class="confirm-dialog__actions">
          <button
            class="confirm-dialog__btn confirm-dialog__btn--secondary"
            @click="$emit('cancel')"
          >
            {{ cancelText }}
          </button>
          <button
            class="confirm-dialog__btn confirm-dialog__btn--primary"
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

const props = withDefaults(defineProps<Props>(), {
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
  transform: translateY(-20px);
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
}

.confirm-dialog {
  background-color: var(--color-white);
  border-radius: 1.875rem;
  padding: 2rem;
  max-width: 448px;
  width: 100%;
  margin: 0 1rem;
  box-shadow: var(--shadow-lg);
  position: relative;
  animation: dialogSlideUp 0.3s ease;
}

@keyframes dialogSlideUp {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.confirm-dialog__close {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--color-secondary-70);
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color var(--transition-fast);
  width: 1.5rem;
  height: 1.5rem;
  line-height: 1;
}

.confirm-dialog__close:hover {
  color: var(--color-secondary);
}

.confirm-dialog__center {
  text-align: center;
  margin-bottom: 1.5rem;
  margin-top: 0.5rem;
}

.confirm-dialog__title {
  font-family: 'Inter', sans-serif;
  font-size: 1.5rem;
  font-weight: var(--font-weight-bold);
  color: var(--color-secondary);
  margin: 0 0 0.75rem 0;
}

.confirm-dialog__message {
  font-family: 'Inter', sans-serif;
  font-size: var(--font-size-sm);
  color: var(--color-secondary-70);
  margin: 0;
  line-height: var(--line-height-relaxed);
}

.confirm-dialog__actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.confirm-dialog__btn {
  padding: 0.75rem 1rem;
  border: none;
  border-radius: var(--radius-full);
  font-family: 'Inter', sans-serif;
  font-size: 1rem;
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.confirm-dialog__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.confirm-dialog__btn--secondary {
  color: var(--color-secondary);
  border: 2px solid var(--color-border);
  background-color: transparent;
}

.confirm-dialog__btn--secondary:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.confirm-dialog__btn--primary {
  background: linear-gradient(to right, var(--color-accent-orange), var(--color-accent-red));
  color: var(--color-white);
  box-shadow: var(--shadow-gradient);
}

.confirm-dialog__btn--primary:hover:not(:disabled) {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}

.confirm-dialog__btn--danger {
  background: linear-gradient(to right, #ef4444, #dc2626);
  box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);
}

.confirm-dialog__btn--danger:hover:not(:disabled) {
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}
</style>
