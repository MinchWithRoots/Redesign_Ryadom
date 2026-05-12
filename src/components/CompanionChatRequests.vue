<template>
  <div class="companion-requests-container">
    <div v-if="allRequests.length === 0" class="companion-requests-empty">
      <svg class="companion-requests-empty__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p class="companion-requests-empty__text">У вас нет заявок на чат</p>
    </div>

    <div v-else class="companion-requests-sections">
      <!-- Pending Requests Section -->
      <div v-if="pendingRequests.length > 0" class="companion-requests-section">
        <h3 class="companion-requests-section__title">
          <span class="companion-requests-section__badge companion-requests-section__badge--pending">
            {{ pendingRequests.length }}
          </span>
          В ожидании
        </h3>

        <div class="companion-requests-list">
          <div
            v-for="request in pendingRequests"
            :key="request.id"
            class="companion-request-item companion-request-item--pending"
          >
            <!-- User Info -->
            <div class="companion-request-item__info">
              <!-- Avatar -->
              <img
                v-if="request.user_image"
                :src="request.user_image"
                :alt="request.user_name"
                class="companion-request-item__avatar"
              />
              <div
                v-else
                class="companion-request-item__avatar-placeholder"
              >
                <svg class="companion-request-item__avatar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>

              <!-- Request Info -->
              <div class="companion-request-item__details">
                <p class="companion-request-item__name">{{ request.user_name }}</p>
                <p class="companion-request-item__date">
                  {{ formatDate(request.created_at) }}
                </p>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="companion-request-item__actions">
              <button
                @click="handleApprove(request.id)"
                :disabled="isLoading"
                class="companion-request-item__btn companion-request-item__btn--approve"
              >
                {{ isLoading ? '...' : 'Принять' }}
              </button>
              <button
                @click="handleReject(request.id)"
                :disabled="isLoading"
                class="companion-request-item__btn companion-request-item__btn--reject"
              >
                {{ isLoading ? '...' : 'Отклонить' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Approved Requests Section -->
      <div v-if="approvedRequests.length > 0" class="companion-requests-section">
        <h3 class="companion-requests-section__title">
          <span class="companion-requests-section__badge companion-requests-section__badge--approved">
            {{ approvedRequests.length }}
          </span>
          Одобренные
        </h3>

        <div class="companion-requests-list">
          <div
            v-for="request in approvedRequests"
            :key="request.id"
            class="companion-request-item companion-request-item--approved"
          >
            <!-- User Info -->
            <div class="companion-request-item__info">
              <img
                v-if="request.user_image"
                :src="request.user_image"
                :alt="request.user_name"
                class="companion-request-item__avatar"
              />
              <div v-else class="companion-request-item__avatar-placeholder">
                <svg class="companion-request-item__avatar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>

              <div class="companion-request-item__details">
                <p class="companion-request-item__name">{{ request.user_name }}</p>
                <p class="companion-request-item__date">Одобрена {{ formatDate(request.approved_at) }}</p>
              </div>
            </div>

            <!-- Status Badge -->
            <span class="companion-request-item__status companion-request-item__status--approved">
              ✓ Одобрена
            </span>
          </div>
        </div>
      </div>

      <!-- Rejected Requests Section -->
      <div v-if="rejectedRequests.length > 0" class="companion-requests-section">
        <h3 class="companion-requests-section__title">
          <span class="companion-requests-section__badge companion-requests-section__badge--rejected">
            {{ rejectedRequests.length }}
          </span>
          Отклоненные
        </h3>

        <div class="companion-requests-list">
          <div
            v-for="request in rejectedRequests"
            :key="request.id"
            class="companion-request-item companion-request-item--rejected"
          >
            <!-- User Info -->
            <div class="companion-request-item__info">
              <img
                v-if="request.user_image"
                :src="request.user_image"
                :alt="request.user_name"
                class="companion-request-item__avatar"
              />
              <div v-else class="companion-request-item__avatar-placeholder">
                <svg class="companion-request-item__avatar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>

              <div class="companion-request-item__details">
                <p class="companion-request-item__name">{{ request.user_name }}</p>
                <p class="companion-request-item__date">Отклонена {{ formatDate(request.rejected_at) }}</p>
              </div>
            </div>

            <!-- Status Badge -->
            <span class="companion-request-item__status companion-request-item__status--rejected">
              ✗ Отклонена
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Notification -->
    <transition name="slide">
      <div
        v-if="notification"
        class="companion-requests-notification"
      >
        {{ notification }}
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { chatRequests, loadChatRequests, approveChatRequest, rejectChatRequest } from '../composables/useAppState'

interface Props {
  companionId: string | number
}

const props = defineProps<Props>()

const isLoading = ref(false)
const notification = ref('')

const allRequests = computed(() => chatRequests.value)

const pendingRequests = computed(() => {
  return chatRequests.value.filter(r => r.status === 'pending')
})

const approvedRequests = computed(() => {
  return chatRequests.value.filter(r => r.status === 'approved')
})

const rejectedRequests = computed(() => {
  return chatRequests.value.filter(r => r.status === 'rejected')
})

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return ''
  
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

const handleApprove = async (requestId: string) => {
  isLoading.value = true
  try {
    console.log('handleApprove called with requestId:', requestId)
    await approveChatRequest(requestId)
    notification.value = 'Заявка принята! Чат создан.'
    setTimeout(() => {
      notification.value = ''
    }, 3000)
    // Reload requests
    await loadChatRequests(props.companionId, 'all')
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    console.error('Error approving request:', {
      error: err,
      message: errorMsg,
      stack: err instanceof Error ? err.stack : undefined,
    })
    notification.value = `Ошибка: ${errorMsg}`
    setTimeout(() => {
      notification.value = ''
    }, 5000)
  } finally {
    isLoading.value = false
  }
}

const handleReject = async (requestId: string) => {
  isLoading.value = true
  try {
    await rejectChatRequest(requestId, '')
    notification.value = 'Заявка отклонена.'
    setTimeout(() => {
      notification.value = ''
    }, 3000)
    // Reload requests
    await loadChatRequests(props.companionId, 'all')
  } catch (err) {
    console.error('Error rejecting request:', err)
    notification.value = 'Ошибка при отклонении заявки'
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  try {
    // Load all requests (pending, approved, rejected)
    await loadChatRequests(props.companionId, 'all')
  } catch (err) {
    console.error('Error loading chat requests:', err)
  }
})

watch(
  () => props.companionId,
  async (newCompanionId) => {
    try {
      await loadChatRequests(newCompanionId, 'all')
    } catch (err) {
      console.error('Error loading chat requests:', err)
    }
  }
)
</script>

<style scoped>
.companion-requests-container {
  width: 100%;
}

.companion-requests-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  text-align: center;
}

.companion-requests-empty__icon {
  width: 4rem;
  height: 4rem;
  color: rgba(93, 90, 136, 0.3);
  margin-bottom: 1rem;
}

.companion-requests-empty__text {
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  color: rgba(93, 90, 136, 0.6);
}

.companion-requests-sections {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.companion-requests-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.companion-requests-section__title {
  font-family: 'Inter', sans-serif;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-secondary);
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.companion-requests-section__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 700;
  font-family: 'Inter', sans-serif;
}

.companion-requests-section__badge--pending {
  background-color: rgba(234, 179, 8, 0.1);
  color: #ca8a04;
}

.companion-requests-section__badge--approved {
  background-color: rgba(34, 197, 94, 0.1);
  color: #16a34a;
}

.companion-requests-section__badge--rejected {
  background-color: rgba(239, 68, 68, 0.1);
  color: #dc2626;
}

.companion-requests-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.companion-request-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background-color: var(--color-light-bg);
  border-radius: 0.75rem;
  transition: all var(--transition-fast);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.companion-request-item--pending {
  border-color: rgba(234, 179, 8, 0.3);
}

.companion-request-item--pending:hover {
  background-color: rgba(255, 106, 47, 0.05);
}

.companion-request-item--approved {
  border-color: rgba(34, 197, 94, 0.3);
}

.companion-request-item--rejected {
  border-color: rgba(239, 68, 68, 0.3);
}

.companion-request-item__info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.companion-request-item__avatar {
  width: 3rem;
  height: 3rem;
  border-radius: 9999px;
  object-fit: cover;
  flex-shrink: 0;
}

.companion-request-item__avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border-radius: 9999px;
  background-color: rgba(255, 106, 47, 0.1);
  flex-shrink: 0;
}

