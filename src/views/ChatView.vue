<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { currentUser, messages, getChatById, endSession, loadChats, chats as globalChats } from '../composables/useAppState'
import { supabase } from '@/utils/supabase'
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
const isLoadingMessages = ref(false)
const isSending = ref(false)
const messagesContainer = ref<HTMLElement | null>(null)
const showActionMenu = ref(false)
const isBlockingUser = ref(false)
const blockSuccess = ref('')

const chatId = computed(() => (route.query.id as string) || null)

const chat = computed(() => {
  if (!chatId.value) return null
  return globalChats.value.find(c => c.id.toString() === chatId.value)
})

const chatMessages = computed(() => messages.value)

const currentCompanion = computed(() => {
  if (chat.value) {
    // Determine status - show as "Онлайн" for active status or "Оффлайн" otherwise
    const statusText = chat.value.status === 'online' || chat.value.status === 'active' ? 'Онлайн' : 'Оффлайн'
    return {
      name: chat.value.name,
      status: statusText,
      image: chat.value.image,
      rawStatus: chat.value.status, // Keep raw status for internal comparisons
    }
  }
  return null
})


// Format time for display
const formatTime = (date: string | Date) => {
  const d = new Date(date)
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

const loadMessages = async () => {
  if (chatId.value) {
    isLoadingMessages.value = true
    try {
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId.value)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error loading messages:', error)
        return
      }

      // Transform messages to include proper formatting and get sender names
      const transformedMessages = await Promise.all((messagesData || []).map(async (msg: any) => {
        let authorName = 'Unknown'

        if (msg.sender_id === currentUser.value?.id) {
          authorName = currentUser.value?.name || 'You'
        } else {
          // Fetch sender info for other users
          try {
            const { data: senderData } = await supabase
              .from('users')
              .select('name')
              .eq('id', msg.sender_id)
              .single()
            authorName = senderData?.name || 'Unknown'
          } catch (err) {
            console.error('Error fetching sender name:', err)
          }
        }

        return {
          id: msg.id,
          sender_id: msg.sender_id,
          text: msg.text,
          created_at: msg.created_at,
          author: authorName,
          isMine: msg.sender_id === currentUser.value?.id,
          chat_id: msg.chat_id,
          time: formatTime(msg.created_at),
        }
      }))

      messages.value = transformedMessages

      // Scroll to bottom after messages load
      await nextTick()
      scrollToBottom()
    } catch (err) {
      console.error('Error loading messages:', err)
    } finally {
      isLoadingMessages.value = false
    }
  }
}


