<script setup lang="ts">
import { ref, watch } from 'vue'
import { useNotifications } from '../composables/useNotifications'

const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification } = useNotifications()
const isOpen = ref(false)

const handleNotificationClick = (notificationId: string) => {
  markAsRead(notificationId)
}

const handleMarkAllRead = () => {
  markAllAsRead()
}

const formatTime = (date: Date) => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return 'только что'
  if (minutes < 60) return `${minutes} мин назад`
  if (hours < 24) return `${hours} ч назад`
  if (days < 7) return `${days} дн назад`
  
  return date.toLocaleDateString('ru-RU')
}

watch(isOpen, (newVal) => {
  if (newVal) {
    document.addEventListener('click', handleOutsideClick)
  } else {
    document.removeEventListener('click', handleOutsideClick)
  }
})

const handleOutsideClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('[data-notification-panel]')) {
    isOpen.value = false
  }
}
</script>

<template>
  <div data-notification-panel class="notification-panel">
    <!-- Notification Bell Button -->
    <button
      class="notification-bell"
      @click="isOpen = !isOpen"
      :aria-label="`Уведомления (${unreadCount} новых)`"
    >
      <svg
        v-if="unreadCount > 0"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        class="notification-icon notification-icon--unread"
      >
        <path
          d="M13.3858 2.92597C13.409 2.98202 13.4288 3.03931 13.445 3.09751C13.6688 3.13466 13.889 3.18212 14.1053 3.2394C13.7386 3.62378 13.4478 4.08107 13.2566 4.58732C12.9321 4.52994 12.5982 4.5 12.2573 4.5C9.10933 4.5 6.55726 7.05222 6.55726 10.2003V11.5C6.55726 13.5041 5.9476 15.8973 5.41031 17.6423C5.34705 17.8477 5.38676 18.0699 5.51097 18.2468C5.63155 18.4185 5.79472 18.5 5.96673 18.5H18.3096C18.6283 18.5 18.9549 18.1594 18.8569 17.7417C18.4407 15.9687 17.9573 13.5012 17.9573 11.5V10.2003C17.9573 10.0951 17.9544 9.9906 17.9488 9.8868C18.478 9.75806 18.9661 9.52404 19.3895 9.20818C19.4342 9.53251 19.4573 9.86372 19.4573 10.2003V11.5C19.4573 13.3161 19.9044 15.6401 20.3172 17.3989C20.6235 18.7039 19.65 20 18.3096 20H14C14 20.2626 13.9483 20.5227 13.8478 20.7654C13.7472 21.008 13.5999 21.2285 13.4142 21.4142C13.2285 21.5999 13.008 21.7472 12.7654 21.8478C12.5227 21.9483 12.2626 22 12 22C11.7374 22 11.4773 21.9483 11.2346 21.8478C10.992 21.7472 10.7715 21.5999 10.5858 21.4142C10.4001 21.2285 10.2528 21.008 10.1522 20.7654C10.0517 20.5227 10 20.2626 10 20H5.96673C4.54844 20 3.55937 18.5563 3.97673 17.2009C4.50774 15.4763 5.05726 13.2651 5.05726 11.5V10.2003C5.05726 6.81982 7.38702 3.9832 10.5285 3.2089C10.5476 3.11224 10.5763 3.01745 10.6142 2.92597C10.6896 2.74399 10.8001 2.57863 10.9393 2.43934C11.0786 2.30005 11.244 2.18956 11.426 2.11418C11.608 2.0388 11.803 2 12 2C12.197 2 12.392 2.0388 12.574 2.11418C12.756 2.18956 12.9214 2.30005 13.0607 2.43934C13.1999 2.57863 13.3104 2.74399 13.3858 2.92597Z"
          fill="#FF6330"
        />
        <path
          d="M17 9C18.6569 9 20 7.65685 20 6C20 4.34315 18.6569 3 17 3C15.3431 3 14 4.34315 14 6C14 7.65685 15.3431 9 17 9Z"
          fill="#FF6330"
        />
      </svg>
      <svg
        v-else
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        class="notification-icon"
      >
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M10.5286 3.20887C7.38708 3.98312 5.05726 6.81977 5.05726 10.2003V11.5C5.05726 13.2651 4.50774 15.4763 3.97673 17.2009C3.55937 18.5563 4.54844 20 5.96673 20H10.0001C10.0001 20.2626 10.0519 20.5227 10.1524 20.7654C10.2529 21.008 10.4002 21.2285 10.5859 21.4142C10.7716 21.5999 10.9921 21.7472 11.2348 21.8478C11.4774 21.9483 11.7375 22 12.0001 22C12.2628 22 12.5228 21.9483 12.7655 21.8478C13.0081 21.7472 13.2286 21.5999 13.4143 21.4142C13.6 21.2285 13.7474 21.008 13.8479 20.7654C13.9484 20.5227 14.0001 20.2626 14.0001 20H18.3096C19.65 20 20.6235 18.7039 20.3172 17.3989C19.9044 15.6401 19.4573 13.3161 19.4573 11.5V10.2003C19.4573 6.6285 16.8563 3.66387 13.4451 3.09753C13.4289 3.03932 13.4092 2.98203 13.3859 2.92597C13.3106 2.74399 13.2001 2.57863 13.0608 2.43934C12.9215 2.30005 12.7561 2.18956 12.5741 2.11418C12.3922 2.0388 12.1971 2 12.0001 2C11.8031 2 11.6081 2.0388 11.4261 2.11418C11.2441 2.18956 11.0787 2.30005 10.9395 2.43934C10.8002 2.57863 10.6897 2.74399 10.6143 2.92597C10.5764 3.01744 10.5478 3.11221 10.5286 3.20887ZM6.55726 10.2003V11.5C6.55726 13.5041 5.9476 15.8973 5.41031 17.6423C5.34705 17.8477 5.38676 18.0699 5.51097 18.2468C5.63155 18.4185 5.79472 18.5 5.96673 18.5H18.3096C18.6283 18.5 18.9549 18.1594 18.8569 17.7417C18.4407 15.9687 17.9573 13.5012 17.9573 11.5V10.2003C17.9573 7.05222 15.4052 4.5 12.2573 4.5C9.10933 4.5 6.55726 7.05222 6.55726 10.2003Z"
          fill="#FF6330"
        />
      </svg>
      <!-- Badge with unread count -->
      <span v-if="unreadCount > 0" class="notification-badge">{{ unreadCount > 9 ? '9+' : unreadCount }}</span>
    </button>

    <!-- Notification Dropdown Menu -->
    <div v-if="isOpen" class="notification-dropdown">
      <div class="notification-dropdown__header">
        <h3 class="notification-dropdown__title">Уведомления</h3>
        <button
          v-if="unreadCount > 0"
          @click="handleMarkAllRead"
          class="notification-dropdown__mark-read"
        >
          Отметить прочитанным
        </button>
      </div>

      <div class="notification-dropdown__content">
        <div v-if="notifications.length === 0" class="notification-empty">
          <p>Нет уведомлений</p>
        </div>
        <div v-else class="notification-list">
          <div
            v-for="notification in notifications"
            :key="notification.id"
            class="notification-item"
            :class="{ 'notification-item--unread': !notification.read }"
            @click="handleNotificationClick(notification.id)"
          >
            <div class="notification-item__content">
              <h4 class="notification-item__title">{{ notification.title }}</h4>
              <p v-if="notification.description" class="notification-item__description">
                {{ notification.description }}
              </p>
              <time class="notification-item__time">
                {{ formatTime(notification.createdAt) }}
              </time>
            </div>
            <button
              class="notification-item__close"
              @click.stop="removeNotification(notification.id)"
              aria-label="Удалить уведомление"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.notification-panel {
  position: relative;
}

