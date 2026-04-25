<template>
  <div v-if="pendingRequests.length > 0" class="card">
    <h2 class="text-2xl font-bold text-secondary mb-6">Заявки на чат</h2>

    <div class="space-y-4">
      <div
        v-for="request in pendingRequests"
        :key="request.id"
        class="flex items-center justify-between p-4 bg-light-bg rounded-xl hover:bg-primary/5 transition-colors"
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
            class="px-4 py-2 bg-primary text-white font-semibold rounded-full text-sm hover:bg-primary/90 disabled:opacity-50 transition-all"
          >
            {{ isLoading ? '...' : 'Принять' }}
          </button>
          <button
            @click="handleReject(request.id)"
            :disabled="isLoading"
            class="px-4 py-2 text-primary font-semibold border-2 border-primary rounded-full text-sm hover:bg-primary/5 disabled:opacity-50 transition-all"
          >
            {{ isLoading ? '...' : 'Отклонить' }}
          </button>
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

const pendingRequests = computed(() => {
  return chatRequests.value.filter(r => r.status === 'pending')
})

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

  if (diffHours < 1) {
    return 'только что'
  } else if (diffHours < 24) {
    return `${diffHours}ч назад`
  } else {
    return date.toLocaleDateString('ru-RU')
  }
}

const handleApprove = async (requestId: string) => {
  isLoading.value = true
  try {
    const result = await approveChatRequest(requestId)
    notification.value = 'Заявка принята! Чат создан.'
    setTimeout(() => {
      notification.value = ''
    }, 3000)
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
  } catch (err) {
    console.error('Error rejecting request:', err)
    notification.value = 'Ошибка при отклонении заявки'
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  try {
    await loadChatRequests(props.companionId)
  } catch (err) {
    console.error('Error loading chat requests:', err)
  }
})

watch(
  () => props.companionId,
  async (newCompanionId) => {
    try {
      await loadChatRequests(newCompanionId)
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
