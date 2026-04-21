<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { currentUser, isAdmin } from '../composables/useAppState'
import { supabase } from '@/utils/supabase'

const router = useRouter()
const activeTab = ref('overview')
const users = ref<any[]>([])
const companions = ref<any[]>([])
const reviews = ref<any[]>([])
const chats = ref<any[]>([])
const isLoading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

// Check admin access
onMounted(async () => {
  if (!isAdmin()) {
    router.push('/')
    return
  }
  await loadDashboardData()
})

const loadDashboardData = async () => {
  try {
    isLoading.value = true
    await Promise.all([loadUsers(), loadCompanions(), loadReviews(), loadChats()])
  } finally {
    isLoading.value = false
  }
}

const loadUsers = async () => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })

  if (!error) {
    users.value = data || []
  }
}

const loadCompanions = async () => {
  const { data, error } = await supabase
    .from('companions')
    .select('*')
    .order('created_at', { ascending: false })

  if (!error) {
    companions.value = data || []
  }
}

const loadReviews = async () => {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .order('created_at', { ascending: false })

  if (!error) {
    reviews.value = data || []
  }
}

const loadChats = async () => {
  const { data, error } = await supabase
    .from('chats')
    .select('*')
    .order('created_at', { ascending: false })

  if (!error) {
    chats.value = data || []
  }
}

// Stats
const stats = computed(() => ({
  totalUsers: users.value.length,
  totalCompanions: companions.value.length,
  totalChats: chats.value.length,
  totalReviews: reviews.value.length,
  activeChats: chats.value.filter((c: any) => c.status === 'active').length,
}))

const handleDeleteUser = async (userId: string | number) => {
  if (!confirm('Вы уверены? Это удалит пользователя и все его данные.')) return

  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)

    if (error) throw error

    successMessage.value = 'Пользователь удален ✓'
    await loadUsers()
    setTimeout(() => (successMessage.value = ''), 3000)
  } catch (err) {
    errorMessage.value = `Ошибка при удалении: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`
    setTimeout(() => (errorMessage.value = ''), 3000)
  }
}

const handleToggleCompanionStatus = async (companionId: string | number, isAvailable: boolean) => {
  try {
    const { error } = await supabase
      .from('companions')
      .update({ is_available: !isAvailable })
      .eq('id', companionId)

    if (error) throw error

    successMessage.value = `Статус изменен на "${!isAvailable ? 'Доступен' : 'Недоступен'}" ✓`
    await loadCompanions()
    setTimeout(() => (successMessage.value = ''), 3000)
  } catch (err) {
    errorMessage.value = `Ошибка при обновлении: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`
    setTimeout(() => (errorMessage.value = ''), 3000)
  }
}

const handleToggleAdminStatus = async (userId: string | number, currentRole: string) => {
  try {
    const newRole = currentRole === 'admin' ? 'user' : 'admin'
    const { error } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', userId)

    if (error) throw error

    successMessage.value = `Роль изменена на "${newRole === 'admin' ? 'Администратор' : 'Пользователь'}" ✓`
    await loadUsers()
    setTimeout(() => (successMessage.value = ''), 3000)
  } catch (err) {
    errorMessage.value = `Ошибка при изменении роли: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`
    setTimeout(() => (errorMessage.value = ''), 3000)
  }
}

const handleDeleteReview = async (reviewId: string | number) => {
  if (!confirm('Удалить этот отзыв?')) return

  try {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId)

    if (error) throw error

    successMessage.value = 'Отзыв удален ✓'
    await loadReviews()
    setTimeout(() => (successMessage.value = ''), 3000)
  } catch (err) {
    errorMessage.value = `Ошибка при удалении: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`
    setTimeout(() => (errorMessage.value = ''), 3000)
  }
}

const navigate = (path: string) => {
  router.push(path)
}
</script>

