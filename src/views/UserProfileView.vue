<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { companions, currentUser, getCompanionById, sendConnectionRequest, loadCurrentUser } from '../composables/useAppState'
import AuthRequiredModal from '../components/AuthRequiredModal.vue'
import CompanionChatRequests from '../components/CompanionChatRequests.vue'
import supportIcon from '../images/support.svg'
import { getAgeForm } from '../utils/ageForm'
import { getExperienceText } from '../utils/experienceForm'

const router = useRouter()
const route = useRoute()
const authModal = ref<InstanceType<typeof AuthRequiredModal> | null>(null)
const companion = ref<(typeof companions)['value'][0] | null>(null)
const isLoading = ref(true)
const showNotification = ref('')
const hasRequestSent = ref(false)

const isCurrentUserCompanion = computed(() => {
  return currentUser.value && companion.value && currentUser.value.id === companion.value.user_id
})

// Get companion ID from route params
const companionId = computed(() => {
  const id = route.params.id
  return typeof id === 'string' ? parseInt(id) : id
})

onMounted(async () => {
  try {
    // Load current user if not already loaded
    if (!currentUser.value) {
      await loadCurrentUser()
    }

    const comp = await getCompanionById(companionId.value.toString())
    if (comp) {
      companion.value = comp
    } else {
      console.error('Companion not found with ID:', companionId.value)
    }
  } catch (err) {
    console.error('Error loading companion profile:', err)
  } finally {
    isLoading.value = false
  }
})

const handleSendConnectionRequest = async () => {
  if (!companion.value) return

  try {
    await sendConnectionRequest(companion.value.id)
    hasRequestSent.value = true
    showNotification.value = `Запрос отправлен ${companion.value.name}!`
    setTimeout(() => {
      showNotification.value = ''
    }, 3000)
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    if (error === 'NOT_LOGGED_IN') {
      // Show auth modal instead of error
      authModal.value?.openModal()
    } else {
      console.error('Error sending connection request:', err)
      showNotification.value = 'Ошибка при отправке запроса'
    }
  }
}

const goBack = () => {
  router.back()
}

const navigateToChat = () => {
  // After connection request, user can navigate to chat
  router.push('/profile?tab=chats')
}
</script>

