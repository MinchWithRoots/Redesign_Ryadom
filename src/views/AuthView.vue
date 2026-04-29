<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { loadCurrentUser } from '../composables/useAppState'
import { supabase } from '@/utils/supabase'

const router = useRouter()
const { login, signUp, error } = useAuth()

const isLogin = ref(true)
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const rememberMe = ref(false)

// Watch for errors from useAuth
watch(error, (newError) => {
  if (newError) {
    errorMessage.value = newError
  }
})

const loginForm = ref({
  email: '',
  password: '',
})

const registerForm = ref({
  email: '',
  password: '',
  confirmPassword: '',
  fullName: '',
  acceptTerms: false,
})

// Load remembered credentials on component mount
onMounted(() => {
  const remembered = localStorage.getItem('rememberMe')
  if (remembered) {
    try {
      const { email, password } = JSON.parse(remembered)
      loginForm.value.email = email
      loginForm.value.password = password
      rememberMe.value = true
    } catch (err) {
      console.error('Error loading remembered credentials:', err)
    }
  }
})

const handleLogin = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  if (!loginForm.value.email || !loginForm.value.password) {
    errorMessage.value = 'Пожалуйста, заполните все поля'
    return
  }

  isLoading.value = true
  try {
    await login(loginForm.value.email, loginForm.value.password)
    successMessage.value = 'Вы успешно вошли!'

    // Save credentials if "remember me" is checked
    if (rememberMe.value) {
      localStorage.setItem('rememberMe', JSON.stringify({
        email: loginForm.value.email,
        password: loginForm.value.password,
      }))
    } else {
      // Clear saved credentials if unchecked
      localStorage.removeItem('rememberMe')
    }

    // Clear form
    loginForm.value = {
      email: '',
      password: '',
    }
    // Load current user from database
    await loadCurrentUser()
    setTimeout(() => {
      router.push('/profile')
    }, 500)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Ошибка входа'
    errorMessage.value = message
    console.error('Login error:', message)
  } finally {
    isLoading.value = false
  }
}

const handleRegister = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  // Trim whitespace from inputs
  const email = registerForm.value.email.trim().toLowerCase()
  const fullName = registerForm.value.fullName.trim()
  const password = registerForm.value.password

  if (!fullName || !email || !password) {
    errorMessage.value = 'Пожалуйста, заполните все поля'
    return
  }

  // Simple email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    errorMessage.value = 'Пожалуйста, введите корректный email адрес'
    return
  }

  if (password !== registerForm.value.confirmPassword) {
    errorMessage.value = 'Пароли не совпадают'
    return
  }

  if (password.length < 6) {
    errorMessage.value = 'Пароль должен быть не менее 6 символов'
    return
  }

  if (!registerForm.value.acceptTerms) {
    errorMessage.value = 'Вы должны согласиться с условиями использования'
    return
  }

  isLoading.value = true
  try {
    await signUp(email, password, fullName)
    successMessage.value = 'Аккаунт создан успешно!'
    // Clear form
    registerForm.value = {
      email: '',
      password: '',
      confirmPassword: '',
      fullName: '',
      acceptTerms: false,
    }
    // Load current user from database
    await loadCurrentUser()
    setTimeout(() => {
      router.push('/profile-setup')
    }, 500)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Ошибка регистрации'
    errorMessage.value = message
    console.error('Registration error:', message)
  } finally {
    isLoading.value = false
  }
}

const handleForgotPassword = async () => {
  const email = loginForm.value.email
  if (!email) {
    errorMessage.value = 'Пожалуйста, введите ваш email'
    return
  }

  isLoading.value = true
  try {
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (resetError) {
      throw new Error(resetError.message)
    }

    successMessage.value = 'Письмо для сброса пароля отправлено на ваш email'
    errorMessage.value = ''
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Ошибка при отправке письма'
    errorMessage.value = message
    console.error('Forgot password error:', message)
  } finally {
    isLoading.value = false
  }
}

