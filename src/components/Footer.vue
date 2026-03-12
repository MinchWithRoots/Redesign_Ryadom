<script setup lang="ts">
import { useRouter } from 'vue-router'
import logo from '../assets/logo.svg'

const router = useRouter()

const navigate = (path: string) => {
  router.push(path)
  window.scrollTo(0, 0)
}
</script>

<template>
  <footer class="bg-gradient-to-b from-white to-light-bg border-t border-border/30 py-16 lg:py-20">
    <div class="container mx-auto px-4 lg:px-8">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12 lg:mb-16">
        <!-- Logo and description -->
        <div class="flex flex-col gap-4">
          <div class="flex items-center gap-2 group cursor-pointer hover:opacity-70 transition-opacity">
            <img :src="logo" alt="Рядом" class="w-10 h-10" />
            <span class="text-xl font-bold text-secondary">Рядом</span>
          </div>
          <p class="text-sm text-secondary/60 leading-relaxed">
            Платформа для подбора собеседника и партнёра для психологической поддержки и терапии
          </p>
        </div>

        <!-- Navigation -->
        <div class="flex flex-col gap-6">
          <h3 class="font-semibold text-secondary">Навигация</h3>
          <nav class="flex flex-col gap-3">
            <button
              @click="navigate('/')"
              class="text-sm text-secondary/70 hover:text-primary transition-colors text-left font-medium"
            >
              Главная
            </button>
            <button
              @click="navigate('/')"
              class="text-sm text-secondary/70 hover:text-primary transition-colors text-left font-medium"
            >
              О нас
            </button>
            <button
              @click="navigate('/')"
              class="text-sm text-secondary/70 hover:text-primary transition-colors text-left font-medium"
            >
              Отзывы
            </button>
            <button
              @click="navigate('/')"
              class="text-sm text-secondary/70 hover:text-primary transition-colors text-left font-medium"
            >
              Контакты
            </button>
          </nav>
        </div>

        <!-- Contact Info -->
        <div class="flex flex-col gap-6">
          <h3 class="font-semibold text-secondary">Контакты</h3>
          <div class="flex flex-col gap-3 text-sm">
            <a href="mailto:info@ryandom.ru" class="text-secondary/70 hover:text-primary transition-colors font-medium">
              info@ryandom.ru
            </a>
            <a href="tel:+79000000000" class="text-secondary/70 hover:text-primary transition-colors font-medium">
              +7 (900) 000-00-00
            </a>
          </div>
        </div>
      </div>

      <!-- Copyright -->
      <div class="border-t border-border/30 pt-12 text-center text-sm text-secondary/60">
        <p>&copy; 2024 Рядом. Все права защищены.</p>
      </div>
    </div>
  </footer>
</template>

<style scoped></style>