<template>
  <div class="layout-page">
    <!-- Auth Required Modal -->
    <AuthRequiredModal ref="authModal" />

    <!-- Notification -->
    <transition name="slide">
      <div v-if="showNotification" class="fixed top-[180px] left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-full shadow-lg z-50">
        {{ showNotification }}
      </div>
    </transition>

    <div class="container mx-auto px-4 lg:px-8 max-w-4xl">
      <!-- Back Button -->
      <button
        @click="goBack"
        class="mb-8 flex items-center gap-2 text-secondary hover:text-primary transition-colors"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        <span class="font-medium">Назад</span>
      </button>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex items-center justify-center py-16">
        <div class="text-center">
          <div class="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p class="text-secondary/60">Загрузка профиля...</p>
        </div>
      </div>

      <!-- Profile Content -->
      <div v-else-if="companion" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Sidebar with Basic Info -->
        <div class="lg:col-span-1">
          <div class="bg-white border border-border/50 rounded-3xl p-6 shadow-card sticky top-[140px]">
            <!-- Profile Image -->
            <div class="mb-6">
              <img
                :src="companion.image"
                :alt="companion.name"
                class="w-full h-72 rounded-2xl object-cover"
              />
            </div>

            <!-- Basic Info -->
            <div class="text-center mb-6">
              <h1 class="text-2xl font-bold text-secondary mb-2">{{ companion.name }}</h1>
              <p class="text-lg text-secondary/60 mb-4">{{ companion.age }} {{ getAgeForm(companion.age) }}</p>
            </div>

            <!-- Stats -->
            <div class="flex gap-3 mb-6 pb-6 border-b border-border/50">
              <div class="flex-1 p-3 bg-light-bg rounded-xl text-center">
                <div class="flex items-center justify-center gap-2 mb-2">
                  <img :src="supportIcon" alt="благодарности" class="w-5 h-5" />
                  <p class="text-2xl font-bold text-primary">{{ companion.reviews_count }}</p>
                </div>
                <p class="text-xs text-secondary/60">благодарностей</p>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="space-y-3">
              <button
                v-if="!hasRequestSent"
                @click="handleSendConnectionRequest"
                class="w-full py-3 bg-gradient-to-r from-primary to-primary/90 text-white font-semibold rounded-full shadow-soft hover:shadow-hover transition-all"
              >
                Предложить связь
              </button>
              <button
                v-else
                @click="navigateToChat"
                class="w-full py-3 bg-gradient-to-r from-primary to-primary/90 text-white font-semibold rounded-full shadow-soft hover:shadow-hover transition-all"
              >
                Перейти в чаты
              </button>
              <button
                @click="goBack"
                class="w-full py-3 text-secondary font-semibold border-2 border-border rounded-full hover:border-primary hover:text-primary transition-all"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>

        <!-- Main Content -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Experience Section -->
          <div class="card">
            <h2 class="text-2xl font-bold text-secondary mb-6">Опыт в терапии</h2>

            <div class="space-y-4">
              <div class="flex items-start gap-4 p-4 bg-light-bg rounded-xl">
                <div class="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p class="text-sm font-semibold text-secondary mb-1">Время в пути</p>
                  <p class="text-secondary/70">{{ getExperienceText(companion.experience) }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Bio Section -->
          <div class="card">
            <h2 class="text-2xl font-bold text-secondary mb-6">О себе</h2>
            <p class="text-secondary/70 leading-relaxed text-lg">
              {{ companion.bio }}
            </p>
          </div>

          <!-- Topics Section -->
          <div class="card">
            <h2 class="text-2xl font-bold text-secondary mb-6">Темы для обсуждения</h2>

            <div class="flex flex-wrap gap-3">
              <span
                v-for="topic in companion.topics"
                :key="topic"
                class="px-6 py-2.5 bg-primary/10 text-primary font-semibold rounded-full text-sm hover:bg-primary/20 transition-colors"
              >
                {{ topic }}
              </span>
            </div>
          </div>

          <!-- Chat Requests Section (only for the companion themselves) -->
          <CompanionChatRequests v-if="isCurrentUserCompanion" :companion-id="companion.id" />

          <!-- How It Works -->
          <div class="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-3xl p-8 shadow-card">
            <h2 class="text-2xl font-bold text-secondary mb-6">Как это работает</h2>

            <div class="space-y-4">
              <div class="flex gap-4">
                <div class="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">
                  1
                </div>
                <div>
                  <p class="font-semibold text-secondary mb-1">Отправьте запрос</p>
                  <p class="text-sm text-secondary/70">Нажмите кнопку "Предложить связь"</p>
                </div>
              </div>

              <div class="flex gap-4">
                <div class="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">
                  2
                </div>
                <div>
                  <p class="font-semibold text-secondary mb-1">Дождитесь ответа</p>
                  <p class="text-sm text-secondary/70">{{ companion.name }} ответит на ваш запрос в течение 24 часов</p>
                </div>
              </div>

              <div class="flex gap-4">
                <div class="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">
                  3
                </div>
                <div>
                  <p class="font-semibold text-secondary mb-1">Начните общение</p>
                  <p class="text-sm text-secondary/70">Обсудите важные для вас темы и поддерживайте друг друга</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Not Found State -->
      <div v-else class="flex items-center justify-center py-16">
        <div class="text-center">
          <svg class="w-16 h-16 text-secondary/30 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <h2 class="text-2xl font-bold text-secondary mb-2">Профиль не найден</h2>
          <p class="text-secondary/60 mb-6">К сожалению, не удалось загрузить профиль пользователя</p>
          <button
            @click="goBack"
            class="btn-primary"
          >
            Вернуться назад
          </button>
        </div>
      </div>
    </div>
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
