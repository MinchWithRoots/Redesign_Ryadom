<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { currentUser, messages, getChatById, endSession, loadChats, chats as globalChats, refreshCompanionData, loadCurrentUser } from '../composables/useAppState'
import { supabase } from '@/utils/supabase'
import * as supabaseService from '../services/supabaseService'
import { encryptionService } from '../services/encryptionService'
import { messageRetentionService } from '../services/messageRetentionService'
import ImageWithFallback from '../components/ImageWithFallback.vue'
import ReviewModal from '../components/ReviewModal.vue'
import RetentionPolicyModal from '../components/RetentionPolicyModal.vue'
import '@/assets/chat.css'
import infoIcon from '../images/info-triangle.svg'
import blockIcon from '../images/block.svg'
import sendIcon from '../images/send.svg'
import closeIcon from '../images/close.svg'

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
const showReviewModal = ref(false)
const showRetentionModal = ref(false)
const currentRetention = ref<1 | 24 | 720 | 2160 | null>(720)

const chatId = computed(() => (route.query.id as string) || undefined)

const chat = computed(() => {
  if (!chatId.value) return null
  return globalChats.value.find(c => c.id.toString() === chatId.value)
})

const chatMessages = computed(() => messages.value)

const isBlocked = computed(() => {
  const status = chat.value?.status
  return status === 'offline'
})

