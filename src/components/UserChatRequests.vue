<template>
  <div>
    <div v-if="userRequests.length === 0" class="text-center py-8">
      <svg class="w-16 h-16 text-secondary/30 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p class="text-secondary/60">У вас нет заявок на чат</p>
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="request in userRequests"
        :key="request.id"
        class="p-4 bg-light-bg rounded-xl hover:bg-primary/5 transition-colors border border-border/50"
      >
        <div class="flex items-center justify-between gap-4">
          <!-- Companion Info -->
          <div class="flex items-center gap-4 flex-1 min-w-0">
            <!-- Avatar -->
            <img
              v-if="request.user_image"
              :src="request.user_image"
              :alt="request.user_name"
              class="w-12 h-12 rounded-full object-cover flex-shrink-0"
            />
            <div
              v-else
              class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0"
            >
              <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>

            <!-- Request Info -->
            <div class="min-w-0 flex-1">
              <p class="font-semibold text-secondary truncate">{{ request.user_name }}</p>
              <p class="text-sm text-secondary/60">
                {{ formatDate(request.created_at) }}
              </p>
            </div>
          </div>

          <!-- Status Badge -->
          <div class="flex-shrink-0">
            <span
              :class="[
                'px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap',
                request.status === 'pending' && 'bg-yellow-100 text-yellow-800',
                request.status === 'approved' && 'bg-green-100 text-green-800',
                request.status === 'rejected' && 'bg-red-100 text-red-800',
              ]"
            >
              {{ getStatusText(request.status) }}
            </span>
          </div>
        </div>

        <!-- Rejection Reason (if rejected) -->
        <div v-if="request.status === 'rejected' && request.rejection_reason" class="mt-3 p-3 bg-red-50 rounded-lg">
          <p class="text-sm text-red-700">
            <strong>Причина отклонения:</strong> {{ request.rejection_reason }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { userChatRequests, loadUserChatRequests, currentUser } from '../composables/useAppState'

const userRequests = computed(() => userChatRequests.value)

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

  if (diffHours < 1) {
    return 'только что'
  } else if (diffHours < 24) {
    return `${diffHours}ч назад`
  } else {
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays === 1) return 'вчера'
    return date.toLocaleDateString('ru-RU')
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'pending':
      return 'В ожидании'
    case 'approved':
      return 'Одобрена'
    case 'rejected':
      return 'Отклонена'
    default:
      return status
  }
}

onMounted(async () => {
  if (currentUser.value) {
    try {
      await loadUserChatRequests(currentUser.value.id)
    } catch (err) {
      console.error('Error loading user chat requests:', err)
    }
  }
})
</script>

<style scoped>
</style>
