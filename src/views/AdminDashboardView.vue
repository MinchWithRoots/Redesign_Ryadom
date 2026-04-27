<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { currentUser, isAdmin, companions, loadCompanions } from '../composables/useAppState'
import { supabase } from '@/utils/supabase'
import { getGenderInRussian } from '@/utils/genderForm'

const router = useRouter()
const activeTab = ref('overview')
const users = ref<any[]>([])
const companions = ref<any[]>([])
const reviews = ref<any[]>([])
const chats = ref<any[]>([])
const applications = ref<any[]>([])
const rejectionReasons = ref<{ [key: string]: string }>({})
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
    await Promise.all([loadUsers(), loadCompanions(), loadReviews(), loadChats(), loadApplications()])
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

const loadApplications = async () => {
  const { data, error } = await supabase
    .from('companion_applications')
    .select('*, users (name, email)')
    .order('created_at', { ascending: false })

  if (!error) {
    applications.value = data || []
  }
}

// Stats
const stats = computed(() => ({
  totalUsers: users.value.length,
  totalCompanions: companions.value.length,
  totalChats: chats.value.length,
  totalReviews: reviews.value.length,
  activeChats: chats.value.filter((c: any) => c.status === 'active').length,
  pendingApplications: applications.value.filter((a: any) => a.status === 'pending').length,
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

const handleApproveApplication = async (applicationId: string | number) => {
  try {
    // Get the application data
    const app = applications.value.find((a: any) => a.id === applicationId)
    if (!app) throw new Error('Application not found')

    console.log('Approving application:', {
      id: app.id,
      name: app.name,
      age: app.age,
      gender: app.gender,
      experience: app.experience,
      topics: app.topics,
      bio: app.bio?.substring(0, 50),
    })

    // Validate required fields
    if (!app.name || !app.age || !app.gender || !app.experience || !app.bio) {
      throw new Error('Missing required fields in application')
    }

    // Handle image field - use provided image or default
    // Images from profile uploads are now URLs (from Supabase Storage) instead of base64
    const imageUrl = app.image || 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg'

    console.log('Using image URL:', {
      appImage: app.image?.substring(0, 50),
      imageUrl: imageUrl.substring(0, 50),
      length: imageUrl.length
    })

    // Prepare companion data
    const companionData = {
      name: app.name,
      age: app.age,
      gender: app.gender,
      experience: app.experience,
      bio: app.bio,
      image: imageUrl,
      topics: app.topics || [],
      is_available: true,
      user_id: app.user_id, // Link companion to user
    }

    console.log('Inserting companion with data:', companionData)

    // Create a new companion from the application
    const { data: companionInsertData, error: companionError } = await supabase
      .from('companions')
      .insert([companionData])
      .select()
      .single()

    if (companionError) {
      console.error('Companion insert error details:', {
        message: companionError.message,
        code: companionError.code,
        hint: companionError.hint,
        details: (companionError as any).details,
      })

      // Check if the error is about missing is_available column
      const isColumnMissingError = companionError.message?.includes('is_available') ||
                                   companionError.code === 'PGRST204' ||
                                   companionError.hint?.includes('is_available')

      if (isColumnMissingError) {
        throw new Error(`Ошибка: Столбец 'is_available' отсутствует в таблице companions. Необходимо применить миграцию в Supabase Dashboard. Откройте SQL Editor и выполните команду: ALTER TABLE public.companions ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true;`)
      }

      throw new Error(`Failed to create companion: ${companionError.message}${companionError.hint ? ' - ' + companionError.hint : ''}`)
    }

    if (!companionInsertData) {
      throw new Error('No companion data returned after insert')
    }

    console.log('Companion created successfully:', companionInsertData)

    // Update the application status
    const { error: updateAppError } = await supabase
      .from('companion_applications')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
      })
      .eq('id', applicationId)

    if (updateAppError) {
      console.error('Application update error:', updateAppError.message)
      throw new Error(`Failed to update application status: ${updateAppError.message}`)
    }

    // CRITICAL: Change user role from 'user' to 'companion'
    console.log('Changing user role to companion for user:', app.user_id)
    const { error: updateUserRoleError } = await supabase
      .from('users')
      .update({ role: 'companion' })
      .eq('id', app.user_id)

    if (updateUserRoleError) {
      console.error('User role update error:', updateUserRoleError.message)
      throw new Error(`Failed to update user role to companion: ${updateUserRoleError.message}`)
    }

    console.log('User role changed to companion successfully')

    successMessage.value = `Заявка одобрена! ${app.name} добавлена в качестве спутника ✓`

    // Reload both applications and companions lists to reflect changes globally
    // This is critical: loadCompanions() updates the global companions ref so new companion appears everywhere
    await Promise.all([
      loadApplications(),
      loadCompanions()
    ])
    setTimeout(() => (successMessage.value = ''), 3000)
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Неизвестная ошибка'
    console.error('Full approval error:', err)
    errorMessage.value = `Ошибка при одобрении: ${errorMsg}`
    setTimeout(() => (errorMessage.value = ''), 5000)
  }
}

const handleRejectApplication = async (applicationId: string | number) => {
  const reason = rejectionReasons.value[applicationId]
  if (!reason || reason.trim().length === 0) {
    errorMessage.value = 'Пожалуйста, укажите причину отклонения'
    setTimeout(() => (errorMessage.value = ''), 3000)
    return
  }

  if (!confirm(`Отклонить заявку с причиной: "${reason}"?`)) return

  try {
    const { error } = await supabase
      .from('companion_applications')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        rejected_at: new Date().toISOString(),
      })
      .eq('id', applicationId)

    if (error) throw error

    delete rejectionReasons.value[applicationId]
    successMessage.value = 'Заявка отклонена ✓'
    await loadApplications()
    setTimeout(() => (successMessage.value = ''), 3000)
  } catch (err) {
    errorMessage.value = `Ошибка при отклонении: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`
    setTimeout(() => (errorMessage.value = ''), 3000)
  }
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
        <button
          @click="activeTab = 'applications'"
          :class="[
            'px-6 py-3 font-semibold border-b-2 transition-all whitespace-nowrap',
            activeTab === 'applications'
              ? 'border-primary text-primary'
              : 'border-transparent text-secondary/60 hover:text-secondary'
          ]"
        >
          <img src="../images/send.svg" alt="Applications" class="w-5 h-5 inline mr-2 object-contain" />
          Заявки <span v-if="stats.pendingApplications > 0" class="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full font-bold">{{ stats.pendingApplications }}</span>
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

      <!-- Applications Tab -->
      <div v-if="activeTab === 'applications'" class="space-y-4">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold text-secondary">Заявки на становление спутником ({{ applications.length }})</h2>
          <div class="text-sm text-secondary/60">
            <span class="font-semibold text-orange-600">{{ stats.pendingApplications }}</span> ожидают рассмотрения
          </div>
        </div>

        <div v-if="isLoading" class="text-center py-12 text-secondary/60">
          Загрузка...
        </div>

        <div v-else-if="applications.length > 0" class="grid gap-6">
          <div
            v-for="app in applications"
            :key="app.id"
            :class="[
              'card-surface border-l-4',
              app.status === 'pending' ? 'border-l-orange-500 bg-orange-50/30' :
              app.status === 'approved' ? 'border-l-green-500 bg-green-50/30' :
              'border-l-red-500 bg-red-50/30'
            ]"
          >
            <div class="mb-4">
              <div class="flex items-start justify-between mb-4">
                <div class="flex-1">
                  <div class="flex items-center gap-3 mb-2">
                    <h3 class="text-lg font-bold text-secondary">{{ app.name }}</h3>
                    <span
                      :class="[
                        'px-3 py-1 rounded-full text-xs font-semibold',
                        app.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                        app.status === 'approved' ? 'bg-green-100 text-green-700' :
                        'bg-red-100 text-red-700'
                      ]"
                    >
                      {{
                        app.status === 'pending' ? '⏳ На рассмотрении' :
                        app.status === 'approved' ? '✅ Одобрена' :
                        '❌ Отклонена'
                      }}
                    </span>
                  </div>
                  <p class="text-secondary/60 text-sm mb-2">
                    <strong>От:</strong> {{ app.users?.name }} ({{ app.users?.email }})
                  </p>
                  <div class="flex flex-wrap gap-4 text-sm text-secondary/60 mb-3">
                    <span><strong>Возраст:</strong> {{ app.age }}</span>
                    <span><strong>Пол:</strong> {{ getGenderInRussian(app.gender) }}</span>
                    <span><strong>Опыт:</strong> {{ app.experience }}</span>
                  </div>
                  <div class="mb-3">
                    <p class="text-sm text-secondary/60 mb-2"><strong>О себе:</strong></p>
                    <p class="text-secondary text-sm">{{ app.bio }}</p>
                  </div>
                  <div v-if="app.message" class="mb-3">
                    <p class="text-sm text-secondary/60 mb-2"><strong>Мотивация:</strong></p>
                    <p class="text-secondary text-sm">{{ app.message }}</p>
                  </div>
                  <div v-if="app.rejection_reason" class="mb-3 p-3 bg-red-100 rounded-lg">
                    <p class="text-sm text-red-700"><strong>Причина отклонения:</strong> {{ app.rejection_reason }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Actions for Pending Applications -->
            <div v-if="app.status === 'pending'" class="border-t border-border/50 pt-4">
              <div class="space-y-3">
                <button
                  @click="handleApproveApplication(app.id)"
                  class="w-full px-4 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                >
                  ✓ Одобрить заявку
                </button>
                <div>
                  <label class="block text-xs text-secondary/60 mb-2 font-semibold">Причина отклонения (если отклоняете):</label>
                  <textarea
                    v-model="rejectionReasons[app.id]"
                    placeholder="Например: Недостаточно информации в профиле, требуется дополнительная верификация..."
                    rows="3"
                    class="w-full px-3 py-2 rounded-lg border border-border/50 bg-white focus:outline-none focus:ring-2 focus:ring-red-500/50 transition text-sm resize-none"
                  ></textarea>
                  <button
                    @click="handleRejectApplication(app.id)"
                    class="w-full mt-2 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors text-sm"
                  >
                    ✗ Отклонить заявку
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-12 text-secondary/60">
          Заявок не найдено
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
