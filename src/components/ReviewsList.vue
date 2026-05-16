<template>
  <div class="reviews-section">
    <div class="reviews-section__header">
      <h2 class="reviews-section__title">Отзывы ({{ reviews.length }})</h2>
      <div class="reviews-section__stats">
        <div class="reviews-stat">
          <svg class="reviews-stat__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          <div class="reviews-stat__content">
            <p class="reviews-stat__label">Сессий</p>
            <p class="reviews-stat__value">{{ sessions }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="reviews-loading">
      <div class="reviews-loading__spinner"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="reviews.length === 0" class="reviews-empty">
      <svg class="reviews-empty__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2h-3l-4 4z" />
      </svg>
      <p class="reviews-empty__text">Нет отзывов</p>
    </div>

    <!-- Reviews List -->
    <div v-else class="reviews-list">
      <div v-for="review in reviews" :key="review.id" class="review-item">
        <!-- Header -->
        <div class="review-item__header">
          <div class="review-item__user-info">
            <!-- Avatar -->
            <img
              :src="review.user_image || 'https://via.placeholder.com/40'"
              :alt="review.user_name || 'User'"
              class="review-item__avatar"
            />
            <!-- User Info -->
            <div class="review-item__user-details">
              <p class="review-item__user-name">{{ review.user_name }}</p>
              <p class="review-item__date">{{ formatSessionDate(review.chat_created_at) }}</p>
            </div>
          </div>
          <!-- Rating -->
          <div class="review-item__rating">
            <span v-for="i in 5" :key="i" class="review-item__star" :class="{ 'review-item__star--filled': i <= review.rating, 'review-item__star--empty': i > review.rating }">★</span>
          </div>
        </div>

        <!-- Title -->
        <p v-if="review.title" class="review-item__title">{{ review.title }}</p>

        <!-- Comment -->
        <p class="review-item__comment">{{ review.comment }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getCompanionReviews, type Review } from '@/composables/useAppState'
import '@/assets/profile.css'

const props = defineProps<{
  companionId: string | number
  sessions?: number
}>()

const reviews = ref<Review[]>([])
const isLoading = ref(true)
const sessions = ref(props.sessions || 0)

const formatSessionDate = (dateString: string | null | undefined) => {
  if (!dateString) return 'Дата сессии неизвестна'

  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch {
    return 'Дата сессии неизвестна'
  }
}

onMounted(async () => {
  sessions.value = props.sessions || 0
  try {
    const companionIdStr = typeof props.companionId === 'string' ? props.companionId : props.companionId.toString()
    reviews.value = await getCompanionReviews(companionIdStr)
  } catch (err) {
    console.error('Error loading reviews:', err)
  } finally {
    isLoading.value = false
  }
})
</script>
