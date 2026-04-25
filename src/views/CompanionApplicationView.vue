<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { currentUser } from '@/composables/useAppState'
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
    const user = currentUser()
    
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

    // Prefill form with user data
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (userData) {
      form.value.name = userData.name || ''
      form.value.age = userData.age || null
      form.value.gender = userData.gender || ''
      form.value.bio = userData.bio || ''
      form.value.image = userData.image || ''
      form.value.topics = userData.topics || []
    }

    // Fetch available topics
    const { data: topicsData } = await supabase
      .from('companion_topics')
      .select('*')
      .order('name', { ascending: true })

    if (topicsData) {
      topics.value = topicsData
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
      errorMessage.value = 'Пожалуйста, выберите пол'
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

    isSubmitting.value = true

    const user = currentUser()
    if (!user) {
      router.push('/auth')
      return
    }

    const result = await submitCompanionApplication(user.id, form.value)

    if (result) {
      successMessage.value = 'Спасибо! Ваша заявка подана на рассмотрение. Администратор свяжется с вами в ближайшее время.'
      existingApplication.value = result
      // Reset form
      setTimeout(() => {
        router.push('/profile')
      }, 2000)
    } else {
      errorMessage.value = 'Ошибка при отправке заявки. Пожалуйста, попробуйте позже.'
    }
  } catch (error) {
    console.error('Error submitting application:', error)
    errorMessage.value = 'Ошибка при отправке заявки'
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
                <select
                  id="gender"
                  v-model="form.gender"
                  class="w-full px-4 py-3 rounded-xl border border-border/50 bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                  required
                >
                  <option value="">Выберите пол</option>
                  <option value="Мужчина">Мужчина</option>
                  <option value="Женщина">Женщина</option>
                  <option value="Другое">Другое</option>
                </select>
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
