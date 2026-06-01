<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { currentUser, loadCurrentUser, logoutUser } from '../composables/useAppState'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const route = useRoute()
const isMobileMenuOpen = ref(false)
const { logout } = useAuth()

const isActive = (path: string) => route.path === path

const navigate = (path: string, query?: Record<string, string>) => {
  router.push({ path, query }).then(() => {
    if (path === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  })
  isMobileMenuOpen.value = false
}

const scrollToSection = (sectionId: string) => {
  const performScroll = () => {
    const element = document.getElementById(sectionId)
    if (element) {
      const headerHeight = 80
      const elementPosition = element.getBoundingClientRect().top + window.scrollY - headerHeight

      // Use smooth scroll
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      })
    }
  }

  if (route.path !== '/') {
    // Navigate to home first, then scroll
    router.push('/').then(() => {
      // Wait for page to render before scrolling
      requestAnimationFrame(() => {
        setTimeout(performScroll, 100)
      })
    })
  } else {
    // Already on home page, scroll directly
    performScroll()
  }

  isMobileMenuOpen.value = false
}

const handleLogout = async () => {
  try {
    await logout()
    await logoutUser()
    router.push('/auth')
  } catch {
    logoutUser()
    router.push('/auth')
  }
}

onMounted(async () => {
  await loadCurrentUser()
})

onUnmounted(() => {})
</script>

<template>
  <header class="site-header">
    <div class="site-header__container">

      <!-- Logo -->
      <div class="site-header__logo" @click="navigate('/')">
        <img
          src="https://api.builder.io/api/v1/image/assets/TEMP/e2792548849e9a9b49ac0d1023b64e6ba4665289?width=92"
          alt="Рядом"
          class="site-header__logo-icon"
        />
        <span class="site-header__logo-text">Рядом</span>
      </div>

      <!-- Desktop Navigation -->
      <nav class="site-header__nav" aria-label="Основная навигация">
        <a
          href="/"
          @click.prevent="navigate('/')"
          :class="['site-header__nav-link', isActive('/') ? 'site-header__nav-link--active' : '']"
        >
          Главная
        </a>
        <button class="site-header__nav-btn" @click="scrollToSection('about')">О нас</button>
        <button class="site-header__nav-btn" @click="scrollToSection('reviews')">Отзывы</button>
        <button class="site-header__nav-btn" @click="scrollToSection('contacts')">Контакты</button>
      </nav>

      <!-- Desktop Auth Buttons -->
      <div class="site-header__actions">
        <template v-if="!currentUser">
          <button class="btn-header-login" @click="navigate('/auth')">Логин</button>
          <button class="btn-header-register" @click="navigate('/auth', { mode: 'register' })">Регистрация</button>
        </template>
        <template v-else>
          <button class="btn-header-login" @click="navigate('/profile')">
            {{ currentUser.name }}
          </button>
          <button class="btn-header-register" @click="handleLogout">Выйти</button>
        </template>
      </div>

      <!-- Mobile Toggle -->
      <button
        :class="['site-header__mobile-toggle', isMobileMenuOpen ? 'is-open' : '']"
        @click="isMobileMenuOpen = !isMobileMenuOpen"
        aria-label="Меню"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
    </div>

    <!-- Mobile Menu -->
    <div v-if="isMobileMenuOpen" class="site-header__mobile-menu">
      <div class="site-header__mobile-menu-inner">
        <a
          href="/"
          @click.prevent="navigate('/')"
          :class="['site-header__mobile-nav-link', isActive('/') ? 'site-header__mobile-nav-link--active' : '']"
        >
          Главная
        </a>
        <button class="site-header__mobile-nav-btn" @click="scrollToSection('about')">О нас</button>
        <button class="site-header__mobile-nav-btn" @click="scrollToSection('reviews')">Отзывы</button>
        <button class="site-header__mobile-nav-btn" @click="scrollToSection('contacts')">Контакты</button>

        <div class="site-header__mobile-actions">
          <template v-if="!currentUser">
            <button class="btn-mobile-login" @click="navigate('/auth')">Логин</button>
            <button class="btn-mobile-register" @click="navigate('/auth', { mode: 'register' })">Регистрация</button>
          </template>
          <template v-else>
            <button class="btn-mobile-login" @click="navigate('/profile')">{{ currentUser.name }}</button>
            <button class="btn-mobile-register" @click="handleLogout">Выйти</button>
          </template>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped></style>
