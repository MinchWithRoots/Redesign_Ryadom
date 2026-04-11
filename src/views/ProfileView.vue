<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { currentUser, chats, updateUserProfile, logoutUser, deleteChat, markChatAsRead, loadChats } from '../composables/useAppState'

const router = useRouter()
const activeTab = ref('chats')
const isSaving = ref(false)
const successMessage = ref('')
const editBio = ref('')

// Mock history data (in real app would come from API)
const sessionHistory = ref([
  {
    id: 1,
    companionName: 'Анна М.',
    topic: 'Отношения',
    date: '2024-01-15',
    duration: '45 мин',
    feedback: 5,
  },
  {
    id: 2,
    companionName: 'Виктор П.',
    topic: 'Карьера',
    date: '2024-01-10',
    duration: '30 мин',
    feedback: 4,
  },
  {
    id: 3,
    companionName: 'Елена К.',
    topic: 'Тревожность',
    date: '2024-01-05',
    duration: '50 мин',
    feedback: 5,
  },
])

// Initialize with current user data
const userProfile = computed(() => currentUser.value || {})

const userEditForm = ref({
  bio: userProfile.value?.bio || '',
})

const handleLogout = () => {
  logoutUser()
  router.push('/')
}

const handleSaveProfile = async () => {
  isSaving.value = true
  try {
    updateUserProfile({ bio: userEditForm.value.bio })
    successMessage.value = 'Профиль обновлён успешно!'
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  } finally {
    isSaving.value = false
  }
}

const handleDeleteChat = (chatId: number) => {
  if (confirm('Вы уверены, что хотите удалить этот чат?')) {
    deleteChat(chatId)
  }
}

const handleOpenChat = (chatId: number) => {
  markChatAsRead(chatId)
  router.push(`/chat?id=${chatId}`)
}

const navigate = (path: string) => {
  router.push(path)
}

// Settings management
const settings = ref({
  emailNotifications: true,
  newMessagesNotifications: true,
  marketingEmails: false,
  showOnlineStatus: true,
  allowEmailSearch: true,
})

const isSavingSettings = ref(false)

const handleSaveSettings = async () => {
  isSavingSettings.value = true
  try {
    // In a real app, this would send to backend
    console.log('Settings saved:', settings.value)
    successMessage.value = 'Настройки сохранены успешно!'
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  } finally {
    isSavingSettings.value = false
  }
}

