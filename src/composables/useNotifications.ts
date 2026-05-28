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
let isInitialized = false

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

  // Initialize real-time message listening
  const initializeRealtimeListeners = async () => {
    if (isInitialized) return

    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData?.user?.id) return

      const userId = userData.user.id

      // Subscribe to new messages across all chats
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

            // Only show notification for messages not from current user
            if (newMessage.sender_id !== userId) {
              try {
                // Fetch sender and chat info
                const { data: senderData } = await supabase
                  .from('users')
                  .select('name, image')
                  .eq('id', newMessage.sender_id)
                  .single()

                const senderName = senderData?.name || 'Пользователь'

                // Fetch chat info
                const { data: chatData } = await supabase
                  .from('chats')
                  .select('id')
                  .eq('id', newMessage.chat_id)
                  .single()

                if (chatData) {
                  addNotification({
                    type: 'message',
                    title: `Новое сообщение от "${senderName}"`,
                    description: newMessage.text?.substring(0, 100) || 'Сообщение получено',
                    userId: newMessage.sender_id,
                    chatId: newMessage.chat_id,
                  })
                }
              } catch (error) {
                console.error('Error processing new message notification:', error)
                // Still add a generic notification if queries fail
                addNotification({
                  type: 'message',
                  title: 'Новое сообщение',
                  description: 'У вас новое сообщение',
                })
              }
            }
          }
        )
        .subscribe()

      isInitialized = true
    } catch (error) {
      console.error('Error initializing real-time listeners:', error)
    }
  }

  // Cleanup subscription on unmount
  const unsubscribeRealtimeListeners = () => {
    if (messageSubscription) {
      messageSubscription.unsubscribe()
      messageSubscription = null
    }
    isInitialized = false
  }

  // Initialize on first use
  initializeRealtimeListeners()

  // Cleanup on component unmount
  onBeforeUnmount(() => {
    unsubscribeRealtimeListeners()
  })

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
  }
}
