<script setup lang="ts">
import { ref } from 'vue'

// Метод для сброса фильтров
const resetFilters = () => {
  filters.value.gender = 'all'
  filters.value.ageMin = 18
  filters.value.ageMax = 65
  filters.value.experience = 'all'
  filters.value.topic = 'all'
}

const companions = ref([
  {
    id: 1,
    name: 'Мария К.',
    age: 28,
    specialization: 'Психолог',
    experience: 'Опытный специалист',
    topics: ['Отношения', 'Тревожность', 'Стресс'],
    image: 'https://images.pexels.com/photos/27603433/pexels-photo-27603433.jpeg',
    rating: 4.9,
    reviews: 127,
    bio: 'Специализируюсь на работе с молодежью и вопросами личных отношений',
  },
  {
    id: 2,
    name: 'Алексей М.',
    age: 32,
    specialization: 'Counselor',
    experience: 'Опытный специалист',
    topics: ['Карьера', 'Развитие', 'Мотивация'],
    image: 'https://images.pexels.com/photos/31422830/pexels-photo-31422830.png',
    rating: 4.8,
    reviews: 95,
    bio: 'Помогу разобраться в карьерных целях и найти свой путь',
  },
  {
    id: 3,
    name: 'Елена В.',
    age: 35,
    specialization: 'Терапевт',
    experience: 'Опытный специалист',
    topics: ['Горе', 'Потеря', 'Восстановление'],
    image: 'https://images.pexels.com/photos/20860595/pexels-photo-20860595.jpeg',
    rating: 5.0,
    reviews: 156,
    bio: 'Специалист по работе с жизненными кризисами и горем',
  },
  {
    id: 4,
    name: 'Игорь С.',
    age: 26,
    specialization: 'Слушатель',
    experience: 'Начинающий',
    topics: ['Личные проблемы', 'Поддержка', 'Общение'],
    image: 'https://images.pexels.com/photos/966067/pexels-photo-966067.jpeg',
    rating: 4.7,
    reviews: 43,
    bio: 'Готов выслушать и поддержать в любой жизненной ситуации',
  },
])

const filters = ref({
  gender: 'all',
  ageMin: 18,
  ageMax: 65,
  experience: 'all',
  topic: 'all',
})

const selectedCompanion = ref<typeof companions.value[0] | null>(null)

const topics = ['Все', 'Отношения', 'Карьера', 'Тревожность', 'Горе', 'Развитие']
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-white to-light-bg pt-[140px] pb-16">
    <div class="container mx-auto px-4 lg:px-8 max-w-7xl">
      <!-- Header -->
      <div class="mb-12 lg:mb-16">
        <h1 class="text-4xl lg:text-5xl font-bold text-secondary mb-4">
          Найди своего <span class="text-primary">собеседника</span>
        </h1>
        <p class="text-xl text-secondary/60">
          Профессионалы и волонтёры, готовые помочь и поддержать
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-6">
        <!-- Filters Sidebar -->
        <div class="lg:col-span-1">
          <div class="bg-white border border-border/50 rounded-3xl p-6 shadow-card sticky top-[140px]">
            <h3 class="text-lg font-bold text-secondary mb-6">Фильтры</h3>

            <!-- Gender Filter -->
            <div class="mb-6">
              <p class="text-sm font-semibold text-secondary mb-3">Пол</p>
              <div class="flex flex-col gap-2">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    v-model="filters.gender"
                    type="radio"
                    value="all"
                    class="w-4 h-4 accent-primary"
                  />
                  <span class="text-sm text-secondary/70">Все</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    v-model="filters.gender"
                    type="radio"
                    value="female"
                    class="w-4 h-4 accent-primary"
                  />
                  <span class="text-sm text-secondary/70">Женщина</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    v-model="filters.gender"
                    type="radio"
                    value="male"
                    class="w-4 h-4 accent-primary"
                  />
                  <span class="text-sm text-secondary/70">Мужчина</span>
                </label>
              </div>
            </div>

            <!-- Age Range -->
            <div class="mb-6 border-t border-border/50 pt-6">
              <p class="text-sm font-semibold text-secondary mb-3">Возраст</p>
              <div class="flex gap-2 mb-3">
                <input
                  v-model.number="filters.ageMin"
                  type="number"
                  min="18"
                  max="65"
                  class="w-full px-3 py-2 border border-border rounded-xl text-sm text-secondary focus:outline-none focus:border-primary"
                />
                <input
                  v-model.number="filters.ageMax"
                  type="number"
                  min="18"
                  max="65"
                  class="w-full px-3 py-2 border border-border rounded-xl text-sm text-secondary focus:outline-none focus:border-primary"
                />
              </div>
              <p class="text-xs text-secondary/60">
                от {{ filters.ageMin }} до {{ filters.ageMax }} лет
              </p>
            </div>

            <!-- Experience -->
            <div class="mb-6 border-t border-border/50 pt-6">
              <p class="text-sm font-semibold text-secondary mb-3">Опыт</p>
              <div class="flex flex-col gap-2">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    v-model="filters.experience"
                    type="radio"
                    value="all"
                    class="w-4 h-4 accent-primary"
                  />
                  <span class="text-sm text-secondary/70">Все</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    v-model="filters.experience"
                    type="radio"
                    value="beginner"
                    class="w-4 h-4 accent-primary"
                  />
                  <span class="text-sm text-secondary/70">Начинающий</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    v-model="filters.experience"
                    type="radio"
                    value="experienced"
                    class="w-4 h-4 accent-primary"
                  />
                  <span class="text-sm text-secondary/70">Опытный</span>
                </label>
              </div>
            </div>

            <!-- Reset Button -->
           <button @click="resetFilters" class="w-full py-2 text-secondary text-sm font-medium border border-border rounded-full hover:border-primary hover:text-primary transition-all">
  Сбросить фильтры
