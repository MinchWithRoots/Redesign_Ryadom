<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { currentUser, logoutUser, loadCurrentUser } from '../composables/useAppState'
import logo from '../assets/logo.svg'

const router = useRouter()
const route = useRoute()
const isMobileMenuOpen = ref(false)

// Проверить, залогинен ли пользователь
onMounted(async () => {
  await loadCurrentUser()
})

const isActive = (path: string) => route.path === path

const navigate = (path: string) => {
  router.push(path)
  isMobileMenuOpen.value = false
}

const handleLogout = () => {
  logoutUser()
  router.push('/auth')
}

const navItems = [
  { name: 'Главная', path: '/' },
  { name: 'О нас', path: '/#about' },
  { name: 'Отзывы', path: '/#reviews' },
  { name: 'Контакты', path: '/#contacts' },
]
</script>

<template>
  <header class="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md shadow-card z-50 h-[118px] flex items-center border-b border-border/30">
    <div class="container mx-auto px-4 lg:px-8 w-full flex items-center justify-between">
      <!-- Logo -->
      <div class="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" @click="navigate('/')">
        <img :src="logo" alt="Рядом" class="w-12 h-12" />
        <span class="text-2xl font-bold text-secondary">Рядом</span>
      </div>

      <!-- Desktop Navigation -->
      <nav class="hidden lg:flex items-center gap-8">
        <a
          href="/"
          @click.prevent="navigate('/')"
          :class="[
            'text-lg font-medium transition-colors',
            isActive('/') ? 'text-primary' : 'text-secondary hover:text-primary'
          ]"
        >
          Главная
        </a>
        <a
          href="/#about"
          @click.prevent="navigate('/')"
          :class="[
            'text-lg font-medium transition-colors text-secondary hover:text-primary'
          ]"
        >
          О нас
        </a>
        <a
          href="/#reviews"
          @click.prevent="navigate('/')"
          :class="[
            'text-lg font-medium transition-colors text-secondary hover:text-primary'
          ]"
        >
          Отзывы
        </a>
        <a
          href="/#contacts"
          @click.prevent="navigate('/')"
          :class="[
            'text-lg font-medium transition-colors text-secondary hover:text-primary'
          ]"
        >
          Контакты
        </a>
      </nav>

      <!-- Desktop Buttons -->
      <div class="hidden lg:flex items-center gap-4">
        <!-- Not logged in -->
        <template v-if="!currentUser">
          <button
            @click="navigate('/auth')"
            class="px-6 py-2 text-secondary font-medium border-2 border-border rounded-full hover:border-primary hover:text-primary transition-all"
          >
            Логин
          </button>
          <button
            @click="navigate('/auth')"
            class="px-8 py-2 bg-gradient-to-r from-primary to-primary/90 text-white font-medium rounded-full shadow-soft hover:shadow-hover hover:translate-y-[-2px] transition-all"
          >
            Регистрация
          </button>
        </template>
        <!-- Logged in -->
        <template v-else>
          <button
            @click="navigate('/profile')"
            class="px-6 py-2 text-secondary font-medium border-2 border-border rounded-full hover:border-primary hover:text-primary transition-all"
          >
            {{ currentUser.name }}
          </button>
          <button
            @click="handleLogout"
            class="px-8 py-2 bg-gradient-to-r from-primary to-primary/90 text-white font-medium rounded-full shadow-soft hover:shadow-hover hover:translate-y-[-2px] transition-all"
          >
            Выйти
          </button>
        </template>
      </div>

      <!-- Mobile Menu Button -->
      <button
        @click="isMobileMenuOpen = !isMobileMenuOpen"
        class="lg:hidden flex flex-col gap-1.5 w-10 h-10 items-center justify-center"
      >
        <span
          :class="[
            'w-6 h-0.5 bg-secondary transition-all',
            isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''
          ]"
        ></span>
        <span
          :class="[
            'w-6 h-0.5 bg-secondary transition-all',
            isMobileMenuOpen ? 'opacity-0' : ''
          ]"
        ></span>
        <span
          :class="[
            'w-6 h-0.5 bg-secondary transition-all',
            isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''
          ]"
        ></span>
      </button>
    </div>

    <!-- Mobile Menu -->
    <div
      v-if="isMobileMenuOpen"
      class="lg:hidden absolute top-[118px] left-0 right-0 bg-white border-t border-border shadow-card"
    >
      <nav class="flex flex-col p-4 gap-3">
        <a
          href="/"
          @click.prevent="navigate('/')"
          class="text-secondary font-medium py-2 hover:text-primary transition-colors"
        >
          Главная
        </a>
        <a
          href="/#about"
          class="text-secondary font-medium py-2 hover:text-primary transition-colors"
        >
          О нас
        </a>
        <a
          href="/#reviews"
          class="text-secondary font-medium py-2 hover:text-primary transition-colors"
        >
          Отзывы
        </a>
        <a
          href="/#contacts"
          class="text-secondary font-medium py-2 hover:text-primary transition-colors"
        >
          Контакты
        </a>
        <div class="flex flex-col gap-2 pt-2 border-t border-border">
          <!-- Not logged in -->
          <template v-if="!currentUser">
            <button
              @click="navigate('/auth')"
              class="w-full px-6 py-2 text-secondary font-medium border border-border rounded-full hover:border-primary hover:text-primary transition-colors"
            >
              Логин
            </button>
            <button
              @click="navigate('/auth')"
              class="w-full px-6 py-3 bg-primary text-white font-medium rounded-full shadow-soft hover:shadow-hover transition-all"
            >
              Регистрация
            </button>
          </template>
          <!-- Logged in -->
          <template v-else>
            <button
              @click="navigate('/profile')"
              class="w-full px-6 py-2 text-secondary font-medium border border-border rounded-full hover:border-primary hover:text-primary transition-colors"
            >
              {{ currentUser.name }}
            </button>
            <button
              @click="handleLogout"
              class="w-full px-6 py-3 bg-primary text-white font-medium rounded-full shadow-soft hover:shadow-hover transition-all"
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
