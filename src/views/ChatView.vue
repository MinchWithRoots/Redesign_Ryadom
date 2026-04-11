<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { messages, getChatById, sendMessage as sendChatMessage, endSession, getChatMessages } from '../composables/useAppState'
import * as supabaseService from '../services/supabaseService'

const router = useRouter()
const route = useRoute()
const messageInput = ref('')
const isEndingSession = ref(false)
const sessionEnded = ref(false)
const showReportModal = ref(false)
const reportReason = ref('')
const reportMessage = ref('')
const isReporting = ref(false)
const reportSuccess = ref('')

const chatId = computed(() => (route.query.id as string) || null)

const chat = computed(() => getChatById(chatId.value))

const chatMessages = computed(() => getChatMessages(chatId.value))

const currentCompanion = computed(() => {
  if (chat.value) {
    return {
      name: chat.value.name,
      status: chat.value.status,
      image: chat.value.image,
    }
  }
  return null
})

const sendMessage = () => {
  if (messageInput.value.trim() && chatId.value) {
    sendChatMessage(chatId.value, messageInput.value)
    messageInput.value = ''
  }
}

const handleEndSession = async () => {
  isEndingSession.value = true
  try {
    endSession(chatId.value)
    sessionEnded.value = true
    setTimeout(() => {
      router.push('/profile')
    }, 2000)
  } finally {
    isEndingSession.value = false
  }
}

