<template>
  <transition name="modal">
    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center">
      <!-- Backdrop -->
      <div 
        @click="close"
        class="absolute inset-0 bg-black/50"
      ></div>
      
      <!-- Modal Content -->
      <div class="relative bg-white rounded-3xl shadow-xl p-8 max-w-md mx-4 z-50">
        <!-- Close Button -->
        <button
          @click="close"
          class="absolute top-4 right-4 text-secondary/60 hover:text-secondary transition-colors"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <!-- Icon -->
        <div class="flex justify-center mb-6">
          <div class="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <svg class="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </div>

        <!-- Title -->
        <h2 class="text-2xl font-bold text-secondary text-center mb-3">
          Требуется вход
        </h2>

        <!-- Message -->
        <p class="text-secondary/70 text-center mb-8">
          Чтобы предложить связь спутнику, сначала необходимо войти в аккаунт или зарегистрироваться.
        </p>

        <!-- Buttons -->
        <div class="space-y-3">
          <button
            @click="handleLogin"
            class="w-full py-3 bg-gradient-to-r from-primary to-primary/90 text-white font-semibold rounded-full shadow-soft hover:shadow-hover transition-all"
          >
            Войти
          </button>
          <button
            @click="handleRegister"
            class="w-full py-3 text-primary font-semibold border-2 border-primary rounded-full hover:bg-primary/5 transition-all"
          >
            Зарегистрироваться
          </button>
          <button
            @click="close"
            class="w-full py-3 text-secondary/70 font-semibold border-2 border-border rounded-full hover:border-secondary/70 transition-all"
          >
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

const router = useRouter()
const isOpen = ref(false)

export const openModal = () => {
  isOpen.value = true
}

export const close = () => {
  isOpen.value = false
}

const handleLogin = () => {
  close()
  router.push('/auth')
}

const handleRegister = () => {
  close()
  router.push('/auth')
}
</script>

<style scoped>
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
