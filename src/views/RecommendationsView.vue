<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { currentUser, companions, chats, sendConnectionRequest, loadCompanions } from '../composables/useAppState'
import { getAgeForm } from '../utils/ageForm'
import { getExperienceText } from '../utils/experienceForm'

const router = useRouter()
const selectedCompanion = ref<(typeof companions)['value'][0] | null>(null)
const showNotification = ref('')

// Get recommended companions based on user's topics
const recommendedCompanions = computed(() => {
  if (!currentUser.value) return []

  // If user has selected topics, find companions that match
  const userTopics = Array.isArray(currentUser.value.topics) ? currentUser.value.topics : []

  if (userTopics.length === 0) {
    // If no topics selected, show all companions
    return companions.value
  }

  // Find companions that have matching topics
  const matched = companions.value.filter(companion => {
    if (!companion.topics || companion.topics.length === 0) return false
    return companion.topics.some(topic => userTopics.includes(topic))
  })

  // Sort by number of matching topics
  return matched
    .map(companion => ({
      companion,
      matchCount: (companion.topics || []).filter(topic => userTopics.includes(topic)).length
    }))
    .sort((a, b) => b.matchCount - a.matchCount)
    .map(item => item.companion)
})

onMounted(async () => {
  try {
    await loadCompanions()
  } catch (err) {
    console.error('Failed to load companions:', err)
  }
})

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

const navigateToProfile = (companionId: string | number) => {
  router.push(`/user/${companionId}`)
}

const navigateToSearch = () => {
  router.push('/search')
}
</script>

<template>
  <div class="layout-page">
    <div class="layout-container">
      <!-- Header -->
      <div class="mb-12 lg:mb-16">
        <h1 class="text-4xl lg:text-5xl font-bold text-secondary mb-4">
          Подобранные для вас <span class="text-primary">собеседники</span>
        </h1>
        <p class="text-xl text-secondary/60">
          Люди, которые подходят по вашим интересам и готовы слушать
        </p>
      </div>

      <!-- Recommendations Grid -->
      <div v-if="recommendedCompanions.length > 0" class="mb-16">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <div
            v-for="companion in recommendedCompanions"
            :key="companion.id"
            class="group bg-white border border-primary/20 rounded-3xl overflow-hidden shadow-card hover:shadow-hover hover:translate-y-[-4px] transition-all cursor-pointer"
            @click="selectedCompanion = companion"
          >
            <!-- Image -->
            <div class="h-48 overflow-hidden bg-light-bg relative">
              <img
                :src="companion.image"
                :alt="companion.name"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
              <!-- Match Badge -->
              <div class="absolute top-3 right-3 px-3 py-1 bg-primary text-white text-xs font-bold rounded-full">
                ⭐ Подходит
              </div>
            </div>

            <!-- Info -->
            <div class="p-4">
              <div class="mb-3">
                <h3 class="text-lg font-bold text-secondary">{{ companion.name }}</h3>
                <div class="flex items-center gap-2">
                  <p class="text-sm text-secondary/60">{{ companion.age }} {{ getAgeForm(companion.age) }}</p>
                  <span v-if="companion.gender === 'female'" class="text-sm text-secondary/60">• Женщина</span>
                  <span v-else-if="companion.gender === 'male'" class="text-sm text-secondary/60">• Мужчина</span>
                </div>
              </div>

              <p class="text-xs text-primary font-semibold mb-2">Опыт в терапии: {{ getExperienceText(companion.experience) }}</p>
              <p class="text-sm text-secondary/70 leading-relaxed mb-3 line-clamp-2">{{ companion.bio }}</p>

              <!-- Topics -->
              <div v-if="companion.topics && companion.topics.length > 0" class="mb-3 flex flex-wrap gap-1">
                <span
                  v-for="(topic, idx) in companion.topics.slice(0, 2)"
                  :key="idx"
                  class="px-2 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full"
                >
                  {{ topic }}
                </span>
                <span v-if="companion.topics.length > 2" class="px-2 py-1 bg-primary/10 text-primary text-xs font-semibold">
                  +{{ companion.topics.length - 2 }}
                </span>
              </div>

              <!-- Button -->
              <button
                @click.stop="selectedCompanion = companion"
                class="w-full py-2 bg-gradient-to-r from-primary to-primary/90 text-white text-sm font-semibold rounded-full shadow-soft hover:shadow-hover transition-all"
              >
                Предложить связь
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-12">
        <p class="text-secondary/60 text-lg mb-6">
          Нет рекомендаций на основе ваших интересов. Смотрите всех собеседников в поиске!
        </p>
      </div>

      <!-- Notification -->
      <transition name="slide">
        <div v-if="showNotification" class="fixed top-[180px] left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-full shadow-lg z-50">
          {{ showNotification }}
        </div>
      </transition>

      <!-- CTA Section -->
      <div class="border-t border-border/30 pt-12">
        <div class="text-center">
          <button
            @click="navigateToSearch"
            class="inline-block px-8 py-3 bg-gradient-to-r from-primary to-primary/90 text-white font-semibold rounded-full shadow-soft hover:shadow-hover transition-all"
          >
            Или выбрать другого спутника
          </button>
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
