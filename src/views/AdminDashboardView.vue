<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { currentUser, isAdmin, loadCurrentUser } from '../composables/useAppState'
import { supabase } from '@/utils/supabase'
import { getGenderInRussian } from '@/utils/genderForm'
import { getExperienceText } from '@/utils/experienceForm'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import LoaderAnimation from '@/components/LoaderAnimation.vue'

const router = useRouter()
const activeTab = ref('overview')
const users = ref<any[]>([])
const companionsList = ref<any[]>([])
const reviews = ref<any[]>([])
const chats = ref<any[]>([])
const applications = ref<any[]>([])
const reports = ref<any[]>([])
const rejectionReasons = ref<{ [key: string]: string }>({})
const isLoading = ref(false)
const loadingStates = ref({
  users: false,
  companions: false,
  reviews: false,
  chats: false,
  applications: false,
  reports: false
})
const successMessage = ref('')
const errorMessage = ref('')

// Confirm Dialog
const confirmDialog = ref({
  isOpen: false,
  title: '',
  message: '',
  confirmText: 'Подтвердить',
  cancelText: 'Отмена',
  onConfirm: null as (() => Promise<void>) | null,
  isDangerous: false
})

const showConfirmDialog = (title: string, message: string, onConfirm: () => Promise<void>, isDangerous = false) => {
  console.log('showConfirmDialog called with title:', title)
  confirmDialog.value = {
    isOpen: true,
    title,
    message,
    confirmText: isDangerous ? 'Да, удалить' : 'Подтвердить',
    cancelText: 'Отмена',
    onConfirm,
    isDangerous
  }
  console.log('Confirm dialog opened, callback set:', !!onConfirm)
}

const closeConfirmDialog = () => {
  confirmDialog.value.isOpen = false
  confirmDialog.value.onConfirm = null
}

const handleConfirmDialog = async () => {
  if (confirmDialog.value.onConfirm) {
    await confirmDialog.value.onConfirm()
  }
  closeConfirmDialog()
}

const handleDialogConfirm = async () => {
  console.log('handleDialogConfirm called, onConfirm exists:', !!confirmDialog.value.onConfirm)
  if (confirmDialog.value.onConfirm) {
    try {
      console.log('Executing onConfirm callback...')
      await confirmDialog.value.onConfirm()
      console.log('onConfirm callback completed successfully')
    } catch (err) {
      console.error('Error in onConfirm callback:', err)
      throw err
    }
  }
  closeConfirmDialog()
}

// Check admin access
onMounted(async () => {
  console.log('AdminDashboard mounted')
  try {
    // First load current user to check if admin
    await loadCurrentUser()
    console.log('Current user loaded:', currentUser.value?.email, 'Role:', currentUser.value?.role)

    if (!isAdmin()) {
      console.log('Not admin, redirecting...')
      router.push('/')
      return
    }
    console.log('Loading dashboard data...')
    await loadDashboardData()
    console.log('Dashboard data loaded')
  } catch (err) {
    console.error('Error in AdminDashboard mount:', err)
    errorMessage.value = `Ошибка при загрузке: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`
    setTimeout(() => (errorMessage.value = ''), 5000)
  }
})

const loadDashboardData = async () => {
  try {
    isLoading.value = true
    console.log('Loading all dashboard data...')
    const results = await Promise.allSettled([loadUsers(), loadCompanionsList(), loadReviews(), loadChats(), loadApplications(), loadReports()])
    results.forEach((result, index) => {
      const names = ['users', 'companions', 'reviews', 'chats', 'applications', 'reports']
      if (result.status === 'rejected') {
        console.error(`Failed to load ${names[index]}:`, result.reason)
      } else {
        console.log(`✓ Loaded ${names[index]}`)
      }
    })
  } catch (err) {
    console.error('Error in loadDashboardData:', err)
  } finally {
    isLoading.value = false
  }
}

const loadUsers = async () => {
  loadingStates.value.users = true
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading users:', error)
      errorMessage.value = `Ошибка при загрузке пользователей: ${error.message}`
      setTimeout(() => (errorMessage.value = ''), 5000)
      return
    }
    users.value = data || []
  } catch (err) {
    console.error('Failed to fetch users:', err)
    errorMessage.value = `Ошибка подключения: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`
    setTimeout(() => (errorMessage.value = ''), 5000)
  } finally {
    loadingStates.value.users = false
  }
}