<template>
  <div class="layout-page">
    <div class="layout-container">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center justify-between mb-6">
          <div>
            <div class="flex items-center gap-3 mb-2">
              <img src="../images/shield-tick.svg" alt="Admin" class="w-10 h-10 object-contain" />
              <h1 class="text-4xl font-bold text-secondary">Админ Панель</h1>
            </div>
            <p class="text-secondary/60">Управление платформой и данными пользователей</p>
          </div>
          <button
            @click="navigate('/profile')"
            class="px-6 py-2 text-secondary font-semibold border-2 border-border rounded-full hover:border-primary hover:text-primary transition-all"
          >
            ← Вернуться
          </button>
        </div>
      </div>

      <!-- Messages -->
      <transition name="fade">
        <div
          v-if="successMessage"
          class="alert-success-row"
        >
          <span>✅</span>
          <span>{{ successMessage }}</span>
        </div>
      </transition>
      <transition name="fade">
        <div
          v-if="errorMessage"
          class="alert-error-row"
        >
          <span>❌</span>
          <span>{{ errorMessage }}</span>
        </div>
      </transition>

      <!-- Stats -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div class="bg-white border border-border/50 rounded-2xl p-6 shadow-card hover:shadow-hover transition-all group">
          <div class="flex items-center justify-between mb-2">
            <div class="text-2xl font-bold text-primary">{{ stats.totalUsers }}</div>
            <img src="../images/user.svg" alt="Users" class="w-6 h-6 object-contain opacity-30 group-hover:opacity-100 transition-opacity" />
          </div>
          <p class="text-secondary/60 text-sm">Пользователей</p>
        </div>
        <div class="bg-white border border-border/50 rounded-2xl p-6 shadow-card hover:shadow-hover transition-all group">
          <div class="flex items-center justify-between mb-2">
            <div class="text-2xl font-bold text-primary">{{ stats.totalCompanions }}</div>
            <img src="../images/user-story.svg" alt="Companions" class="w-6 h-6 object-contain opacity-30 group-hover:opacity-100 transition-opacity" />
          </div>
          <p class="text-secondary/60 text-sm">Спутников</p>
        </div>
        <div class="bg-white border border-border/50 rounded-2xl p-6 shadow-card hover:shadow-hover transition-all group">
          <div class="flex items-center justify-between mb-2">
            <div class="text-2xl font-bold text-primary">{{ stats.totalChats }}</div>
            <img src="../images/message-add-alt.svg" alt="Chats" class="w-6 h-6 object-contain opacity-30 group-hover:opacity-100 transition-opacity" />
          </div>
          <p class="text-secondary/60 text-sm">Всего чатов</p>
        </div>
        <div class="bg-white border border-border/50 rounded-2xl p-6 shadow-card hover:shadow-hover transition-all group">
          <div class="flex items-center justify-between mb-2">
            <div class="text-2xl font-bold text-green-600">{{ stats.activeChats }}</div>
            <img src="../images/shield-tick.svg" alt="Active" class="w-6 h-6 object-contain opacity-30 group-hover:opacity-100 transition-opacity" />
          </div>
          <p class="text-secondary/60 text-sm">Активных чатов</p>
        </div>
        <div class="bg-white border border-border/50 rounded-2xl p-6 shadow-card hover:shadow-hover transition-all group">
          <div class="flex items-center justify-between mb-2">
            <div class="text-2xl font-bold text-primary">{{ stats.totalReviews }}</div>
            <img src="../images/smile.svg" alt="Reviews" class="w-6 h-6 object-contain opacity-30 group-hover:opacity-100 transition-opacity" />
          </div>
          <p class="text-secondary/60 text-sm">Отзывов</p>
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex gap-2 mb-8 overflow-x-auto pb-2 border-b border-border">
        <button
          @click="activeTab = 'overview'"
          :class="[
            'px-6 py-3 font-semibold border-b-2 transition-all whitespace-nowrap',
            activeTab === 'overview'
              ? 'border-primary text-primary'
              : 'border-transparent text-secondary/60 hover:text-secondary'
          ]"
        >
          <img src="../images/shield-tick.svg" alt="Overview" class="w-5 h-5 inline mr-2 object-contain" />
          Обзор
        </button>
        <button
          @click="activeTab = 'users'"
          :class="[
            'px-6 py-3 font-semibold border-b-2 transition-all whitespace-nowrap',
            activeTab === 'users'
              ? 'border-primary text-primary'
              : 'border-transparent text-secondary/60 hover:text-secondary'
          ]"
        >
          <img src="../images/user.svg" alt="Users" class="w-5 h-5 inline mr-2 object-contain" />
          Пользователи ({{ users.length }})
        </button>
        <button
          @click="activeTab = 'companions'"
          :class="[
            'px-6 py-3 font-semibold border-b-2 transition-all whitespace-nowrap',
            activeTab === 'companions'
              ? 'border-primary text-primary'
              : 'border-transparent text-secondary/60 hover:text-secondary'
          ]"
        >
          <img src="../images/user-story.svg" alt="Companions" class="w-5 h-5 inline mr-2 object-contain" />
          Спутники ({{ companions.length }})
        </button>
        <button
          @click="activeTab = 'reviews'"
          :class="[
            'px-6 py-3 font-semibold border-b-2 transition-all whitespace-nowrap',
            activeTab === 'reviews'
              ? 'border-primary text-primary'
              : 'border-transparent text-secondary/60 hover:text-secondary'
          ]"
        >
          <img src="../images/smile.svg" alt="Reviews" class="w-5 h-5 inline mr-2 object-contain" />
          Отзывы ({{ reviews.length }})
        </button>
        <button
          @click="activeTab = 'chats'"
          :class="[
            'px-6 py-3 font-semibold border-b-2 transition-all whitespace-nowrap',
            activeTab === 'chats'
              ? 'border-primary text-primary'
              : 'border-transparent text-secondary/60 hover:text-secondary'
          ]"
        >
          <img src="../images/message-add-alt.svg" alt="Chats" class="w-5 h-5 inline mr-2 object-contain" />
          Чаты ({{ chats.length }})
        </button>
      </div>

      <!-- Overview Tab -->
      <div v-if="activeTab === 'overview'" class="space-y-6">
        <div class="card">
          <h2 class="text-2xl font-bold text-secondary mb-6">Добро пожаловать, Администратор!</h2>
          <div class="space-y-4 text-secondary/70">
            <p><img src="../images/shield-tick.svg" alt="Overview" class="w-5 h-5 inline mr-2 object-contain" />На этой панели вы можете управлять:</p>
            <ul class="list-disc list-inside space-y-2">
              <li><strong>Пользователи</strong> - просмотр, управление и удаление профилей</li>
              <li><strong>Спутники</strong> - управление статусом доступности и информацией</li>
              <li><strong>Отзывы</strong> - модерация отзывов пользователей</li>
              <li><strong>Чаты</strong> - просмотр истории коммуникации</li>
            </ul>
            <p class="mt-6 pt-6 border-t border-border/50">
              Используйте табы выше для переключения между разделами.
            </p>
          </div>
        </div>
      </div>

      <!-- Users Tab -->
      <div v-if="activeTab === 'users'" class="space-y-4">
        <h2 class="text-2xl font-bold text-secondary mb-6">Пользователи ({{ users.length }})</h2>

        <div v-if="isLoading" class="text-center py-12 text-secondary/60">
          Загрузка...
        </div>

        <div v-else-if="users.length > 0" class="card-table">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-border bg-light-bg">
                  <th class="table-th">ID</th>
                  <th class="table-th">Имя</th>
                  <th class="table-th">Email</th>
                  <th class="table-th">Роль</th>
                  <th class="table-th">Дата</th>
                  <th class="table-th">Действия</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in users" :key="user.id" class="table-tr">
                  <td class="px-4 py-4 text-secondary text-sm">{{ user.id }}</td>
                  <td class="px-4 py-4 text-secondary font-medium">{{ user.name }}</td>
                  <td class="px-4 py-4 text-secondary text-sm">{{ user.email }}</td>
                  <td class="px-4 py-4">
                    <span
                      :class="[
                        'px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1',
                        user.role === 'admin'
                          ? 'bg-primary/20 text-primary'
                          : 'bg-secondary/10 text-secondary'
                      ]"
                    >
                      {{ user.role === 'admin' ? 'Администратор' : 'Пользователь' }}
                    </span>
                  </td>
                  <td class="px-4 py-4 text-secondary text-sm">
                    {{ new Date(user.created_at).toLocaleDateString('ru-RU') }}
                  </td>
                  <td class="px-4 py-4 space-x-2">
                    <button
                      @click="handleToggleAdminStatus(user.id, user.role)"
                      :class="[
                        'px-3 py-1.5 text-xs font-semibold rounded transition-colors',
                        user.role === 'admin'
                          ? 'text-orange-600 hover:bg-orange-50'
                          : 'text-green-600 hover:bg-green-50'
                      ]"
                    >
                      {{ user.role === 'admin' ? 'Убрать' : 'Админ' }}
                    </button>
                    <button
                      v-if="user.role !== 'admin'"
                      @click="handleDeleteUser(user.id)"
                      class="px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      Удалить
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-else class="text-center py-12 text-secondary/60">
          Пользователей не найдено
        </div>
      </div>

      <!-- Companions Tab -->
      <div v-if="activeTab === 'companions'" class="space-y-4">
        <h2 class="text-2xl font-bold text-secondary mb-6">Спутники ({{ companions.length }})</h2>

        <div v-if="isLoading" class="text-center py-12 text-secondary/60">
          Загрузка...
        </div>

        <div v-else-if="companions.length > 0" class="grid gap-4">
          <div
            v-for="companion in companions"
            :key="companion.id"
            class="card-surface"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1">
                <h3 class="text-lg font-bold text-secondary mb-2">{{ companion.name }}</h3>
                <p class="text-secondary/60 text-sm mb-3">{{ companion.experience }}</p>
                <div class="flex items-center gap-4 text-sm text-secondary/60">
                  <span class="inline-flex items-center gap-1.5">
                    <img src="../images/heart.svg" alt="Thanks" class="w-4 h-4 object-contain" />
                    {{ companion.reviews_count }} благодарностей
                  </span>
                </div>
              </div>
              <button
                @click="handleToggleCompanionStatus(companion.id, companion.is_available)"
                :class="[
                  'px-4 py-2 rounded-full font-semibold text-xs whitespace-nowrap transition-all',
                  companion.is_available
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                ]"
              >
                {{ companion.is_available ? '✓ Доступен' : '✗ Недоступен' }}
              </button>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-12 text-secondary/60">
          Спутников не найдено
        </div>
      </div>

      <!-- Reviews Tab -->
      <div v-if="activeTab === 'reviews'" class="space-y-4">
        <h2 class="text-2xl font-bold text-secondary mb-6">Отзывы ({{ reviews.length }})</h2>

        <div v-if="isLoading" class="text-center py-12 text-secondary/60">
          Загрузка...
        </div>

        <div v-else-if="reviews.length > 0" class="grid gap-4">
          <div
            v-for="review in reviews"
            :key="review.id"
            class="bg-white border border-border/50 rounded-2xl p-6 shadow-card"
          >
            <div class="flex items-start justify-between gap-4 mb-4">
              <div>
                <div class="flex items-center gap-2 mb-2">
                  <div class="flex gap-0.5">
                    <img
                      v-for="starIndex in 5"
                      :key="starIndex"
                      src="../images/smile.svg"
                      :alt="`Star ${starIndex}`"
                      :class="[
                        'w-4 h-4 object-contain',
                        starIndex <= review.rating ? 'opacity-100' : 'opacity-20'
                      ]"
                    />
                  </div>
                  <span class="text-sm font-semibold text-secondary">{{ review.title }}</span>
                </div>
                <p class="text-secondary/60 text-sm">{{ review.comment }}</p>
              </div>
              <button
                @click="handleDeleteReview(review.id)"
                class="px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 rounded transition-colors whitespace-nowrap"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-12 text-secondary/60">
          Отзывов не найдено
        </div>
      </div>

      <!-- Chats Tab -->
      <div v-if="activeTab === 'chats'" class="space-y-4">
        <h2 class="text-2xl font-bold text-secondary mb-6">Чаты ({{ chats.length }})</h2>

        <div v-if="isLoading" class="text-center py-12 text-secondary/60">
          Загрузка...
        </div>

        <div v-else-if="chats.length > 0" class="card-table">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-border bg-light-bg">
                  <th class="table-th">ID</th>
                  <th class="table-th">Пользователь</th>
                  <th class="table-th">Консультант</th>
                  <th class="table-th">Статус</th>
                  <th class="table-th">Сообщений</th>
                  <th class="table-th">Дата</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="chat in chats" :key="chat.id" class="table-tr">
                  <td class="px-4 py-4 text-secondary text-sm">{{ chat.id }}</td>
                  <td class="px-4 py-4 text-secondary text-sm">{{ chat.user_id }}</td>
                  <td class="px-4 py-4 text-secondary text-sm">{{ chat.companion_id }}</td>
                  <td class="px-4 py-4">
                    <span
                      :class="[
                        'px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1',
                        chat.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-secondary/10 text-secondary'
                      ]"
                    >
                      {{ chat.status === 'active' ? '✓ Активен' : '✗ Завершен' }}
                    </span>
                  </td>
                  <td class="px-4 py-4 text-secondary text-sm">{{ chat.total_messages || 0 }}</td>
                  <td class="px-4 py-4 text-secondary text-sm">
                    {{ new Date(chat.created_at).toLocaleDateString('ru-RU') }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-else class="text-center py-12 text-secondary/60">
          Чатов не найдено
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