const handleGoogleLogin = async () => {
  try {
    isLoading.value = true
    errorMessage.value = ''

    const { data, error: googleError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (googleError) {
      throw new Error(googleError.message)
    }

    if (data.url) {
      // Redirect to Google OAuth flow
      window.location.href = data.url
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Ошибка при входе через Google'
    errorMessage.value = message
    console.error('Google login error:', message)
    isLoading.value = false
  }
}

const navigate = (path: string) => {
  router.push(path)
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-white to-light-bg pt-[140px] pb-16 flex items-center">
    <div class="container mx-auto px-4 max-w-md">
      <div class="mb-12 text-center">
        <h1 class="text-4xl font-bold text-secondary mb-3">
          <span v-if="isLogin">Добро пожаловать</span>
          <span v-else>Присоединиться</span>
        </h1>
        <p class="text-secondary/60">
          <span v-if="isLogin">Войдите, чтобы продолжить поиск поддержки</span>
          <span v-else>Создайте аккаунт для начала</span>
        </p>
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

        <!-- Login Form -->
        <form v-if="isLogin" @submit.prevent="handleLogin" class="space-y-6">
          <!-- Email -->
          <div class="space-y-2">
            <label class="text-sm font-semibold text-secondary block">Email адрес</label>
            <input
              v-model="loginForm.email"
              type="email"
              placeholder="your@email.com"
              class="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-secondary"
            />
          </div>

          <!-- Password -->
          <div class="space-y-2">
            <label class="text-sm font-semibold text-secondary block">Пароль</label>
            <div class="relative">
              <input
                v-model="loginForm.password"
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

          <!-- Remember & Forgot -->
          <div class="flex items-center justify-between text-sm">
            <label class="flex items-center gap-2 cursor-pointer">
              <input v-model="rememberMe" type="checkbox" class="w-4 h-4 accent-primary rounded" />
              <span class="text-secondary/70">Запомнить меня</span>
            </label>
            <button
              type="button"
              @click="handleForgotPassword"
              :disabled="isLoading"
              class="text-primary hover:text-primary/80 transition-colors font-medium disabled:opacity-50"
            >
              Забыли пароль?
            </button>
          </div>

          <!-- Login Button -->
          <button
            type="submit"
            :disabled="isLoading"
            class="w-full py-3 bg-gradient-to-r from-primary to-primary/90 text-white font-semibold rounded-full shadow-soft hover:shadow-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="!isLoading">Войти</span>
            <span v-else>Загрузка...</span>
          </button>

          <!-- Divider -->
          <div class="relative my-6">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-border"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-white text-secondary/60">или</span>
            </div>
          </div>

          <!-- Social Login -->
          <button
            type="button"
            @click="handleGoogleLogin"
            :disabled="isLoading"
            class="w-full py-3 border-2 border-border rounded-full text-secondary font-semibold hover:border-primary hover:text-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span v-if="!isLoading">Войти через Google</span>
            <span v-else>Загрузка...</span>
          </button>

          <!-- Register Link -->
          <p class="text-center text-secondary/70 text-sm">
            Нет аккаунта?
            <button
              type="button"
              @click="isLogin = false"
              class="text-primary font-semibold hover:text-primary/80 transition-colors"
            >
              Зарегистрироваться
            </button>
          </p>
        </form>

        <!-- Register Form -->
        <form v-else @submit.prevent="handleRegister" class="space-y-4">
          <!-- Full Name -->
          <div class="space-y-2">
            <label class="text-sm font-semibold text-secondary block">Полное имя</label>
            <input
              v-model="registerForm.fullName"
              type="text"
              placeholder="Иван Петров"
              class="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-secondary"
            />
          </div>

          <!-- Email -->
          <div class="space-y-2">
            <label class="text-sm font-semibold text-secondary block">Email адрес</label>
            <input
              v-model="registerForm.email"
              type="email"
              placeholder="your@email.com"
              class="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-secondary"
            />
          </div>

          <!-- Password -->
          <div class="space-y-2">
            <label class="text-sm font-semibold text-secondary block">Пароль</label>
            <div class="relative">
              <input
                v-model="registerForm.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Минимум 8 символов"
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
                v-model="registerForm.confirmPassword"
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

          <!-- Terms -->
          <label class="flex items-start gap-3 cursor-pointer mt-4">
            <input
              v-model="registerForm.acceptTerms"
              type="checkbox"
              class="w-4 h-4 mt-1 accent-primary rounded"
            />
            <span class="text-xs text-secondary/70">
              Я согласен с
              <button type="button" class="text-primary hover:underline">условиями использования</button>
              и
              <button type="button" class="text-primary hover:underline">политикой конфиденциальности</button>
            </span>
          </label>

          <!-- Register Button -->
          <button
            type="submit"
            :disabled="isLoading"
            class="w-full py-3 bg-gradient-to-r from-primary to-primary/90 text-white font-semibold rounded-full shadow-soft hover:shadow-hover transition-all mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="!isLoading">Создать аккаунт</span>
            <span v-else>Загрузка...</span>
          </button>

          <!-- Login Link -->
          <p class="text-center text-secondary/70 text-sm mt-4">
            Уже есть аккаунт?
            <button
              type="button"
              @click="isLogin = true"
              class="text-primary font-semibold hover:text-primary/80 transition-colors"
            >
              Войти
            </button>
          </p>
        </form>
      </div>

      <!-- Security Info -->
      <div class="mt-8 grid grid-cols-3 gap-4 text-center text-xs text-secondary/60">
        <div class="flex flex-col items-center gap-2">
          <svg class="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
          </svg>
          Защита данных
        </div>
        <div class="flex flex-col items-center gap-2">
          <svg class="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
          Проверено
        </div>
        <div class="flex flex-col items-center gap-2">
          <svg class="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          Надёжная
        </div>
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