const loadCompanionsList = async () => {
  loadingStates.value.companions = true
  try {
    const { data, error } = await supabase
      .from('companions')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading companions:', error)
      return
    }
    companionsList.value = data || []
  } catch (err) {
    console.error('Failed to fetch companions:', err)
  } finally {
    loadingStates.value.companions = false
  }
}

const loadReviews = async () => {
  loadingStates.value.reviews = true
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading reviews:', error)
      return
    }
    reviews.value = data || []
  } catch (err) {
    console.error('Failed to fetch reviews:', err)
  } finally {
    loadingStates.value.reviews = false
  }
}

const loadChats = async () => {
  loadingStates.value.chats = true
  try {
    const { data, error } = await supabase
      .from('chats')
      .select('*, companion:companions(name, id), user:users(name, id)')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading chats:', error)
      return
    }
    chats.value = data || []
  } catch (err) {
    console.error('Failed to fetch chats:', err)
  } finally {
    loadingStates.value.chats = false
  }
}

const loadApplications = async () => {
  loadingStates.value.applications = true
  try {
    const { data, error } = await supabase
      .from('companion_applications')
      .select('*, users (name, email)')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading applications:', error)
      return
    }
    applications.value = data || []
  } catch (err) {
    console.error('Failed to fetch applications:', err)
  } finally {
    loadingStates.value.applications = false
  }
}

const loadReports = async () => {
  loadingStates.value.reports = true
  try {
    const { data, error } = await supabase
      .from('reports')
      .select('*, chats(user_id, companion_id), companion:companions(id, name), reporter:users!reports_user_id_fkey(name, email)')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading reports:', error)
      return
    }
    reports.value = data || []
  } catch (err) {
    console.error('Failed to fetch reports:', err)
  } finally {
    loadingStates.value.reports = false
  }
}

// Stats
const stats = computed(() => ({
  totalUsers: users.value.length,
  totalCompanions: companionsList.value.length,
  totalChats: chats.value.length,
  totalReviews: reviews.value.length,
  activeChats: chats.value.filter((c: any) => c.status === 'active').length,
  pendingApplications: applications.value.filter((a: any) => a.status === 'pending').length,
  totalReports: reports.value.length,
  pendingReports: reports.value.filter((r: any) => r.status === 'pending').length,
}))

const handleDeleteUser = async (userId: string | number) => {
  showConfirmDialog(
    'Удалить пользователя',
    'Это действие удалит пользователя и все его данные. Это невозможно отменить.',
    async () => {
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
    },
    true
  )
}

const handleToggleCompanionStatus = async (companionId: string | number, isAvailable: boolean) => {
  try {
    const { error } = await supabase
      .from('companions')
      .update({ is_available: !isAvailable })
      .eq('id', companionId)

    if (error) throw error

    successMessage.value = `Статус изменен на "${!isAvailable ? 'Доступен' : 'Недоступен'}" ✓`
    await loadCompanionsList()
    setTimeout(() => (successMessage.value = ''), 3000)
  } catch (err) {
    errorMessage.value = `Ошибка при обновлении: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`
    setTimeout(() => (errorMessage.value = ''), 3000)
  }
}

const handleToggleAdminStatus = async (userId: string | number, currentRole: string) => {
  console.log('handleToggleAdminStatus called with userId:', userId, 'currentRole:', currentRole)
  const newRole = currentRole === 'admin' ? 'user' : 'admin'
  const actionText = newRole === 'admin' ? 'Сделать администратором' : 'Убрать из администраторов'
  const warningText = newRole === 'admin'
    ? 'Пользователь получит полный доступ к админ панели'
    : 'Пользователь потеряет доступ к админ панели'

  console.log('Showing confirm dialog with newRole:', newRole)
  showConfirmDialog(
    actionText,
    warningText,
    async () => {
      console.log('Dialog callback executing: updating user', userId, 'to role:', newRole)
      try {
        const { error, data } = await supabase
          .from('users')
          .update({ role: newRole })
          .eq('id', userId)
          .select()

        console.log('Update result:', { error, data })

        if (error) {
          console.error('Supabase error:', error)
          throw error
        }

        console.log('Update successful, reloading users...')
        successMessage.value = `Роль изменена на "${newRole === 'admin' ? 'Администратор' : 'Пользователь'}"`
        await loadUsers()
        console.log('Users reloaded, users.value:', users.value.map(u => ({ id: u.id, role: u.role })))
        setTimeout(() => (successMessage.value = ''), 3000)
      } catch (err) {
        console.error('Error in handleToggleAdminStatus callback:', err)
        errorMessage.value = `Ошибка при изменении роли: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`
        setTimeout(() => (errorMessage.value = ''), 3000)
      }
    },
    newRole === 'admin' ? false : true
  )
}