</button>
          </div>
        </div>

        <!-- Main Content -->
        <div class="lg:col-span-3">
          <!-- Topic Tags -->
          <div class="mb-8 flex flex-wrap gap-2">
            <button
              v-for="topic in topics"
              :key="topic"
              @click="filters.topic = topic"
              :class="[
                'px-4 py-2 rounded-full text-sm font-medium transition-all',
                filters.topic === topic
                  ? 'bg-primary text-white shadow-soft'
                  : 'bg-white border border-border/50 text-secondary hover:border-primary hover:text-primary'
              ]"
            >
              {{ topic }}
            </button>
          </div>

          <!-- Companions Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-6">
            <div
              v-for="companion in companions"
              :key="companion.id"
              class="group bg-white border border-border/50 rounded-3xl overflow-hidden shadow-card hover:shadow-hover hover:translate-y-[-4px] transition-all cursor-pointer"
              @click="selectedCompanion = companion"
            >
              <!-- Image -->
              <div class="h-64 overflow-hidden bg-light-bg relative">
                <img
                  :src="companion.image"
                  :alt="companion.name"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div class="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>

                <!-- Rating Badge -->
                <div class="absolute top-4 right-4 bg-white/95 backdrop-blur px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-card">
                  <svg class="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span class="text-sm font-bold text-secondary">{{ companion.rating }}</span>
                </div>
              </div>

              <!-- Info -->
              <div class="p-6">
                <div class="mb-4">
                  <div class="flex items-start justify-between mb-2">
                    <div>
                      <h3 class="text-lg font-bold text-secondary">{{ companion.name }}</h3>
                      <p class="text-sm text-secondary/60">{{ companion.age }} лет • {{ companion.specialization }}</p>
                    </div>
                  </div>
                  <p class="text-xs text-primary font-semibold mb-3">{{ companion.experience }}</p>
                  <p class="text-sm text-secondary/70 leading-relaxed mb-4">{{ companion.bio }}</p>
                </div>

                <!-- Topics -->
                <div class="mb-4 flex flex-wrap gap-2">
                  <span
                    v-for="topic in companion.topics"
                    :key="topic"
                    class="px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full"
                  >
                    {{ topic }}
                  </span>
                </div>

                <!-- Reviews -->
                <p class="text-xs text-secondary/60 mb-4">{{ companion.reviews }} отзывов</p>

                <!-- Button -->
                <button
                  class="w-full py-3 bg-gradient-to-r from-primary to-primary/90 text-white font-semibold rounded-full shadow-soft hover:shadow-hover transition-all"
                >
                  Предложить связь
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Reply Modal (if companion selected) -->
    <transition name="fade">
      <div
        v-if="selectedCompanion"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 pt-[140px]"
        @click="selectedCompanion = null"
      >
        <div
          class="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-hover"
          @click.stop
        >
          <button
            @click="selectedCompanion = null"
            class="ml-auto block text-secondary/50 hover:text-secondary transition-colors mb-4"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div class="text-center mb-6">
            <img
              :src="selectedCompanion.image"
              :alt="selectedCompanion.name"
              class="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
            />
            <h2 class="text-2xl font-bold text-secondary mb-2">{{ selectedCompanion.name }}</h2>
            <p class="text-secondary/60">{{ selectedCompanion.specialization }}</p>
          </div>

          <div class="space-y-3 mb-6">
            <button
              class="w-full py-3 bg-gradient-to-r from-primary to-primary/90 text-white font-semibold rounded-full shadow-soft hover:shadow-hover transition-all"
            >
              Написать сообщение
            </button>
            <button
              class="w-full py-3 text-secondary font-semibold border-2 border-border rounded-full hover:border-primary hover:text-primary transition-all"
            >
              Посмотреть профиль
            </button>
          </div>

          <p class="text-xs text-secondary/60 text-center">
            Ваш запрос будет отправлен {{ selectedCompanion.name }}. Они смогут ответить в течение 24 часов
          </p>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
