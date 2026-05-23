<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { companions, currentUser, getCompanionById, sendConnectionRequest, loadCurrentUser } from '../composables/useAppState'
import AuthRequiredModal from '../components/AuthRequiredModal.vue'
import ImageWithFallback from '../components/ImageWithFallback.vue'
import CompanionChatRequests from '../components/CompanionChatRequests.vue'
import ReviewsList from '../components/ReviewsList.vue'
import supportIcon from '../images/support.svg'
import { getAgeForm } from '../utils/ageForm'
import { getExperienceText } from '../utils/experienceForm'
import '@/assets/profile.css'

const router = useRouter()
const route = useRoute()
const authModal = ref<InstanceType<typeof AuthRequiredModal> | null>(null)
const companion = ref<(typeof companions)['value'][0] | null>(null)
const isLoading = ref(true)
const showNotification = ref('')
const hasRequestSent = ref(false)
const companionSessions = ref(0)
const reviewsListRef = ref<any>(null)

const isCurrentUserCompanion = computed(() => {
  return currentUser.value && companion.value && 
         currentUser.value.role === 'companion' && 
         currentUser.value.id === companion.value.user_id
})

const companionId = computed(() => {
  const id = route.params.id
  return typeof id === 'string' ? parseInt(id) : id
})

onMounted(async () => {
  try {
    if (!currentUser.value) {
      await loadCurrentUser()
    }

    const comp = await getCompanionById(companionId.value.toString())
    if (comp) {
      companion.value = comp
      companionSessions.value = comp.sessions || 0
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
    companionSessions.value += 1
    showNotification.value = `Запрос отправлен ${companion.value.name}!`
    setTimeout(() => {
      showNotification.value = ''
    }, 3000)
  } catch (err) {
    let errorMessage = 'Ошибка при отправке запроса'

    if (err instanceof Error) {
      errorMessage = err.message

      if (errorMessage === 'NOT_LOGGED_IN') {
        authModal.value?.openModal()
        return
      }
    }

    console.error('Error sending connection request:', {
      error: err,
      message: errorMessage
    })
    showNotification.value = errorMessage
    setTimeout(() => {
      showNotification.value = ''
    }, 4000)
  }
}

const goBack = () => {
  router.back()
}

const navigateToChat = () => {
  router.push('/profile?tab=chats')
}

const handleReviewsLoaded = async (reviews: any[]) => {
  if (companion.value) {
    companion.value.reviews_count = reviews.length

    // Refresh companion data to get updated sessions and reviews info
    const refreshedCompanion = await getCompanionById(companion.value.id.toString())
    if (refreshedCompanion) {
      companion.value = refreshedCompanion
      companionSessions.value = refreshedCompanion.sessions || 0
    }
  }
}

watch(companion, async () => {
  if (companion.value && reviewsListRef.value) {
    await nextTick()
    reviewsListRef.value.loadReviews()
  }
})
</script>

<template>
  <div class="layout-page">
    <AuthRequiredModal ref="authModal" />

    <transition name="slide">
      <div v-if="showNotification" class="profile-notification">
        {{ showNotification }}
      </div>
    </transition>

    <div class="profile-container">
      <button @click="goBack" class="profile-back">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        <span>Назад</span>
      </button>

      <div v-if="isLoading" class="profile-loading">
        <div class="profile-loading__spinner"></div>
        <p class="profile-loading__text">Загрузка профиля...</p>
      </div>

      <div v-else-if="companion" class="profile-layout" style="padding-top: 0;">
        <div v-if="isCurrentUserCompanion" class="profile-badge">
          <svg class="profile-badge__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m7 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div class="profile-badge__content">
            <p class="profile-badge__title">👤 Это ваш профиль спутника</p>
            <p class="profile-badge__subtitle">Только вы видите раздел с входящими заявками на чат</p>
          </div>
        </div>

        <div class="profile-layout__container">
          <div class="profile-layout__sidebar">
            <div class="profile-card">
              <ImageWithFallback
                :src="companion.image"
                :alt="companion.name"
                class="profile-card__avatar-large-wrapper"
                imageClass="profile-card__avatar profile-card__avatar--large"
                fallbackClass="profile-card__avatar-fallback"
                iconClass="profile-card__avatar-icon-large"
              />

              <div class="profile-card__header">
                <h1 class="profile-card__name">{{ companion.name }}</h1>
                <p class="profile-card__age">{{ companion.age }} {{ getAgeForm(companion.age) }}</p>
              </div>

              <div class="profile-stats">
                <div class="profile-stat">
                  <p class="profile-stat__value">{{ companion.reviews_count ?? 0 }}</p>
                  <p class="profile-stat__label">отзывов</p>
                </div>
                <div class="profile-stat">
                  <p class="profile-stat__value">{{ companionSessions }}</p>
                  <p class="profile-stat__label">сессий</p>
                </div>
              </div>

              <div class="profile-divider"></div>

              <div class="profile-menu">
                <button
                  v-if="!hasRequestSent && !isCurrentUserCompanion"
                  @click="handleSendConnectionRequest"
                  class="profile-button profile-button--primary"
                >
                  Предложить связь
                </button>
                <button
                  v-else-if="hasRequestSent && !isCurrentUserCompanion"
                  @click="navigateToChat"
                  class="profile-button profile-button--primary"
                >
                  Перейти в чаты
                </button>
                <button
                  @click="goBack"
                  class="profile-button profile-button--secondary"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>

          <div class="profile-layout__main">
            <div class="profile-section">
              <h2 class="profile-section__title">Опыт в терапии</h2>
              <div class="profile-section__content">
                <div class="experience-item">
                  <div class="experience-item__icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div class="experience-item__text">
                    <p class="experience-item__label">Время в пути</p>
                    <p class="experience-item__value">{{ getExperienceText(companion.experience) }}</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="profile-section">
              <h2 class="profile-section__title">О себе</h2>
              <p class="profile-bio">{{ companion.bio }}</p>
            </div>

            <div class="profile-section">
              <h2 class="profile-section__title">Темы для обсуждения</h2>
              <div class="profile-topics">
                <span
                  v-for="topic in companion.topics"
                  :key="topic"
                  class="profile-topic"
                >
                  {{ topic }}
                </span>
              </div>
            </div>

            <ReviewsList v-if="companion" ref="reviewsListRef" :companion-id="companion.id" @reviews-loaded="handleReviewsLoaded" />

            <CompanionChatRequests v-if="isCurrentUserCompanion && companion" :companion-id="companion.id" />

            <div class="profile-how-it-works">
              <h2 class="profile-how-it-works__title">Как это работает</h2>

              <div class="profile-steps">
                <div class="profile-step">
                  <div class="profile-step__number">1</div>
                  <div>
                    <p class="profile-step__title">Отправьте запрос</p>
                    <p class="profile-step__description">Нажмите кнопку "Предложить связь"</p>
                  </div>
                </div>

                <div class="profile-step">
                  <div class="profile-step__number">2</div>
                  <div>
                    <p class="profile-step__title">Дождитесь ответа</p>
                    <p class="profile-step__description">{{ companion.name }} ответит на ваш запрос в течение 24 часов</p>
                  </div>
                </div>

                <div class="profile-step">
                  <div class="profile-step__number">3</div>
                  <div>
                    <p class="profile-step__title">Начните общение</p>
                    <p class="profile-step__description">Обсудите важные для вас темы и поддерживайте друг друга</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="profile-not-found">
        <svg class="profile-not-found__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <h2 class="profile-not-found__title">Профиль не найден</h2>
        <p class="profile-not-found__text">К сожалению, не удалось загрузить профиль пользователя</p>
        <button @click="goBack" class="profile-button profile-button--primary">
          Вернуться назад
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-notification {
  position: fixed;
  top: 180px;
  left: 50%;
  transform: translateX(-50%);
  background-color: var(--color-success);
  color: var(--color-white);
  padding: 0.75rem 1.5rem;
  border-radius: 9999px;
  box-shadow: var(--shadow-lg);
  z-index: 50;
  font-family: 'Inter', sans-serif;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.profile-card__avatar--large {
  width: 100%;
  height: 18rem;
  border-radius: 1.25rem;
  object-fit: cover;
  margin-bottom: 1.5rem;
  display: block;
}

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