.companion-request-item__avatar-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: var(--color-primary);
}

.companion-request-item__details {
  flex: 1;
}

.companion-request-item__name {
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  color: var(--color-secondary);
}

.companion-request-item__date {
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  color: rgba(93, 90, 136, 0.6);
}

.companion-request-item__actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.companion-request-item__btn {
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.companion-request-item__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.companion-request-item__btn--approve {
  background-color: #22c55e;
  color: white;
}

.companion-request-item__btn--approve:hover:not(:disabled) {
  background-color: #16a34a;
}

.companion-request-item__btn--reject {
  background-color: transparent;
  color: #ef4444;
  border: 2px solid #ef4444;
}

.companion-request-item__btn--reject:hover:not(:disabled) {
  background-color: rgba(239, 68, 68, 0.05);
}

.companion-request-item__status {
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  flex-shrink: 0;
}

.companion-request-item__status--approved {
  background-color: rgba(34, 197, 94, 0.1);
  color: #16a34a;
}

.companion-request-item__status--rejected {
  background-color: rgba(239, 68, 68, 0.1);
  color: #dc2626;
}

.companion-requests-notification {
  position: fixed;
  top: 180px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #22c55e;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 9999px;
  box-shadow: var(--shadow-lg);
  z-index: 50;
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  font-weight: 500;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}
</style>
