import { ref, computed } from 'vue'

export interface Notification {
  id: string
  type: 'message' | 'application'
  title: string
  description?: string
  createdAt: Date
  read: boolean
  userId?: string
}

const notifications = ref<Notification[]>([])

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

  return {
    notifications: computed(() => notifications.value),
    unreadCount,
    hasUnread,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
  }
}
