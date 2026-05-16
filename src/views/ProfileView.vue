<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { currentUser, chats, updateUserProfile, logoutUser, deleteChat, markChatAsRead, loadChats, topics, loadTopics, getCompanionById, getCurrentCompanionId } from '../composables/useAppState'
import UserChatRequests from '../components/UserChatRequests.vue'
import CompanionChatRequests from '../components/CompanionChatRequests.vue'
import ReviewModal from '../components/ReviewModal.vue'
import { getUserReviews, deleteReview } from '../services/supabaseService'
import { getAgeForm } from '../utils/ageForm'
import { supabase } from '@/utils/supabase'
import '@/assets/profile.css'

const router = useRouter()
const activeTab = ref('chats')
const isSaving = ref(false)
const successMessage = ref('')
const errorMessage = ref('')
const editBio = ref('')
const previewImage = ref<string>('')
const imageLoadErrors = ref<Set<string>>(new Set())

// Session history - loaded from chats table where status = 'offline'
const sessionHistory = ref<any[]>([])
const companionData = ref<any>(null)
const companionId = ref<string | null>(null)

// Reviews
const userReviews = ref<any[]>([])
const isLoadingReviews = ref(false)
const showReviewModal = ref(false)
const selectedSessionForReview = ref<any>(null)

// Initialize with current user data
const userProfile = computed(() => currentUser.value)

