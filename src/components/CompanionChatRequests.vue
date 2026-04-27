<template>
  <div>
    <div v-if="allRequests.length === 0" class="text-center py-8">
      <svg class="w-16 h-16 text-secondary/30 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p class="text-secondary/60">У вас нет заявок на чат</p>
    </div>

    <div v-else class="space-y-6">
      <!-- Pending Requests Section -->
      <div v-if="pendingRequests.length > 0">
        <h3 class="text-lg font-semibold text-secondary mb-4 pb-3 border-b border-border">
          <span class="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-bold mr-2">
            {{ pendingRequests.length }}
          </span>
          В ожидании
        </h3>

        <div class="space-y-4">
          <div
            v-for="request in pendingRequests"
            :key="request.id"
            class="flex items-center justify-between p-4 bg-light-bg rounded-xl hover:bg-primary/5 transition-colors border border-yellow-200"
          >
            <!-- User Info -->
            <div class="flex items-center gap-4 flex-1">
              <!-- Avatar -->
              <img
                v-if="request.user_image"
                :src="request.user_image"
                :alt="request.user_name"
                class="w-12 h-12 rounded-full object-cover"
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
              <div>
                <p class="font-semibold text-secondary">{{ request.user_name }}</p>
                <p class="text-sm text-secondary/60">
                  {{ formatDate(request.created_at) }}
                </p>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-2 flex-shrink-0">
              <button
                @click="handleApprove(request.id)"
                :disabled="isLoading"
                class="px-4 py-2 bg-green-500 text-white font-semibold rounded-full text-sm hover:bg-green-600 disabled:opacity-50 transition-all"
              >
                {{ isLoading ? '...' : 'Принять' }}
              </button>
              <button
                @click="handleReject(request.id)"
                :disabled="isLoading"
                class="px-4 py-2 text-red-500 font-semibold border-2 border-red-500 rounded-full text-sm hover:bg-red-50 disabled:opacity-50 transition-all"
              >
                {{ isLoading ? '...' : 'Отклонить' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Approved Requests Section -->
      <div v-if="approvedRequests.length > 0">
        <h3 class="text-lg font-semibold text-secondary mb-4 pb-3 border-b border-border">
          <span class="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-bold mr-2">
            {{ approvedRequests.length }}
          </span>
          Одобренные
        </h3>

        <div class="space-y-4">
          <div
            v-for="request in approvedRequests"
            :key="request.id"
            class="flex items-center justify-between p-4 bg-light-bg rounded-xl border border-green-200"
          >
            <!-- User Info -->
            <div class="flex items-center gap-4 flex-1">
              <img
                v-if="request.user_image"
                :src="request.user_image"
                :alt="request.user_name"
                class="w-12 h-12 rounded-full object-cover"
              />
              <div v-else class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>

              <div>
                <p class="font-semibold text-secondary">{{ request.user_name }}</p>
                <p class="text-sm text-secondary/60">Одобрена {{ formatDate(request.approved_at) }}</p>
              </div>
            </div>

            <!-- Status Badge -->
            <div class="flex-shrink-0">
              <span class="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                ✓ Одобрена
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Rejected Requests Section -->
      <div v-if="rejectedRequests.length > 0">
        <h3 class="text-lg font-semibold text-secondary mb-4 pb-3 border-b border-border">
          <span class="inline-block px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-bold mr-2">
            {{ rejectedRequests.length }}
          </span>
          Отклоненные
        </h3>

        <div class="space-y-4">
          <div
            v-for="request in rejectedRequests"
            :key="request.id"
            class="flex items-center justify-between p-4 bg-light-bg rounded-xl border border-red-200"
          >
            <!-- User Info -->
            <div class="flex items-center gap-4 flex-1">
              <img
                v-if="request.user_image"
                :src="request.user_image"
                :alt="request.user_name"
                class="w-12 h-12 rounded-full object-cover"
              />
              <div v-else class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>

              <div>
                <p class="font-semibold text-secondary">{{ request.user_name }}</p>
                <p class="text-sm text-secondary/60">Отклонена {{ formatDate(request.rejected_at) }}</p>
              </div>
            </div>

            <!-- Status Badge -->
            <div class="flex-shrink-0">
              <span class="px-4 py-2 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
                ✗ Отклонена
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Notification -->
    <transition name="slide">
      <div
        v-if="notification"
        class="fixed top-[180px] left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-full shadow-lg z-50"
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
    await approveChatRequest(requestId)
    notification.value = 'Заявка принята! Чат создан.'
    setTimeout(() => {
      notification.value = ''
    }, 3000)
    // Reload requests
    await loadChatRequests(props.companionId, 'all')
  } catch (err) {
    console.error('Error approving request:', err)
    notification.value = 'Ошибка при принятии заявки'
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
  transform: translateY(-20px);
}
</style>
