<template>
  <div class="user-requests-container">
    <div v-if="userRequests.length === 0" class="user-requests-empty">
      <svg class="user-requests-empty__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p class="user-requests-empty__text">У вас нет заявок на чат</p>
    </div>

    <div v-else class="user-requests-list">
      <div
        v-for="request in userRequests"
        :key="request.id"
        class="user-request-item"
      >
        <div class="user-request-item__header">
          <!-- Companion Info -->
          <div class="user-request-item__info">
            <!-- Avatar -->
            <img
              v-if="request.user_image"
              :src="request.user_image"
              :alt="request.user_name"
              class="user-request-item__avatar"
            />
            <div
              v-else
              class="user-request-item__avatar-placeholder"
            >
              <svg class="user-request-item__avatar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>

            <!-- Request Info -->
            <div class="user-request-item__details">
              <p class="user-request-item__name">{{ request.user_name }}</p>
              <p class="user-request-item__date">
                {{ formatDate(request.created_at) }}
              </p>
            </div>
          </div>

          <!-- Status Badge -->
          <span
            :class="[
              'user-request-item__badge',
              `user-request-item__badge--${request.status}`
            ]"
          >
            {{ getStatusText(request.status) }}
          </span>
        </div>

        <!-- Rejection Reason (if rejected) -->
        <div v-if="request.status === 'rejected' && request.rejection_reason" class="user-request-item__rejection">
          <p class="user-request-item__rejection-text">
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
.user-requests-container {
  width: 100%;
}

.user-requests-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  text-align: center;
}

.user-requests-empty__icon {
  width: 4rem;
  height: 4rem;
  color: rgba(93, 90, 136, 0.3);
  margin-bottom: 1rem;
}

.user-requests-empty__text {
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  color: rgba(93, 90, 136, 0.6);
}

.user-requests-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.user-request-item {
  padding: 1rem;
  background-color: var(--color-light-bg);
  border-radius: 0.75rem;
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all var(--transition-fast);
}

.user-request-item:hover {
  background-color: rgba(255, 106, 47, 0.05);
}

.user-request-item__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.user-request-item__info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  min-width: 0;
}

.user-request-item__avatar {
  width: 3rem;
  height: 3rem;
  border-radius: 9999px;
  object-fit: cover;
  flex-shrink: 0;
}

.user-request-item__avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border-radius: 9999px;
  background-color: rgba(255, 106, 47, 0.1);
  flex-shrink: 0;
}

.user-request-item__avatar-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: var(--color-primary);
}

.user-request-item__details {
  min-width: 0;
}

.user-request-item__name {
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  color: var(--color-secondary);
}

.user-request-item__date {
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  color: rgba(93, 90, 136, 0.6);
}

.user-request-item__badge {
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
  font-family: 'Inter', sans-serif;
}

.user-request-item__badge--pending {
  background-color: rgba(234, 179, 8, 0.1);
  color: #ca8a04;
}

.user-request-item__badge--approved {
  background-color: rgba(34, 197, 94, 0.1);
  color: #16a34a;
}

.user-request-item__badge--rejected {
  background-color: rgba(239, 68, 68, 0.1);
  color: #dc2626;
}

.user-request-item__rejection {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background-color: rgba(239, 68, 68, 0.05);
  border-radius: 0.5rem;
}

.user-request-item__rejection-text {
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  color: #dc2626;
  margin: 0;
}
</style>