const userEditForm = ref({
  bio: currentUser.value?.bio || '',
  image: currentUser.value?.image || '',
  selectedTopics: (currentUser.value?.topics as string[]) || [],
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

const handleImageError = (imageId: string) => {
  imageLoadErrors.value.add(imageId)
}

const handleImageUpload = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  try {
    const reader = new FileReader()
    reader.onload = async (e) => {
      const imageData = e.target?.result as string
      previewImage.value = imageData

      // Upload to Supabase Storage
      if (!currentUser.value) return

      const fileExtension = file.name.split('.').pop()
      const filePath = `profile-images/${currentUser.value.id}-${Date.now()}.${fileExtension}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) {
        console.error('Error uploading image:', uploadError)
        errorMessage.value = 'Ошибка при загрузке изображения'
        return
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      userEditForm.value.image = publicUrlData.publicUrl
    }
    reader.readAsDataURL(file)
  } catch (err) {
    console.error('Image upload error:', err)
    errorMessage.value = 'Ошибка при загрузке изображения'
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
      bio: userEditForm.value.bio.substring(0, 500),
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

const handleDeleteChat = (chatId: string | number) => {
  if (confirm('Вы уверены, что хотите удалить этот чат?')) {
    deleteChat(chatId.toString())
  }
}

const handleOpenChat = (chatId: string | number) => {
  markChatAsRead(chatId.toString())
  router.push(`/chat?id=${chatId}`)
}

const handleUnblockChat = async (chatId: string | number, event: Event) => {
  event.stopPropagation()

  try {
    const { error } = await supabase
      .from('chats')
      .update({ status: 'offline' })
      .eq('id', chatId)

    if (error) {
      console.error('Error unblocking chat:', error)
      alert('Ошибка при разблокировке')
      return
    }

    successMessage.value = 'Пользователь разблокирован'
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)

    // Reload chats to update the list
    await loadChats()
  } catch (err) {
    console.error('Error in handleUnblockChat:', err)
    alert('Ошибка при разблокировке')
  }
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

// Load session history (completed chats)
const loadSessionHistory = async () => {
  try {
    if (!currentUser.value) return

    const { data: completedChats, error } = await supabase
      .from('chats')
      .select(`
        id,
        user_id,
        companion_id,
        status,
        created_at,
        updated_at,
        companions (name, image)
      `)
      .eq('user_id', currentUser.value.id)
      .eq('status', 'offline')
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error loading session history:', error)
      return
    }

    // Transform the data for display
    sessionHistory.value = (completedChats || []).map((chat: any) => ({
      id: chat.id,
      companionId: chat.companion_id,
      companionName: chat.companions?.name || 'Unknown',
      companionImage: chat.companions?.image,
      topic: '', // We don't have topic info in the chat yet
      date: new Date(chat.updated_at).toLocaleDateString('ru-RU'),
      duration: '—', // Calculate duration if needed
      feedback: 0,
    }))

    console.log('Session history loaded:', sessionHistory.value)
  } catch (err) {
    console.error('Error in loadSessionHistory:', err)
  }
}

// Load user's reviews
const loadUserReviews = async () => {
  if (!currentUser.value) return

  isLoadingReviews.value = true
  try {
    const reviews = await getUserReviews(currentUser.value.id)
    userReviews.value = reviews || []
  } catch (err) {
    console.error('Error loading reviews:', err)
  } finally {
    isLoadingReviews.value = false
  }
}

// Open review modal for session
const openReviewModal = (session: any) => {
  selectedSessionForReview.value = session
  showReviewModal.value = true
}

// Handle review deletion
const handleDeleteReview = async (reviewId: string) => {
  if (!confirm('Вы уверены, что хотите удалить этот отзыв?')) return

  try {
    const success = await deleteReview(reviewId)
    if (success) {
      userReviews.value = userReviews.value.filter(r => r.id !== reviewId)
      successMessage.value = 'Отзыв удалён'
      setTimeout(() => {
        successMessage.value = ''
      }, 3000)
    }
  } catch (err) {
    console.error('Error deleting review:', err)
    errorMessage.value = 'Ошибка при удалении отзыва'
  }
}

// Handle review success
const handleReviewSuccess = async () => {
  showReviewModal.value = false
  await loadUserReviews()
}

// Load chats and topics on mount
onMounted(async () => {
  await loadChats()
  await loadTopics()
  await loadSessionHistory()
  await loadUserReviews()

  // If user is a companion, load companion ID for chat requests
  if (currentUser.value?.role === 'companion') {
    try {
      const id = await getCurrentCompanionId()
      companionId.value = id
      console.log('Companion ID loaded:', id)
    } catch (err) {
      console.error('Error loading companion data:', err)
    }
  }
})

// Watch for changes to currentUser role and load companion ID if needed
watch(
  () => currentUser.value?.role,
  async (newRole) => {
    if (newRole === 'companion') {
      try {
        const id = await getCurrentCompanionId()
        companionId.value = id
        console.log('Companion ID loaded after role change:', id)
      } catch (err) {
        console.error('Error loading companion data:', err)
      }
    } else {
      companionId.value = null
    }
  }
)
</script>

<template>
  <div class="profile-layout">
    <div class="profile-layout__container">
      <!-- Sidebar with Profile -->
      <aside class="profile-layout__sidebar">
        <div class="profile-sidebar">
          <div class="profile-card">
            <!-- Profile Card Header -->
            <div class="profile-card__header">
              <div class="profile-card__avatar-wrapper">
                <img
                  v-if="userProfile && userProfile.image && !imageLoadErrors.has('profile-avatar')"
                  :src="userProfile.image"
                  :alt="userProfile.name"
                  class="profile-card__avatar"
                  @error="handleImageError('profile-avatar')"
                />
                <div v-else-if="userProfile" class="profile-card__avatar-fallback">
                  <img src="/src/images/gallery.svg" alt="Gallery" class="profile-card__avatar-icon" />
                </div>
              </div>
              <h2 v-if="userProfile" class="profile-card__name">{{ userProfile.name }}</h2>
              <p v-if="userProfile" class="profile-card__age">{{ userProfile.age }} {{ getAgeForm(userProfile.age) }}</p>

              <!-- Stats -->
              <div v-if="userProfile" class="profile-stats">
                <div class="profile-stat">
                  <p class="profile-stat__value">{{ userProfile.sessions || 0 }}</p>
                  <p class="profile-stat__label">сессий</p>
                </div>
                <div class="profile-stat">
                  <div class="profile-stat__flex">
                    <img src="../images/support.svg" alt="Thanks" class="profile-stat__icon" />
                    <span class="profile-stat__value">0</span>
                  </div>
                  <p class="profile-stat__label">отзывов</p>
                </div>
              </div>
            </div>

            <!-- Bio -->
            <p v-if="userProfile" class="profile-card__bio">
              {{ userProfile.bio || 'Добавьте информацию о себе' }}
            </p>

            <!-- Divider -->
            <div class="profile-divider"></div>

            <!-- Menu -->
            <nav class="profile-menu">
              <button
                @click="activeTab = 'profile'"
                :class="[
                  'profile-menu__item',
                  activeTab === 'profile' && 'profile-menu__item--active'
                ]"
              >
                <img src="../images/user.svg" alt="Profile" class="profile-menu__icon" />
                Мой профиль
              </button>
              <button
                @click="activeTab = 'chats'"
                :class="[
                  'profile-menu__item',
                  activeTab === 'chats' && 'profile-menu__item--active'
                ]"
              >
                <img src="../images/message-add-alt.svg" alt="Chats" class="profile-menu__icon" />
                Мои чаты
              </button>
              <!-- Show "Мои заявки" only for companions -->
              <button
                v-if="userProfile?.role === 'companion'"
                @click="activeTab = 'companion-requests'"
                :class="[
                  'profile-menu__item',
                  activeTab === 'companion-requests' && 'profile-menu__item--active'
                ]"
              >
                <svg class="profile-menu__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m0 0h6m0 0l-6-6m0 0l6 6" />
                </svg>
                Мои заявки
              </button>

              <!-- Show "Мои запросы" for regular users -->
              <button
                v-if="userProfile?.role !== 'companion'"
                @click="activeTab = 'user-requests'"
                :class="[
                  'profile-menu__item',
                  activeTab === 'user-requests' && 'profile-menu__item--active'
                ]"
              >
                <svg class="profile-menu__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Мои запросы
              </button>

              <button
                @click="activeTab = 'history'"
                :class="[
                  'profile-menu__item',
                  activeTab === 'history' && 'profile-menu__item--active'
                ]"
              >
                <img src="../images/shield-tick.svg" alt="History" class="profile-menu__icon" />
                История сессий
              </button>
              <button
                @click="activeTab = 'reviews'"
                :class="[
                  'profile-menu__item',
                  activeTab === 'reviews' && 'profile-menu__item--active'
                ]"
              >
                <svg class="profile-menu__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                Мои отзывы
              </button>
              <button
                @click="activeTab = 'settings'"
                :class="[
                  'profile-menu__item',
                  activeTab === 'settings' && 'profile-menu__item--active'
                ]"
              >
                <img src="../images/settings.svg" alt="Settings" class="profile-menu__icon" />
                Настройки
              </button>
              <template v-if="userProfile?.role === 'admin'">
                <div class="profile-menu__admin-section">
                  <button
                    @click="navigate('/admin')"
                    class="profile-menu__admin-btn"
                  >
                    <img src="../images/shield-tick.svg" alt="Admin" class="profile-menu__icon" />
                    Админ панель
                  </button>
                </div>
              </template>
            </nav>

            <!-- Logout -->
            <button
              @click="handleLogout"
              class="profile-sidebar__logout"
            >
              Выйти
            </button>
          </div>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="profile-layout__main">
        <!-- Profile Tab -->
        <div v-if="activeTab === 'profile'" class="profile-main-content">
          <!-- Error Message -->
          <transition name="fade">
            <div v-if="errorMessage" class="profile-alert profile-alert--error">
              {{ errorMessage }}
            </div>
          </transition>

          <!-- Success Message -->
          <transition name="fade">
            <div v-if="successMessage" class="profile-alert profile-alert--success">
              {{ successMessage }}
            </div>
          </transition>

          <!-- Edit Profile Card -->
          <div class="profile-section">
            <h2 class="profile-section__title">Мой профиль</h2>

            <div class="profile-form">
              <!-- Photo Upload -->
              <div class="profile-form__group">
                <label class="form-label">Фото профиля</label>
                <div class="profile-photo-upload">
                  <div v-if="previewImage" class="profile-photo-preview">
                    <img
                      :src="previewImage"
                      alt="Profile preview"
                      class="profile-photo-preview__image"
                    />
                  </div>
                  <div v-else class="profile-photo-placeholder">
                    <img src="/src/images/gallery.svg" alt="Upload photo" class="profile-photo-placeholder__icon" />
                  </div>
                </div>
                <label class="profile-file-input">
                  <span class="sr-only">Выберите фото</span>
                  <input
                    type="file"
                    accept="image/*"
                    @change="handleImageUpload"
                    style="display: none"
                  />
                  <span class="profile-file-label">Загрузить фото</span>
                </label>
              </div>

              <!-- Name -->
              <div class="profile-form__group">
                <label class="form-label">Полное имя</label>
                <input
                  type="text"
                  :value="userProfile?.name || ''"
                  disabled
                  class="profile-input profile-input--disabled"
                />
              </div>

              <!-- Email -->
              <div class="profile-form__group">
                <label class="form-label">Email</label>
                <input
                  type="email"
                  :value="userProfile?.email || ''"
                  disabled
                  class="profile-input profile-input--disabled"
                />
              </div>

              <!-- Age (Display Only) -->
              <div class="profile-form__group">
                <label class="form-label">Возраст</label>
                <div class="profile-display-field">
                  {{ userProfile?.age }} {{ userProfile?.age ? getAgeForm(userProfile.age) : '' }}
                </div>
              </div>

              <!-- Gender (Display Only) -->
              <div class="profile-form__group">
                <label class="form-label">Пол</label>
                <div class="profile-display-field">
                  {{ userProfile?.gender === 'female' ? 'Женщина' : userProfile?.gender === 'male' ? 'Мужчина' : '—' }}
                </div>
              </div>

              <!-- Bio -->
              <div class="profile-form__group">
                <label class="form-label">О себе *</label>
                <textarea
                  v-model="userEditForm.bio"
                  rows="4"
                  placeholder="Расскажите о себе..."
                  class="profile-textarea"
                ></textarea>
              </div>

              <!-- Topics -->
              <div class="profile-form__group">
                <label class="form-label">Темы интересов *</label>
                <div class="profile-topics">
                  <button
                    v-for="topic in topics"
                    :key="topic"
                    @click="toggleTopic(topic)"
                    :class="[
                      'profile-topic',
                      userEditForm.selectedTopics.includes(topic) && 'profile-topic--active'
                    ]"
                  >
                    {{ topic }}
                  </button>
                </div>
              </div>

              <!-- Buttons -->
              <div class="profile-form__buttons">
                <button
                  @click="handleSaveProfile"
                  :disabled="isSaving"
                  class="profile-button profile-button--primary"
                >
                  <span v-if="!isSaving">Сохранить</span>
                  <span v-else>Сохранение...</span>
                </button>
                <button
                  @click="activeTab = 'chats'"
                  class="profile-button profile-button--secondary"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Chats Tab -->
        <div v-if="activeTab === 'chats'" class="profile-main-content">
          <h2 class="profile-section__title">Мои чаты</h2>

          <!-- Empty State -->
          <div v-if="chats.length === 0" class="profile-empty-state">
            <svg class="profile-empty-state__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <h3 class="profile-empty-state__title">Чатов нет</h3>
            <p class="profile-empty-state__text">Найдите компаньона и отправьте запрос на подключение</p>
            <router-link
              to="/search"
              class="profile-empty-state__link"
            >
              Найти компаньона
            </router-link>
          </div>

          <div v-else class="profile-chats-list">
            <div
              v-for="chat in chats"
              :key="chat.id"
              :class="[
                'profile-chat-item',
                chat.status === 'offline' && 'profile-chat-item--blocked'
              ]"
            >
              <div
                @click="chat.status !== 'offline' && handleOpenChat(chat.id)"
                :class="['profile-chat-item__main', chat.status !== 'offline' ? 'profile-chat-item__main--clickable' : '']"
              >
                <!-- Avatar -->
                <div class="profile-chat-item__avatar-wrapper">
                  <img
                    v-if="chat.image && !imageLoadErrors.has(`chat-${chat.id}`)"
                    :src="chat.image"
                    :alt="chat.name"
                    class="profile-chat-item__avatar"
                    @error="handleImageError(`chat-${chat.id}`)"
                  />
                  <div v-else class="profile-chat-item__avatar-fallback">
                    <img src="/src/images/gallery.svg" alt="Gallery" class="profile-chat-item__avatar-icon" />
                  </div>
                  <div
                    :class="[
                      'profile-chat-item__status',
                      chat.status === 'active' ? 'profile-chat-item__status--active' : 'profile-chat-item__status--inactive'
                    ]"
                  ></div>
                </div>

                <!-- Info -->
                <div class="profile-chat-item__info">
                  <div class="profile-chat-item__header">
                    <h3 class="profile-chat-item__name">{{ chat.name }}</h3>
                    <!-- Blocked Badge -->
                    <span v-if="chat.status === 'offline'" class="profile-chat-item__badge profile-chat-item__badge--blocked">
                      завершён
                    </span>
                    <span v-else-if="chat.unread_count > 0" class="profile-chat-item__badge profile-chat-item__badge--unread">
                      {{ chat.unread_count }}
                    </span>
                  </div>
                  <p class="profile-chat-item__message">{{ chat.lastMessage }}</p>
                  <p class="profile-chat-item__time">{{ chat.time }}</p>
                </div>

                <!-- Arrow (hidden for blocked) -->
                <img v-if="chat.status !== 'offline'" src="../images/send.svg" alt="Open" class="profile-chat-item__arrow" />
              </div>

              <!-- Action Buttons -->
              <div class="profile-chat-item__actions">
                <!-- Unblock Button (for offline chats) -->
                <button
                  v-if="chat.status === 'offline'"
                  @click.stop="handleUnblockChat(chat.id, $event)"
                  class="profile-chat-item__action-btn profile-chat-item__action-btn--unblock"
                  title="Активировать чат"
                >
                  <svg class="profile-chat-item__action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </button>

                <!-- Delete Button -->
                <button
                  @click.stop="handleDeleteChat(chat.id)"
                  class="profile-chat-item__action-btn profile-chat-item__action-btn--delete"
                  title="Удалить чат"
                >
                  <span>🗑</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Chat Requests Tab (only for companions) -->
        <div v-if="activeTab === 'companion-requests' && userProfile?.role === 'companion'" class="profile-main-content">
          <h2 class="profile-section__title">Мои заявки на чат</h2>
          <div class="profile-section">
            <CompanionChatRequests
              v-if="companionId"
              :companion-id="companionId"
            />
            <div v-else class="profile-loading">
              <p class="profile-loading__text">Загрузка...</p>
            </div>
          </div>
        </div>

        <!-- User Chat Requests Tab (for regular users) -->
        <div v-if="activeTab === 'user-requests' && userProfile?.role !== 'companion'" class="profile-main-content">
          <h2 class="profile-section__title">Мои запросы на чат</h2>
          <div class="profile-section">
            <UserChatRequests />
          </div>
        </div>

        <!-- History Tab -->
        <div v-if="activeTab === 'history'" class="profile-main-content">
          <h2 class="profile-section__title">История сессий</h2>

          <div v-if="sessionHistory.length > 0" class="profile-history-list">
            <div
              v-for="session in sessionHistory"
              :key="session.id"
              class="profile-history-item"
            >
              <div class="profile-history-item__header">
                <div class="profile-history-item__info">
                  <h3 class="profile-history-item__name">{{ session.companionName }}</h3>
                  <p class="profile-history-item__topic">{{ session.topic }}</p>
                </div>
                <div class="profile-history-item__date">
                  <p class="profile-history-item__date-value">{{ session.date }}</p>
                  <p class="profile-history-item__duration">{{ session.duration }}</p>
                </div>
              </div>

              <!-- Rating and Actions -->
              <div class="profile-history-item__footer">
                <div class="profile-history-item__rating">
                  <span class="profile-history-item__rating-label">Ваша оценка:</span>
                  <div class="profile-history-item__stars">
                    <img
                      v-for="starIndex in 5"
                      :key="starIndex"
                      src="@/images/star.svg"
                      :alt="`Star ${starIndex}`"
                      class="profile-history-item__star"
                      :style="{ opacity: starIndex <= session.feedback ? 1 : 0.2 }"
                    />
                  </div>
                </div>
                <button
                  @click="openReviewModal(session)"
                  class="profile-history-item__review-btn"
                >
                  Оставить отзыв
                </button>
              </div>
            </div>
          </div>

          <div v-else class="profile-empty-history">
            <p>У вас пока нет завершённых сессий</p>
          </div>
        </div>

        <!-- Reviews Tab -->
        <div v-if="activeTab === 'reviews'" class="profile-main-content">
          <div class="profile-section">
            <h2 class="profile-section__title">Мои отзывы</h2>

            <!-- Loading State -->
            <div v-if="isLoadingReviews" class="reviews-loading">
              <div class="reviews-loading__spinner"></div>
              <p>Загрузка отзывов...</p>
            </div>

            <!-- Reviews List -->
            <div v-else-if="userReviews.length > 0" class="profile-reviews-list">
              <div v-for="review in userReviews" :key="review.id" class="profile-review-item">
                <div class="profile-review-item__header">
                  <div class="profile-review-item__companion-info">
                    <img
                      v-if="review.companions?.image"
                      :src="review.companions.image"
                      :alt="review.companions.name"
                      class="profile-review-item__companion-image"
                    />
                    <div class="profile-review-item__companion-details">
                      <h3 class="profile-review-item__companion-name">{{ review.companions?.name || 'Неизвестный спутник' }}</h3>
                      <p class="profile-review-item__date">{{ new Date(review.created_at).toLocaleDateString('ru-RU') }}</p>
                      <p v-if="review.is_anonymous" class="profile-review-item__anonymous">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 4px; vertical-align: middle;">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
                        </svg>
                        Анонимный отзыв
                      </p>
                    </div>
                  </div>
                  <div class="profile-review-item__rating">
                    <span v-for="i in 5" :key="i" class="profile-review-item__star" :class="{ 'profile-review-item__star--filled': i <= review.rating, 'profile-review-item__star--empty': i > review.rating }">★</span>
                  </div>
                </div>

                <!-- Title -->
                <p v-if="review.title" class="profile-review-item__title">{{ review.title }}</p>

                <!-- Comment -->
                <p class="profile-review-item__comment">{{ review.comment }}</p>

                <!-- Actions -->
                <div class="profile-review-item__actions">
                  <button
                    @click="handleDeleteReview(review.id)"
                    class="profile-review-item__delete-btn"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                    Удалить
                  </button>
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div v-else class="profile-empty-reviews">
              <p>У вас пока нет отзывов</p>
              <p class="profile-empty-reviews__hint">После завершения сессии с спутником вы сможете оставить отзыв</p>
            </div>
          </div>
        </div>

        <!-- Settings Tab -->
        <div v-if="activeTab === 'settings'" class="profile-main-content">
          <!-- Success Message -->
          <transition name="fade">
            <div v-if="successMessage" class="profile-alert profile-alert--success">
              {{ successMessage }}
            </div>
          </transition>

          <div class="profile-section">
            <h2 class="profile-section__title">Настройки</h2>

            <!-- Notifications -->
            <div class="profile-settings__group">
              <h3 class="profile-settings__subtitle">Уведомления</h3>
              <div class="profile-settings__options">
                <label class="profile-settings__option">
                  <input
                    v-model="settings.emailNotifications"
                    type="checkbox"
                    class="profile-settings__checkbox"
                  />
                  <div class="profile-settings__content">
                    <span class="profile-settings__label">Email уведомления</span>
                    <p class="profile-settings__description">Получайте важные новости о сервисе</p>
                  </div>
                </label>
                <label class="profile-settings__option">
                  <input
                    v-model="settings.newMessagesNotifications"
                    type="checkbox"
                    class="profile-settings__checkbox"
                  />
                  <div class="profile-settings__content">
                    <span class="profile-settings__label">Уведомления о новых сообщениях</span>
                    <p class="profile-settings__description">Получайте напоминания о сообщениях</p>
                  </div>
                </label>
                <label class="profile-settings__option">
                  <input
                    v-model="settings.marketingEmails"
                    type="checkbox"
                    class="profile-settings__checkbox"
                  />
                  <div class="profile-settings__content">
                    <span class="profile-settings__label">Маркетинговые письма</span>
                    <p class="profile-settings__description">Узнавайте о новых функциях</p>
                  </div>
                </label>
              </div>
            </div>

            <!-- Privacy -->
            <div class="profile-settings__group">
              <h3 class="profile-settings__subtitle">Приватность</h3>
              <div class="profile-settings__options">
                <label class="profile-settings__option">
                  <input
                    v-model="settings.showOnlineStatus"
                    type="checkbox"
                    class="profile-settings__checkbox"
                  />
                  <div class="profile-settings__content">
                    <span class="profile-settings__label">Показывать мой статус онлайн</span>
                    <p class="profile-settings__description">Люди смогут видеть, когда вы онлайн</p>
                  </div>
                </label>
                <label class="profile-settings__option">
                  <input
                    v-model="settings.allowEmailSearch"
                    type="checkbox"
                    class="profile-settings__checkbox"
                  />
                  <div class="profile-settings__content">
                    <span class="profile-settings__label">Позволить находить меня по email</span>
                    <p class="profile-settings__description">Другие пользователи смогут вас найти</p>
                  </div>
                </label>
              </div>
            </div>

            <!-- Buttons -->
            <div class="profile-form__buttons">
              <button
                @click="handleSaveSettings"
                :disabled="isSavingSettings"
                class="profile-button profile-button--primary"
              >
                <span v-if="!isSavingSettings">Сохранить настройки</span>
                <span v-else>Сохранение...</span>
              </button>
              <button
                @click="activeTab = 'profile'"
                class="profile-button profile-button--secondary"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      </main>

      <!-- Review Modal -->
      <ReviewModal
        v-if="selectedSessionForReview"
        :is-open="showReviewModal"
        :companion-id="selectedSessionForReview.companionId"
        :companion-name="selectedSessionForReview.companionName"
        :user-id="currentUser?.id || ''"
        :chat-id="selectedSessionForReview.id"
        @success="handleReviewSuccess"
        @close="showReviewModal = false"
      />
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

.profile-main-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.profile-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.profile-form__group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.profile-form__buttons {
  display: flex;
  gap: 1rem;
  padding-top: 1rem;
}

.form-label {
  font-family: 'Inter', sans-serif;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-secondary);
  display: block;
}

.profile-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  font-family: 'Inter', sans-serif;
  font-size: var(--font-size-sm);
  color: var(--color-secondary);
  background-color: var(--color-white);
  transition: all var(--transition-fast);
}

.profile-input:focus {
  outline: none;
  ring: 2px;
  ring-color: rgba(255, 106, 47, 0.2);
  border-color: var(--color-primary);
}

.profile-input--disabled {
  opacity: 0.5;
  background-color: var(--color-light-bg);
  cursor: not-allowed;
}

.profile-display-field {
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  background-color: var(--color-light-bg);
  color: var(--color-secondary-70);
  font-family: 'Inter', sans-serif;
  font-size: var(--font-size-sm);
}

.profile-textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  font-family: 'Inter', sans-serif;
  font-size: var(--font-size-sm);
  color: var(--color-secondary);
  background-color: var(--color-white);
  resize: none;
  transition: all var(--transition-fast);
}

.profile-textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(255, 106, 47, 0.2);
}

.profile-textarea::placeholder {
  color: var(--color-secondary-60);
}

.profile-photo-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.profile-photo-preview {
  text-align: center;
}

.profile-photo-preview__image {
  width: 8rem;
  height: 8rem;
  border-radius: 9999px;
  object-fit: cover;
  border: 4px solid rgba(255, 106, 47, 0.2);
}

.profile-photo-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 8rem;
  height: 8rem;
  border-radius: 9999px;
  background-color: var(--color-light-bg);
  border: 4px dashed var(--color-border);
  font-size: 2rem;
}

.profile-photo-placeholder__icon {
  width: 2.5rem;
  height: 2.5rem;
  opacity: 0.6;
  color: var(--color-secondary);
}

.profile-file-input {
  display: block;
  cursor: pointer;
}

.profile-file-label {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  border-radius: 9999px;
  background-color: var(--color-primary);
  color: var(--color-white);
  font-family: 'Inter', sans-serif;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.profile-file-label:hover {
  background-color: rgba(255, 106, 47, 0.9);
}

.profile-topic--active {
  background-color: var(--color-primary) !important;
  color: var(--color-white) !important;
  box-shadow: var(--shadow-soft);
}

.profile-empty-state {
  background-color: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: 1.875rem;
  padding: 3rem 1.5rem;
  box-shadow: var(--shadow-card);
  text-align: center;
}

.profile-empty-state__icon {
  width: 5rem;
  height: 5rem;
  margin: 0 auto 1.5rem;
  color: rgba(93, 90, 136, 0.3);
}

.profile-empty-state__title {
  font-family: 'Inter', sans-serif;
  font-size: 1.25rem;
  font-weight: var(--font-weight-bold);
  color: var(--color-secondary);
  margin-bottom: 0.5rem;
}

.profile-empty-state__text {
  font-family: 'Inter', sans-serif;
  font-size: var(--font-size-sm);
  color: var(--color-secondary-60);
  margin-bottom: 1.5rem;
}

.profile-empty-state__link {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background-color: var(--color-primary);
  color: var(--color-white);
  border-radius: 9999px;
  text-decoration: none;
  font-weight: var(--font-weight-medium);
  transition: all var(--transition-fast);
}

.profile-empty-state__link:hover {
  background-color: rgba(255, 106, 47, 0.9);
}

.profile-chats-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.profile-chat-item {
  background-color: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  padding: 1rem;
  box-shadow: var(--shadow-card);
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all var(--transition-fast);
  gap: 1rem;
}

.profile-chat-item:hover {
  box-shadow: var(--shadow-hover);
  transform: translateY(-2px);
}

.profile-chat-item--blocked {
  opacity: 0.6;
}

.profile-chat-item--blocked:hover {
  box-shadow: var(--shadow-card);
  transform: none;
}

.profile-chat-item__main {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  min-width: 0;
}

.profile-chat-item__main--clickable {
  cursor: pointer;
}

.profile-chat-item__avatar-wrapper {
  position: relative;
  flex-shrink: 0;
}

.profile-chat-item__avatar {
  width: 4rem;
  height: 4rem;
  border-radius: 9999px;
  object-fit: cover;
}

.profile-chat-item__status {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 1rem;
  height: 1rem;
  border-radius: 9999px;
  border: 2px solid var(--color-white);
}

.profile-chat-item__status--active {
  background-color: var(--color-success);
}

.profile-chat-item__status--inactive {
  background-color: rgba(93, 90, 136, 0.3);
}

.profile-chat-item__info {
  flex: 1;
  min-width: 0;
}

.profile-chat-item__header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.profile-chat-item__name {
  font-family: 'Inter', sans-serif;
  font-weight: var(--font-weight-bold);
  color: var(--color-secondary);
}

.profile-chat-item__badge {
  font-family: 'Inter', sans-serif;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  margin-left: auto;
}

.profile-chat-item__badge--blocked {
  background-color: rgba(239, 68, 68, 0.1);
  color: var(--color-error);
}

.profile-chat-item__badge--unread {
  background-color: var(--color-primary);
  color: var(--color-white);
}

.profile-chat-item__message {
  font-family: 'Inter', sans-serif;
  font-size: var(--font-size-sm);
  color: var(--color-secondary-60);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.profile-chat-item__time {
  font-family: 'Inter', sans-serif;
  font-size: var(--font-size-xs);
  color: var(--color-secondary-50);
  margin-top: 0.25rem;
}

.profile-chat-item__arrow {
  width: 1.25rem;
  height: 1.25rem;
  color: var(--color-secondary-30);
  object-fit: contain;
  opacity: 0.3;
}

.profile-chat-item__actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  opacity: 0;
  transition: opacity var(--transition-fast);
  flex-shrink: 0;
}

.profile-chat-item:hover .profile-chat-item__actions {
  opacity: 1;
}

.profile-chat-item__action-btn {
  padding: 0.5rem;
  border-radius: 0.5rem;
  border: none;
  background-color: transparent;
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-chat-item__action-btn--unblock {
  color: var(--color-success);
}

.profile-chat-item__action-btn--unblock:hover {
  background-color: rgba(34, 197, 94, 0.1);
  color: var(--color-success);
}

.profile-chat-item__action-btn--delete {
  color: var(--color-error);
  font-size: 1.125rem;
}

.profile-chat-item__action-btn--delete:hover {
  background-color: rgba(239, 68, 68, 0.1);
}

.profile-chat-item__action-icon {
  width: 1.25rem;
  height: 1.25rem;
  stroke: currentColor;
}

.profile-history-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.profile-history-item {
  background-color: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: var(--shadow-card);
  transition: all var(--transition-fast);
}

.profile-history-item:hover {
  box-shadow: var(--shadow-hover);
  transform: translateY(-2px);
}

.profile-history-item__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.profile-history-item__info {
  flex: 1;
}

.profile-history-item__name {
  font-family: 'Inter', sans-serif;
  font-weight: var(--font-weight-bold);
  color: var(--color-secondary);
  margin-bottom: 0.25rem;
}

.profile-history-item__topic {
  font-family: 'Inter', sans-serif;
  font-size: var(--font-size-sm);
  color: var(--color-secondary-60);
}

.profile-history-item__date {
  text-align: right;
  flex-shrink: 0;
}

.profile-history-item__date-value {
  font-family: 'Inter', sans-serif;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-secondary);
}

.profile-history-item__duration {
  font-family: 'Inter', sans-serif;
  font-size: var(--font-size-xs);
  color: var(--color-secondary-60);
}

.profile-history-item__rating {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}

.profile-history-item__rating-label {
  font-family: 'Inter', sans-serif;
  font-size: var(--font-size-xs);
  color: var(--color-secondary-60);
}

.profile-history-item__stars {
  display: flex;
  gap: 0.25rem;
}

.profile-history-item__star {
  width: 1rem;
  height: 1rem;
  object-fit: contain;
}

.profile-empty-history {
  text-align: center;
  padding: 3rem 1.5rem;
  color: var(--color-secondary-60);
  font-family: 'Inter', sans-serif;
  font-size: var(--font-size-sm);
}

.profile-alert {
  padding: 1rem;
  border-radius: 1rem;
  font-family: 'Inter', sans-serif;
  font-size: var(--font-size-sm);
}

.profile-alert--error {
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: var(--color-error);
}

.profile-alert--success {
  background-color: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  color: var(--color-success);
}

.profile-settings__group {
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--color-border);
}

.profile-settings__subtitle {
  font-family: 'Inter', sans-serif;
  font-size: 1.125rem;
  font-weight: var(--font-weight-semibold);
  color: var(--color-secondary);
  margin-bottom: 1rem;
}

.profile-settings__options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.profile-settings__option {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  cursor: pointer;
}

.profile-settings__checkbox {
  width: 1.25rem;
  height: 1.25rem;
  margin-top: 0.25rem;
  accent-color: var(--color-primary);
  cursor: pointer;
  flex-shrink: 0;
}

.profile-settings__content {
  flex: 1;
}

.profile-settings__label {
  display: block;
  font-family: 'Inter', sans-serif;
  color: var(--color-secondary-70);
  font-weight: var(--font-weight-medium);
  margin-bottom: 0.25rem;
}

.profile-settings__description {
  font-family: 'Inter', sans-serif;
  font-size: var(--font-size-xs);
  color: var(--color-secondary-50);
  margin: 0;
}

.profile-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  text-align: center;
}

.profile-loading__text {
  font-family: 'Inter', sans-serif;
  font-size: var(--font-size-sm);
  color: var(--color-secondary-60);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.profile-card__avatar-wrapper {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 0 auto 1rem;
  border-radius: 9999px;
  overflow: hidden;
  background: linear-gradient(135deg, #f3e7f5 0%, #e0f2fe 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-card__avatar-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.profile-card__avatar-icon {
  width: 60px;
  height: 60px;
  opacity: 0.6;
}

.profile-chat-item__avatar-wrapper {
  position: relative;
  flex-shrink: 0;
  width: 4rem;
  height: 4rem;
  border-radius: 9999px;
  overflow: hidden;
  background: linear-gradient(135deg, #f3e7f5 0%, #e0f2fe 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-chat-item__avatar-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.profile-chat-item__avatar-icon {
  width: 24px;
  height: 24px;
  opacity: 0.6;
}

/* Reviews Section Styles */
.profile-reviews-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.profile-review-item {
  padding: 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  transition: box-shadow 0.2s;
}

.profile-review-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.profile-review-item__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.profile-review-item__companion-info {
  display: flex;
  gap: 12px;
  flex: 1;
}

.profile-review-item__companion-image {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.profile-review-item__companion-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.profile-review-item__companion-name {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.profile-review-item__date {
  font-size: 12px;
  color: #999;
  margin: 0;
}

.profile-review-item__anonymous {
  font-size: 12px;
  color: #666;
  margin: 0;
  display: flex;
  align-items: center;
}

.profile-review-item__rating {
  display: flex;
  gap: 2px;
}

.profile-review-item__star {
  font-size: 16px;
  color: #ffc107;
  display: inline-block;
}

.profile-review-item__star--empty {
  color: #e0e0e0;
}

.profile-review-item__title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin: 8px 0;
}

.profile-review-item__comment {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
  margin: 0 0 12px 0;
}

.profile-review-item__actions {
  display: flex;
  gap: 8px;
}

.profile-review-item__delete-btn {
  padding: 6px 12px;
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 4px;
  color: #c33;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.profile-review-item__delete-btn:hover {
  background: #fdd;
  border-color: #fbb;
}

.profile-empty-reviews {
  padding: 32px 16px;
  text-align: center;
  color: #999;
}

.profile-empty-reviews__hint {
  font-size: 13px;
  color: #bbb;
  margin-top: 8px;
}

.reviews-loading {
  padding: 32px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: #999;
}

.reviews-loading__spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #f0f0f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.profile-history-item__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.profile-history-item__review-btn {
  padding: 8px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.profile-history-item__review-btn:hover {
  background: #2563eb;
}
</style>
