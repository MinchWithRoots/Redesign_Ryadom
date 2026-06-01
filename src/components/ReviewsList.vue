<template>
  <div class="reviews-section">
    <h2 class="reviews-section__title">Отзывы ({{ reviews.length }})</h2>


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
      <div v-for="review in reviewsAboutComputed" :key="review.id" class="review-item">
        <!-- Header -->
        <div class="review-item__header">
          <div class="review-item__user-info">
            <!-- Avatar -->
            <img
              v-if="!review.is_anonymous"
              :src="review.user_image || 'https://via.placeholder.com/40'"
              :alt="review.user_name || 'User'"
              class="review-item__avatar"
            />
            <div v-else class="review-item__avatar review-item__avatar--anonymous">?</div>
            <!-- User Info -->
            <div class="review-item__user-details">
              <p class="review-item__user-name">{{ review.is_anonymous ? 'Анонимный пользователь' : review.user_name }}</p>
            </div>
          </div>
          <!-- Rating -->
          <div class="review-item__rating">
            <img v-for="i in 5" :key="i" src="../images/star.svg" alt="Star" class="review-item__star" :class="{ 'review-item__star--filled': i <= review.rating, 'review-item__star--empty': i > review.rating }" />
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
import { ref, onMounted, computed } from 'vue'
import { getCompanionReviews, type Review } from '@/composables/useAppState'
import '@/assets/profile.css'

const props = defineProps<{
  companionId: string | number
}>()

const emit = defineEmits<{
  reviewsLoaded: [reviews: Review[]]
}>()

const reviews = ref<Review[]>([])
const isLoading = ref(true)
const allReviewsAbout = ref<Review[]>([])

const reviewsAboutComputed = computed(() => {
  return allReviewsAbout.value
})

const loadReviews = async () => {
  isLoading.value = true
  try {
    const companionIdStr = typeof props.companionId === 'string' ? props.companionId : props.companionId.toString()

    // Load reviews ABOUT this companion
    allReviewsAbout.value = await getCompanionReviews(companionIdStr)
    reviews.value = allReviewsAbout.value
    emit('reviewsLoaded', reviews.value)
  } catch (err) {
    console.error('Error loading reviews:', err)
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await loadReviews()
})

defineExpose({
  loadReviews
})
</script>

<style scoped>
</style>
