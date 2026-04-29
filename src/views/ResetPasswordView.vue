<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { supabase } from '@/utils/supabase'

const router = useRouter()
const route = useRoute()

const showPassword = ref(false)
const showConfirmPassword = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const resetForm = ref({
  password: '',
  confirmPassword: '',
})

const handleResetPassword = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  if (!resetForm.value.password || !resetForm.value.confirmPassword) {
    errorMessage.value = 'Пожалуйста, заполните все поля'
    return
  }

  if (resetForm.value.password !== resetForm.value.confirmPassword) {
    errorMessage.value = 'Пароли не совпадают'
    return
  }

  if (resetForm.value.password.length < 6) {
    errorMessage.value = 'Пароль должен быть не менее 6 символов'
    return
  }

  isLoading.value = true
  try {
    const { error } = await supabase.auth.updateUser({
      password: resetForm.value.password,
    })

    if (error) {
      throw new Error(error.message)
    }

    successMessage.value = 'Пароль успешно изменен! Перенаправление на вход...'
    
    // Clear form
    resetForm.value = {
      password: '',
      confirmPassword: '',
    }

    // Redirect to auth page after 2 seconds
    setTimeout(() => {
      router.push('/auth')
    }, 2000)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Ошибка при изменении пароля'
    errorMessage.value = message
    console.error('Reset password error:', message)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-white to-light-bg pt-[140px] pb-16 flex items-center">
    <div class="container mx-auto px-4 max-w-md">
      <div class="mb-12 text-center">
        <h1 class="text-4xl font-bold text-secondary mb-3">Сброс пароля</h1>
        <p class="text-secondary/60">Введите новый пароль для вашего аккаунта</p>
      </div>

      <!-- Form Container -->
      <div class="card">
        <!-- Error Message -->
        <transition name="fade">
          <div v-if="errorMessage" class="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            {{ errorMessage }}
          </div>
        </transition>

        <!-- Success Message -->
        <transition name="fade">
          <div v-if="successMessage" class="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm">
            {{ successMessage }}
          </div>
        </transition>

        <!-- Reset Form -->
        <form @submit.prevent="handleResetPassword" class="space-y-6">
          <!-- New Password -->
          <div class="space-y-2">
            <label class="text-sm font-semibold text-secondary block">Новый пароль</label>
            <div class="relative">
              <input
                v-model="resetForm.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="••••••••"
                class="w-full px-4 py-3 pr-12 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-secondary"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-4 top-1/2 -translate-y-1/2 text-secondary/50 hover:text-secondary transition-colors"
              >
                <svg v-if="showPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Confirm Password -->
          <div class="space-y-2">
            <label class="text-sm font-semibold text-secondary block">Подтверждение пароля</label>
            <div class="relative">
              <input
                v-model="resetForm.confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                placeholder="••••••••"
                class="w-full px-4 py-3 pr-12 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-secondary"
              />
              <button
                type="button"
                @click="showConfirmPassword = !showConfirmPassword"
                class="absolute right-4 top-1/2 -translate-y-1/2 text-secondary/50 hover:text-secondary transition-colors"
              >
                <svg v-if="showConfirmPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Reset Button -->
          <button
            type="submit"
            :disabled="isLoading"
            class="w-full py-3 bg-gradient-to-r from-primary to-primary/90 text-white font-semibold rounded-full shadow-soft hover:shadow-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="!isLoading">Изменить пароль</span>
            <span v-else>Загрузка...</span>
          </button>

          <!-- Back to Login -->
          <p class="text-center text-secondary/70 text-sm">
            <button
              type="button"
              @click="$router.push('/auth')"
              class="text-primary font-semibold hover:text-primary/80 transition-colors"
            >
              Вернуться к входу
            </button>
          </p>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
