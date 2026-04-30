<template>
  <div class="card">
    <h2 class="text-2xl font-bold text-secondary mb-6">Отзывы ({{ reviews.length }})</h2>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-8">
      <div class="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="reviews.length === 0" class="text-center py-8">
      <svg class="w-12 h-12 text-secondary/30 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2h-3l-4 4z" />
      </svg>
      <p class="text-secondary/60">Нет отзывов</p>
    </div>

    <!-- Reviews List -->
    <div v-else class="space-y-4">
      <div v-for="review in reviews" :key="review.id" class="p-4 bg-light-bg rounded-xl border border-border/50">
        <!-- Header -->
        <div class="flex items-start justify-between mb-3">
          <div class="flex items-center gap-3">
            <!-- Avatar -->
            <img
              :src="review.user_image || 'https://via.placeholder.com/40'"
              :alt="review.user_name || 'User'"
              class="w-10 h-10 rounded-full object-cover"
            />
            <!-- User Info -->
            <div>
              <p class="font-semibold text-secondary">{{ review.user_name }}</p>
              <p class="text-xs text-secondary/60">{{ formatSessionDate(review.chat_created_at) }}</p>
            </div>
          </div>
          <!-- Rating -->
          <div class="flex gap-0.5">
            <span v-for="i in 5" :key="i" class="text-lg">
              <span v-if="i <= review.rating" class="text-yellow-400">★</span>
              <span v-else class="text-secondary/20">★</span>
            </span>
          </div>
        </div>

        <!-- Title -->
        <p v-if="review.title" class="font-semibold text-secondary mb-2">{{ review.title }}</p>

        <!-- Comment -->
        <p class="text-secondary/70 leading-relaxed text-sm break-words">{{ review.comment }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getCompanionReviews, type Review } from '@/composables/useAppState'

const props = defineProps<{
  companionId: string | number
}>()

const reviews = ref<Review[]>([])
const isLoading = ref(true)

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
