<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { currentUser, companions, chats, sendConnectionRequest, loadCompanions, topics, loadTopics } from '../composables/useAppState'
import { getAgeForm } from '../utils/ageForm'
import { getExperienceText } from '../utils/experienceForm'

const router = useRouter()
const selectedCompanion = ref<(typeof companions)['value'][0] | null>(null)
const showNotification = ref('')

const filters = ref({
  gender: 'all',
  ageMin: 18,
  ageMax: 65,
  experience: 'all',
  topic: 'all',
  specialization: 'all',
})


// Extract unique specializations from companions
const specializations = computed(() => {
  const uniqueSpecializations = new Map<number, string>()
  companions.value.forEach(companion => {
    if (companion.specializations && Array.isArray(companion.specializations)) {
      companion.specializations.forEach(spec => {
        if (spec.id && spec.name) {
          uniqueSpecializations.set(spec.id, spec.name)
        }
      })
    }
  })
  return Array.from(uniqueSpecializations.values()).sort()
})

const filteredCompanions = computed(() => {
  let filteredCompanionList = [...companions.value]

  // Filter by gender
  if (filters.value.gender !== 'all') {
    filteredCompanionList = filteredCompanionList.filter(companion => companion.gender === filters.value.gender)
  }

  // Filter by age
  filteredCompanionList = filteredCompanionList.filter(
    companion => companion.age >= filters.value.ageMin && companion.age <= filters.value.ageMax
  )

  // Filter by experience
  if (filters.value.experience !== 'all') {
    filteredCompanionList = filteredCompanionList.filter(companion => companion.experience === filters.value.experience)
  }

  // Filter by topic
  if (filters.value.topic !== 'all') {
    filteredCompanionList = filteredCompanionList.filter(
      companion => companion.topics && companion.topics.includes(filters.value.topic)
    )
  }

  // Filter by specialization
  if (filters.value.specialization !== 'all') {
    filteredCompanionList = filteredCompanionList.filter(companion => {
      if (!companion.specialization || typeof companion.specialization !== 'string') return false
      const specs = companion.specialization.split(',').map(s => s.trim())
      return specs.includes(filters.value.specialization)
    })
  }

  return filteredCompanionList
})


onMounted(async () => {
  try {
    await Promise.all([
      loadCompanions(),
      loadTopics()
    ])
  } catch (err) {
    console.error('Failed to load companions or topics:', err)
  }
})

const resetFilters = async () => {
  filters.value = {
    gender: 'all',
    ageMin: 18,
    ageMax: 65,
    experience: 'all',
    topic: 'all',
    specialization: 'all',
  }
  try {
    await loadCompanions()
  } catch (err) {
    console.error('Failed to load companions:', err)
  }
}

const handleConnectionRequest = async (companionId: string | number) => {
  try {
    const chat = await sendConnectionRequest(companionId.toString())
    showNotification.value = `Чат с ${selectedCompanion.value?.name} создан!`
    setTimeout(() => {
      showNotification.value = ''
      selectedCompanion.value = null
      // Navigate to the new chat
      router.push(`/chat?id=${chat.id}`)
    }, 500)
  } catch (err) {
    console.error('Failed to send connection request:', err)
    showNotification.value = 'Ошибка при создании чата'
  }
}

const navigateToChat = (companionId: string | number) => {
  const selectedChat = chats.value.find(chatItem => chatItem.companion_id === companionId.toString())
  if (selectedChat) {
    router.push(`/chat?id=${selectedChat.id}`)
  }
}

const navigateToProfile = (companionId: string | number) => {
  router.push(`/user/${companionId}`)
}
</script>

