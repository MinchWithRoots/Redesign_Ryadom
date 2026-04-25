<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { currentUser, chats, updateUserProfile, logoutUser, deleteChat, markChatAsRead, loadChats, topics, loadTopics } from '../composables/useAppState'
import { getAgeForm } from '../utils/ageForm'

const router = useRouter()
const activeTab = ref('chats')
const isSaving = ref(false)
const successMessage = ref('')
const errorMessage = ref('')
const editBio = ref('')
const previewImage = ref<string>('')

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
  image: userProfile.value?.image || '',
  selectedTopics: (userProfile.value?.topics as string[]) || [],
})

// Watch for changes to currentUser and update form
watch(currentUser, (newUser) => {
  if (newUser) {
    userEditForm.value = {
      bio: newUser.bio || '',
      image: newUser.image || '',
      selectedTopics: (newUser.topics as string[]) || [],
    }
    if (userEditForm.value.image) {
      previewImage.value = userEditForm.value.image
    }
  }
}, { immediate: true })

const handleLogout = () => {
  logoutUser()
  router.push('/')
}

const handleImageUpload = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const imageData = e.target?.result as string
      userEditForm.value.image = imageData
      previewImage.value = imageData
    }
    reader.readAsDataURL(file)
  }
}

const toggleTopic = (topic: string) => {
  const index = userEditForm.value.selectedTopics.indexOf(topic)
  if (index > -1) {
    userEditForm.value.selectedTopics.splice(index, 1)
  } else {
    userEditForm.value.selectedTopics.push(topic)
  }
}

