<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { companions, filterCompanions, sendConnectionRequest, chats, currentUser } from '../composables/useAppState'

const router = useRouter()
const selectedCompanion = ref<(typeof companions)['value'][0] | null>(null)
const showNotification = ref('')

const filters = ref({
  gender: 'all',
  ageMin: 18,
  ageMax: 65,
  experience: 'all',
  topic: 'all',
})

const topics = ['Все', 'Отношения', 'Карьера', 'Тревожность', 'Горе', 'Развитие']

const filteredCompanions = computed(() => {
  return filterCompanions({
    ageMin: filters.value.ageMin,
    ageMax: filters.value.ageMax,
    experience: filters.value.experience,
    topic: filters.value.topic === 'Все' ? undefined : filters.value.topic,
  })
})

const resetFilters = () => {
  filters.value = {
    gender: 'all',
    ageMin: 18,
    ageMax: 65,
    experience: 'all',
    topic: 'Все',
  }
}

const handleConnectionRequest = (companionId: number) => {
  const newChat = sendConnectionRequest(companionId)
  if (newChat) {
    showNotification.value = `Запрос отправлен ${selectedCompanion.value?.name}!`
    setTimeout(() => {
      showNotification.value = ''
      selectedCompanion.value = null
    }, 2000)
  }
}

const navigateToChat = (companionId: number) => {
  const chat = chats.value.find(c => c.companionId === companionId)
  if (chat) {
    router.push(`/chat?id=${chat.id}`)
  }
}

const navigateToProfile = (companionId: number) => {
  // Could navigate to companion's profile page
  console.log('View profile for companion:', companionId)
}
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
            <button
              @click="
                filters.gender = 'all'
                filters.ageMin = 18
                filters.ageMax = 65
                filters.experience = 'all'
                filters.topic = 'all'
              "
              class="w-full py-2 text-secondary text-sm font-medium border border-border rounded-full hover:border-primary hover:text-primary transition-all"
            >
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

          <!-- Notification -->
          <transition name="slide">
            <div v-if="showNotification" class="fixed top-[180px] left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-full shadow-lg z-50">
              {{ showNotification }}
            </div>
          </transition>

          <!-- Companions Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-6">
            <div
              v-for="companion in filteredCompanions"
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
                  @click.stop="selectedCompanion = companion"
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
              @click="handleConnectionRequest(selectedCompanion.id)"
              class="w-full py-3 bg-gradient-to-r from-primary to-primary/90 text-white font-semibold rounded-full shadow-soft hover:shadow-hover transition-all"
            >
              Предложить связь
            </button>
            <button
              @click="navigateToProfile(selectedCompanion.id)"
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

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
