import { ref, computed, onBeforeUnmount } from 'vue'
import { supabase } from '@/utils/supabase'

export interface Notification {
  id: string
  type: 'message' | 'application'
  title: string
  description?: string
  createdAt: Date
  read: boolean
  userId?: string
  chatId?: string
}

const notifications = ref<Notification[]>([])
let messageSubscription: any = null
let requestSubscription: any = null
let initPromise: Promise<void> | null = null

export const useNotifications = () => {
  const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)
  const hasUnread = computed(() => unreadCount.value > 0)

  const addNotification = async (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData?.user?.id) {
        console.warn('[useNotifications] Cannot save notification: user not authenticated')
        // Still add to local state
        const newNotification: Notification = {
          ...notification,
          id: `${Date.now()}-${Math.random()}`,
          createdAt: new Date(),
          read: false,
        }
        notifications.value.unshift(newNotification)
        return newNotification
      }

      // Save to database
      const { data, error } = await supabase
        .from('notifications')
        .insert([
          {
            user_id: userData.user.id,
            type: notification.type,
            title: notification.title,
            description: notification.description,
            related_user_id: notification.userId,
            related_chat_id: notification.chatId,
            read: false,
            message_id: notification.chatId ? null : undefined, // Will be set by trigger if needed
          },
        ])
        .select()
        .single()

      if (error) {
        console.error('[useNotifications] Error saving notification to DB:', error)
        // Still add to local state as fallback
        const newNotification: Notification = {
          ...notification,
          id: `${Date.now()}-${Math.random()}`,
          createdAt: new Date(),
          read: false,
        }
        notifications.value.unshift(newNotification)
        return newNotification
      }

      // Add to local state
      const newNotification: Notification = {
        ...notification,
        id: data.id.toString(),
        createdAt: new Date(data.created_at),
        read: data.read,
      }
      notifications.value.unshift(newNotification)
      console.log('[useNotifications] ✅ Notification saved to DB:', data.id)
      return newNotification
    } catch (error) {
      console.error('[useNotifications] Error in addNotification:', error)
      // Fallback: add to local state only
      const newNotification: Notification = {
        ...notification,
        id: `${Date.now()}-${Math.random()}`,
        createdAt: new Date(),
        read: false,
      }
      notifications.value.unshift(newNotification)
      return newNotification
    }
  }

  const markAsRead = (id: string) => {
    const notification = notifications.value.find(n => n.id === id)
    if (notification) {
      notification.read = true
    }
  }

  const markAllAsRead = () => {
    notifications.value.forEach(n => {
      n.read = true
    })
  }

  const removeNotification = (id: string) => {
    notifications.value = notifications.value.filter(n => n.id !== id)
  }

  const clearAll = () => {
    notifications.value = []
  }

  const loadSavedNotifications = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData?.user?.id) {
        console.warn('[useNotifications] No authenticated user for loading notifications')
        return
      }

      const { data: savedNotifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userData.user.id)
        .eq('read', false)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('[useNotifications] Error loading saved notifications:', error)
        return
      }

      if (savedNotifications && savedNotifications.length > 0) {
        console.log('[useNotifications] 📂 Loaded', savedNotifications.length, 'saved notifications')
        const mappedNotifications = savedNotifications.map(n => ({
          id: n.id.toString(),
          type: n.type as 'message' | 'application',
          title: n.title,
          description: n.description,
          createdAt: new Date(n.created_at),
          read: n.read,
          userId: n.related_user_id,
          chatId: n.related_chat_id,
        }))
        notifications.value = mappedNotifications
      } else {
        console.log('[useNotifications] No unread notifications found')
      }
    } catch (error) {
      console.error('[useNotifications] Error in loadSavedNotifications:', error)
    }
  }

  const initializeRealtimeListeners = async () => {
    // Prevent multiple concurrent initializations
    if (initPromise) return initPromise

    initPromise = (async () => {
      try {
        const { data: userData } = await supabase.auth.getUser()
        if (!userData?.user?.id) {
          console.warn('[useNotifications] No authenticated user found')
          return
        }

        const userId = userData.user.id
        console.log('[useNotifications] ⏳ Initializing realtime listeners for user:', userId)
        console.log('[useNotifications] 📋 Current user details:', { userId, email: userData.user.email })

        // Load saved notifications first
        await loadSavedNotifications()

        // Subscribe to new messages
        console.log('[useNotifications] 📡 Subscribing to messages channel with user ID filter:', userId)
        messageSubscription = supabase
          .channel(`messages:${userId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'messages',
            },
            async (payload) => {
              const newMessage = payload.new as any
              console.log('[useNotifications] 🔔 MESSAGE INSERT EVENT RECEIVED:', {
                event: 'postgres_changes INSERT on messages',
                senderId: newMessage.sender_id,
                currentUserId: userId,
                isSelfMessage: newMessage.sender_id === userId,
                chatId: newMessage.chat_id,
                messageId: newMessage.id,
                textLength: newMessage.text?.length || 0,
                encryptedLength: newMessage.encrypted_text?.length || 0,
                timestamp: new Date().toISOString(),
              })

              console.log('[useNotifications] 🔍 Processing message event...')
              console.log('[useNotifications] Message sender:', newMessage.sender_id)
              console.log('[useNotifications] Current auth user:', userId)

              try {
                // Get chat details to identify participants
                const { data: chatData } = await supabase
                  .from('chats')
                  .select('id, user_id, companion_id')
                  .eq('id', newMessage.chat_id)
                  .single()

                if (!chatData) {
                  console.warn('[useNotifications] Chat not found for message', newMessage.chat_id)
                  return
                }

                console.log('[useNotifications] Chat structure:', {
                  chatId: chatData.id,
                  user_id: chatData.user_id,
                  companion_id: chatData.companion_id,
                  sender_id: newMessage.sender_id,
                  current_user_id: userId
                })

                // Check if current user is IN this chat
                let isCurrentUserInChat = false
                let currentUserRole = null

                if (chatData.user_id === userId) {
                  isCurrentUserInChat = true
                  currentUserRole = 'user'
                  console.log('[useNotifications] Current user is the CHAT USER')
                } else if (chatData.companion_id) {
                  // Check if current user is the companion
                  const { data: companionData } = await supabase
                    .from('companions')
                    .select('user_id, id')
                    .eq('id', chatData.companion_id)
                    .single()

                  if (companionData?.user_id === userId) {
                    isCurrentUserInChat = true
                    currentUserRole = 'companion'
                    console.log('[useNotifications] Current user is the COMPANION')
                  }
                }

                if (!isCurrentUserInChat) {
                  console.log('[useNotifications] ❌ Current user is NOT in this chat, skipping notification')
                  return
                }

                // Check if SENDER is NOT the current user (i.e., is message for me?)
                if (newMessage.sender_id === userId) {
                  console.log('[useNotifications] ❌ Current user is the SENDER, skipping self-notification')
                  return
                }

                console.log('[useNotifications] ✅ Current user is RECIPIENT (' + currentUserRole + ')')

                // Get sender info for notification
                const { data: senderData } = await supabase
                  .from('users')
                  .select('name')
                  .eq('id', newMessage.sender_id)
                  .single()

                const senderName = senderData?.name || 'Пользователь'
                console.log('[useNotifications] 📬 Sending notification to', currentUserRole, 'from:', senderName)

                const messagePreview = newMessage.text || newMessage.encrypted_text || 'Сообщение получено'
                addNotification({
                  type: 'message',
                  title: `Новое сообщение от "${senderName}"`,
                  description: messagePreview.substring(0, 100),
                  userId: newMessage.sender_id,
                  chatId: newMessage.chat_id,
                })
              } catch (error) {
                console.error('[useNotifications] Error processing message notification:', error)
                addNotification({
                  type: 'message',
                  title: 'Новое сообщение',
                  description: 'У вас новое сообщение',
                })
              }
            }
          )
          .subscribe((status) => {
            console.log('[useNotifications] 📡 Message subscription status:', status)
            if (status === 'SUBSCRIBED') {
              console.log('✅ Successfully subscribed to message INSERT events')
              console.log('[useNotifications] 🔍 Listening for new messages on all chats...')
            } else if (status === 'CHANNEL_ERROR') {
              console.error('❌ Channel error - messages may not work')
            } else if (status === 'CLOSED') {
              console.warn('[useNotifications] Channel closed')
            }
          })

        console.log('[useNotifications] Message subscription setup complete')

        console.log('[useNotifications] Setting up companion_chat_requests subscription...')

        // Subscribe to companion chat requests (new and status changes)
        requestSubscription = supabase
          .channel('chat_requests')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'companion_chat_requests',
            },
            async (payload) => {
              const newRequest = payload.new as any

              if (newRequest.companion_id === userId) {
                try {
                  const { data: requesterData } = await supabase
                    .from('users')
                    .select('name')
                    .eq('id', newRequest.user_id)
                    .single()

                  const requesterName = requesterData?.name || 'Пользователь'

                  addNotification({
                    type: 'application',
                    title: `Новая заявка от "${requesterName}"`,
                    description: 'Новый пользователь хочет пообщаться с вами',
                    userId: newRequest.user_id,
                    chatId: newRequest.id,
                  })
                } catch (error) {
                  console.error('Error processing request notification:', error)
                  addNotification({
                    type: 'application',
                    title: 'Новая заявка',
                    description: 'Вы получили новую заявку',
                  })
                }
              }
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'companion_chat_requests',
            },
            async (payload) => {
              const updatedRequest = payload.new as any
              const oldRequest = payload.old as any

              // Notify user when their request is approved
              if (updatedRequest.user_id === userId && oldRequest.status === 'pending' && updatedRequest.status === 'approved') {
                try {
                  const { data: companionData } = await supabase
                    .from('users')
                    .select('name')
                    .eq('id', updatedRequest.companion_id)
                    .single()

                  const companionName = companionData?.name || 'Спутник'

                  addNotification({
                    type: 'application',
                    title: `Заявка принята`,
                    description: `"${companionName}" одобрил(а) вашу заявку`,
                    userId: updatedRequest.companion_id,
                    chatId: updatedRequest.chat_id,
                  })
                } catch (error) {
                  console.error('Error processing approval notification:', error)
                  addNotification({
                    type: 'application',
                    title: 'Заявка принята',
                    description: 'Ваша заявка была одобрена',
                  })
                }
              }

              // Notify user when their request is rejected
              if (updatedRequest.user_id === userId && oldRequest.status === 'pending' && updatedRequest.status === 'rejected') {
                addNotification({
                  type: 'application',
                  title: 'Заявка отклонена',
                  description: updatedRequest.rejection_reason || 'Ваша заявка была отклонена',
                  userId: updatedRequest.companion_id,
                })
              }
            }
        )
        .subscribe((status) => {
          console.log('[useNotifications] Chat requests subscription status:', status)
        })

        // Subscribe to message read status updates to remove notifications
        console.log('[useNotifications] Setting up message read status subscription...')
        supabase
          .channel('message_reads')
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'messages',
              filter: 'is_read=eq.true',
            },
            async (payload) => {
              const updatedMessage = payload.new as any
              console.log('[useNotifications] Message marked as read, message_id:', updatedMessage.id)

              // Find and remove notification for this message
              const notificationIndex = notifications.value.findIndex(
                n => n.type === 'message' && n.chatId === updatedMessage.chat_id
              )

              if (notificationIndex !== -1) {
                const removedNotification = notifications.value[notificationIndex]
                notifications.value.splice(notificationIndex, 1)
                console.log('[useNotifications] ✅ Removed notification for read message')

                // Mark as read in database
                try {
                  await supabase
                    .from('notifications')
                    .update({ read: true })
                    .eq('id', parseInt(removedNotification.id))
                } catch (error) {
                  console.error('[useNotifications] Error marking notification as read in DB:', error)
                }
              }
            }
          )
          .subscribe((status) => {
            console.log('[useNotifications] Message read subscription status:', status)
          })

        console.log('[useNotifications] All subscriptions setup complete')
      } catch (error) {
        console.error('[useNotifications] Error initializing real-time listeners:', error)
        initPromise = null
      }
    })()

    return initPromise
  }

  const unsubscribeRealtimeListeners = () => {
    if (messageSubscription) {
      messageSubscription.unsubscribe()
      messageSubscription = null
    }
    if (requestSubscription) {
      requestSubscription.unsubscribe()
      requestSubscription = null
    }
    initPromise = null
  }

  return {
    notifications: computed(() => notifications.value),
    unreadCount,
    hasUnread,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    loadSavedNotifications,
    initializeRealtimeListeners,
    unsubscribeRealtimeListeners,
  }
}
