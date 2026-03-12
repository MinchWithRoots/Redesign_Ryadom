<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const navigate = (path: string) => {
  router.push(path)
  window.scrollTo(0, 0)
}
</script>

<template>
  <footer class="bg-light-bg border-t border-border py-12 lg:py-16">
    <div class="container mx-auto px-4 lg:px-8">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 lg:mb-12">
        <!-- Logo and description -->
        <div class="flex flex-col gap-4">
          <div class="flex items-center gap-2">
            <div class="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white font-bold">
              ❤️
            </div>
            <span class="text-xl font-bold text-secondary">Рядом</span>
          </div>
          <p class="text-sm text-secondary">
            Платформа для подбора собеседника и партнёра для психологической поддержки
          </p>
        </div>

        <!-- Navigation -->
        <div class="flex flex-col gap-4">
          <h3 class="font-bold text-secondary">Навигация</h3>
          <nav class="flex flex-col gap-2">
            <button
              @click="navigate('/')"
              class="text-sm text-secondary hover:text-primary transition-colors text-left"
            >
              Главная
            </button>
            <button
              @click="navigate('/')"
              class="text-sm text-secondary hover:text-primary transition-colors text-left"
            >
              О нас
            </button>
            <button
              @click="navigate('/')"
              class="text-sm text-secondary hover:text-primary transition-colors text-left"
            >
              Отзывы
            </button>
            <button
              @click="navigate('/')"
              class="text-sm text-secondary hover:text-primary transition-colors text-left"
            >
              Контакты
            </button>
          </nav>
        </div>

        <!-- Contact Info -->
        <div class="flex flex-col gap-4">
          <h3 class="font-bold text-secondary">Контакты</h3>
          <div class="flex flex-col gap-2 text-sm text-secondary">
            <p>Email: info@ryandom.ru</p>
            <p>Телефон: +7 (900) 000-00-00</p>
          </div>
        </div>
      </div>

      <!-- Copyright -->
      <div class="border-t border-border pt-8 text-center text-sm text-secondary">
        <p>&copy; 2024 Рядом. Все права защищены.</p>
      </div>
    </div>
  </footer>
</template>

<style scoped></style>