const currentCompanion = computed(() => {
  if (chat.value) {
    // Determine status - show as "Онлайн" for active status or "Оффлайн" otherwise
    const statusText = chat.value.status === 'active' ? 'Онлайн' : 'Оффлайн'
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
      // Ensure encryption key exists for this chat
      if (chatId.value && !encryptionService.hasKey(chatId.value)) {
        // Generate new key if it doesn't exist
        const newKey = encryptionService.generateKey(chatId.value)
        console.log('Generated new encryption key for chat')
      }

      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('id, chat_id, sender_id, text, created_at, is_read, read_at')
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

        // Decrypt message text
        let decryptedText = msg.text
        try {
          if (chatId.value && msg.text) {
            // Try to decrypt - if key doesn't exist, message might be plain text
            if (encryptionService.hasKey(chatId.value)) {
              decryptedText = encryptionService.decryptMessage(msg.text, chatId.value)
            } else {
              // Key doesn't exist - message is likely plain text
              // This can happen if messages were created before encryption was enabled
              decryptedText = msg.text
            }
          }
        } catch (err) {
          // Decryption failed - either message is corrupted or wasn't encrypted
          console.warn('Failed to decrypt message, treating as plain text:', err)
          // Try to use as plain text if it looks reasonable
          decryptedText = msg.text || '[Не удалось расшифровать сообщение]'
        }

        return {
          id: msg.id,
          sender_id: msg.sender_id,
          text: decryptedText,
          created_at: msg.created_at,
          author: authorName,
          isMine: msg.sender_id === currentUser.value?.id,
          chat_id: msg.chat_id,
          time: formatTime(msg.created_at),
          isRead: msg.is_read || false,
          isSent: true,
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
  const messageText = messageInput.value.trim()

  try {
    // Ensure encryption key exists
    if (!encryptionService.hasKey(chatId.value)) {
      const newKey = encryptionService.generateKey(chatId.value)
      console.log('Generated encryption key for new message')
    }

    // Encrypt message before sending
    let encryptedText: string
    try {
      encryptedText = encryptionService.encryptMessage(messageText, chatId.value)
    } catch (err) {
      console.error('Encryption failed:', err)
      alert('Ошибка при шифровании сообщения')
      return
    }

    const { data: messageData, error } = await supabase
      .from('messages')
      .insert([
        {
          chat_id: chatId.value,
          sender_id: currentUser.value.id,
          text: encryptedText,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('Error sending message:', error)
      // Add message to local state with isSent=false
      const failedMessage = {
        id: `temp-${Date.now()}`,
        sender_id: currentUser.value.id,
        text: messageText,
        created_at: new Date().toISOString(),
        author: currentUser.value.name || 'You',
        isMine: true,
        chat_id: chatId.value,
        time: formatTime(new Date().toISOString()),
        isRead: false,
        isSent: false,
      }
      messages.value.push(failedMessage)
      messageInput.value = ''
      await nextTick()
      scrollToBottom()
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

    // Add message to local state (with decrypted text for display)
    const newMessage = {
      id: messageData.id,
      sender_id: messageData.sender_id,
      text: messageText,
      created_at: messageData.created_at,
      author: currentUser.value.name || 'You',
      isMine: true,
      chat_id: messageData.chat_id,
      time: formatTime(messageData.created_at),
      isRead: false,
      isSent: true,
    }

    messages.value.push(newMessage)
    messageInput.value = ''

    // Mark any unread messages as read after sending a reply
    await markMessagesAsRead()

    // Scroll to bottom after new message
    await nextTick()
    scrollToBottom()
  } catch (err) {
    console.error('Error in sendMessage:', err)
    // Add message to local state with isSent=false
    const failedMessage = {
      id: `temp-${Date.now()}`,
      sender_id: currentUser.value.id,
      text: messageText,
      created_at: new Date().toISOString(),
      author: currentUser.value.name || 'You',
      isMine: true,
      chat_id: chatId.value,
      time: formatTime(new Date().toISOString()),
      isRead: false,
      isSent: false,
    }
    messages.value.push(failedMessage)
    messageInput.value = ''
    await nextTick()
    scrollToBottom()
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
    showReviewModal.value = true
  } catch (err) {
    console.error('Error ending session:', err)
  } finally {
    isEndingSession.value = false
  }
}

const handleReviewSuccess = async () => {
  if (chat.value) {
    await refreshCompanionData(chat.value.companion_id)
    // Refresh current user data to update sessions and reviews count
    await loadCurrentUser()
  }
  setTimeout(() => {
    router.push('/profile')
  }, 1000)
}

const handleReviewClose = () => {
  showReviewModal.value = false
  setTimeout(() => {
    router.push('/profile')
  }, 500)
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

const handleUnblockUser = async () => {
  if (!chatId.value || !chat.value) return

  isBlockingUser.value = true
  try {
    const { error } = await supabase
      .from('chats')
      .update({ status: 'offline' })
      .eq('id', chatId.value)

    if (error) {
      console.error('Error unblocking user:', error)
      alert('Ошибка при разблокировке пользователя')
      return
    }

    blockSuccess.value = 'Пользователь разблокирован'
    showActionMenu.value = false
    setTimeout(() => {
      router.push('/profile')
    }, 1500)
  } catch (err) {
    console.error('Error unblocking user:', err)
    alert('Ошибка при разблокировке пользователя')
  } finally {
    isBlockingUser.value = false
  }
}

// Subscribe to real-time messages
let currentSubscription: any = null
let pollInterval: number | null = null

const subscribeToMessages = () => {
  if (!chatId.value) return

  // Realtime subscription
  currentSubscription = supabase
    .channel(`messages:${chatId.value}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${chatId.value}`,
      },
      async (payload) => {
        const newMsg = payload.new as any
        // Only add if not already in messages
        const existingMsg = messages.value.find(m => m.id === newMsg.id)

        if (!existingMsg) {
          let authorName = 'Unknown'
          if (newMsg.sender_id === currentUser.value?.id) {
            authorName = currentUser.value?.name || 'You'
          } else {
            try {
              const { data: senderData } = await supabase
                .from('users')
                .select('name')
                .eq('id', newMsg.sender_id)
                .single()
              authorName = senderData?.name || 'Unknown'
            } catch (err) {
              console.error('Error fetching sender name:', err)
            }
          }

          // Decrypt message text
          let decryptedText = newMsg.text
          try {
            if (chatId.value) {
              decryptedText = encryptionService.decryptMessage(newMsg.text, chatId.value)
            }
          } catch (err) {
            console.warn('Failed to decrypt message:', err)
            decryptedText = '[Не удалось расшифровать сообщение]'
          }

          const transformedMsg = {
            id: newMsg.id,
            sender_id: newMsg.sender_id,
            text: decryptedText,
            created_at: newMsg.created_at,
            author: authorName,
            isMine: newMsg.sender_id === currentUser.value?.id,
            chat_id: newMsg.chat_id,
            time: formatTime(newMsg.created_at),
            isRead: newMsg.is_read === true,
            isSent: true,
          }
          messages.value.push(transformedMsg)
          scrollToBottom()
        } else if (existingMsg && newMsg.is_read && !existingMsg.isRead) {
          // Update existing message if it was marked as read
          existingMsg.isRead = true
        }
      }
    )
    .subscribe()

  // Polling fallback - check for new messages every 2 seconds
  if (pollInterval) clearInterval(pollInterval)
  pollInterval = setInterval(async () => {
    if (!chatId.value) return
    try {
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('id, chat_id, sender_id, text, created_at, is_read, read_at')
        .eq('chat_id', chatId.value)
        .order('created_at', { ascending: true })

      if (error || !messagesData) return

      // Check for new messages
      for (const msg of messagesData) {
        if (!messages.value.find(m => m.id === msg.id)) {
          let authorName = 'Unknown'
          if (msg.sender_id === currentUser.value?.id) {
            authorName = currentUser.value?.name || 'You'
          } else {
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

          // Decrypt message text
          let decryptedText = msg.text
          try {
            if (chatId.value && msg.text) {
              // Try to decrypt - if key doesn't exist, message might be plain text
              if (encryptionService.hasKey(chatId.value)) {
                decryptedText = encryptionService.decryptMessage(msg.text, chatId.value)
              } else {
                // Key doesn't exist - message is likely plain text
                decryptedText = msg.text
              }
            }
          } catch (err) {
            // Decryption failed - either message is corrupted or wasn't encrypted
            console.warn('Failed to decrypt message, treating as plain text:', err)
            decryptedText = msg.text || '[Не удалось расшифровать сообщение]'
          }

          const transformedMsg = {
            id: msg.id,
            sender_id: msg.sender_id,
            text: decryptedText,
            created_at: msg.created_at,
            author: authorName,
            isMine: msg.sender_id === currentUser.value?.id,
            chat_id: msg.chat_id,
            time: formatTime(msg.created_at),
            isRead: msg.is_read === true,
            isSent: true,
          }
          messages.value.push(transformedMsg)
          scrollToBottom()
        } else {
          // Update existing message with new read status
          const existingMsgIndex = messages.value.findIndex(m => m.id === msg.id)
          if (existingMsgIndex !== -1 && !messages.value[existingMsgIndex].isRead && msg.is_read === true) {
            messages.value[existingMsgIndex].isRead = true
          }
        }
      }
    } catch (err) {
      console.error('Error polling for messages:', err)
    }
  }, 2000)

  return currentSubscription
}

const unsubscribeFromMessages = () => {
  if (currentSubscription) {
    supabase.removeChannel(currentSubscription)
    currentSubscription = null
  }
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
}

// Mark messages as read
const markMessagesAsRead = async () => {
  if (!chatId.value) return

  // Update all unread messages from other users
  const unreadMessages = messages.value.filter(m => !m.isMine && !m.isRead && m.id && typeof m.id === 'number')

  if (unreadMessages.length === 0) return

  try {
    const messageIds = unreadMessages.map(m => m.id)
    console.log('Marking messages as read:', messageIds)

    const { data, error } = await supabase
      .from('messages')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .in('id', messageIds)
      .select()

    if (error) {
      console.error('Error marking messages as read:', error)
      return
    }

    console.log('Messages marked as read in DB:', data)

    // Update local state
    messages.value.forEach(msg => {
      if (messageIds.includes(msg.id)) {
        msg.isRead = true
      }
    })
  } catch (err) {
    console.error('Error in markMessagesAsRead:', err)
  }
}

// Subscribe to read status updates
let readStatusSubscription: any = null

const subscribeToReadStatus = () => {
  if (!chatId.value) return

  readStatusSubscription = supabase
    .channel(`messages_read:${chatId.value}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${chatId.value}`,
      },
      (payload) => {
        const updatedMsg = payload.new as any
        const msgIndex = messages.value.findIndex(m => m.id === updatedMsg.id)
        if (msgIndex !== -1) {
          const wasRead = messages.value[msgIndex].isRead
          messages.value[msgIndex].isRead = updatedMsg.is_read === true
          if (!wasRead && updatedMsg.is_read) {
            console.log('Message marked as read:', updatedMsg.id)
          }
        }
      }
    )
    .subscribe()

  return readStatusSubscription
}

const unsubscribeFromReadStatus = () => {
  if (readStatusSubscription) {
    supabase.removeChannel(readStatusSubscription)
    readStatusSubscription = null
  }
}

// Load data on mount and when chatId changes
watch(chatId, async () => {
  if (chatId.value) {
    unsubscribeFromMessages()
    unsubscribeFromReadStatus()
    messages.value = []
    await loadChats()
    await loadMessages()
    await markMessagesAsRead()
    subscribeToMessages()
    subscribeToReadStatus()
  }
})

onMounted(async () => {
  await loadChats()
  if (chatId.value) {
    await loadMessages()
    await markMessagesAsRead()
    subscribeToMessages()
    subscribeToReadStatus()
    // Load retention policy
    const retention = await messageRetentionService.getRetentionPolicy(chatId.value)
    currentRetention.value = retention
  }
})

onBeforeUnmount(() => {
  unsubscribeFromMessages()
  unsubscribeFromReadStatus()
})
</script>

<template>
  <div class="chat-page">
    <div class="chat-main-container">
      <!-- Loading or Chat Header -->
      <div v-if="!chat && isLoadingMessages" class="chat-header-loading">
        <div class="chat-header-loading-content">
          <div class="chat-spinner"></div>
          <p class="chat-loading-text">Загрузка чата...</p>
        </div>
      </div>

      <div v-else-if="!chat && !isLoadingMessages" class="chat-not-found">
        <svg class="chat-not-found-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <p class="chat-not-found-title">Чат не найден</p>
        <p class="chat-not-found-text">Пожалуйста, выберите чат из списка или вернитесь в профиль</p>
        <button
          @click="router.push('/profile')"
          class="chat-button chat-button--primary"
        >
          Вернуться в профиль
        </button>
      </div>

      <!-- Chat Header -->
      <div v-else-if="currentCompanion" class="chat-header">
        <div class="chat-header-info">
          <!-- Avatar -->
          <ImageWithFallback
            :src="currentCompanion?.image"
            :alt="currentCompanion?.name || 'Companion'"
            class="chat-avatar-wrapper"
            imageClass="chat-avatar"
            fallbackClass="chat-avatar-fallback"
            iconClass="chat-avatar-icon"
          />
          <div v-if="currentCompanion?.status === 'Онлайн'" class="chat-avatar-online"></div>

          <!-- Info -->
          <div class="chat-header-user-info">
            <h2 class="chat-header-name">{{ currentCompanion?.name }}</h2>
            <p class="chat-header-status" :class="{ 'chat-header-status--online': currentCompanion?.status === 'Онлайн' }">{{ currentCompanion?.status }}</p>
          </div>
        </div>

        <!-- Actions -->
        <div class="chat-header-actions">
          <!-- Kebab menu (3 dots) -->
          <div class="chat-menu-wrapper">
            <button
              @click="showActionMenu = !showActionMenu"
              class="chat-menu-button"
              title="Ещё"
            >
              <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 8c1.1 0 2-0.9 2-2s-0.9-2-2-2-2 0.9-2 2 0.9 2 2 2zm0 2c-1.1 0-2 0.9-2 2s0.9 2 2 2 2-0.9 2-2-0.9-2-2-2zm0 6c-1.1 0-2 0.9-2 2s0.9 2 2 2 2-0.9 2-2-0.9-2-2-2z" />
              </svg>
            </button>

            <!-- Dropdown menu -->
            <transition name="fade">
              <div v-if="showActionMenu" class="chat-dropdown-menu">
                <!-- Report option -->
                <button
                  @click="showReportModal = true; showActionMenu = false"
                  class="chat-dropdown-item"
                >
                  <img :src="infoIcon" alt="Report" class="chat-dropdown-icon" />
                  <span>Пожаловаться</span>
                </button>

                <!-- Block/Unblock option -->
                <button
                  v-if="!isBlocked"
                  @click="handleBlockUser"
                  :disabled="isBlockingUser"
                  class="chat-dropdown-item chat-dropdown-item--danger"
                >
                  <img :src="blockIcon" alt="Block" class="chat-dropdown-icon" />
                  <span v-if="!isBlockingUser">Заблокировать</span>
                  <span v-else>Блокировка...</span>
                </button>
                <button
                  v-else
                  @click="handleUnblockUser"
                  :disabled="isBlockingUser"
                  class="chat-dropdown-item chat-dropdown-item--success"
                >
                  <img :src="blockIcon" alt="Unblock" class="chat-dropdown-icon" />
                  <span v-if="!isBlockingUser">Разблокировать</span>
                  <span v-else>Разблокировка...</span>
                </button>

                <!-- Retention Policy option -->
                <button
                  @click="showRetentionModal = true; showActionMenu = false"
                  class="chat-dropdown-item"
                >
                  <svg class="chat-dropdown-icon" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                  </svg>
                  <span>Удаление сообщений</span>
                </button>

                <!-- Divider -->
                <div class="chat-dropdown-divider"></div>

                <!-- End session option -->
                <button
                  @click="() => { handleEndSession(); showActionMenu = false }"
                  :disabled="isEndingSession"
                  class="chat-dropdown-item"
                >
                  <img :src="closeIcon" alt="Close" class="chat-dropdown-icon" />
                  <span>Завершить сессию</span>
                </button>
              </div>
            </transition>
          </div>
        </div>
      </div>

      <!-- Session Ended Message -->
      <transition name="fade">
        <div v-if="sessionEnded" class="chat-modal-overlay">
          <div class="chat-modal">
            <h2 class="chat-modal-title">Сессия завершена</h2>
            <p class="chat-modal-text">Спасибо за использование нашего сервиса!</p>
          </div>
        </div>
      </transition>

      <!-- Block/Unblock Success Message -->
      <transition name="fade">
        <div v-if="blockSuccess" class="chat-modal-overlay">
          <div class="chat-modal">
            <div class="chat-modal-icon-wrapper">
              <svg class="chat-modal-icon chat-modal-icon--success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 class="chat-modal-title">{{ blockSuccess }}</h2>
            <p class="chat-modal-text" v-if="blockSuccess.includes('разблокир')">Вы сможете общаться с этим пользователем снова</p>
            <p class="chat-modal-text" v-else>Вы больше не сможете общаться с этим пользователем</p>
          </div>
        </div>
      </transition>

      <!-- Report Modal -->
      <transition name="fade">
        <div v-if="showReportModal" class="chat-modal-overlay">
          <div class="chat-modal chat-modal--report">
            <button
              @click="showReportModal = false"
              class="chat-modal-close"
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 class="chat-modal-title">SOS/Пожаловаться</h2>
            <p class="chat-modal-description">Если вы чувствуете себя в опасности или встретили неадекватное поведение, расскажите нам.</p>

            <!-- Success Message -->
            <transition name="fade">
              <div v-if="reportSuccess" class="chat-modal-success">
                {{ reportSuccess }}
              </div>
            </transition>

            <div class="chat-form-group">
              <!-- Reason Select -->
              <div class="chat-form-field">
                <label class="chat-form-label">Причина</label>
                <select
                  v-model="reportReason"
                  class="chat-form-select"
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
              <div class="chat-form-field">
                <label class="chat-form-label">Описание</label>
                <textarea
                  v-model="reportMessage"
                  rows="3"
                  placeholder="Опишите, что произошло..."
                  class="chat-form-textarea"
                ></textarea>
              </div>

              <!-- Submit Button -->
              <button
                @click="handleReportUser"
                :disabled="isReporting"
                class="chat-button chat-button--danger"
              >
                <span v-if="!isReporting">Отправить отчёт</span>
                <span v-else>Отправка...</span>
              </button>

              <p class="chat-form-hint">
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
        class="chat-messages-container"
      >
        <!-- Empty state -->
        <div v-if="chatMessages.length === 0" class="chat-empty-state">
          <!-- Avatar -->
          <div class="chat-empty-avatar-wrapper">
            <ImageWithFallback
              :src="currentCompanion?.image"
              :alt="currentCompanion?.name"
              class="chat-empty-avatar"
              imageClass="chat-empty-avatar-image"
              fallbackClass="chat-empty-avatar-fallback"
              iconClass="chat-empty-avatar-icon"
            />
            <div class="chat-empty-avatar-status"></div>
          </div>

          <!-- Greeting -->
          <h3 class="chat-empty-greeting">
            Привет! 👋
          </h3>
          <p class="chat-empty-text">
            Вы в чате с <span class="chat-empty-name">{{ currentCompanion.name }}</span>
          </p>
          <p class="chat-empty-description">
            Начните разговор - поделитесь интересующей вас темой или просто скажите привет!
          </p>

          <!-- Status indicator -->
          <div class="chat-empty-status">
            <div class="chat-empty-status-dot" :class="{ 'chat-empty-status-dot--online': currentCompanion?.status === 'Онлайн' }"></div>
            <span class="chat-empty-status-text">
              {{ currentCompanion?.status }}
            </span>
          </div>

          <!-- Call to action -->
          <p class="chat-empty-cta">
            💬 Отправьте первое сообщение, чтобы начать
          </p>
        </div>

        <!-- Messages -->
        <div
          v-for="message in chatMessages"
          :key="message.id"
          class="chat-message-group"
          :class="{ 'chat-message-group--sent': message.isMine }"
        >
          <!-- Avatar (for other) -->
          <ImageWithFallback
            v-if="!message.isMine"
            :src="message.image || currentCompanion?.image"
            :alt="currentCompanion?.name || 'User'"
            class="chat-message-avatar"
            imageClass="chat-message-avatar-image"
            fallbackClass="chat-message-avatar-fallback"
            iconClass="chat-message-avatar-icon"
          />

          <!-- Message Bubble -->
          <div
            class="chat-message-bubble"
            :class="{ 'chat-message-bubble--sent': message.isMine }"
          >
            <p class="chat-message-text">{{ message.text }}</p>
            <div class="chat-message-footer">
              <p class="chat-message-time" :class="{ 'chat-message-time--sent': message.isMine }">
                {{ formatTime(message.created_at) }}
              </p>
              <!-- Status indicator (only for sent messages) -->
              <div v-if="message.isMine" class="chat-message-status">
                <span v-if="!message.isSent" class="chat-message-status-icon chat-message-status--warning" title="Не отправлено">⚠</span>
                <span v-else-if="message.isRead" class="chat-message-status-icon chat-message-status--read" title="Прочитано">✓✓</span>
                <span v-else class="chat-message-status-icon chat-message-status--sent" title="Отправлено">✓</span>
              </div>
            </div>
          </div>

          <!-- Avatar (for me) -->
          <div v-if="message.isMine" class="chat-message-avatar chat-message-avatar--mine">
            <div class="chat-message-avatar-mine-text">Я</div>
          </div>
        </div>
      </div>

      <!-- Input Area -->
      <div class="chat-input-wrapper">
        <div class="chat-input-container">
      

          <!-- Input -->
          <input
            v-model="messageInput"
            type="text"
            placeholder="Напишите сообщение..."
            @keyup.enter="sendMessage"
            :disabled="isSending"
            class="chat-input-field"
          />

          <!-- Send Button -->
          <button
            @click="sendMessage"
            :disabled="!messageInput.trim() || isSending"
            type="button"
            class="chat-send-button"
            title="Отправить сообщение"
          >
            <img v-if="!isSending" :src="sendIcon" alt="Send" class="chat-send-icon" />
            <svg v-else class="chat-send-spinner" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </button>
        </div>

        <!-- Info -->
        <p class="chat-input-info">
          💬 Сессия активна
        </p>
      </div>
      </template>
    </div>

    <!-- Review Modal -->
    <ReviewModal
      v-if="chat"
      :is-open="showReviewModal"
      :companion-id="chat.companion_id"
      :companion-name="chat.name"
      :user-id="currentUser?.id || ''"
      :chat-id="chatId"
      @success="handleReviewSuccess"
      @close="handleReviewClose"
    />

    <!-- Retention Policy Modal -->
    <RetentionPolicyModal
      :is-open="showRetentionModal"
      :chat-id="chatId || ''"
      :initial-retention="currentRetention"
      @close="showRetentionModal = false"
      @confirm="(hours) => currentRetention = hours"
    />
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--transition-normal);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
