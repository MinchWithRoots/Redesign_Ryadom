<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const navigate = (path: string) => {
  router.push(path)
  window.scrollTo(0, 0)
}

const reviews = [
  {
    id: 1,
    name: 'Мария К.',
    title: 'Менеджер проектов',
    text: 'Платформа помогла мне найти поддержку в сложный период. Очень благодарна за возможность конфиденциального общения.',
    avatar: '👩',
  },
  {
    id: 2,
    name: 'Алексей М.',
    title: 'Психолог',
    text: 'Отличный сервис для тех, кто ищет профессиональную поддержку. Удобный интерфейс и надежная система безопасности.',
    avatar: '👨',
  },
  {
    id: 3,
    name: 'Елена В.',
    title: 'Студентка',
    text: 'Наконец-то нашла место, где можно открыто поговорить о своих переживаниях. Спасибо за создание такого важного сервиса!',
    avatar: '👩‍🦰',
  },
]
</script>

<template>
  <div class="min-h-screen bg-white">
    <!-- Hero Section -->
    <section class="pt-[140px] pb-16 lg:pb-24 px-4 lg:px-8">
      <div class="container mx-auto max-w-7xl">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <!-- Left Content -->
          <div class="flex flex-col gap-6 lg:gap-8">
            <h1 class="text-4xl lg:text-5xl font-bold text-secondary leading-tight">
              Найди свою поддержку <span class="text-primary">Рядом</span>
            </h1>
            <p class="text-lg lg:text-xl text-secondary/70 leading-relaxed">
              Безопасная платформа для подбора собеседника и партнёра для психологической поддержки и терапии. Найди человека, который поймет и поддержит тебя в любой ситуации.
            </p>
            <button
              @click="navigate('/search')"
              class="inline-flex items-center justify-center gap-2 px-8 py-4 lg:px-10 lg:py-5 bg-primary text-white font-semibold rounded-full shadow-soft hover:shadow-hover hover:translate-y-[-2px] transition-all w-fit text-base lg:text-lg"
            >
              Найти свою поддержку
              <svg class="w-5 h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>

          <!-- Right Image -->
          <div class="flex justify-center lg:justify-end">
            <div class="relative w-full max-w-md lg:max-w-lg aspect-square">
              <!-- Decorative circles with emoji -->
              <div class="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5 rounded-3xl"></div>
              <div class="absolute top-8 right-8 lg:top-12 lg:right-12 w-40 h-40 lg:w-56 lg:h-56 bg-primary/20 rounded-3xl flex items-center justify-center text-8xl lg:text-9xl">
                🤝
              </div>
              <div class="absolute bottom-0 left-0 w-48 h-48 lg:w-64 lg:h-64 bg-primary/10 rounded-3xl flex items-center justify-center text-7xl lg:text-8xl">
                💬
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- About Section -->
    <section id="about" class="py-16 lg:py-24 px-4 lg:px-8 bg-light-bg">
      <div class="container mx-auto max-w-7xl">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          <!-- Image -->
          <div class="order-2 lg:order-1 flex justify-center">
            <div class="w-full max-w-md lg:max-w-lg aspect-square bg-gradient-to-br from-secondary/10 to-primary/10 rounded-3xl flex items-center justify-center text-7xl lg:text-8xl">
              💝
            </div>
          </div>

          <!-- Content -->
          <div class="order-1 lg:order-2 flex flex-col gap-6 lg:gap-8">
            <h2 class="text-3xl lg:text-4xl font-bold text-secondary">О нас</h2>
            <div class="flex flex-col gap-4 text-secondary/70 text-base lg:text-lg leading-relaxed">
              <p>
                Мы создали Рядом с простой идеей: каждый человек заслуживает поддержки и понимания. Платформа объединяет людей, ищущих психологическую помощь, с опытными собеседниками и профессионалами.
              </p>
              <p>
                Наша миссия – создать безопасное, конфиденциальное пространство, где каждый может найти помощь и поддержку без страха и стыда.
              </p>
              <p>
                Мы верим в силу человеческого общения и профессиональной помощи в решении жизненных проблем.
              </p>
            </div>
            <button
              @click="navigate('/search')"
              class="inline-flex items-center justify-center gap-2 px-8 py-3 lg:px-10 lg:py-4 text-secondary font-semibold border border-border rounded-full hover:border-primary hover:text-primary transition-colors w-fit"
            >
              Начать поиск
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Reviews Section -->
    <section id="reviews" class="py-16 lg:py-24 px-4 lg:px-8">
      <div class="container mx-auto max-w-7xl">
        <div class="flex flex-col gap-8 lg:gap-12">
          <div class="text-center">
            <h2 class="text-3xl lg:text-4xl font-bold text-secondary mb-4">Отзывы</h2>
            <p class="text-lg text-secondary/70">
              Что говорят о нас наши пользователи
            </p>
          </div>

          <!-- Reviews Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            <div
              v-for="review in reviews"
              :key="review.id"
              class="bg-white border border-border rounded-3xl p-6 lg:p-8 shadow-card hover:shadow-hover hover:translate-y-[-5px] transition-all"
            >
              <!-- Top Section with Stars -->
              <div class="flex gap-1 mb-4">
                <span v-for="i in 5" :key="i" class="text-primary text-lg">★</span>
              </div>

              <!-- Quote -->
              <p class="text-secondary/70 text-base lg:text-lg leading-relaxed mb-6 italic">
                "{{ review.text }}"
              </p>

              <!-- Avatar and Info -->
              <div class="flex items-center gap-4">
                <div class="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-secondary/10 flex items-center justify-center text-4xl flex-shrink-0">
                  {{ review.avatar }}
                </div>
                <div>
                  <h4 class="font-bold text-secondary">{{ review.name }}</h4>
                  <p class="text-sm text-secondary/60">{{ review.title }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="py-16 lg:py-24 px-4 lg:px-8 bg-light-bg">
      <div class="container mx-auto max-w-3xl text-center">
        <h2 class="text-3xl lg:text-4xl font-bold text-secondary mb-6">
          Готов найти свою поддержку?
        </h2>
        <p class="text-lg text-secondary/70 mb-8">
          Присоединяйся к нашему сообществу людей, которые находят понимание и поддержку
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            @click="navigate('/auth')"
            class="px-8 py-4 bg-primary text-white font-semibold rounded-full shadow-soft hover:shadow-hover hover:translate-y-[-2px] transition-all"
          >
            Регистрация
          </button>
          <button
            @click="navigate('/')"
            class="px-8 py-4 text-secondary font-semibold border border-border rounded-full hover:border-primary hover:text-primary transition-colors"
          >
            Узнать больше
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped></style>