.notification-bell {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: opacity 0.2s ease;
}

.notification-bell:hover {
  opacity: 0.7;
}

.notification-icon {
  width: 24px;
  height: 24px;
  color: var(--color-primary);
}

.notification-badge {
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background-color: var(--color-primary);
  color: white;
  border-radius: 50%;
  font-size: 12px;
  font-weight: bold;
  line-height: 1;
}

.notification-dropdown {
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  width: 360px;
  max-width: calc(100vw - 20px);
  background: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  max-height: 500px;
}

.notification-dropdown__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border);
  background-color: var(--color-secondary-light);
}

.notification-dropdown__title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-secondary);
}

.notification-dropdown__mark-read {
  padding: 0;
  background: none;
  border: none;
  color: var(--color-primary);
  cursor: pointer;
  font-size: 12px;
  text-decoration: none;
  transition: opacity 0.2s;
}

.notification-dropdown__mark-read:hover {
  opacity: 0.7;
  text-decoration: underline;
}

.notification-dropdown__content {
  overflow-y: auto;
  flex: 1;
}

.notification-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  text-align: center;
  color: var(--color-secondary-60);
}

.notification-empty p {
  margin: 0;
  font-size: 14px;
}

.notification-list {
  padding: 0;
}

.notification-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border);
  cursor: pointer;
  background-color: var(--color-white);
  transition: background-color 0.2s;
}

.notification-item:hover {
  background-color: var(--color-secondary-light);
}

.notification-item--unread {
  background-color: var(--color-primary-light);
}

.notification-item__content {
  flex: 1;
  margin-right: 8px;
}

.notification-item__title {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-secondary);
}

.notification-item__description {
  margin: 0 0 6px 0;
  font-size: 13px;
  color: var(--color-secondary-60);
  line-height: 1.4;
}

.notification-item__time {
  display: block;
  font-size: 12px;
  color: var(--color-secondary-70);
  font-style: normal;
}

.notification-item__close {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: var(--color-secondary-30);
  cursor: pointer;
  font-size: 16px;
  transition: color 0.2s;
}

.notification-item__close:hover {
  color: var(--color-primary);
}
</style>
