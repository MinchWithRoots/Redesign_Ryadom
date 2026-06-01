<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { currentUser, messages, getChatById, endSession, loadChats, chats as globalChats, refreshCompanionData, loadCurrentUser } from '../composables/useAppState'
import { useConfirmDialog } from '../composables/useConfirmDialog'
import { supabase } from '@/utils/supabase'
import * as supabaseService from '../services/supabaseService'
import * as encryptionService from '@/services/encryptionService'
import ImageWithFallback from '../components/ImageWithFallback.vue'
import ReviewModal from '../components/ReviewModal.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import LoaderAnimation from '../components/LoaderAnimation.vue'
import AsyncLoader from '../components/AsyncLoader.vue'
import '@/assets/chat.css'

const { isOpen, title, message, confirmText, cancelText, isDangerous, openDialog, handleConfirm, handleCancel } = useConfirmDialog()
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
// null = not loaded yet, undefined = loaded but no encryption, string = loaded with key
const currentChatMasterKey = ref<string | null | undefined>(null)

const chatId = computed(() => (route.query.id as string) || undefined)

const chat = computed(() => {
  if (!chatId.value) return null
  return globalChats.value.find(c => c.id.toString() === chatId.value)
})

const chatMessages = computed(() => messages.value)

const isBlocked = computed(() => {
  const status = chat.value?.status as string  // расширяем тип
  return status === 'blocked' || status === 'offline'
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
      // Load encryption key for this chat if not already loaded
      if (currentChatMasterKey.value === null && currentUser.value && chat.value) {
        try {
          // Auto-derive password from companion ID (deterministic)
          const autoPassword = chat.value.companion_id.toString()

          console.log('[Encryption] Loading key for chat:', chatId.value, 'with password:', autoPassword, 'userId:', currentUser.value.id)

          // Initialize encryption service FIRST before loading key
          encryptionService.initializeWithPasswordAndSalt(currentUser.value.id, autoPassword, currentUser.value.id)
          console.log('[Encryption] Service initialized')

          // Try to load encryption key with auto-derived password
          let key = await encryptionService.loadChatKey(chatId.value, autoPassword)

          console.log('[Encryption] Key loaded:', !!key, 'keyLength:', key?.length || 0)

          // If no key exists, wait a moment and try again (in case it was just created)
          // This handles the case where the companion just approved the request
          if (!key) {
            console.log('[Encryption] No key found on first try, retrying after delay...')
            await new Promise(resolve => setTimeout(resolve, 500))
            key = await encryptionService.loadChatKey(chatId.value, autoPassword)
            console.log('[Encryption] Key loaded after retry:', !!key)
          }

          // Only generate a new key if absolutely none exists
          if (!key) {
            console.log('[Encryption] Still no key found, generating new one for this chat')
            try {
              const masterKey = encryptionService.generateMasterKey()
              const userDerivedKey = encryptionService.deriveKeyFromPassword(autoPassword, currentUser.value.id)
              await encryptionService.storeEncryptedChatKey(
                chatId.value,
                currentUser.value.id,
                masterKey,
                userDerivedKey
              )
              console.log('[Encryption] Successfully stored new encryption key for current user')
              key = masterKey
            } catch (storeErr) {
              console.error('[Encryption] Failed to store new encryption key:', storeErr)
              // Continue without encryption
            }
          }

          if (key) {
            console.log('Chat encryption key loaded successfully')
          } else {
            console.debug('No encryption key found for this chat')
          }

          currentChatMasterKey.value = key || undefined
        } catch (encErr) {
          console.warn('Could not load encryption key (chat may be unencrypted):', encErr)
          currentChatMasterKey.value = undefined
        }
      }

      let messagesData
      let error
      let retries = 3

      // Retry logic for network errors
      while (retries > 0) {
        try {
          const result = await supabase
            .from('messages')
            .select('id, chat_id, sender_id, text, created_at, is_read, read_at')
            .eq('chat_id', chatId.value)
            .order('created_at', { ascending: true })

          messagesData = result.data
          error = result.error
          break
        } catch (fetchError) {
          retries--
          if (retries === 0) {
            console.error('Failed to load messages after 3 retries:', fetchError)
            return
          }
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }

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

        // Decrypt message if encryption key is available and text looks encrypted
        let decryptedText = msg.text
        const isLikelyEncrypted = msg.text && msg.text.includes(':') && /^[0-9a-f]+:/.test(msg.text)

        if (currentChatMasterKey.value && isLikelyEncrypted) {
          try {
            decryptedText = encryptionService.decryptMessage(msg.text, currentChatMasterKey.value)
            console.log('[Decryption] Message decrypted:', msg.text.substring(0, 30) + '... -> ' + decryptedText)
          } catch (decErr) {
            console.warn('Failed to decrypt message:', decErr, 'encrypted:', msg.text.substring(0, 30))
            // Keep original if decryption fails
            decryptedText = msg.text
          }
        } else if (!isLikelyEncrypted) {
          console.log('[Decryption] Message doesn\'t look encrypted, using as-is')
        } else {
          console.log('[Decryption] No encryption key available, displaying as-is:', msg.text.substring(0, 30))
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
  if (!messageInput.value.trim() || !chatId.value || !currentUser.value || isBlocked.value) {
    return
  }

  isSending.value = true
  const messageText = messageInput.value.trim()

  try {
    // Load encryption key if not already loaded
    if (currentChatMasterKey.value === null && currentUser.value && chat.value) {
      try {
        // Auto-derive password from companion ID
        const autoPassword = chat.value.companion_id.toString()
        // Initialize encryption service FIRST
        encryptionService.initializeWithPasswordAndSalt(currentUser.value.id, autoPassword, currentUser.value.id)
        let key = await encryptionService.loadChatKey(chatId.value, autoPassword)

        // If no key exists, try again after a short delay (in case it was just created)
        if (!key) {
          console.log('[Send] No key found on first try, retrying after delay...')
          await new Promise(resolve => setTimeout(resolve, 300))
          key = await encryptionService.loadChatKey(chatId.value, autoPassword)
        }

        // Only generate a new key if still no key exists
        if (!key) {
          console.log('[Send] Still no key found, generating and storing new one')
          try {
            const masterKey = encryptionService.generateMasterKey()
            const userDerivedKey = encryptionService.deriveKeyFromPassword(autoPassword, currentUser.value.id)
            await encryptionService.storeEncryptedChatKey(
              chatId.value,
              currentUser.value.id,
              masterKey,
              userDerivedKey
            )
            console.log('[Send] Successfully stored new encryption key')
            key = masterKey
          } catch (storeErr) {
            console.error('[Send] Failed to store encryption key:', storeErr)
          }
        }

        currentChatMasterKey.value = key || undefined
      } catch (encErr) {
        console.warn('Could not load encryption key, proceeding without encryption:', encErr)
        currentChatMasterKey.value = undefined
      }
    }

    // Encrypt message if encryption key is available
    let textToSend = messageText
    let encryptedText = null
    let isEncrypted = false

    if (currentChatMasterKey.value) {
      try {
        encryptedText = encryptionService.encryptMessage(messageText, currentChatMasterKey.value)
        textToSend = encryptedText
        isEncrypted = true
        console.log('[Send] Message encrypted:', messageText, '→', textToSend.substring(0, 50) + '...')
      } catch (encErr) {
        console.error('[Send] Failed to encrypt message:', encErr)
        // Still send unencrypted as fallback
      }
    } else {
      console.warn('[Send] No encryption key available, sending unencrypted')
    }

    let messageData
    let error
    let retries = 3

    // Retry logic for network errors
    while (retries > 0) {
      try {
        const result = await supabase
          .from('messages')
          .insert([
            {
              chat_id: chatId.value,
              sender_id: currentUser.value.id,
              text: textToSend,
              encrypted_text: encryptedText,
              is_encrypted: isEncrypted,
            },
          ])
          .select()
          .single()

        messageData = result.data
        error = result.error
        break
      } catch (fetchError) {
        retries--
        if (retries === 0) {
          console.error('Failed to send message after 3 retries:', fetchError)
          error = new Error('Network error - failed to send message')
        } else {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }
    }

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
      // Don't show alert for all errors - they may be temporary network issues
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
    openDialog({
      title: 'Заполните все поля',
      message: 'Пожалуйста, выберите причину и опишите ситуацию',
      confirmText: 'OK',
      cancelText: 'Отмена',
    })
    return
  }

  isReporting.value = true
  try {
    const chatData = chat.value
    if (!chatData) {
      openDialog({
        title: 'Ошибка',
        message: 'Чат не найден',
        confirmText: 'OK',
        cancelText: 'Отмена',
      })
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
    openDialog({
      title: 'Ошибка при отправке',
      message: 'Ошибка при отправке отчёта. Пожалуйста, попробуйте позже.',
      confirmText: '✓ OK',
      cancelText: '✕ Отмена',
    })
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
      openDialog({
        title: 'Ошибка',
        message: 'Ошибка при блокировке пользователя. Пожалуйста, попробуйте позже.',
        confirmText: '✓ OK',
        cancelText: '✕ Отмена',
      })
      return
    }

    blockSuccess.value = 'Пользователь заблокирован'
    showActionMenu.value = false
    setTimeout(() => {
      router.push('/profile')
    }, 1500)
  } catch (err) {
    console.error('Error blocking user:', err)
    openDialog({
      title: 'Ошибка',
      message: 'Ошибка при блокировке пользователя. Пожалуйста, попробуйте позже.',
      confirmText: '✓ OK',
      cancelText: '✕ Отмена',
    })
  } finally {
    isBlockingUser.value = false
  }
}

const handleUnblockUser = async () => {
  if (!chatId.value || !chat.value) return

  isBlockingUser.value = true
  try {
    // Check if current user is the one who blocked (only for 'blocked' status, not 'offline')
    if (chat.value.status === 'blocked' && chat.value.blocked_by !== currentUser.value?.id) {
      openDialog({
        title: 'Нет прав',
        message: 'Только пользователь, который заблокировал чат, может его разблокировать.',
        confirmText: '✓ OK',
        cancelText: '✕ Отмена',
      })
      return
    }

    const { error } = await supabase
      .from('chats')
      .update({ status: 'active' })
      .eq('id', chatId.value)

    if (error) {
      console.error('Error restoring chat:', error)
      openDialog({
        title: 'Ошибка',
        message: 'Ошибка при восстановлении чата. Пожалуйста, попробуйте позже.',
        confirmText: '✓ OK',
        cancelText: '✕ Отмена',
      })
      return
    }

    blockSuccess.value = 'Пользователь разблокирован.'
    showActionMenu.value = false
    setTimeout(() => {
      router.push('/profile')
    }, 1500)
  } catch (err) {
    console.error('Error restoring chat:', err)
    openDialog({
      title: 'Ошибка',
      message: 'Ошибка при восстановлении чата. Пожалуйста, попробуйте позже.',
      confirmText: '✓ OK',
      cancelText: '✕ Отмена',
    })
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

          // Decrypt message if encryption key is available and text looks encrypted
          let decryptedText = newMsg.text
          const isLikelyEncrypted = newMsg.text && newMsg.text.includes(':') && /^[0-9a-f]+:/.test(newMsg.text)

          if (currentChatMasterKey.value && isLikelyEncrypted) {
            try {
              decryptedText = encryptionService.decryptMessage(newMsg.text, currentChatMasterKey.value)
            } catch (decErr) {
              console.warn('Failed to decrypt realtime message:', decErr)
              decryptedText = newMsg.text
            }
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

          // Decrypt message if encryption key is available and text looks encrypted
          let decryptedText = msg.text
          const isLikelyEncrypted = msg.text && msg.text.includes(':') && /^[0-9a-f]+:/.test(msg.text)

          if (currentChatMasterKey.value && isLikelyEncrypted) {
            try {
              decryptedText = encryptionService.decryptMessage(msg.text, currentChatMasterKey.value)
            } catch (decErr) {
              console.warn('Failed to decrypt polled message:', decErr)
              decryptedText = msg.text
            }
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
    isLoadingMessages.value = true
    currentChatMasterKey.value = null // Reset to "not loaded" state for new chat
    await nextTick() // Ensure DOM updates with cleared messages before loading
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
          <LoaderAnimation type="pulse" size="md" />
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
        <button @click="router.push('/profile')" class="chat-header-back">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
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
            <p class="chat-modal-text" v-if="blockSuccess.includes('разблокир')">Он снова может писать вам, и вы можете продолжить диалог</p>
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
        <!-- Loading state -->
        <template v-if="isLoadingMessages && chatMessages.length === 0">
          <AsyncLoader type="message-skeleton" />
          <AsyncLoader type="message-skeleton" />
          <AsyncLoader type="message-skeleton" />
        </template>

        <!-- Empty state -->
        <div v-else-if="chatMessages.length === 0" class="chat-empty-state">
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
            :disabled="isSending || isBlocked"
            class="chat-input-field"
          />

          <!-- Send Button -->
          <button
            @click="sendMessage"
            :disabled="!messageInput.trim() || isSending || isBlocked"
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
        <p class="chat-input-info" :class="{ 'chat-input-info--blocked': isBlocked }">
          <span v-if="isBlocked">Чат заблокирован</span>
          <span v-else>💬 Сессия активна</span>
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

    <!-- Confirm Dialog -->
    <ConfirmDialog
      :is-open="isOpen"
      :title="title"
      :message="message"
      :confirm-text="confirmText"
      :cancel-text="cancelText"
      :is-dangerous="isDangerous"
      @confirm="handleConfirm"
      @cancel="handleCancel"
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