<template>
  <div class="layout-page">
    <div class="layout-container">
      <!-- Header -->
      <div class="mb-12 lg:mb-16">
        <h1 class="text-4xl lg:text-5xl font-bold text-secondary mb-4">
          Найди своего <span class="text-primary">спутника</span>
        </h1>
        <p class="text-xl text-secondary/60">
          Люди в терапии, готовые слушать и поддерживать друг друга
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
                от {{ filters.ageMin }} {{ getAgeForm(filters.ageMin) }} до {{ filters.ageMax }} {{ getAgeForm(filters.ageMax) }}
              </p>
            </div>

            <!-- Experience -->
            <div class="mb-6 border-t border-border/50 pt-6">
              <p class="text-sm font-semibold text-secondary mb-3">Опыт в терапии</p>
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
                  <span class="text-sm text-secondary/70">До 1 года</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    v-model="filters.experience"
                    type="radio"
                    value="experienced"
                    class="w-4 h-4 accent-primary"
                  />
                  <span class="text-sm text-secondary/70">2+ года</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    v-model="filters.experience"
                    type="radio"
                    value="expert"
                    class="w-4 h-4 accent-primary"
                  />
                  <span class="text-sm text-secondary/70">5+ лет</span>
                </label>
              </div>
            </div>

            <!-- Reset Button -->
            <button
              @click="resetFilters"
              class="w-full py-2 text-secondary text-sm font-medium border border-border rounded-full hover:border-primary hover:text-primary transition-all"
            >
              Сбросить фильтры
            </button>
          </div>
        </div>

        <!-- Main Content -->
        <div class="lg:col-span-3">
          <!-- Specialization Filter Tags -->
          <div v-if="specializations.length > 0" class="mb-6">
            <div class="flex flex-wrap gap-2">
              <button
                @click="filters.specialization = 'all'"
                :class="[
                  'px-4 py-2 rounded-full text-sm font-medium transition-all',
                  filters.specialization === 'all'
                    ? 'bg-primary text-white shadow-soft'
                    : 'bg-white border border-border/50 text-secondary hover:border-primary hover:text-primary'
                ]"
              >
                Все направления
              </button>
              <button
                v-for="spec in specializations"
                :key="spec"
                @click="filters.specialization = spec"
                :class="[
                  'px-4 py-2 rounded-full text-sm font-medium transition-all',
                  filters.specialization === spec
                    ? 'bg-primary text-white shadow-soft'
                    : 'bg-white border border-border/50 text-secondary hover:border-primary hover:text-primary'
                ]"
              >
                {{ spec }}
              </button>
            </div>
          </div>

          <!-- Topic Tags -->
          <div class="mb-8 flex flex-wrap gap-2">
            <button
              @click="filters.topic = 'all'"
              :class="[
                'px-4 py-2 rounded-full text-sm font-medium transition-all',
                filters.topic === 'all'
                  ? 'bg-primary text-white shadow-soft'
                  : 'bg-white border border-border/50 text-secondary hover:border-primary hover:text-primary'
              ]"
            >
              Все темы
            </button>
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
              </div>

              <!-- Info -->
              <div class="p-6">
                <div class="mb-4">
                  <div class="flex items-start justify-between mb-2">
                    <div>
                      <h3 class="text-lg font-bold text-secondary">{{ companion.name }}</h3>
                      <div class="flex items-center gap-2">
                        <p class="text-sm text-secondary/60">{{ companion.age }} {{ getAgeForm(companion.age) }}</p>
                        <span v-if="companion.gender === 'female'" class="text-sm text-secondary/60">• Женщина</span>
                        <span v-else-if="companion.gender === 'male'" class="text-sm text-secondary/60">• Мужчина</span>
                      </div>
                    </div>
                  </div>
                  <p class="text-xs text-primary font-semibold mb-3">Опыт в терапии: {{ getExperienceText(companion.experience) }}</p>
                  <p v-if="companion.topics && companion.topics.length > 0" class="text-xs text-primary font-semibold mb-3">Темы: {{ companion.topics.join(', ') }}</p>
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

                <!-- Testimonials -->
                <div class="flex items-center gap-2 mb-4">
                  <img src="../images/support.svg" alt="Thanks" class="w-[16px] h-[16px] object-contain" />
                  <p class="text-xs text-secondary/60">{{ companion.reviews_count }} благодарностей</p>
                </div>

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
            <p class="text-secondary/60">{{ selectedCompanion.age }} {{ getAgeForm(selectedCompanion.age) }}</p>
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