const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const sendMessage = async () => {
  if (!messageInput.value.trim() || !chatId.value || !currentUser.value) {
    return
  }

  isSending.value = true
  try {
    const { data: messageData, error } = await supabase
      .from('messages')
      .insert([
        {
          chat_id: chatId.value,
          sender_id: currentUser.value.id,
          text: messageInput.value.trim(),
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('Error sending message:', error)
      return
    }

    // Update chat timestamps
    const { error: updateErr } = await supabase
      .from('chats')
      .update({
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        total_messages: (messages.value.length),
      })
      .eq('id', chatId.value)

    if (updateErr) {
      console.error('Error updating chat:', updateErr)
    }

    // Add message to local state
    const newMessage = {
      id: messageData.id,
      sender_id: messageData.sender_id,
      text: messageData.text,
      created_at: messageData.created_at,
      author: currentUser.value.name || 'You',
      isMine: true,
      chat_id: messageData.chat_id,
      time: formatTime(messageData.created_at),
    }

    messages.value.push(newMessage)
    messageInput.value = ''

    // Scroll to bottom after new message
    await nextTick()
    scrollToBottom()
  } catch (err) {
    console.error('Error in sendMessage:', err)
  } finally {
    isSending.value = false
  }
}

const handleEndSession = async () => {
  isEndingSession.value = true
  try {
    const { error } = await supabase
      .from('chats')
      .update({ status: 'offline' })
      .eq('id', chatId.value)

    if (error) {
      console.error('Error ending session:', error)
      return
    }

    sessionEnded.value = true
    setTimeout(() => {
      router.push('/profile')
    }, 2000)
  } catch (err) {
    console.error('Error ending session:', err)
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
    const chatData = chat.value
    if (!chatData) {
      alert('Chat not found')
      return
    }

    // Submit report to Supabase
    await supabaseService.submitReport(
      chatId.value,
      chatData.user_id,
      chatData.companion_id,
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

const handleBlockUser = async () => {
  if (!chatId.value || !chat.value) return

  isBlockingUser.value = true
  try {
    // Add the companion to blocked list in user's profile
    const { error } = await supabase
      .from('chats')
      .update({ status: 'blocked' })
      .eq('id', chatId.value)

    if (error) {
      console.error('Error blocking user:', error)
      alert('Ошибка при блокировке пользователя')
      return
    }

    blockSuccess.value = 'Пользователь заблокирован'
    showActionMenu.value = false
    setTimeout(() => {
      router.push('/profile')
    }, 1500)
  } catch (err) {
    console.error('Error blocking user:', err)
    alert('Ошибка при блокировке пользователя')
  } finally {
    isBlockingUser.value = false
  }
}

// Subscribe to real-time messages
const subscribeToMessages = () => {
  if (!chatId.value) return

  const subscription = supabase
    .channel(`messages:${chatId.value}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${chatId.value}`,
      },
      (payload) => {
        const newMsg = payload.new as any
        // Only add if not already in messages
        if (!messages.value.find(m => m.id === newMsg.id)) {
          const transformedMsg = {
            id: newMsg.id,
            sender_id: newMsg.sender_id,
            text: newMsg.text,
            created_at: newMsg.created_at,
            author: newMsg.sender_id === currentUser.value?.id ? 'You' : 'Companion',
            isMine: newMsg.sender_id === currentUser.value?.id,
            chat_id: newMsg.chat_id,
            time: formatTime(newMsg.created_at),
          }
          messages.value.push(transformedMsg)
          scrollToBottom()
        }
      }
    )
    .subscribe()

  return subscription
}

// Load data on mount and when chatId changes
watch(chatId, async () => {
  if (chatId.value) {
    messages.value = []
    await loadChats()
    await loadMessages()
    subscribeToMessages()
  }
})

onMounted(async () => {
  await loadChats()
  if (chatId.value) {
    await loadMessages()
    subscribeToMessages()
  }
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-white to-light-bg pt-[140px] pb-16 flex flex-col">
    <div class="container mx-auto px-4 lg:px-8 max-w-4xl flex-1 flex flex-col">
      <!-- Loading or Chat Header -->
      <div v-if="!chat && isLoadingMessages" class="bg-white border border-border/50 rounded-3xl p-8 mb-6 shadow-card text-center">
        <div class="flex items-center justify-center gap-3">
          <div class="w-3 h-3 bg-primary rounded-full animate-bounce"></div>
          <p class="text-secondary/60">Загрузка чата...</p>
        </div>
      </div>

      <div v-else-if="!chat && !isLoadingMessages" class="bg-white border border-border/50 rounded-3xl p-8 mb-6 shadow-card text-center">
        <svg class="w-16 h-16 mx-auto mb-4 text-secondary/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <p class="text-secondary/60 mb-4 text-lg">Чат не найден</p>
        <p class="text-secondary/50 mb-6 text-sm">Пожалуйста, выберите чат из списка или вернитесь в профиль</p>
        <button
          @click="router.push('/profile')"
          class="px-8 py-3 bg-primary text-white rounded-full hover:bg-primary/90 transition-all font-medium"
        >
          Вернуться в профиль
        </button>
      </div>

      <!-- Chat Header -->
      <div v-else-if="currentCompanion" class="bg-white border border-border/50 rounded-3xl p-4 mb-6 shadow-card flex items-center justify-between sticky top-[140px] z-40">
        <div class="flex items-center gap-4">
          <!-- Avatar -->
          <div class="relative">
            <img
              :src="currentCompanion?.image || 'https://via.placeholder.com/100'"
              :alt="currentCompanion?.name || 'Companion'"
              class="w-12 h-12 rounded-full object-cover"
            />
            <div v-if="currentCompanion?.status === 'Онлайн'" class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
          </div>

          <!-- Info -->
          <div>
            <h2 class="font-bold text-secondary">{{ currentCompanion?.name }}</h2>
            <p class="text-xs text-green-500 font-medium">{{ currentCompanion?.status }}</p>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-2">
          <!-- Kebab menu (3 dots) -->
          <div class="relative">
            <button
              @click="showActionMenu = !showActionMenu"
              class="p-2 hover:bg-light-bg rounded-lg transition-colors text-secondary/60 hover:text-secondary"
              title="Ещё"
            >
              <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 8c1.1 0 2-0.9 2-2s-0.9-2-2-2-2 0.9-2 2 0.9 2 2 2zm0 2c-1.1 0-2 0.9-2 2s0.9 2 2 2 2-0.9 2-2-0.9-2-2-2zm0 6c-1.1 0-2 0.9-2 2s0.9 2 2 2 2-0.9 2-2-0.9-2-2-2z" />
              </svg>
            </button>

            <!-- Dropdown menu -->
            <transition name="fade">
              <div v-if="showActionMenu" class="absolute right-0 mt-2 w-48 bg-white border border-border/50 rounded-xl shadow-hover z-50 py-2">
                <!-- Report option -->
                <button
                  @click="showReportModal = true; showActionMenu = false"
                  class="w-full text-left px-4 py-3 text-secondary/80 hover:bg-light-bg hover:text-secondary transition-colors flex items-center gap-3 text-sm"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4v2m0 6H2a1 1 0 00-1 1v1a6 6 0 006 6h8a6 6 0 006-6v-1a1 1 0 00-1-1h-1m-6-15a6 6 0 100 12 6 6 0 000-12z" />
                  </svg>
                  <span>Пожаловаться</span>
                </button>

                <!-- Block option -->
                <button
                  @click="handleBlockUser"
                  :disabled="isBlockingUser"
                  class="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 transition-colors flex items-center gap-3 text-sm disabled:opacity-50"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4m0 0H3m0 0v8m0-8l8 8" />
                  </svg>
                  <span v-if="!isBlockingUser">Заблокировать</span>
                  <span v-else>Блокировка...</span>
                </button>

                <!-- Divider -->
                <div class="border-t border-border/30 my-2"></div>

                <!-- End session option -->
                <button
                  @click="() => { handleEndSession(); showActionMenu = false }"
                  :disabled="isEndingSession"
                  class="w-full text-left px-4 py-3 text-secondary/80 hover:bg-light-bg hover:text-secondary transition-colors flex items-center gap-3 text-sm disabled:opacity-50"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Завершить сессию</span>
                </button>
              </div>
            </transition>
          </div>
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

      <!-- Block Success Message -->
      <transition name="fade">
        <div v-if="blockSuccess" class="absolute inset-0 bg-black/50 flex items-center justify-center z-50 rounded-3xl">
          <div class="bg-white rounded-2xl p-8 text-center">
            <div class="mb-4">
              <svg class="w-16 h-16 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 class="text-2xl font-bold text-secondary mb-2">{{ blockSuccess }}</h2>
            <p class="text-secondary/60">Вы больше не сможете общаться с этим пользователем</p>
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
                <label class="form-label">Причина</label>
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
                <label class="form-label">Описание</label>
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

      <!-- Messages Container (only show if chat is loaded) -->
      <template v-if="currentCompanion">
      <div
        ref="messagesContainer"
        class="flex-1 overflow-y-auto mb-6 space-y-3 px-2 py-4 scroll-smooth"
        style="scroll-behavior: smooth;"
      >
        <!-- Empty state -->
        <div v-if="chatMessages.length === 0" class="flex items-center justify-center h-full py-12">
          <div class="text-center max-w-sm">
            <!-- Avatar -->
            <div class="mb-6 flex justify-center">
              <div class="relative">
                <img
                  :src="currentCompanion?.image || 'https://via.placeholder.com/120'"
                  :alt="currentCompanion?.name"
                  class="w-24 h-24 rounded-full object-cover border-4 border-light-bg shadow-md"
                />
                <div class="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-3 border-white"></div>
              </div>
            </div>

            <!-- Greeting -->
            <h3 class="text-2xl font-bold text-secondary mb-2">
              Привет! 👋
            </h3>
            <p class="text-secondary/70 mb-2">
              Вы в чате с <span class="font-semibold text-secondary">{{ currentCompanion.name }}</span>
            </p>
            <p class="text-secondary/60 text-sm mb-6">
              Начните разговор - поделитесь интересующей вас темой или просто скажите привет!
            </p>

            <!-- Status indicator -->
            <div class="inline-flex items-center gap-2 px-4 py-2 bg-light-bg rounded-full mb-6">
              <div :class="['w-2 h-2 rounded-full', currentCompanion?.status === 'Онлайн' ? 'bg-green-500' : 'bg-gray-400']"></div>
              <span class="text-xs font-medium text-secondary/70">
                {{ currentCompanion?.status }}
              </span>
            </div>

            <!-- Call to action -->
            <p class="text-xs text-secondary/50">
              💬 Отправьте первое сообщение, чтобы начать
            </p>
          </div>
        </div>

        <!-- Messages -->
        <div
          v-for="message in chatMessages"
          :key="message.id"
          :class="[
            'flex gap-2 animate-fadeIn',
            message.isMine ? 'justify-end' : 'justify-start'
          ]"
        >
          <!-- Avatar (for other) -->
          <div v-if="!message.isMine" class="flex-shrink-0 mt-1">
            <img
              :src="message.image || currentCompanion?.image || 'https://via.placeholder.com/28'"
              :alt="currentCompanion?.name || 'User'"
              class="w-7 h-7 rounded-full object-cover"
            />
          </div>

          <!-- Message Bubble -->
          <div
            :class="[
              'max-w-xs lg:max-w-md px-4 py-3 rounded-3xl break-words',
              message.isMine
                ? 'bg-gradient-to-r from-primary to-primary/90 text-white rounded-br-none'
                : 'bg-light-bg text-secondary rounded-bl-none shadow-sm'
            ]"
          >
            <p class="text-sm leading-relaxed whitespace-pre-wrap">{{ message.text }}</p>
            <p :class="[
              'text-xs mt-1 font-medium',
              message.isMine ? 'text-white/70' : 'text-secondary/50'
            ]">
              {{ formatTime(message.created_at) }}
            </p>
          </div>

          <!-- Avatar (for me) -->
          <div v-if="message.isMine" class="flex-shrink-0 mt-1">
            <div class="w-7 h-7 rounded-full bg-secondary/20 flex items-center justify-center text-xs font-bold text-secondary">
              Я
            </div>
          </div>
        </div>
      </div>

      <!-- Input Area -->
      <div class="bg-white border border-border/50 rounded-3xl p-4 shadow-card sticky bottom-0">
        <div class="flex gap-3 items-end">
          <!-- Attachment Button -->
          <button
            type="button"
            class="flex-shrink-0 p-2 text-secondary/60 hover:text-secondary hover:bg-light-bg rounded-lg transition-all"
            title="Загрузить файл"
          >
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
            :disabled="isSending"
            class="flex-1 px-4 py-2.5 bg-light-bg rounded-full focus:outline-none text-secondary placeholder-secondary/50 disabled:opacity-50 transition-all"
          />

          <!-- Send Button -->
          <button
            @click="sendMessage"
            :disabled="!messageInput.trim() || isSending"
            type="button"
            class="flex-shrink-0 p-2.5 bg-primary text-white rounded-full hover:shadow-soft disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium hover:bg-primary/90"
            title="Отправить сообщение"
          >
            <svg v-if="!isSending" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5.951-2.976 5.951 2.976a1 1 0 001.169-1.409l-7-14z" />
            </svg>
            <svg v-else class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </button>
        </div>

        <!-- Info -->
        <p class="text-xs text-secondary/50 mt-3 text-center font-medium">
          💬 Сессия активна
        </p>
      </div>
      </template>
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

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-out;
}
</style>