// Load chats on mount
onMounted(async () => {
  await loadChats()
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-white to-light-bg pt-[140px] pb-16">
    <div class="container mx-auto px-4 lg:px-8 max-w-7xl">
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <!-- Sidebar with Profile -->
        <div class="lg:col-span-1">
          <div class="bg-white border border-border/50 rounded-3xl p-6 shadow-card sticky top-[140px]">
            <!-- Profile Card -->
            <div class="text-center mb-6">
              <img
                :src="userProfile.image"
                :alt="userProfile.name"
                class="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
              />
              <h2 v-if="userProfile" class="text-xl font-bold text-secondary mb-1">{{ userProfile.name }}</h2>
              <p v-if="userProfile" class="text-sm text-secondary/60 mb-4">{{ userProfile.age }} лет</p>

              <!-- Stats -->
              <div v-if="userProfile" class="grid grid-cols-2 gap-4 mb-6 p-4 bg-light-bg rounded-2xl">
                <div>
                  <p class="text-2xl font-bold text-primary">12</p>
                  <p class="text-xs text-secondary/60">сессий</p>
                </div>
                <div>
                  <div class="flex items-center justify-center gap-1 mb-1">
                    <svg class="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span class="font-bold text-primary">4.8</span>
                  </div>
                  <p class="text-xs text-secondary/60">рейтинг</p>
                </div>
              </div>
            </div>

            <!-- Bio -->
            <p v-if="userProfile" class="text-sm text-secondary/70 text-center mb-6 leading-relaxed">
              {{ userProfile.bio || 'Добавьте информацию о себе' }}
            </p>

            <!-- Divider -->
            <div class="border-t border-border/50 my-6"></div>

            <!-- Menu -->
            <nav class="flex flex-col gap-2">
              <button
                @click="activeTab = 'profile'"
                :class="[
                  'text-left px-4 py-3 rounded-xl font-medium transition-all',
                  activeTab === 'profile'
                    ? 'bg-primary/10 text-primary'
                    : 'text-secondary/70 hover:bg-light-bg'
                ]"
              >
                📋 Мой профиль
              </button>
              <button
                @click="activeTab = 'chats'"
                :class="[
                  'text-left px-4 py-3 rounded-xl font-medium transition-all',
                  activeTab === 'chats'
                    ? 'bg-primary/10 text-primary'
                    : 'text-secondary/70 hover:bg-light-bg'
                ]"
              >
                💬 Мои чаты
              </button>
              <button
                @click="activeTab = 'history'"
                :class="[
                  'text-left px-4 py-3 rounded-xl font-medium transition-all',
                  activeTab === 'history'
                    ? 'bg-primary/10 text-primary'
                    : 'text-secondary/70 hover:bg-light-bg'
                ]"
              >
                📈 История сессий
              </button>
              <button
                @click="activeTab = 'settings'"
                :class="[
                  'text-left px-4 py-3 rounded-xl font-medium transition-all',
                  activeTab === 'settings'
                    ? 'bg-primary/10 text-primary'
                    : 'text-secondary/70 hover:bg-light-bg'
                ]"
              >
                ⚙️ Настройки
              </button>
              <template v-if="userProfile.role === 'admin'">
                <div class="border-t border-border/50 my-2 pt-2">
                  <button
                    @click="navigate('/admin')"
                    class="w-full text-left px-4 py-3 rounded-xl font-medium transition-all bg-gradient-to-r from-primary/10 to-primary/5 text-primary hover:from-primary/20 hover:to-primary/10"
                  >
                    🛡️ Админ панель
                  </button>
                </div>
              </template>
            </nav>

            <!-- Logout -->
            <button
              @click="handleLogout"
              class="w-full mt-6 py-2 text-secondary font-medium border border-border rounded-full hover:border-primary hover:text-primary transition-all text-sm"
            >
              Выйти
            </button>
          </div>
        </div>

        <!-- Main Content -->
        <div class="lg:col-span-3">
          <!-- Profile Tab -->
          <div v-if="activeTab === 'profile'" class="space-y-6">
            <!-- Success Message -->
            <transition name="fade">
              <div v-if="successMessage" class="p-4 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm">
                {{ successMessage }}
              </div>
            </transition>

            <!-- Edit Profile Card -->
            <div class="bg-white border border-border/50 rounded-3xl p-8 shadow-card">
              <h2 class="text-2xl font-bold text-secondary mb-6">Мой профиль</h2>

              <div class="space-y-6">
                <!-- Name -->
                <div>
                  <label class="text-sm font-semibold text-secondary block mb-2">Полное имя</label>
                  <input
                    type="text"
                    :value="userProfile?.name"
                    disabled
                    class="w-full px-4 py-3 border border-border rounded-xl bg-light-bg text-secondary"
                  />
                </div>

                <!-- Email -->
                <div>
                  <label class="text-sm font-semibold text-secondary block mb-2">Email</label>
                  <input
                    type="email"
                    :value="userProfile?.email"
                    disabled
                    class="w-full px-4 py-3 border border-border rounded-xl bg-light-bg text-secondary"
                  />
                </div>

                <!-- Bio -->
                <div>
                  <label class="text-sm font-semibold text-secondary block mb-2">О себе</label>
                  <textarea
                    v-model="userEditForm.bio"
                    rows="4"
                    class="w-full px-4 py-3 border border-border rounded-xl text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  ></textarea>
                </div>

                <!-- Buttons -->
                <div class="flex gap-4 pt-4">
                  <button
                    @click="handleSaveProfile"
                    :disabled="isSaving"
                    class="px-8 py-3 bg-gradient-to-r from-primary to-primary/90 text-white font-semibold rounded-full shadow-soft hover:shadow-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span v-if="!isSaving">Сохранить</span>
                    <span v-else>Сохранение...</span>
                  </button>
                  <button
                    @click="activeTab = 'chats'"
                    class="px-8 py-3 text-secondary font-semibold border-2 border-border rounded-full hover:border-primary hover:text-primary transition-all"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Chats Tab -->
          <div v-if="activeTab === 'chats'" class="space-y-4">
            <h2 class="text-2xl font-bold text-secondary mb-6">Мои чаты</h2>

            <div v-if="chats.length > 0" class="space-y-3">
              <div
                v-for="chat in chats"
                :key="chat.id"
                class="bg-white border border-border/50 rounded-2xl p-4 shadow-card hover:shadow-hover hover:translate-y-[-2px] transition-all flex items-center justify-between group"
              >
                <div
                  @click="handleOpenChat(chat.id)"
                  class="flex-1 flex items-center gap-4 cursor-pointer"
                >
                  <!-- Avatar -->
                  <div class="relative flex-shrink-0">
                    <img
                      :src="chat.image"
                      :alt="chat.name"
                      class="w-16 h-16 rounded-full object-cover"
                    />
                    <div
                      :class="[
                        'absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white',
                        chat.status === 'active' ? 'bg-green-500' : 'bg-secondary/30'
                      ]"
                    ></div>
                  </div>

                  <!-- Info -->
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                      <h3 class="font-bold text-secondary">{{ chat.name }}</h3>
                      <span v-if="chat.unread_count > 0" class="ml-auto px-2 py-1 bg-primary text-white text-xs font-bold rounded-full">
                        {{ chat.unread_count }}
                      </span>
                    </div>
                    <p class="text-sm text-secondary/60 truncate">{{ chat.lastMessage }}</p>
                    <p class="text-xs text-secondary/50 mt-1">{{ chat.time }}</p>
                  </div>

                  <!-- Arrow -->
                  <svg class="w-5 h-5 text-secondary/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>

                <!-- Delete Button -->
                <button
                  @click.stop="handleDeleteChat(chat.id)"
                  class="flex-shrink-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700"
                  title="Удалить чат"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- History Tab -->
          <div v-if="activeTab === 'history'" class="space-y-6">
            <h2 class="text-2xl font-bold text-secondary mb-6">История сессий</h2>

            <div v-if="sessionHistory.length > 0" class="space-y-3">
              <div
                v-for="session in sessionHistory"
                :key="session.id"
                class="bg-white border border-border/50 rounded-2xl p-6 shadow-card hover:shadow-hover hover:translate-y-[-2px] transition-all"
              >
                <div class="flex items-start justify-between mb-3">
                  <div class="flex-1">
                    <h3 class="font-bold text-secondary mb-1">{{ session.companionName }}</h3>
                    <p class="text-sm text-secondary/60">{{ session.topic }}</p>
                  </div>
                  <div class="text-right flex-shrink-0">
                    <p class="text-sm font-semibold text-secondary">{{ session.date }}</p>
                    <p class="text-xs text-secondary/60">{{ session.duration }}</p>
                  </div>
                </div>

                <!-- Rating -->
                <div class="flex items-center gap-2 pt-3 border-t border-border/50">
                  <span class="text-xs text-secondary/60">Ваша оценка:</span>
                  <div class="flex gap-0.5">
                    <svg
                      v-for="i in 5"
                      :key="i"
                      :class="[
                        'w-4 h-4',
                        i <= session.feedback ? 'text-primary' : 'text-secondary/20'
                      ]"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="text-center py-12">
              <p class="text-secondary/60">У вас пока нет завершённых сессий</p>
            </div>
          </div>

          <!-- Settings Tab -->
          <div v-if="activeTab === 'settings'" class="space-y-6">
            <!-- Success Message -->
            <transition name="fade">
              <div v-if="successMessage" class="p-4 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm">
                {{ successMessage }}
              </div>
            </transition>

            <div class="bg-white border border-border/50 rounded-3xl p-8 shadow-card">
              <h2 class="text-2xl font-bold text-secondary mb-6">Настройки</h2>

              <!-- Notifications -->
              <div class="mb-8 pb-8 border-b border-border/50">
                <h3 class="text-lg font-semibold text-secondary mb-4">Уведомления</h3>
                <div class="space-y-4">
                  <label class="flex items-center gap-3 cursor-pointer hover:bg-light-bg p-3 rounded-lg transition-colors">
                    <input
                      v-model="settings.emailNotifications"
                      type="checkbox"
                      class="w-5 h-5 accent-primary rounded"
                    />
                    <div class="flex-1">
                      <span class="text-secondary/70 font-medium">Email уведомления</span>
                      <p class="text-xs text-secondary/50">Получайте важные новости о сервисе</p>
                    </div>
                  </label>
                  <label class="flex items-center gap-3 cursor-pointer hover:bg-light-bg p-3 rounded-lg transition-colors">
                    <input
                      v-model="settings.newMessagesNotifications"
                      type="checkbox"
                      class="w-5 h-5 accent-primary rounded"
                    />
                    <div class="flex-1">
                      <span class="text-secondary/70 font-medium">Уведомления о новых сообщениях</span>
                      <p class="text-xs text-secondary/50">Получайте напоминания о сообщениях</p>
                    </div>
                  </label>
                  <label class="flex items-center gap-3 cursor-pointer hover:bg-light-bg p-3 rounded-lg transition-colors">
                    <input
                      v-model="settings.marketingEmails"
                      type="checkbox"
                      class="w-5 h-5 accent-primary rounded"
                    />
                    <div class="flex-1">
                      <span class="text-secondary/70 font-medium">Маркетинговые письма</span>
                      <p class="text-xs text-secondary/50">Узнавайте о новых функциях</p>
                    </div>
                  </label>
                </div>
              </div>

              <!-- Privacy -->
              <div class="mb-8 pb-8 border-b border-border/50">
                <h3 class="text-lg font-semibold text-secondary mb-4">Приватность</h3>
                <div class="space-y-4">
                  <label class="flex items-center gap-3 cursor-pointer hover:bg-light-bg p-3 rounded-lg transition-colors">
                    <input
                      v-model="settings.showOnlineStatus"
                      type="checkbox"
                      class="w-5 h-5 accent-primary rounded"
                    />
                    <div class="flex-1">
                      <span class="text-secondary/70 font-medium">Показывать мой статус онлайн</span>
                      <p class="text-xs text-secondary/50">Люди смогут видеть, когда вы онлайн</p>
                    </div>
                  </label>
                  <label class="flex items-center gap-3 cursor-pointer hover:bg-light-bg p-3 rounded-lg transition-colors">
                    <input
                      v-model="settings.allowEmailSearch"
                      type="checkbox"
                      class="w-5 h-5 accent-primary rounded"
                    />
                    <div class="flex-1">
                      <span class="text-secondary/70 font-medium">Позволить находить меня по email</span>
                      <p class="text-xs text-secondary/50">Другие пользователи смогут вас найти</p>
                    </div>
                  </label>
                </div>
              </div>

              <!-- Buttons -->
              <div class="flex gap-4">
                <button
                  @click="handleSaveSettings"
                  :disabled="isSavingSettings"
                  class="px-8 py-3 bg-gradient-to-r from-primary to-primary/90 text-white font-semibold rounded-full shadow-soft hover:shadow-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span v-if="!isSavingSettings">Сохранить настройки</span>
                  <span v-else>Сохранение...</span>
                </button>
                <button
                  @click="activeTab = 'profile'"
                  class="px-8 py-3 text-secondary font-semibold border-2 border-border rounded-full hover:border-primary hover:text-primary transition-all"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
