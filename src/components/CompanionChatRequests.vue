<template>
  <div class="chat-requests-section">
    <h2 class="chat-requests-section__title">Входящие заявки на чат</h2>
    <div v-if="allRequests.length === 0" class="reviews-empty">
      <svg class="reviews-empty__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p class="reviews-empty__text">У вас нет заявок на чат</p>
    </div>

    <div v-else class="chat-requests-list">
      <!-- Pending Requests Section -->
      <div v-if="pendingRequests.length > 0">
        <div class="chat-requests-section__header">
          <h3 class="chat-requests-section__subtitle">
            <span class="chat-requests-section__badge chat-requests-section__badge--pending">
              {{ pendingRequests.length }}
            </span>
            В ожидании
          </h3>
        </div>

        <div class="chat-requests-list">
          <div
            v-for="request in pendingRequests"
            :key="request.id"
            class="chat-request-item"
            style="border-color: rgba(234, 179, 8, 0.3);"
          >
            <!-- User Info -->
            <div class="chat-request-item__user-info">
              <!-- Avatar -->
              <img
                v-if="request.user_image"
                :src="request.user_image"
                :alt="request.user_name"
                class="chat-request-item__avatar"
              />
              <div
                v-else
                class="chat-request-item__avatar-placeholder"
              >
                <svg class="chat-request-item__avatar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>

              <!-- Request Info -->
              <div class="chat-request-item__details">
                <p class="chat-request-item__name">{{ request.user_name }}</p>
                <p class="chat-request-item__date">
                  {{ formatDate(request.created_at) }}
                </p>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="chat-request-item__actions">
              <button
                @click="handleApprove(request.id)"
                :disabled="isLoading"
                class="chat-request-item__btn chat-request-item__btn--approve"
              >
                {{ isLoading ? '...' : 'Принять' }}
              </button>
              <button
                @click="handleReject(request.id)"
                :disabled="isLoading"
                class="chat-request-item__btn chat-request-item__btn--reject"
              >
                {{ isLoading ? '...' : 'Отклонить' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Approved Requests Section -->
      <div v-if="approvedRequests.length > 0" style="margin-top: 1.5rem;">
        <div class="chat-requests-section__header">
          <h3 class="chat-requests-section__subtitle">
            <span class="chat-requests-section__badge chat-requests-section__badge--approved">
              {{ approvedRequests.length }}
            </span>
            Одобренные
          </h3>
        </div>

        <div class="chat-requests-list">
          <div
            v-for="request in approvedRequests"
            :key="request.id"
            class="chat-request-item"
            style="border-color: rgba(34, 197, 94, 0.3);"
          >
            <!-- User Info -->
            <div class="chat-request-item__user-info">
              <img
                v-if="request.user_image"
                :src="request.user_image"
                :alt="request.user_name"
                class="chat-request-item__avatar"
              />
              <div v-else class="chat-request-item__avatar-placeholder">
                <svg class="chat-request-item__avatar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>

              <div class="chat-request-item__details">
                <p class="chat-request-item__name">{{ request.user_name }}</p>
                <p class="chat-request-item__date">Одобрена {{ formatDate(request.approved_at) }}</p>
              </div>
            </div>

            <!-- Status Badge -->
            <span class="chat-request-item__status chat-request-item__status--approved">
              ✓ Одобрена
            </span>
          </div>
        </div>
      </div>

      <!-- Rejected Requests Section -->
      <div v-if="rejectedRequests.length > 0" style="margin-top: 1.5rem;">
        <div class="chat-requests-section__header">
          <h3 class="chat-requests-section__subtitle">
            <span class="chat-requests-section__badge chat-requests-section__badge--rejected">
              {{ rejectedRequests.length }}
            </span>
            Отклоненные
          </h3>
        </div>

        <div class="chat-requests-list">
          <div
            v-for="request in rejectedRequests"
            :key="request.id"
            class="chat-request-item"
            style="border-color: rgba(239, 68, 68, 0.3);"
          >
            <!-- User Info -->
            <div class="chat-request-item__user-info">
              <img
                v-if="request.user_image"
                :src="request.user_image"
                :alt="request.user_name"
                class="chat-request-item__avatar"
              />
              <div v-else class="chat-request-item__avatar-placeholder">
                <svg class="chat-request-item__avatar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>

              <div class="chat-request-item__details">
                <p class="chat-request-item__name">{{ request.user_name }}</p>
                <p class="chat-request-item__date">Отклонена {{ formatDate(request.rejected_at) }}</p>
              </div>
            </div>

            <!-- Status Badge -->
            <span class="chat-request-item__status chat-request-item__status--rejected">
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
        class="chat-requests-notification"
      >
        {{ notification }}
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { chatRequests, loadChatRequests, approveChatRequest, rejectChatRequest } from '../composables/useAppState'
import '@/assets/profile.css'

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
