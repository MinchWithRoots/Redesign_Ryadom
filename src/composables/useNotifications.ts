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

  const addNotification = (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `${Date.now()}-${Math.random()}`,
      createdAt: new Date(),
      read: false,
    }
    notifications.value.unshift(newNotification)
    return newNotification
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
        console.log('[useNotifications] Initializing realtime listeners for user:', userId)

        // Subscribe to new messages
        messageSubscription = supabase
          .channel('new_messages')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'messages',
            },
            async (payload) => {
              const newMessage = payload.new as any
              console.log('[useNotifications] New message event received:', {
                senderId: newMessage.sender_id,
                currentUserId: userId,
                chatId: newMessage.chat_id,
                textLength: newMessage.text?.length || 0,
              })

              if (newMessage.sender_id !== userId) {
                try {
                  const { data: senderData } = await supabase
                    .from('users')
                    .select('name')
                    .eq('id', newMessage.sender_id)
                    .single()

                  const senderName = senderData?.name || 'Пользователь'
                  console.log('[useNotifications] Adding message notification from:', senderName)

                  const messagePreview = newMessage.text || newMessage.encrypted_text || 'Сообщение получено'
                  addNotification({
                    type: 'message',
                    title: `Новое сообщение от "${senderName}"`,
                    description: messagePreview.substring(0, 100),
                    userId: newMessage.sender_id,
                    chatId: newMessage.chat_id,
                  })
                } catch (error) {
                  console.error('[useNotifications] Error processing new message notification:', error)
                  addNotification({
                    type: 'message',
                    title: 'Новое сообщение',
                    description: 'У вас новое сообщение',
                  })
                }
              }
            }
          )
          .subscribe((status) => {
            console.log('[useNotifications] Message subscription status:', status)
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
    initializeRealtimeListeners,
    unsubscribeRealtimeListeners,
  }
}