const handleSaveProfile = async () => {
  errorMessage.value = ''

  if (!userEditForm.value.bio.trim()) {
    errorMessage.value = 'Пожалуйста, расскажите о себе'
    return
  }
  if (userEditForm.value.selectedTopics.length === 0) {
    errorMessage.value = 'Пожалуйста, выберите хотя бы одну тему'
    return
  }

  isSaving.value = true
  try {
    await updateUserProfile({
      bio: userEditForm.value.bio,
      image: userEditForm.value.image || undefined,
      topics: userEditForm.value.selectedTopics,
    })
    successMessage.value = 'Профиль обновлён успешно!'
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Ошибка при сохранении профиля'
    errorMessage.value = message
    console.error('Profile update error:', message)
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

// Load chats and topics on mount
onMounted(async () => {
  await loadChats()
  await loadTopics()
})
</script>

<template>
  <div class="layout-page">
    <div class="layout-container">
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
              <p v-if="userProfile" class="text-sm text-secondary/60 mb-4">{{ userProfile.age }} {{ getAgeForm(userProfile.age) }}</p>

              <!-- Stats -->
              <div v-if="userProfile" class="grid grid-cols-2 gap-4 mb-6 p-4 bg-light-bg rounded-2xl">
                <div>
                  <p class="text-2xl font-bold text-primary">12</p>
                  <p class="text-xs text-secondary/60">сессий</p>
                </div>
                <div>
                  <div class="flex items-center justify-center gap-1 mb-1">
                    <img src="../images/support.svg" alt="Thanks" class="w-[24px] h-[24px] object-contain" />
                    <span class="font-bold text-primary">8</span>
                  </div>
                  <p class="text-xs text-secondary/60">благодарностей</p>
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
                <img src="../images/user.svg" alt="Profile" class="w-5 h-5 inline mr-2 object-contain" />
                Мой профиль
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
                <img src="../images/message-add-alt.svg" alt="Chats" class="w-5 h-5 inline mr-2 object-contain" />
                Мои чаты
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
                <img src="../images/shield-tick.svg" alt="History" class="w-5 h-5 inline mr-2 object-contain" />
                История сессий
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
                <img src="../images/settings.svg" alt="Settings" class="w-5 h-5 inline mr-2 object-contain" />
                Настройки
              </button>
              <template v-if="userProfile.role === 'admin'">
                <div class="border-t border-border/50 my-2 pt-2">
                  <button
                    @click="navigate('/admin')"
                    class="w-full text-left px-4 py-3 rounded-xl font-medium transition-all bg-gradient-to-r from-primary/10 to-primary/5 text-primary hover:from-primary/20 hover:to-primary/10"
                  >
                    <img src="../images/shield-tick.svg" alt="Admin" class="w-5 h-5 inline mr-2 object-contain" />
                    Админ панель
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
            <!-- Error Message -->
            <transition name="fade">
              <div v-if="errorMessage" class="mb-6 p-4 bg-red-100 border border-red-300 rounded-2xl text-red-700 text-sm">
                {{ errorMessage }}
              </div>
            </transition>

            <!-- Success Message -->
            <transition name="fade">
              <div v-if="successMessage" class="alert-success">
                {{ successMessage }}
              </div>
            </transition>

            <!-- Edit Profile Card -->
            <div class="card">
              <h2 class="text-2xl font-bold text-secondary mb-6">Мой профиль</h2>

              <div class="space-y-6">
                <!-- Photo Upload -->
                <div>
                  <label class="form-label">Фото профиля</label>
                  <div class="mb-4 text-center">
                    <div v-if="previewImage" class="mb-4">
                      <img
                        :src="previewImage"
                        alt="Profile preview"
                        class="w-32 h-32 rounded-full mx-auto object-cover border-4 border-primary/20"
                      />
                    </div>
                    <div v-else class="mb-4 w-32 h-32 rounded-full mx-auto bg-light-bg border-4 border-dashed border-border flex items-center justify-center">
                      <span class="text-4xl">📸</span>
                    </div>
                  </div>
                  <label class="block">
                    <span class="sr-only">Выберите фото</span>
                    <input
                      type="file"
                      accept="image/*"
                      @change="handleImageUpload"
                      class="block w-full text-sm text-secondary
                        file:mr-4 file:py-3 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-primary file:text-white
                        hover:file:bg-primary/90
                        file:cursor-pointer"
                    />
                  </label>
                </div>

                <!-- Name -->
                <div>
                  <label class="form-label">Полное имя</label>
                  <input
                    type="text"
                    :value="userProfile?.name"
                    disabled
                    class="input opacity-50 cursor-not-allowed"
                  />
                </div>

                <!-- Email -->
                <div>
                  <label class="form-label">Email</label>
                  <input
                    type="email"
                    :value="userProfile?.email"
                    disabled
                    class="input opacity-50 cursor-not-allowed"
                  />
                </div>

                <!-- Age (Display Only) -->
                <div>
                  <label class="form-label">Возраст</label>
                  <div class="px-4 py-3 border border-border rounded-xl bg-light-bg text-secondary/70 rounded-xl">
                    {{ userProfile?.age }} {{ getAgeForm(userProfile?.age) }}
                  </div>
                </div>

                <!-- Gender (Display Only) -->
                <div>
                  <label class="form-label">Пол</label>
                  <div class="px-4 py-3 border border-border rounded-xl bg-light-bg text-secondary/70">
                    {{ userProfile?.gender === 'female' ? 'Женщина' : userProfile?.gender === 'male' ? 'Мужчина' : '—' }}
                  </div>
                </div>

                <!-- Bio -->
                <div>
                  <label class="form-label">О себе *</label>
                  <textarea
                    v-model="userEditForm.bio"
                    rows="4"
                    placeholder="Расскажите о себе..."
                    class="w-full px-4 py-3 border border-border rounded-xl text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  ></textarea>
                </div>

                <!-- Topics -->
                <div>
                  <label class="form-label">Темы интересов *</label>
                  <div class="flex flex-wrap gap-3">
                    <button
                      v-for="topic in topics"
                      :key="topic"
                      @click="toggleTopic(topic)"
                      :class="[
                        'px-4 py-2 rounded-full text-sm font-medium transition-all',
                        userEditForm.selectedTopics.includes(topic)
                          ? 'bg-primary text-white shadow-soft'
                          : 'bg-white border border-border/50 text-secondary hover:border-primary hover:text-primary'
                      ]"
                    >
                      {{ topic }}
                    </button>
                  </div>
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
                    class="btn-secondary"
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
                  <img src="../images/send.svg" alt="Open" class="w-5 h-5 text-secondary/30 object-contain opacity-30" />
                </div>

                <!-- Delete Button -->
                <button
                  @click.stop="handleDeleteChat(chat.id)"
                  class="flex-shrink-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700"
                  title="Удалить чат"
                >
                  <span class="text-lg">🗑</span>
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
                    <img
                      v-for="starIndex in 5"
                      :key="starIndex"
                      src="../images/smile.svg"
                      :alt="`Star ${starIndex}`"
                      :class="[
                        'w-4 h-4 object-contain',
                        starIndex <= session.feedback ? 'opacity-100' : 'opacity-20'
                      ]"
                    />
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
              <div v-if="successMessage" class="alert-success">
                {{ successMessage }}
              </div>
            </transition>

            <div class="card">
              <h2 class="text-2xl font-bold text-secondary mb-6">Настройки</h2>

              <!-- Notifications -->
              <div class="mb-8 pb-8 border-b border-border/50">
                <h3 class="text-lg font-semibold text-secondary mb-4">Уведомления</h3>
                <div class="space-y-4">
                  <label class="settings-row">
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
                  <label class="settings-row">
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
                  <label class="settings-row">
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
                  <label class="settings-row">
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
                  <label class="settings-row">
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
                  class="btn-secondary"
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
