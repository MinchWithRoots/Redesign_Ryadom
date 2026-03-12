<script setup lang="ts">
import { ref } from 'vue'

const messages = ref([
  {
    id: 1,
    author: 'Мария К.',
    text: 'Привет! Как дела? Я хотела обсудить свои проблемы с доверием в отношениях.',
    time: '14:30',
    isMine: false,
  },
  {
    id: 2,
    author: 'Ты',
    text: 'Привет! Я слушаю, расскажи подробнее.',
    time: '14:32',
    isMine: true,
  },
  {
    id: 3,
    author: 'Мария К.',
    text: 'Спасибо. Мне кажется, я часто беспокоюсь без причины и это портит мои отношения.',
    time: '14:35',
    isMine: false,
  },
  {
    id: 4,
    author: 'Мария К.',
    text: 'Я не знаю, как научиться доверять.',
    time: '14:36',
    isMine: false,
  },
  {
    id: 5,
    author: 'Ты',
    text: 'Это очень распространённая проблема. Давайте поговорим о корнях этого беспокойства. Когда оно началось?',
    time: '14:38',
    isMine: true,
  },
  {
    id: 6,
    author: 'Мария К.',
    text: 'Спасибо за помощь! Это действительно помогает разговаривать об этом.',
    time: '14:45',
    isMine: false,
  },
])

const messageInput = ref('')

const currentCompanion = {
  name: 'Мария К.',
  specialization: 'Психолог',
  status: 'online',
  image: 'https://images.pexels.com/photos/27603433/pexels-photo-27603433.jpeg',
}

const sendMessage = () => {
  if (messageInput.value.trim()) {
    messages.value.push({
      id: messages.value.length + 1,
      author: 'Ты',
      text: messageInput.value,
      time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      isMine: true,
    })
    messageInput.value = ''
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
          <button class="p-2 hover:bg-light-bg rounded-lg transition-colors text-red-500 hover:text-red-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Messages Container -->
      <div class="flex-1 overflow-y-auto mb-6 space-y-4 px-2">
        <div
          v-for="message in messages"
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
</style>
