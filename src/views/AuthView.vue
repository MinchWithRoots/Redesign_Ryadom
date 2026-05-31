<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { loadCurrentUser } from '../composables/useAppState'
import { supabase } from '@/utils/supabase'
import '@/assets/auth-redesign.css'
import eyeIcon from '@/images/eye.svg'
import eyeSlashIcon from '@/images/eye-slash.svg'
import userHeartIcon from '@/images/user-heart.svg'

const router = useRouter()
const route = useRoute()
const { login, signUp, error } = useAuth()

const isLogin = ref(true)
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const rememberMe = ref(false)

const icons = {
  eye: eyeIcon,
  eyeSlash: eyeSlashIcon,
  userHeart: userHeartIcon,
}

// Watch for errors from useAuth
watch(error, (newError) => {
  if (newError) {
    errorMessage.value = typeof newError === 'string' ? newError : String(newError)
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

// Check if we should show registration form
const updateFormMode = () => {
  isLogin.value = route.query.mode !== 'register'
}

// Watch for changes in route query
watch(() => route.query.mode, () => {
  updateFormMode()
})

// Load remembered credentials on component mount
onMounted(() => {
  updateFormMode()

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

const navigate = (path: string) => {
  router.push(path)
}
</script>

<template>
  <div class="auth-page">
    <!-- Decorative Background -->
    <div class="auth-page__decoration">
      <div class="auth-page__circle auth-page__circle--1"></div>
      <div class="auth-page__circle auth-page__circle--2"></div>
      <div class="auth-page__circle auth-page__circle--3"></div>
      <div class="auth-page__gradient"></div>
    </div>

    <!-- Main Container -->
    <div class="auth-page__container">
      <!-- Left Section - Brand Info (Desktop) -->
      <div class="auth-page__brand">
        <div class="auth-brand__content">
          <!-- Description -->
          <div class="auth-brand__description">
            <h2 class="auth-brand__tagline">Платформа для тех, кто в пути</h2>
            <p class="auth-brand__subtitle">Найди поддержку и помоги другим обрести надежду</p>
          </div>

          <!-- Features List -->
          <div class="auth-brand__features">
            <div class="auth-brand__feature">
              <div class="auth-brand__feature-icon">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="auth-brand__feature-text">
                <h3>Полная конфиденциальность</h3>
                <p>Твои данные защищены современными стандартами</p>
              </div>
            </div>

            <div class="auth-brand__feature">
              <div class="auth-brand__feature-icon">
                <img :src="icons.userHeart" alt="heart" class="auth-brand__feature-icon-img" />
              </div>
              <div class="auth-brand__feature-text">
                <h3>Сообщество поддержки</h3>
                <p>Людей, которые понимают и поддерживают друг друга</p>
              </div>
            </div>

            <div class="auth-brand__feature">
              <div class="auth-brand__feature-icon">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="auth-brand__feature-text">
                <h3>Безопасная система</h3>
                <p>Проверено и надежно защищено экспертами</p>
              </div>
            </div>
          </div>

          <!-- Testimonial -->
          <div class="auth-brand__testimonial">
            <p class="auth-brand__quote">«Наконец-то нашла людей, которые меня понимают. Спасибо за такое безопасное сообщество!»</p>
            <p class="auth-brand__author">— Елена В., пользователь платформы</p>
          </div>
        </div>
      </div>

      <!-- Right Section - Forms -->
      <div class="auth-page__form-section">
        <!-- Form Wrapper -->
        <div class="auth-form">
          <!-- Form Header -->
          <div class="auth-form__header">
            <h1 class="auth-form__title">
              <span v-if="isLogin">Добро пожаловать</span>
              <span v-else>Присоединиться</span>
            </h1>
            <p class="auth-form__subtitle">
              <span v-if="isLogin">Войдите в свой аккаунт для поиска поддержки</span>
              <span v-else>Создайте аккаунт и начните путь к переменам</span>
            </p>
          </div>

          <!-- Messages -->
          <transition name="auth-fade">
            <div v-if="errorMessage" class="auth-message auth-message--error">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
              {{ errorMessage }}
            </div>
          </transition>

          <transition name="auth-fade">
            <div v-if="successMessage" class="auth-message auth-message--success">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              {{ successMessage }}
            </div>
          </transition>

          <!-- Login Form -->
          <form v-if="isLogin" @submit.prevent="handleLogin" class="auth-form__content">
            <!-- Email -->
            <div class="auth-form__group">
              <label class="auth-form__label">Email адрес</label>
              <div class="auth-form__input-wrapper">
                <svg class="auth-form__input-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                <input
                  v-model="loginForm.email"
                  type="email"
                  placeholder="you@example.com"
                  class="auth-form__input"
                />
              </div>
            </div>

            <!-- Password -->
            <div class="auth-form__group">
              <label class="auth-form__label">Пароль</label>
              <div class="auth-form__input-wrapper">
                <svg class="auth-form__input-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
                </svg>
                <input
                  v-model="loginForm.password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="••••••••"
                  class="auth-form__input"
                />
                <button
                  type="button"
                  @click="showPassword = !showPassword"
                  class="auth-form__input-toggle"
                >
                  <svg v-if="showPassword" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
                  </svg>
                  <svg v-else fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clip-rule="evenodd" />
                    <path d="M15.171 13.576l1.414 1.414A10.015 10.015 0 0119.542 10c-1.274-4.057-5.064-7-9.542-7a9.948 9.948 0 00-2.683.357l1.431 1.431A9.987 9.987 0 0110 3c4.478 0 8.268 2.943 9.542 7a9.957 9.957 0 01-.912 1.976z" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Remember & Forgot -->
            <div class="auth-form__row">
              <label class="auth-form__checkbox">
                <input v-model="rememberMe" type="checkbox" />
                <span>Запомнить меня</span>
              </label>
              <button
                type="button"
                @click="handleForgotPassword"
                :disabled="isLoading"
                class="auth-form__link"
              >
                Забыли пароль?
              </button>
            </div>

            <!-- Login Button -->
            <button
              type="submit"
              :disabled="isLoading"
              class="auth-form__button auth-form__button--primary"
            >
              <span v-if="!isLoading">Войти</span>
              <span v-else>
                <span class="auth-form__loader"></span>
                Загрузка...
              </span>
            </button>

            <!-- Register Link -->
            <p class="auth-form__switch">
              Нет аккаунта?
              <button
                type="button"
                @click="isLogin = false"
                class="auth-form__link"
              >
                Зарегистрироваться
              </button>
            </p>
          </form>

          <!-- Register Form -->
          <form v-else @submit.prevent="handleRegister" class="auth-form__content">
            <!-- Full Name -->
            <div class="auth-form__group">
              <label class="auth-form__label">Полное имя</label>
              <div class="auth-form__input-wrapper">
                <svg class="auth-form__input-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                </svg>
                <input
                  v-model="registerForm.fullName"
                  type="text"
                  placeholder="Иван Петров"
                  class="auth-form__input"
                />
              </div>
            </div>

            <!-- Email -->
            <div class="auth-form__group">
              <label class="auth-form__label">Email адрес</label>
              <div class="auth-form__input-wrapper">
                <svg class="auth-form__input-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                <input
                  v-model="registerForm.email"
                  type="email"
                  placeholder="you@example.com"
                  class="auth-form__input"
                />
              </div>
            </div>

            <!-- Password -->
            <div class="auth-form__group">
              <label class="auth-form__label">Пароль</label>
              <div class="auth-form__input-wrapper">
                <svg class="auth-form__input-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
                </svg>
                <input
                  v-model="registerForm.password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="Минимум 6 символов"
                  class="auth-form__input"
                />
                <button
                  type="button"
                  @click="showPassword = !showPassword"
                  class="auth-form__input-toggle"
                >
                  <img v-if="showPassword" :src="icons.eye" alt="show" class="auth-form__input-toggle-icon" />
                  <img v-else :src="icons.eyeSlash" alt="hide" class="auth-form__input-toggle-icon" />
                </button>
              </div>
            </div>

            <!-- Confirm Password -->
            <div class="auth-form__group">
              <label class="auth-form__label">Подтверждение пароля</label>
              <div class="auth-form__input-wrapper">
                <svg class="auth-form__input-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
                </svg>
                <input
                  v-model="registerForm.confirmPassword"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  placeholder="••••••••"
                  class="auth-form__input"
                />
                <button
                  type="button"
                  @click="showConfirmPassword = !showConfirmPassword"
                  class="auth-form__input-toggle"
                >
                  <img v-if="showConfirmPassword" :src="icons.eye" alt="show" class="auth-form__input-toggle-icon" />
                  <img v-else :src="icons.eyeSlash" alt="hide" class="auth-form__input-toggle-icon" />
                </button>
              </div>
            </div>

            <!-- Terms -->
            <label class="auth-form__checkbox auth-form__checkbox--terms">
              <input v-model="registerForm.acceptTerms" type="checkbox" />
              <span>
                Я согласен с
                <button type="button" class="auth-form__link">условиями использования</button>
                и
                <button type="button" class="auth-form__link">политикой конфиденциальности</button>
              </span>
            </label>

            <!-- Register Button -->
            <button
              type="submit"
              :disabled="isLoading"
              class="auth-form__button auth-form__button--primary"
            >
              <span v-if="!isLoading">Создать аккаунт</span>
              <span v-else>
                <span class="auth-form__loader"></span>
                Загрузка...
              </span>
            </button>

            <!-- Login Link -->
            <p class="auth-form__switch">
              Уже есть аккаунт?
              <button
                type="button"
                @click="isLogin = true"
                class="auth-form__link"
              >
                Войти
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-fade-enter-active,
.auth-fade-leave-active {
  transition: all 0.3s ease;
}

.auth-fade-enter-from,
.auth-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
