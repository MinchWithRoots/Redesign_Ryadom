<script setup lang="ts">
import { useNotifications } from '../composables/useNotifications'

const { addNotification } = useNotifications()

const addMessageNotification = () => {
  addNotification({
    type: 'message',
    title: 'Новое сообщение',
    description: 'От пользователя Иван: Привет, как дела?',
  })
}

const addApplicationNotification = () => {
  addNotification({
    type: 'application',
    title: 'Новая заявка (Application)',
    description: 'Вы получили новую заявку от Мария',
  })
}
</script>

<template>
  <div class="notification-demo">
    <h2>Тестирование уведомлений</h2>
    <p>Кликните кнопки ниже, чтобы добавить уведомления и увидеть их в шапке сайта:</p>
    
    <div class="demo-buttons">
      <button @click="addMessageNotification" class="demo-btn">
        + Добавить уведомление о сообщении
      </button>
      <button @click="addApplicationNotification" class="demo-btn">
        + Добавить уведомление о заявке
      </button>
    </div>
  </div>
</template>

<style scoped>
.notification-demo {
  padding: 20px;
  background: #f5f5f5;
  border-radius: 8px;
  margin: 20px 0;
}

.notification-demo h2 {
  margin-top: 0;
  font-size: 18px;
  color: #333;
}

.notification-demo p {
  color: #666;
  font-size: 14px;
  margin: 10px 0 20px 0;
}

.demo-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.demo-btn {
  padding: 10px 16px;
  background-color: #ff6330;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background-color 0.2s;
}

.demo-btn:hover {
  background-color: #e55a1f;
}
</style>