const handleDeleteReview = async (reviewId: string | number) => {
  showConfirmDialog(
    'Удалить отзыв',
    'Отзыв будет удален и его больше нельзя будет восстановить.',
    async () => {
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
    },
    true
  )
}

const navigate = (path: string) => {
  router.push(path)
}

const handleResolveReport = async (reportId: string | number) => {
  showConfirmDialog(
    'Отметить как обработанную',
    'Жалоба будет отмечена как обработанная и исчезнет из списка ожидающих.',
    async () => {
      try {
        const { error } = await supabase
          .from('reports')
          .update({ status: 'resolved' })
          .eq('id', reportId)

        if (error) throw error

        successMessage.value = 'Жалоба отмечена как обработанная ✓'
        await loadReports()
        setTimeout(() => (successMessage.value = ''), 3000)
      } catch (err) {
        errorMessage.value = `Ошибка при обработке: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`
        setTimeout(() => (errorMessage.value = ''), 3000)
      }
    }
  )
}

const handleDeleteReport = async (reportId: string | number) => {
  showConfirmDialog(
    'Удалить жалобу',
    'Жалоба будет полностью удалена из системы. Это действие невозможно отменить.',
    async () => {
      try {
        const { error } = await supabase
          .from('reports')
          .delete()
          .eq('id', reportId)

        if (error) throw error

        successMessage.value = 'Жалоба удалена ✓'
        await loadReports()
        setTimeout(() => (successMessage.value = ''), 3000)
      } catch (err) {
        errorMessage.value = `Ошибка при удалении: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`
        setTimeout(() => (errorMessage.value = ''), 3000)
      }
    },
    true
  )
}

