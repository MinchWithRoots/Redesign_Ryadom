<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { currentUser, loadCurrentUser } from '@/composables/useAppState'
import { submitCompanionApplication, getUserApplication } from '@/services/supabaseService'
import { supabase } from '@/utils/supabase'

const router = useRouter()
const isLoading = ref(false)
const isSubmitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const topics = ref<any[]>([])
const existingApplication = ref<any>(null)

const form = ref({
  name: '',
  age: null,
  gender: '',
  experience: 'Начинающий',
  bio: '',
  image: '',
  topics: [] as number[],
  message: '',
})

// Check if user already has an application
onMounted(async () => {
  try {
    isLoading.value = true

    // Ensure current user is loaded
    if (!currentUser.value) {
      await loadCurrentUser()
    }

    const user = currentUser.value

    if (!user) {
      router.push('/auth')
      return
    }

    // Check if user already has a pending or approved application
    const existingApp = await getUserApplication(user.id)
    if (existingApp) {
      existingApplication.value = existingApp
      if (existingApp.status === 'approved') {
        successMessage.value = 'Ваша заявка одобрена! Вы уже добавлены в качестве спутника.'
      } else if (existingApp.status === 'pending') {
        successMessage.value = 'Ваша заявка уже подана и ожидает рассмотрения.'
      } else if (existingApp.status === 'rejected') {
        errorMessage.value = `Ваша заявка была отклонена: ${existingApp.rejection_reason}`
      }
    }

    // Test connection to companion_applications table
    try {
      const { data: testData, error: testError } = await supabase
        .from('companion_applications')
        .select('id')
        .limit(1)

      if (testError) {
        console.warn('companion_applications table access error:', testError)
      } else {
        console.log('companion_applications table accessible, found', testData?.length || 0, 'records')
      }
    } catch (e) {
      console.error('Error accessing companion_applications table:', e)
    }

    // Fetch available topics first
    const { data: topicsData, error: topicsError } = await supabase
      .from('companion_topics')
      .select('*')
      .order('name', { ascending: true })

    if (topicsError) {
      console.error('Error loading topics:', topicsError)
      errorMessage.value = 'Ошибка при загрузке областей поддержки'
    }

    if (topicsData) {
      topics.value = topicsData
      console.log('Loaded topics:', topicsData)
    }

    // Prefill form with user data from currentUser (which already has the gender from profile setup)
    if (user) {
      form.value.name = user.name || ''
      form.value.age = user.age || null
      form.value.gender = user.gender || ''
      form.value.bio = user.bio || ''
      form.value.image = user.image || ''

      // Convert topic names (strings) to topic IDs (numbers)
      if (user.topics && user.topics.length > 0 && topicsData && topicsData.length > 0) {
        const topicNameToId = new Map(topicsData.map((t: any) => [t.name, t.id]))
        console.log('Topic name to ID map:', topicNameToId)
        console.log('User topics to convert:', user.topics)
        const convertedTopics = user.topics
          .map((topicName: string) => topicNameToId.get(topicName))
          .filter((id: number | undefined) => id !== undefined) as number[]
        form.value.topics = convertedTopics
        console.log('Converted topics:', convertedTopics)
      }
    }
  } catch (error) {
    console.error('Error loading application:', error)
    errorMessage.value = 'Ошибка при загрузке данных'
  } finally {
    isLoading.value = false
  }
})

const toggleTopic = (topicId: number) => {
  const index = form.value.topics.indexOf(topicId)
  if (index > -1) {
    form.value.topics.splice(index, 1)
  } else {
    form.value.topics.push(topicId)
  }
}