const handleReportUser = async () => {
  if (!reportReason.value || !reportMessage.value || !chatId.value) {
    alert('Пожалуйста, выберите причину и опишите ситуацию')
    return
  }

  isReporting.value = true
  try {
    const chat = getChatById(chatId.value)
    if (!chat) {
      alert('Chat not found')
      return
    }

    // Submit report to Supabase
    await supabaseService.submitReport(
      chatId.value,
      chat.user_id,
      chat.companion_id,
      reportReason.value,
      reportMessage.value
    )

    reportSuccess.value = 'Спасибо за отчёт. Наша команда проверит это.'
    setTimeout(() => {
      showReportModal.value = false
      reportSuccess.value = ''
      reportReason.value = ''
      reportMessage.value = ''
    }, 2000)
  } catch (err) {
    console.error('Error submitting report:', err)
    alert('Ошибка при отправке отчёта')
  } finally {
    isReporting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-white to-light-bg pt-[140px] pb-16 flex flex-col">
    <div class="container mx-auto px-4 lg:px-8 max-w-4xl flex-1 flex flex-col">
      <!-- Chat Header -->
      <div class="bg-white border border-border/50 rounded-3xl p-4 mb-6 shadow-card flex items-center justify-between sticky top-[140px] z-40">
        <div class="flex items-center gap-4">
          <!-- Avatar -->
          <div class="relative">
            <img
              :src="currentCompanion.image"
              :alt="currentCompanion.name"
              class="w-12 h-12 rounded-full object-cover"
            />
            <div class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
          </div>

          <!-- Info -->
          <div>
            <h2 class="font-bold text-secondary">{{ currentCompanion.name }}</h2>
            <p class="text-xs text-green-500 font-medium">{{ currentCompanion.status }}</p>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-2">
          <button class="p-2 hover:bg-light-bg rounded-lg transition-colors text-secondary/60 hover:text-secondary">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 00.948.684l1.498 4.493a1 1 0 00.502.756l2.04 1.318a11.042 11.042 0 005.516 5.516l1.318 2.04a1 1 0 00.756.502l4.493 1.498a1 1 0 00.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </button>
          <button class="p-2 hover:bg-light-bg rounded-lg transition-colors text-secondary/60 hover:text-secondary">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            @click="showReportModal = true"
            class="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-500 hover:text-red-600"
            title="SOS/Пожаловаться"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4v2m0 6H2a1 1 0 00-1 1v1a6 6 0 006 6h8a6 6 0 006-6v-1a1 1 0 00-1-1h-1m-6-15a6 6 0 100 12 6 6 0 000-12z" />
            </svg>
          </button>
          <button
            @click="handleEndSession"
            :disabled="isEndingSession"
            class="p-2 hover:bg-light-bg rounded-lg transition-colors text-secondary/60 hover:text-secondary disabled:opacity-50"
            title="Завершить сессию"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Session Ended Message -->
      <transition name="fade">
        <div v-if="sessionEnded" class="absolute inset-0 bg-black/50 flex items-center justify-center z-50 rounded-3xl">
          <div class="bg-white rounded-2xl p-8 text-center">
            <h2 class="text-2xl font-bold text-secondary mb-2">Сессия завершена</h2>
            <p class="text-secondary/60">Спасибо за использование нашего сервиса!</p>
          </div>
        </div>
      </transition>

      <!-- Report Modal -->
      <transition name="fade">
        <div v-if="showReportModal" class="absolute inset-0 bg-black/50 flex items-center justify-center z-50 rounded-3xl">
          <div class="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-hover">
            <button
              @click="showReportModal = false"
              class="ml-auto block text-secondary/50 hover:text-secondary transition-colors mb-4"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 class="text-2xl font-bold text-secondary mb-2">SOS/Пожаловаться</h2>
            <p class="text-sm text-secondary/60 mb-6">Если вы чувствуете себя в опасности или встретили неадекватное поведение, расскажите нам.</p>

            <!-- Success Message -->
            <transition name="fade">
              <div v-if="reportSuccess" class="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm">
                {{ reportSuccess }}
              </div>
            </transition>

            <div class="space-y-4">
              <!-- Reason Select -->
              <div>
                <label class="text-sm font-semibold text-secondary block mb-2">Причина</label>
                <select
                  v-model="reportReason"
                  class="w-full px-4 py-2 border border-border rounded-xl text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="">Выберите причину...</option>
                  <option value="harassment">Оскорбления/Harassing</option>
                  <option value="inappropriate">Неадекватное поведение</option>
                  <option value="explicit">Оскорбительный контент</option>
                  <option value="danger">Ощущение опасности</option>
                  <option value="other">Другое</option>
                </select>
              </div>

              <!-- Message -->
              <div>
                <label class="text-sm font-semibold text-secondary block mb-2">Описание</label>
                <textarea
                  v-model="reportMessage"
                  rows="3"
                  placeholder="Опишите, что произошло..."
                  class="w-full px-4 py-2 border border-border rounded-xl text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                ></textarea>
              </div>

              <!-- Submit Button -->
              <button
                @click="handleReportUser"
                :disabled="isReporting"
                class="w-full py-3 bg-red-500 text-white font-semibold rounded-full hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span v-if="!isReporting">Отправить отчёт</span>
                <span v-else>Отправка...</span>
              </button>

              <p class="text-xs text-secondary/60 text-center">
                Ваши сообщения остаются конфиденциальными. Мы проверим все отчёты.
              </p>
            </div>
          </div>
        </div>
      </transition>

      <!-- Messages Container -->
      <div class="flex-1 overflow-y-auto mb-6 space-y-4 px-2">
        <div
          v-for="message in chatMessages"
          :key="message.id"
          :class="[
            'flex gap-3',
            message.isMine ? 'justify-end' : 'justify-start'
          ]"
        >
          <!-- Avatar (for other) -->
          <div v-if="!message.isMine" class="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm">
            М
          </div>

          <!-- Message Bubble -->
          <div
            :class="[
              'max-w-xs lg:max-w-md px-4 py-3 rounded-2xl',
              message.isMine
                ? 'bg-gradient-to-r from-primary to-primary/90 text-white rounded-br-none'
                : 'bg-light-bg text-secondary rounded-bl-none'
            ]"
          >
            <p class="text-sm leading-relaxed">{{ message.text }}</p>
            <p :class="[
              'text-xs mt-1',
              message.isMine ? 'text-white/70' : 'text-secondary/50'
            ]">
              {{ message.time }}
            </p>
          </div>

          <!-- Avatar (for me) -->
          <div v-if="message.isMine" class="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-white text-sm">
            Я
          </div>
        </div>
      </div>

      <!-- Input Area -->
      <div class="bg-white border border-border/50 rounded-3xl p-4 shadow-card">
        <div class="flex gap-3">
          <!-- Attachment Button -->
          <button class="flex-shrink-0 p-2 text-secondary/60 hover:text-secondary transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>

          <!-- Input -->
          <input
            v-model="messageInput"
            type="text"
            placeholder="Напишите сообщение..."
            @keyup.enter="sendMessage"
            class="flex-1 px-4 py-2 bg-light-bg rounded-full focus:outline-none text-secondary placeholder-secondary/50"
          />

          <!-- Send Button -->
          <button
            @click="sendMessage"
            :disabled="!messageInput.trim()"
            class="flex-shrink-0 px-4 py-2 bg-primary text-white rounded-full hover:shadow-soft disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5.951-2.976 5.951 2.976a1 1 0 001.169-1.409l-7-14z" />
            </svg>
          </button>
        </div>

        <!-- Info -->
        <p class="text-xs text-secondary/50 mt-3 text-center">
          Сессия завершится через 45 минут
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Smooth scrolling for messages */
div::-webkit-scrollbar {
  width: 6px;
}

div::-webkit-scrollbar-track {
  background: transparent;
}

div::-webkit-scrollbar-thumb {
  background: #d3d2e3;
  border-radius: 3px;
}

div::-webkit-scrollbar-thumb:hover {
  background: #d4846a;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