const handleBlockCompanion = async (companionId: string | number, companionName: string) => {
  showConfirmDialog(
    'Заблокировать спутника',
    `Спутник "${companionName}" не сможет принимать новые чаты. Текущие чаты останутся активными.`,
    async () => {
      try {
        const { error } = await supabase
          .from('companions')
          .update({ is_available: false })
          .eq('id', companionId)

        if (error) throw error

        successMessage.value = `Спутник "${companionName}" заблокирован ✓`
        await loadCompanionsList()
        setTimeout(() => (successMessage.value = ''), 3000)
      } catch (err) {
        errorMessage.value = `Ошибка при блокировке: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`
        setTimeout(() => (errorMessage.value = ''), 3000)
      }
    },
    true
  )
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

    // Fetch user's image from users table (the source of truth for images)
    let imageUrl = 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg'
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('image')
        .eq('id', app.user_id)
        .single()

      if (userError) {
        console.warn('Could not fetch user image, will use app image or default:', userError.message)
      } else if (userData?.image) {
        imageUrl = userData.image
        console.log('Using image from user profile:', imageUrl.substring(0, 50))
      } else if (app.image) {
        // Fallback to application image if user image not available
        imageUrl = app.image
        console.log('User has no image, using application image')
      }
    } catch (err) {
      console.warn('Error fetching user image:', err)
      // Continue with app image or default
      if (app.image) {
        imageUrl = app.image
      }
    }

    console.log('Using image URL:', {
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
      image: imageUrl.substring(0, 2000), // Ensure image URL doesn't exceed limit
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
    const { data: updateData, error: updateUserRoleError } = await supabase
      .from('users')
      .update({ role: 'companion', updated_at: new Date().toISOString() })
      .eq('id', app.user_id)
      .select()

    if (updateUserRoleError) {
      console.error('User role update error details:', {
        message: updateUserRoleError.message,
        code: updateUserRoleError.code,
        hint: updateUserRoleError.hint,
        details: (updateUserRoleError as any).details,
      })
      throw new Error(`Failed to update user role to companion: ${updateUserRoleError.message}`)
    }

    if (!updateData || updateData.length === 0) {
      console.warn('User role update returned no data. This may indicate the user was not found.')
      // Don't throw - the update might still have worked even if no data returned
    }

    console.log('User role changed to companion successfully', updateData)

    successMessage.value = `Заявка одобрена! ${app.name} добавлена в качестве спутника ✓`

    // Reload both applications and companions lists to reflect changes globally
    // This is critical: loadCompanionsList() updates the companionsList ref so new companion appears everywhere
    const reloadTasks = [
      loadApplications(),
      loadCompanionsList()
    ]

    // If the currently logged-in user was approved, reload their profile to show the new role
    if (currentUser.value?.id === app.user_id) {
      console.log('Reloading current user profile due to approval')
      reloadTasks.push(loadCurrentUser())
    }

    await Promise.all(reloadTasks)

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

  showConfirmDialog(
    'Отклонить заявку',
    `Причина отклонения: "${reason}"\n\nПосле подтверждения заявка будет отклонена.`,
    async () => {
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
    },
    true
  )
}
</script>

<template>
  <div class="layout-page">
    <div class="layout-container">
      <!-- Header -->
      <div class="mb-8">
        <div class="admin-header">
          <div class="admin-header__title">
            <img src="../images/shield-tick.svg" alt="Admin" class="admin-header__icon" />
            <div class="admin-header__text">
              <h1>Админ Панель</h1>
              <p>Управление платформой и данными пользователей</p>
            </div>
          </div>
          <button
            @click="navigate('/profile')"
            class="btn btn-large btn--secondary rounded-full"
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
          <img src="/src/images/shield-tick.svg" alt="Success" style="width: 1.25rem; height: 1.25rem;" />
          <span>{{ successMessage }}</span>
        </div>
      </transition>
      <transition name="fade">
        <div
          v-if="errorMessage"
          class="alert-error-row"
        >
          <img src="/src/images/block.svg" alt="Error" style="width: 1.25rem; height: 1.25rem;" />
          <span>{{ errorMessage }}</span>
        </div>
      </transition>

      <!-- Stats -->
      <div class="grid grid-cols-1 gap-4 mb-8" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr))">
        <div class="stat-card group">
          <div class="stat-card__header">
            <div class="stat-card__value">{{ stats.totalUsers }}</div>
            <img src="../images/user.svg" alt="Users" class="stat-card__icon group-hover:opacity-100" />
          </div>
          <p class="stat-card__label">Пользователей</p>
        </div>
        <div class="stat-card group">
          <div class="stat-card__header">
            <div class="stat-card__value">{{ stats.totalCompanions }}</div>
            <img src="../images/user-story.svg" alt="Companions" class="stat-card__icon group-hover:opacity-100" />
          </div>
          <p class="stat-card__label">Спутников</p>
        </div>
        <div class="stat-card group">
          <div class="stat-card__header">
            <div class="stat-card__value">{{ stats.totalChats }}</div>
            <img src="../images/message-add-alt.svg" alt="Chats" class="stat-card__icon group-hover:opacity-100" />
          </div>
          <p class="stat-card__label">Всего чатов</p>
        </div>
        <div class="stat-card group">
          <div class="stat-card__header">
            <div class="stat-card__value" style="color: #576445">{{ stats.activeChats }}</div>
            <img src="../images/shield-tick.svg" alt="Active" class="stat-card__icon group-hover:opacity-100" />
          </div>
          <p class="stat-card__label">Активных чатов</p>
        </div>
        <div class="stat-card group">
          <div class="stat-card__header">
            <div class="stat-card__value">{{ stats.totalReviews }}</div>
            <img src="../images/smile.svg" alt="Reviews" class="stat-card__icon group-hover:opacity-100" />
          </div>
          <p class="stat-card__label">Отзывов</p>
        </div>
        <div class="stat-card group" :style="{ backgroundColor: stats.pendingReports > 0 ? 'rgba(254, 242, 242, 0.3)' : 'transparent', borderColor: stats.pendingReports > 0 ? '#ef4444' : 'var(--color-border)' }">
          <div class="stat-card__header">
            <div class="stat-card__value" :style="{ color: stats.pendingReports > 0 ? '#ef4444' : 'var(--color-primary)' }">{{ stats.totalReports }}</div>
            <svg v-if="stats.pendingReports > 0" class="stat-card__icon animate-pulse" fill="currentColor" viewBox="0 0 24 24" style="color: #ef4444">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <img v-else src="../images/shield-tick.svg" alt="Reports" class="stat-card__icon group-hover:opacity-100" />
          </div>
          <p class="stat-card__label">Жалоб <span v-if="stats.pendingReports > 0" style="font-weight: var(--font-weight-bold); color: #ef4444">({{ stats.pendingReports }} новых)</span></p>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs-nav">
        <button
          @click="activeTab = 'overview'"
          :class="['tab-btn', activeTab === 'overview' ? 'tab-btn--active' : '']"
        >
          <img src="../images/shield-tick.svg" alt="Overview" class="tab-btn__icon" />
          Обзор
        </button>
        <button
          @click="activeTab = 'users'"
          :class="['tab-btn', activeTab === 'users' ? 'tab-btn--active' : '']"
        >
          <img src="../images/user.svg" alt="Users" class="tab-btn__icon" />
          Пользователи ({{ users.length }})
        </button>
        <button
          @click="activeTab = 'companions'"
          :class="['tab-btn', activeTab === 'companions' ? 'tab-btn--active' : '']"
        >
          <img src="../images/user-story.svg" alt="Companions" class="tab-btn__icon" />
          Спутники ({{ companionsList.length }})
        </button>
        <button
          @click="activeTab = 'reviews'"
          :class="['tab-btn', activeTab === 'reviews' ? 'tab-btn--active' : '']"
        >
          <img src="../images/smile.svg" alt="Reviews" class="tab-btn__icon" />
          Отзывы ({{ reviews.length }})
        </button>
        <button
          @click="activeTab = 'applications'"
          :class="['tab-btn', activeTab === 'applications' ? 'tab-btn--active' : '']"
        >
          <img src="../images/user-add.svg" alt="Applications" class="tab-btn__icon" />
          Заявки <span v-if="stats.pendingApplications > 0" class="tab-btn__badge">{{ stats.pendingApplications }}</span>
        </button>
        <button
          @click="activeTab = 'reports'"
          :class="['tab-btn', activeTab === 'reports' ? 'tab-btn--active' : '']"
        >
          <svg class="tab-btn__icon" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          Жалобы <span v-if="stats.pendingReports > 0" class="tab-btn__badge">{{ stats.pendingReports }}</span>
        </button>
      </div>

      <!-- Overview Tab -->
      <div v-if="activeTab === 'overview'" class="space-y-6">
        <div class="card">
          <h2 class="text-2xl font-bold text-secondary mb-6">Добро пожаловать, Администратор!</h2>
          <div class="space-y-4" style="color: var(--color-secondary-70)">
            <p><img src="../images/shield-tick.svg" alt="Overview" style="width: 1.25rem; height: 1.25rem; display: inline; margin-right: 0.5rem; vertical-align: middle;" />На этой панели вы можете управлять:</p>
            <ul style="list-style: disc; list-style-position: inside; display: flex; flex-direction: column; gap: 0.5rem;">
              <li><strong>Пользователи</strong> - просмотр, управление и удаление профилей</li>
              <li><strong>Спутники</strong> - управление статусом доступности и информацией</li>
              <li><strong>Отзывы</strong> - модерация отзывов пользователей</li>
              <li><strong>Чаты</strong> - просмотр истории коммуникации</li>
            </ul>
            <p style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--color-border);">
              Используйте табы выше для переключения между разделами.
            </p>
          </div>
        </div>
      </div>

      <!-- Users Tab -->
      <div v-if="activeTab === 'users'" class="space-y-4">
        <h2 class="text-2xl font-bold text-secondary mb-6">Пользователи ({{ users.length }})</h2>

        <div v-if="loadingStates.users" class="loading-state">
          <LoaderAnimation type="pulse" size="md" />
          <div class="loading-state__text">Загрузка пользователей...</div>
        </div>

        <div v-else-if="users.length > 0" class="card-table">
          <div style="overflow-x: auto;">
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
                    <span class="status-badge" :class="[user.role === 'admin' ? 'status-badge--active' : 'status-badge--inactive']">
                      {{ user.role === 'admin' ? 'Администратор' : 'Пользователь' }}
                    </span>
                  </td>
                  <td class="px-4 py-4 text-secondary text-sm">
                    {{ new Date(user.created_at).toLocaleDateString('ru-RU') }}
                  </td>
                  <td class="px-4 py-4">
                    <div style="display: flex; gap: 0.5rem;">
                      <button
                        @click="handleToggleAdminStatus(user.id, user.role)"
                        :class="['btn btn-small', user.role === 'admin' ? 'btn--secondary' : 'btn--success']"
                      >
                        {{ user.role === 'admin' ? 'Убрать' : 'Админ' }}
                      </button>
                      <button
                        v-if="user.role !== 'admin'"
                        @click="handleDeleteUser(user.id)"
                        class="btn btn-small btn--danger"
                      >
                        Удалить
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-else class="empty-state">
          <div class="empty-state__text">Пользователей не найдено</div>
        </div>
      </div>

      <!-- Companions Tab -->
      <div v-if="activeTab === 'companions'" class="space-y-4">
        <h2 class="text-2xl font-bold text-secondary mb-6">Спутники ({{ companionsList.length }})</h2>

        <div v-if="loadingStates.companions" class="loading-state">
          <LoaderAnimation type="dots" size="md" />
          <div class="loading-state__text">Загрузка спутников...</div>
        </div>

        <div v-else-if="companionsList.length > 0" class="grid gap-4">
          <div
            v-for="companion in companionsList"
            :key="companion.id"
            class="card-surface"
          >
            <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem;">
              <div style="flex: 1;">
                <h3 class="text-lg font-bold text-secondary mb-2">{{ companion.name }}</h3>
                <p style="color: var(--color-secondary-60); font-size: var(--font-size-sm); margin-bottom: 0.75rem;">{{ companion.experience }}</p>
                <div style="display: flex; align-items: center; gap: 1rem; font-size: var(--font-size-sm); color: var(--color-secondary-60);">
                  <span style="display: inline-flex; align-items: center; gap: 0.375rem;">
                    <img src="../images/heart.svg" alt="Thanks" style="width: 1rem; height: 1rem; object-fit: contain;" />
                    {{ companion.reviews_count }} отзывов
                  </span>
                </div>
              </div>
              <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                <button
                  @click="handleToggleCompanionStatus(companion.id, companion.is_available)"
                  class="btn btn-small rounded-full" :style="{
                    backgroundColor: companion.is_available ? 'rgba(87, 100, 69, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: companion.is_available ? '#576445' : '#dc2626'
                  }"
                >
                  {{ companion.is_available ? 'Доступен' : 'Недоступен' }}
                </button>
                <button
                  @click="handleBlockCompanion(companion.id, companion.name)"
                  class="btn btn-small rounded-full"
                  style="background-color: rgba(239, 68, 68, 0.1); color: #dc2626;"
                >
                  <img src="/src/images/block.svg" alt="Block" style="width: 0.875rem; height: 0.875rem; display: inline-block; margin-right: 0.25rem;" />
                  Заблокировать
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <div class="empty-state__text">Спутников не найдено</div>
        </div>
      </div>

      <!-- Reviews Tab -->
      <div v-if="activeTab === 'reviews'" class="space-y-4">
        <h2 class="text-2xl font-bold text-secondary mb-6">Отзывы ({{ reviews.length }})</h2>

        <div v-if="loadingStates.reviews" class="loading-state">
          <LoaderAnimation type="bars" size="md" />
          <div class="loading-state__text">Загрузка отзывов...</div>
        </div>

        <div v-else-if="reviews.length > 0" class="grid gap-4">
          <div
            v-for="review in reviews"
            :key="review.id"
            class="card"
          >
            <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 1rem;">
              <div>
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                  <div class="rating-stars">
                    <img v-for="starIndex in 5" :key="starIndex" src="/src/images/star.svg" alt="Star" class="rating-star" :class="starIndex <= review.rating ? 'rating-star--filled' : 'rating-star--empty'" />
                  </div>
                  <span style="font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); color: var(--color-secondary);">{{ review.title }}</span>
                </div>
                <p style="color: var(--color-secondary-60); font-size: var(--font-size-sm);">{{ review.comment }}</p>
              </div>
              <button
                @click="handleDeleteReview(review.id)"
                class="btn btn-small btn--danger"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <div class="empty-state__text">Отзывов не найдено</div>
        </div>
      </div>

      <!-- Applications Tab -->
      <div v-if="activeTab === 'applications'" class="space-y-4">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem;">
          <h2 class="text-2xl font-bold text-secondary">Заявки на становление спутником ({{ applications.length }})</h2>
          <div style="font-size: var(--font-size-sm); color: var(--color-secondary-60);">
            <span style="font-weight: var(--font-weight-semibold); color: var(--color-primary);">{{ stats.pendingApplications }}</span> ожидают рассмотрения
          </div>
        </div>

        <div v-if="loadingStates.applications" class="loading-state">
          <LoaderAnimation type="path" size="md" />
          <div class="loading-state__text">Загрузка заявок...</div>
        </div>

        <div v-else-if="applications.length > 0" class="grid gap-6">
          <div
            v-for="app in applications"
            :key="app.id"
            class="app-card" :class="{
              'app-card--pending': app.status === 'pending',
              'app-card--approved': app.status === 'approved',
              'app-card--rejected': app.status === 'rejected'
            }"
          >
            <div class="mb-4">
              <div class="app-card__header">
                <div class="flex-1">
                  <h3 class="app-card__title">
                    {{ app.name }}
                    <span class="status-badge" :class="{
                      'status-badge--pending': app.status === 'pending',
                      'status-badge--approved': app.status === 'approved',
                      'status-badge--rejected': app.status === 'rejected'
                    }">
                      {{
                        app.status === 'pending' ? 'На рассмотрении' :
                        app.status === 'approved' ? 'Одобрена' :
                        'Отклонена'
                      }}
                    </span>
                  </h3>
                  <p class="app-card__info">
                    <strong>От:</strong> {{ app.users?.name }} ({{ app.users?.email }})
                  </p>
                  <div class="app-card__details">
                    <div class="app-card__detail">
                      <span class="app-card__detail-label">Возраст:</span>
                      <span class="app-card__detail-value">{{ app.age }}</span>
                    </div>
                    <div class="app-card__detail">
                      <span class="app-card__detail-label">Пол:</span>
                      <span class="app-card__detail-value">{{ getGenderInRussian(app.gender) }}</span>
                    </div>
                    <div class="app-card__detail">
                      <span class="app-card__detail-label">Опыт:</span>
                      <span class="app-card__detail-value">{{ app.experience }}</span>
                    </div>
                  </div>
                  <div class="app-card__bio">
                    <strong style="display: block; margin-bottom: 0.5rem; color: var(--color-secondary-60); font-size: var(--font-size-xs);">О себе:</strong>
                    {{ app.bio }}
                  </div>
                  <div v-if="app.message" class="app-card__message">
                    <strong style="display: block; margin-bottom: 0.5rem; color: var(--color-secondary-60); font-size: var(--font-size-xs);">Мотивация:</strong>
                    {{ app.message }}
                  </div>
                  <div v-if="app.rejection_reason" style="margin-bottom: 1rem; padding: 0.75rem; background-color: rgba(239, 68, 68, 0.1); border-radius: var(--radius-md); border-left: 4px solid #ef4444;">
                    <p style="font-size: var(--font-size-sm); color: #dc2626;"><strong>Причина отклонения:</strong> {{ app.rejection_reason }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Actions for Pending Applications -->
            <div v-if="app.status === 'pending'" class="app-card__actions">
              <button
                @click="handleApproveApplication(app.id)"
                class="btn btn-large btn--success btn-full"
              >
                <img src="/src/images/shield-tick.svg" alt="Approve" style="width: 1rem; height: 1rem; display: inline-block; margin-right: 0.5rem;" />
                Одобрить заявку
              </button>
              <div>
                <label class="form-label">Причина отклонения (если отклоняете):</label>
                <textarea
                  v-model="rejectionReasons[app.id]"
                  placeholder="Например: Недостаточно информации в профиле, требуется дополнительная верификация..."
                  rows="3"
                  class="form-textarea w-full"
                ></textarea>
                <button
                  @click="handleRejectApplication(app.id)"
                  class="btn btn-large btn--danger btn-full mt-2"
                >
                  <img src="/src/images/block.svg" alt="Reject" style="width: 1rem; height: 1rem; display: inline-block; margin-right: 0.5rem;" />
                  Отклонить заявку
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <div class="empty-state__text">Заявок не найдено</div>
        </div>
      </div>

      <!-- Reports Tab -->
      <div v-if="activeTab === 'reports'" class="space-y-4">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem;">
          <h2 class="text-2xl font-bold text-secondary">Жалобы ({{ reports.length }})</h2>
          <div style="font-size: var(--font-size-sm); color: var(--color-secondary-60);">
            <span style="font-weight: var(--font-weight-semibold); color: #ef4444;">{{ stats.pendingReports }}</span> требуют внимания
          </div>
        </div>

        <div v-if="loadingStates.reports" class="loading-state">
          <LoaderAnimation type="pulse" size="md" />
          <div class="loading-state__text">Загрузка жалоб...</div>
        </div>

        <div v-else-if="reports.length > 0" class="grid gap-6">
          <div
            v-for="report in reports"
            :key="report.id"
            class="report-card" :class="{
              'report-card--pending': report.status === 'pending',
              'report-card--resolved': report.status === 'resolved'
            }"
          >
            <div class="report-card__header">
              <div class="report-card__content">
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem;">
                  <span class="status-badge" :class="{
                    'status-badge--pending': report.status === 'pending',
                    'status-badge--approved': report.status === 'resolved'
                  }">
                    {{ report.status === 'pending' ? '⏳ На рассмотрении' : '✅ Обработана' }}
                  </span>
                  <span style="font-size: var(--font-size-xs); font-weight: var(--font-weight-medium); color: var(--color-secondary-60);">ID: {{ report.id }}</span>
                </div>

                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                  <!-- От кого и На кого -->
                  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; padding: 0.75rem; background-color: var(--color-light-bg); border-radius: var(--radius-md);">
                    <div class="report-card__field">
                      <span class="report-card__field-label"><img src="/src/images/user.svg" alt="Reporter" style="width: 0.875rem; height: 0.875rem; display: inline-block; margin-right: 0.375rem;" />От кого:</span>
                      <span class="report-card__field-value">{{ report.reporter?.name || 'Анонимно' }} ({{ report.reporter?.email || 'нет email' }})</span>
                    </div>
                    <div class="report-card__field">
                      <span class="report-card__field-label"><img src="/src/images/user.svg" alt="Companion" style="width: 0.875rem; height: 0.875rem; display: inline-block; margin-right: 0.375rem;" />На кого:</span>
                      <span class="report-card__field-value">{{ report.companion?.name || report.companion_id || 'N/A' }}</span>
                    </div>
                  </div>

                  <div class="report-card__field">
                    <span class="report-card__field-label">Причина:</span>
                    <span class="report-card__field-value">{{ report.reason }}</span>
                  </div>

                  <div class="report-card__field">
                    <span class="report-card__field-label">Описание:</span>
                    <span class="report-card__field-value">{{ report.message }}</span>
                  </div>

                  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem;">
                    <div class="report-card__field">
                      <span class="report-card__field-label">ID чата:</span>
                      <span class="report-card__field-value" style="font-family: monospace; font-size: var(--font-size-xs);">{{ report.chat_id }}</span>
                    </div>
                  </div>

                  <div class="report-card__field">
                    <span class="report-card__field-label">Дата:</span>
                    <span class="report-card__field-value">{{ new Date(report.created_at).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div v-if="report.status === 'pending'" class="report-card__actions">
              <button
                @click="handleResolveReport(report.id)"
                class="btn btn-large btn--success flex-1"
              >
                <img src="/src/images/shield-tick.svg" alt="Resolve" style="width: 1rem; height: 1rem; display: inline-block; margin-right: 0.5rem;" />
                Отметить как обработанную
              </button>
              <button
                @click="handleBlockCompanion(report.chats?.companion_id, 'спутника')"
                v-if="report.chats?.companion_id"
                class="btn btn-large btn-block flex-1"
                style="background-color: #ef4444; color: white;"
              >
                <img src="/src/images/block.svg" alt="Block" style="width: 1rem; height: 1rem; display: inline-block; margin-right: 0.5rem; filter: brightness(0) invert(1);" />
                Заблокировать спутника
              </button>
              <button
                @click="handleDeleteReport(report.id)"
                class="btn btn-large btn--danger flex-1"
              >
                <img src="/src/images/close.svg" alt="Delete" style="width: 1rem; height: 1rem; display: inline-block; margin-right: 0.5rem;" />
                Удалить
              </button>
            </div>
            <div v-else style="border-top: 1px solid var(--color-border); padding-top: 1rem; display: flex; gap: 1rem;">
              <button
                @click="handleBlockCompanion(report.chats?.companion_id, 'спутника')"
                v-if="report.chats?.companion_id"
                class="btn btn-large btn-block flex-1"
                style="background-color: #ef4444; color: white;"
              >
                <img src="/src/images/block.svg" alt="Block" style="width: 1rem; height: 1rem; display: inline-block; margin-right: 0.5rem; filter: brightness(0) invert(1);" />
                Заблокировать спутника
              </button>
              <button
                @click="handleDeleteReport(report.id)"
                class="btn btn-large btn--danger flex-1"
              >
                <img src="/src/images/close.svg" alt="Delete" style="width: 1rem; height: 1rem; display: inline-block; margin-right: 0.5rem;" />
                Удалить
              </button>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <div class="empty-state__text">Жалоб не найдено</div>
        </div>
      </div>
    </div>

    <!-- Confirm Dialog -->
    <ConfirmDialog
      :is-open="confirmDialog.isOpen"
      :title="confirmDialog.title"
      :message="confirmDialog.message"
      :confirm-text="confirmDialog.confirmText"
      :cancel-text="confirmDialog.cancelText"
      :is-dangerous="confirmDialog.isDangerous"
      @confirm="handleDialogConfirm"
      @cancel="closeConfirmDialog"
    />
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

@media (max-width: 769px) {
  :deep(.admin-header__icon),
  :deep(.stat-card__icon) {
    display: none !important;
  }
}
</style>