const submitApplication = async () => {
  try {
    errorMessage.value = ''
    successMessage.value = ''

    // Validation
    if (!form.value.name.trim()) {
      errorMessage.value = 'Пожалуйста, укажите ваше имя'
      return
    }

    if (!form.value.age || form.value.age < 18) {
      errorMessage.value = 'Пожалуйста, укажите корректный возраст (18+)'
      return
    }

    if (!form.value.gender) {
      errorMessage.value = 'Пол не заполнен. Пожалуйста, сначала заполните анкету в профиле'
      return
    }

    if (!form.value.bio.trim() || form.value.bio.trim().length < 50) {
      errorMessage.value = 'Пожалуйста, напишите о себе (минимум 50 символов)'
      return
    }

    if (form.value.topics.length === 0) {
      errorMessage.value = 'Пожалуйста, выберите хотя бы одну область поддержки'
      return
    }

    const user = currentUser.value
    if (!user) {
      errorMessage.value = 'Ошибка: пользователь не авторизован'
      router.push('/auth')
      return
    }

    if (!user.id) {
      errorMessage.value = 'Ошибка: ID пользователя не найден'
      return
    }

    // Check if user is still authenticated with Supabase
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      errorMessage.value = 'Ошибка: сессия истекла. Пожалуйста, повторно войдите'
      router.push('/auth')
      return
    }

    console.log('Submitting application for user:', user.id)
    console.log('Auth user:', authUser.id)
    console.log('Form data before submission:', {
      name: form.value.name,
      age: form.value.age,
      gender: form.value.gender,
      experience: form.value.experience,
      bio: form.value.bio?.substring(0, 50),
      image: form.value.image?.substring(0, 50),
      topics: form.value.topics,
      message: form.value.message,
    })

    // Validate types
    if (typeof form.value.name !== 'string') {
      throw new Error('Name must be a string')
    }
    if (typeof form.value.age !== 'number') {
      throw new Error('Age must be a number')
    }
    if (typeof form.value.gender !== 'string') {
      throw new Error('Gender must be a string')
    }
    if (!Array.isArray(form.value.topics)) {
      throw new Error('Topics must be an array')
    }

    isSubmitting.value = true

    const result = await submitCompanionApplication(user.id, form.value)

    if (result) {
      successMessage.value = 'Спасибо! Ваша заявка подана на рассмотрение. Администратор свяжется с вами в ближайшее время.'
      existingApplication.value = result
      console.log('Application submitted successfully:', result)
      // Reset form
      setTimeout(() => {
        router.push('/profile')
      }, 2000)
    }
  } catch (error) {
    let errorMsg = 'Неизвестная ошибка'
    if (error instanceof Error) {
      errorMsg = error.message
    } else if (typeof error === 'object' && error !== null) {
      const err = error as any
      if (err.message) {
        errorMsg = err.message
      } else if (err.error_description) {
        errorMsg = err.error_description
      } else if (err.hint) {
        errorMsg = err.hint
      } else {
        errorMsg = JSON.stringify(err)
      }
    } else if (typeof error === 'string') {
      errorMsg = error
    }

    console.error('Error submitting application:', errorMsg)
    console.error('Full error object:', error)
    errorMessage.value = `Ошибка при отправке заявки: ${errorMsg}`
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-light-bg to-white py-12 px-4 lg:px-8">
    <div class="container mx-auto max-w-2xl">
      <!-- Header -->
      <div class="mb-12 text-center">
        <h1 class="text-4xl lg:text-5xl font-bold text-secondary mb-4">
          Стань спутником
        </h1>
        <p class="text-xl text-secondary/60">
          Помогайте людям в их пути и получайте вознаграждение за вашу поддержку
        </p>
      </div>

      <!-- Existing Application Status -->
      <div v-if="existingApplication" class="mb-8">
        <div
          v-if="existingApplication.status === 'pending'"
          class="bg-blue-50 border border-blue-200 rounded-2xl p-6 text-blue-900"
        >
          <p class="font-semibold mb-2">⏳ Ваша заявка на рассмотрении</p>
          <p class="text-sm">
            Спасибо за вашу заинтересованность! Администратор рассмотрит вашу заявку и свяжется с вами.
          </p>
        </div>
        <div
          v-else-if="existingApplication.status === 'approved'"
          class="bg-green-50 border border-green-200 rounded-2xl p-6 text-green-900"
        >
          <p class="font-semibold mb-2">✅ Ваша заявка одобрена!</p>
          <p class="text-sm">
            Поздравляем! Вы теперь спутник на платформе. Люди могут найти вас в поиске и отправить вам заявку на общение.
          </p>
        </div>
        <div
          v-else-if="existingApplication.status === 'rejected'"
          class="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-900"
        >
          <p class="font-semibold mb-2">❌ Ваша заявка была отклонена</p>
          <p class="text-sm mb-3">
            {{ existingApplication.rejection_reason }}
          </p>
          <p class="text-xs text-red-700">
            Вы можете отправить новую заявку с обновленной информацией.
          </p>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="text-center py-12">
        <div class="inline-block">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
        <p class="mt-4 text-secondary/60">Загрузка...</p>
      </div>

      <!-- Form -->
      <div v-else-if="!existingApplication || existingApplication.status === 'rejected'" class="bg-white rounded-3xl shadow-card p-8 lg:p-12 border border-border/50">
        <!-- Error Message -->
        <div v-if="errorMessage" class="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 text-red-900">
          {{ errorMessage }}
        </div>

        <!-- Success Message -->
        <div v-if="successMessage" class="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 text-green-900">
          {{ successMessage }}
        </div>

        <form @submit.prevent="submitApplication" class="space-y-8">
          <!-- Personal Information -->
          <div class="space-y-6">
            <h2 class="text-2xl font-bold text-secondary">Персональная информация</h2>

            <!-- Name -->
            <div>
              <label for="name" class="block text-sm font-semibold text-secondary mb-2">
                Ваше имя *
              </label>
              <input
                id="name"
                v-model="form.name"
                type="text"
                placeholder="Введите ваше имя"
                class="w-full px-4 py-3 rounded-xl border border-border/50 bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                required
              />
            </div>

            <!-- Age and Gender -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label for="age" class="block text-sm font-semibold text-secondary mb-2">
                  Возраст *
                </label>
                <input
                  id="age"
                  v-model.number="form.age"
                  type="number"
                  min="18"
                  max="120"
                  placeholder="18+"
                  class="w-full px-4 py-3 rounded-xl border border-border/50 bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                  required
                />
              </div>
              <div>
                <label for="gender" class="block text-sm font-semibold text-secondary mb-2">
                  Пол *
                </label>
                <div class="w-full px-4 py-3 rounded-xl border border-border/50 bg-gray-50 flex items-center">
                  <span class="text-secondary font-medium">
                    {{ form.gender && (form.gender === 'Женщина' || form.gender === 'Мужчина') ? form.gender : (form.gender === 'male' ? 'Мужчина' : form.gender === 'female' ? 'Женщина' : 'Не указан') }}
                  </span>
                  <span class="text-xs text-secondary/50 ml-2">(из профиля)</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Experience -->
          <div>
            <label for="experience" class="block text-sm font-semibold text-secondary mb-2">
              Уровень опыта в поддержке других людей *
            </label>
            <select
              id="experience"
              v-model="form.experience"
              class="w-full px-4 py-3 rounded-xl border border-border/50 bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
              required
            >
              <option value="Начинающий">Начинающий (первый раз помогу людям)</option>
              <option value="Опытный специалист">Опытный специалист (имею опыт в поддержке)</option>
            </select>
          </div>

          <!-- About You -->
          <div>
            <label for="bio" class="block text-sm font-semibold text-secondary mb-2">
              Расскажите о себе (минимум 50 символов) *
            </label>
            <textarea
              id="bio"
              v-model="form.bio"
              placeholder="Опишите свой опыт, интересы, и почему вы хотите стать спутником..."
              rows="5"
              class="w-full px-4 py-3 rounded-xl border border-border/50 bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition resize-none"
              required
            ></textarea>
            <p class="text-xs text-secondary/60 mt-2">
              {{ form.bio.length }} символов
            </p>
          </div>

          <!-- Areas of Support -->
          <div>
            <label class="block text-sm font-semibold text-secondary mb-4">
              Области поддержки (выберите хотя бы одну) *
            </label>
            <div v-if="topics.length > 0" class="grid grid-cols-2 gap-3">
              <button
                v-for="topic in topics"
                :key="topic.id"
                type="button"
                @click="toggleTopic(topic.id)"
                :class="[
                  'px-4 py-3 rounded-xl border-2 font-medium transition text-sm',
                  form.topics.includes(topic.id)
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border/50 bg-white text-secondary hover:border-primary'
                ]"
              >
                ✓ {{ topic.name }}
              </button>
            </div>
          </div>

          <!-- Motivation Message -->
          <div>
            <label for="message" class="block text-sm font-semibold text-secondary mb-2">
              Почему вы хотите стать спутником? (опционально)
            </label>
            <textarea
              id="message"
              v-model="form.message"
              placeholder="Расскажите о ваших мотивациях и целях..."
              rows="4"
              class="w-full px-4 py-3 rounded-xl border border-border/50 bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition resize-none"
            ></textarea>
          </div>

          <!-- Submit Button -->
          <div class="flex gap-4 pt-6">
            <button
              type="button"
              @click="router.back()"
              class="flex-1 px-6 py-3 rounded-full border-2 border-border text-secondary font-semibold hover:border-primary hover:text-primary transition"
            >
              Отмена
            </button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="flex-1 px-6 py-3 rounded-full bg-gradient-to-r from-primary to-primary/90 text-white font-semibold hover:shadow-hover hover:translate-y-[-2px] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isSubmitting ? 'Отправка...' : 'Отправить заявку' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
