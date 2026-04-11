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

  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId)

  if (!error) {
    successMessage.value = 'Пользователь удален'
    await loadUsers()
    setTimeout(() => (successMessage.value = ''), 3000)
  }
}

const handleToggleCompanionStatus = async (companionId: string | number, isAvailable: boolean) => {
  const { error } = await supabase
    .from('companions')
    .update({ is_available: !isAvailable })
    .eq('id', companionId)

  if (!error) {
    successMessage.value = 'Статус обновлен'
    await loadCompanions()
    setTimeout(() => (successMessage.value = ''), 3000)
  }
}

const handleDeleteReview = async (reviewId: string | number) => {
  if (!confirm('Удалить этот отзыв?')) return

  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', reviewId)

  if (!error) {
    successMessage.value = 'Отзыв удален'
    await loadReviews()
    setTimeout(() => (successMessage.value = ''), 3000)
  }
}

const navigate = (path: string) => {
  router.push(path)
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-white to-light-bg pt-[140px] pb-16">
    <div class="container mx-auto px-4 lg:px-8 max-w-7xl">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <h1 class="text-4xl font-bold text-secondary">🛡️ Админ Панель</h1>
        <button
          @click="navigate('/profile')"
          class="px-6 py-2 text-secondary font-semibold border-2 border-border rounded-full hover:border-primary hover:text-primary transition-all"
        >
          Вернуться
        </button>
      </div>

      <!-- Success Message -->
      <transition name="fade">
        <div
          v-if="successMessage"
          class="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm"
        >
          {{ successMessage }}
        </div>
      </transition>

      <!-- Stats -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div class="bg-white border border-border/50 rounded-2xl p-6 shadow-card">
          <div class="text-2xl font-bold text-primary">{{ stats.totalUsers }}</div>
          <p class="text-secondary/60 text-sm mt-2">Пользователей</p>
        </div>
        <div class="bg-white border border-border/50 rounded-2xl p-6 shadow-card">
          <div class="text-2xl font-bold text-primary">{{ stats.totalCompanions }}</div>
          <p class="text-secondary/60 text-sm mt-2">Консультантов</p>
        </div>
        <div class="bg-white border border-border/50 rounded-2xl p-6 shadow-card">
          <div class="text-2xl font-bold text-primary">{{ stats.totalChats }}</div>
          <p class="text-secondary/60 text-sm mt-2">Всего чатов</p>
        </div>
        <div class="bg-white border border-border/50 rounded-2xl p-6 shadow-card">
          <div class="text-2xl font-bold text-primary">{{ stats.activeChats }}</div>
          <p class="text-secondary/60 text-sm mt-2">Активных чатов</p>
        </div>
        <div class="bg-white border border-border/50 rounded-2xl p-6 shadow-card">
          <div class="text-2xl font-bold text-primary">{{ stats.totalReviews }}</div>
          <p class="text-secondary/60 text-sm mt-2">Отзывов</p>
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex gap-2 mb-6 border-b border-border">
        <button
          @click="activeTab = 'overview'"
          :class="[
            'px-6 py-3 font-semibold border-b-2 transition-all',
            activeTab === 'overview'
              ? 'border-primary text-primary'
              : 'border-transparent text-secondary/60 hover:text-secondary'
          ]"
        >
          📊 Обзор
        </button>
        <button
          @click="activeTab = 'users'"
          :class="[
            'px-6 py-3 font-semibold border-b-2 transition-all',
            activeTab === 'users'
              ? 'border-primary text-primary'
              : 'border-transparent text-secondary/60 hover:text-secondary'
          ]"
        >
          👥 Пользователи
        </button>
        <button
          @click="activeTab = 'companions'"
          :class="[
            'px-6 py-3 font-semibold border-b-2 transition-all',
            activeTab === 'companions'
              ? 'border-primary text-primary'
              : 'border-transparent text-secondary/60 hover:text-secondary'
          ]"
        >
          🎯 Консультанты
        </button>
        <button
          @click="activeTab = 'reviews'"
          :class="[
            'px-6 py-3 font-semibold border-b-2 transition-all',
            activeTab === 'reviews'
              ? 'border-primary text-primary'
              : 'border-transparent text-secondary/60 hover:text-secondary'
          ]"
        >
          ⭐ Отзывы
        </button>
        <button
          @click="activeTab = 'chats'"
          :class="[
            'px-6 py-3 font-semibold border-b-2 transition-all',
            activeTab === 'chats'
              ? 'border-primary text-primary'
              : 'border-transparent text-secondary/60 hover:text-secondary'
          ]"
        >
          💬 Чаты
        </button>
      </div>

      <!-- Overview Tab -->
      <div v-if="activeTab === 'overview'" class="space-y-6">
        <div class="bg-white border border-border/50 rounded-3xl p-8 shadow-card">
          <h2 class="text-2xl font-bold text-secondary mb-6">Добро пожаловать, Администратор!</h2>
          <div class="space-y-4 text-secondary/70">
            <p>📊 На этой панели вы можете управлять:</p>
            <ul class="list-disc list-inside space-y-2">
              <li><strong>Пользователи</strong> - просмотр, управление и удаление профилей</li>
              <li><strong>Консультанты</strong> - управление статусом доступности и информацией</li>
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

        <div v-else-if="users.length > 0" class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-border">
                <th class="text-left px-4 py-3 font-semibold text-secondary">ID</th>
                <th class="text-left px-4 py-3 font-semibold text-secondary">Имя</th>
                <th class="text-left px-4 py-3 font-semibold text-secondary">Email</th>
                <th class="text-left px-4 py-3 font-semibold text-secondary">Роль</th>
                <th class="text-left px-4 py-3 font-semibold text-secondary">Дата</th>
                <th class="text-left px-4 py-3 font-semibold text-secondary">Действия</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in users" :key="user.id" class="border-b border-border/50 hover:bg-light-bg">
                <td class="px-4 py-3 text-secondary text-sm">{{ user.id }}</td>
                <td class="px-4 py-3 text-secondary font-medium">{{ user.name }}</td>
                <td class="px-4 py-3 text-secondary text-sm">{{ user.email }}</td>
                <td class="px-4 py-3">
                  <span
                    :class="[
                      'px-3 py-1 rounded-full text-xs font-semibold',
                      user.role === 'admin'
                        ? 'bg-primary/20 text-primary'
                        : 'bg-secondary/10 text-secondary'
                    ]"
                  >
                    {{ user.role === 'admin' ? '🛡️ Админ' : '👤 Пользователь' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-secondary text-sm">
                  {{ new Date(user.created_at).toLocaleDateString('ru-RU') }}
                </td>
                <td class="px-4 py-3">
                  <button
                    v-if="user.role !== 'admin'"
                    @click="handleDeleteUser(user.id)"
                    class="px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    Удалить
                  </button>
                  <span v-else class="text-secondary/50 text-xs">Защищен</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="text-center py-12 text-secondary/60">
          Пользователей не найдено
        </div>
      </div>

      <!-- Companions Tab -->
      <div v-if="activeTab === 'companions'" class="space-y-4">
        <h2 class="text-2xl font-bold text-secondary mb-6">Консультанты ({{ companions.length }})</h2>

        <div v-if="isLoading" class="text-center py-12 text-secondary/60">
          Загрузка...
        </div>

        <div v-else-if="companions.length > 0" class="grid gap-4">
          <div
            v-for="companion in companions"
            :key="companion.id"
            class="bg-white border border-border/50 rounded-2xl p-6 shadow-card hover:shadow-hover transition-all"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1">
                <h3 class="text-lg font-bold text-secondary mb-2">{{ companion.name }}</h3>
                <p class="text-secondary/60 text-sm mb-3">{{ companion.specialization }}</p>
                <div class="flex items-center gap-4 text-sm text-secondary/60">
                  <span>⭐ {{ companion.rating }}/5</span>
                  <span>📝 {{ companion.reviews }} отзывов</span>
                  <span>💰 {{ companion.price_per_hour }}₽/час</span>
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
          Консультантов не найдено
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
                    <svg
                      v-for="i in 5"
                      :key="i"
                      :class="[
                        'w-4 h-4',
                        i <= review.rating ? 'text-primary' : 'text-secondary/20'
                      ]"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                      />
                    </svg>
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

        <div v-else-if="chats.length > 0" class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-border">
                <th class="text-left px-4 py-3 font-semibold text-secondary">ID</th>
                <th class="text-left px-4 py-3 font-semibold text-secondary">Пользователь</th>
                <th class="text-left px-4 py-3 font-semibold text-secondary">Консультант</th>
                <th class="text-left px-4 py-3 font-semibold text-secondary">Статус</th>
                <th class="text-left px-4 py-3 font-semibold text-secondary">Сообщений</th>
                <th class="text-left px-4 py-3 font-semibold text-secondary">Дата</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="chat in chats" :key="chat.id" class="border-b border-border/50 hover:bg-light-bg">
                <td class="px-4 py-3 text-secondary text-sm">{{ chat.id }}</td>
                <td class="px-4 py-3 text-secondary text-sm">{{ chat.user_id }}</td>
                <td class="px-4 py-3 text-secondary text-sm">{{ chat.companion_id }}</td>
                <td class="px-4 py-3">
                  <span
                    :class="[
                      'px-3 py-1 rounded-full text-xs font-semibold',
                      chat.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-secondary/10 text-secondary'
                    ]"
                  >
                    {{ chat.status === 'active' ? '✓ Активен' : 'Завершен' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-secondary text-sm">{{ chat.total_messages }}</td>
                <td class="px-4 py-3 text-secondary text-sm">
                  {{ new Date(chat.created_at).toLocaleDateString('ru-RU') }}
                </td>
              </tr>
            </tbody>
          </table>
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
