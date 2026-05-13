<template>
  <transition name="modal">
    <div v-if="isOpen" class="auth-modal-overlay">
      <!-- Backdrop -->
      <div 
        @click="close"
        class="auth-modal-backdrop"
      ></div>
      
      <!-- Modal Content -->
      <div class="auth-modal-content">
        <!-- Close Button -->
        <button @click="close" class="auth-modal-close">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <!-- Icon -->
        <div class="auth-modal-icon-container">
          <div class="auth-modal-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </div>

        <!-- Title -->
        <h2 class="auth-modal-title">Требуется вход</h2>

        <!-- Message -->
        <p class="auth-modal-message">
          Чтобы предложить связь спутнику, сначала необходимо войти в аккаунт или зарегистрироваться.
        </p>

        <!-- Buttons -->
        <div class="auth-modal-buttons">
          <button @click="handleLogin" class="auth-modal-btn auth-modal-btn--primary">
            Войти
          </button>
          <button @click="handleRegister" class="auth-modal-btn auth-modal-btn--secondary">
            Зарегистрироваться
          </button>
          <button @click="close" class="auth-modal-btn auth-modal-btn--tertiary">
            Отмена
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import '@/assets/profile.css'

const router = useRouter()
const isOpen = ref(false)

const openModal = () => {
  isOpen.value = true
}

const close = () => {
  isOpen.value = false
}

defineExpose({
  openModal,
  close
})

const handleLogin = () => {
  close()
  router.push('/auth')
}

const handleRegister = () => {
  close()
  router.push({ path: '/auth', query: { mode: 'register' } })
}
</script>

<style scoped>
.auth-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth-modal-backdrop {
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  cursor: pointer;
}

.auth-modal-content {
  position: relative;
  background-color: var(--color-white);
  border-radius: 1.875rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  max-width: 28rem;
  width: calc(100% - 2rem);
  z-index: 50;
}

.auth-modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-secondary-60);
  transition: color var(--transition-fast);
  padding: 0;
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth-modal-close:hover {
  color: var(--color-secondary);
}

.auth-modal-close svg {
  width: 100%;
  height: 100%;
}

.auth-modal-icon-container {
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.auth-modal-icon {
  width: 4rem;
  height: 4rem;
  background-color: rgba(255, 106, 47, 0.1);
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth-modal-icon svg {
  width: 2rem;
  height: 2rem;
  color: var(--color-primary);
}

.auth-modal-title {
  font-size: 1.5rem;
  font-weight: var(--font-weight-bold);
  color: var(--color-secondary);
  text-align: center;
  margin-bottom: 0.75rem;
  font-family: 'Inter', sans-serif;
}

.auth-modal-message {
  color: var(--color-secondary-70);
  text-align: center;
  margin-bottom: 2rem;
  font-family: 'Inter', sans-serif;
  font-size: var(--font-size-sm);
  line-height: var(--line-height-relaxed);
}

.auth-modal-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.auth-modal-btn {
  width: 100%;
  padding: 0.75rem 1.5rem;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  border-radius: 9999px;
  border: none;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  transition: all var(--transition-fast);
}

.auth-modal-btn--primary {
  background: linear-gradient(to right, var(--color-primary), var(--color-primary-dark));
  color: var(--color-white);
  box-shadow: var(--shadow-soft);
}

.auth-modal-btn--primary:hover {
  box-shadow: var(--shadow-hover);
  transform: translateY(-2px);
}

.auth-modal-btn--secondary {
  color: var(--color-primary);
  border: 2px solid var(--color-primary);
  background-color: transparent;
}

.auth-modal-btn--secondary:hover {
  background-color: rgba(255, 106, 47, 0.05);
}

.auth-modal-btn--tertiary {
  color: var(--color-secondary-70);
  border: 2px solid var(--color-border);
  background-color: transparent;
}

.auth-modal-btn--tertiary:hover {
  border-color: var(--color-secondary-70);
  color: var(--color-secondary);
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active :deep(> div:not(:first-child)),
.modal-leave-active :deep(> div:not(:first-child)) {
  transition: transform 0.3s ease;
}

.modal-enter-from :deep(> div:not(:first-child)),
.modal-leave-to :deep(> div:not(:first-child)) {
  transform: scale(0.95);
}
</style>
