<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { currentUser, loadCurrentUser, logoutUser } from '../composables/useAppState'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const route = useRoute()
const isMobileMenuOpen = ref(false)
const isScrolled = ref(false)
const { logout } = useAuth()

const isHomePage = computed(() => route.path === '/')
const isTransparent = computed(() => isHomePage.value && !isScrolled.value)

onMounted(async () => {
  await loadCurrentUser()
  handleScroll()
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

const handleScroll = () => {
  isScrolled.value = window.scrollY > 60
}

const isActive = (path: string) => route.path === path

const navigate = (path: string, query?: Record<string, string>) => {
  router.push({ path, query })
  isMobileMenuOpen.value = false
}

const scrollToSection = (sectionId: string) => {
  if (route.path !== '/') {
    router.push('/').then(() => {
      setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    })
  } else {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' })
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
</script>

<template>
  <header
    :class="[
      'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
      isTransparent
        ? 'bg-transparent h-[80px]'
        : 'bg-white/90 backdrop-blur-md shadow-card border-b border-border/30 h-[80px]'
    ]"
  >
    <div class="container mx-auto px-4 lg:px-8 w-full h-full flex items-center justify-between">
      <!-- Logo -->
      <div
        class="flex items-center gap-2.5 cursor-pointer transition-opacity hover:opacity-80"
        @click="navigate('/')"
      >
        <span
          :class="[
            'text-2xl font-bold font-inter transition-colors',
            isTransparent ? 'text-white' : 'text-secondary'
          ]"
        >
          Рядом
        </span>
      </div>

      <!-- Desktop Navigation -->
      <nav class="hidden lg:flex items-center gap-8">
        <a
          href="/"
          @click.prevent="navigate('/')"
          :class="[
            'text-base font-medium transition-colors',
            isTransparent
              ? (isActive('/') ? 'text-white font-semibold' : 'text-white/80 hover:text-white')
              : (isActive('/') ? 'text-primary' : 'text-secondary hover:text-primary')
          ]"
        >
          Главная
        </a>
        <button
          @click="scrollToSection('about')"
          :class="[
            'text-base font-medium transition-colors',
            isTransparent ? 'text-white/80 hover:text-white' : 'text-secondary hover:text-primary'
          ]"
        >
          О нас
        </button>
        <button
          @click="scrollToSection('reviews')"
          :class="[
            'text-base font-medium transition-colors',
            isTransparent ? 'text-white/80 hover:text-white' : 'text-secondary hover:text-primary'
          ]"
        >
          Отзывы
        </button>
        <button
          @click="scrollToSection('contacts')"
          :class="[
            'text-base font-medium transition-colors',
            isTransparent ? 'text-white/80 hover:text-white' : 'text-secondary hover:text-primary'
          ]"
        >
          Контакты
        </button>
      </nav>

      <!-- Desktop Buttons -->
      <div class="hidden lg:flex items-center gap-3">
        <template v-if="!currentUser">
          <button
            @click="navigate('/auth')"
            :class="[
              'px-6 py-2.5 text-sm font-semibold rounded-full border-2 transition-all',
              isTransparent
                ? 'border-white/60 text-white hover:border-white hover:bg-white/10'
                : 'border-primary text-secondary hover:bg-primary/5'
            ]"
          >
            Логин
          </button>
          <button
            @click="navigate('/auth', { mode: 'register' })"
            class="px-6 py-2.5 text-sm font-semibold bg-gradient-to-r from-[#FF6330] to-[#D32032] text-white rounded-full shadow-soft hover:shadow-hover hover:-translate-y-px transition-all"
          >
            Регистрация
          </button>
        </template>
        <template v-else>
          <button
            @click="navigate('/profile')"
            :class="[
              'px-6 py-2.5 text-sm font-semibold rounded-full border-2 transition-all',
              isTransparent
                ? 'border-white/60 text-white hover:border-white hover:bg-white/10'
                : 'border-border text-secondary hover:border-primary hover:text-primary'
            ]"
          >
            {{ currentUser.name }}
          </button>
          <button
            @click="handleLogout"
            class="px-6 py-2.5 text-sm font-semibold bg-gradient-to-r from-[#FF6330] to-[#D32032] text-white rounded-full shadow-soft hover:shadow-hover hover:-translate-y-px transition-all"
          >
            Выйти
          </button>
        </template>
      </div>

      <!-- Mobile Menu Button -->
      <button
        @click="isMobileMenuOpen = !isMobileMenuOpen"
        class="lg:hidden flex flex-col gap-1.5 w-10 h-10 items-center justify-center"
        aria-label="Меню"
      >
        <span
          :class="[
            'w-6 h-0.5 transition-all',
            isTransparent ? 'bg-white' : 'bg-secondary',
            isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''
          ]"
        ></span>
        <span
          :class="[
            'w-6 h-0.5 transition-all',
            isTransparent ? 'bg-white' : 'bg-secondary',
            isMobileMenuOpen ? 'opacity-0' : ''
          ]"
        ></span>
        <span
          :class="[
            'w-6 h-0.5 transition-all',
            isTransparent ? 'bg-white' : 'bg-secondary',
            isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''
          ]"
        ></span>
      </button>
    </div>

    <!-- Mobile Menu -->
    <div
      v-if="isMobileMenuOpen"
      class="lg:hidden absolute top-[80px] left-0 right-0 bg-white border-t border-border shadow-card"
    >
      <nav class="flex flex-col p-4 gap-3">
        <a
          href="/"
          @click.prevent="navigate('/')"
          class="text-secondary font-medium py-2 hover:text-primary transition-colors"
        >
          Главная
        </a>
        <button
          @click="scrollToSection('about')"
          class="text-secondary font-medium py-2 hover:text-primary transition-colors text-left"
        >
          О нас
        </button>
        <button
          @click="scrollToSection('reviews')"
          class="text-secondary font-medium py-2 hover:text-primary transition-colors text-left"
        >
          Отзывы
        </button>
        <button
          @click="scrollToSection('contacts')"
          class="text-secondary font-medium py-2 hover:text-primary transition-colors text-left"
        >
          Контакты
        </button>
        <div class="flex flex-col gap-2 pt-2 border-t border-border">
          <template v-if="!currentUser">
            <button
              @click="navigate('/auth')"
              class="w-full px-6 py-2.5 text-secondary font-semibold border-2 border-border rounded-full hover:border-primary hover:text-primary transition-colors"
            >
              Логин
            </button>
            <button
              @click="navigate('/auth', { mode: 'register' })"
              class="w-full px-6 py-3 bg-gradient-to-r from-[#FF6330] to-[#D32032] text-white font-semibold rounded-full shadow-soft hover:shadow-hover transition-all"
            >
              Регистрация
            </button>
          </template>
          <template v-else>
            <button
              @click="navigate('/profile')"
              class="w-full px-6 py-2.5 text-secondary font-semibold border-2 border-border rounded-full hover:border-primary hover:text-primary transition-colors"
            >
              {{ currentUser.name }}
            </button>
            <button
              @click="handleLogout"
              class="w-full px-6 py-3 bg-gradient-to-r from-[#FF6330] to-[#D32032] text-white font-semibold rounded-full shadow-soft hover:shadow-hover transition-all"
            >
              Выйти
            </button>
          </template>
        </div>
      </nav>
    </div>
  </header>
</template>

<style scoped></style>
