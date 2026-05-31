<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { currentUser, loadCurrentUser } from '@/composables/useAppState'
import { submitCompanionApplication, getUserApplication } from '@/services/supabaseService'
import { supabase } from '@/utils/supabase'
import LoaderAnimation from '@/components/LoaderAnimation.vue'
import '@/assets/become-companion.css'

const router = useRouter()
const isLoading = ref(false)
const isSubmitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const topics = ref<any[]>([])
const existingApplication = ref<any>(null)
const isUploadingImage = ref(false)
const imagePreview = ref<string>('')

const form = ref({
  name: '',
  age: null as number | null,
  gender: '',
  experience: 'до года',
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
      imagePreview.value = user.image || ''

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

const handleImageUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  // Show preview immediately for UX
  const reader = new FileReader()
  reader.onload = (e) => {
    imagePreview.value = e.target?.result as string
  }
  reader.readAsDataURL(file)

  try {
    isUploadingImage.value = true
    errorMessage.value = ''

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      errorMessage.value = 'Размер файла не должен превышать 5MB'
      return
    }

    // Upload to Supabase Storage (same as profile setup)
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`
    const filePath = `profile-images/${Date.now()}-${fileName}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file)

    if (uploadError) {
      console.error('Upload error details:', uploadError)
      throw uploadError
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    form.value.image = publicUrlData.publicUrl
    console.log('Image uploaded successfully:', form.value.image)
  } catch (error) {
    errorMessage.value = `Ошибка: ${error instanceof Error ? error.message : 'неизвестная ошибка'}. Убедитесь, что бакет 'avatars' создан в Supabase Storage.`
    console.error('Image upload error:', error)
    imagePreview.value = ''
    form.value.image = ''
  } finally {
    isUploadingImage.value = false
  }
}

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
  <div class="become-companion-wrapper">
    <div class="become-companion-container">
      <!-- Header -->
      <div class="become-companion-header">
        <h1 class="become-companion-title">Стань спутником</h1>
        <p class="become-companion-subtitle">
          Помогайте людям в их пути и получайте вознаграждение за вашу поддержку
        </p>
      </div>

      <!-- Existing Application Status -->
      <div v-if="existingApplication">
        <div
          v-if="existingApplication.status === 'pending'"
          class="become-companion-status become-companion-status-pending"
        >
          <div class="become-companion-status-icon">⏳</div>
          <div class="become-companion-status-content">
            <div class="become-companion-status-title">Ваша заявка на рассмотрении</div>
            <div class="become-companion-status-message">
              Спасибо за вашу заинтересованность! Администратор рассмотрит вашу заявку и свяжется с вами.
            </div>
          </div>
        </div>
        <div
          v-else-if="existingApplication.status === 'approved'"
          class="become-companion-status become-companion-status-approved"
        >
          <div class="become-companion-status-icon">✅</div>
          <div class="become-companion-status-content">
            <div class="become-companion-status-title">Ваша заявка одобрена!</div>
            <div class="become-companion-status-message">
              Поздравляем! Вы теперь спутник на платформе. Люди могут найти вас в поиске и отправить вам заявку на общение.
            </div>
          </div>
        </div>
        <div
          v-else-if="existingApplication.status === 'rejected'"
          class="become-companion-status become-companion-status-rejected"
        >
          <div class="become-companion-status-icon">❌</div>
          <div class="become-companion-status-content">
            <div class="become-companion-status-title">Ваша заявка была отклонена</div>
            <div class="become-companion-status-message">
              {{ existingApplication.rejection_reason }}
            </div>
            <div class="become-companion-status-message become-companion-mt">
              Вы можете отправить новую заявку с обновленной информацией.
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="become-companion-loading">
        <LoaderAnimation type="gradient" size="lg" />
        <p class="become-companion-loading-text">Загрузка...</p>
      </div>

      <!-- Form -->
      <div v-else-if="!existingApplication || existingApplication.status === 'rejected'" class="become-companion-form-card">
        <!-- Error Message -->
        <div v-if="errorMessage" class="become-companion-response-message become-companion-response-error">
          {{ errorMessage }}
        </div>

        <!-- Success Message -->
        <div v-if="successMessage" class="become-companion-response-message become-companion-response-success">
          {{ successMessage }}
        </div>

        <form @submit.prevent="submitApplication">
          <!-- Personal Information Section -->
          <div class="become-companion-form-section">
            <h2 class="become-companion-form-section-title">Персональная информация</h2>

            <!-- Profile Photo -->
            <div class="become-companion-form-group">
              <label for="image" class="become-companion-label">
                Ваша фотография
              </label>
              <div style="display: flex; gap: 1rem; align-items: flex-start;">
                <div style="flex-shrink: 0;">
                  <div v-if="imagePreview" style="width: 120px; height: 120px; border-radius: 8px; overflow: hidden; background: #f0f0f0;">
                    <img :src="imagePreview" alt="Preview" style="width: 100%; height: 100%; object-fit: cover;" />
                  </div>
                  <div v-else style="width: 120px; height: 120px; border-radius: 8px; background: #f0f0f0; display: flex; align-items: center; justify-content: center; color: #999;">
                    Нет фото
                  </div>
                </div>
                <div style="flex: 1;">
                  <label for="image-input" style="display: block; padding: 1rem; border: 2px dashed #ddd; border-radius: 8px; text-align: center; cursor: pointer; transition: all 0.2s;">
                    <span style="display: block; font-size: 0.9rem; color: #666;">Нажмите для загрузки фото или перетащите файл сюда</span>
                  </label>
                  <input
                    id="image-input"
                    type="file"
                    accept="image/*"
                    @change="handleImageUpload"
                    :disabled="isUploadingImage"
                    style="display: none;"
                  />
                  <p style="font-size: 0.85rem; color: #999; margin-top: 0.5rem;">Рекомендуемый размер: 500×500px, максимум 5MB</p>
                </div>
              </div>
            </div>

            <!-- Name -->
            <div class="become-companion-form-group">
              <label for="name" class="become-companion-label become-companion-label-required">
                Ваше имя
              </label>
              <input
                id="name"
                v-model="form.name"
                type="text"
                placeholder="Введите ваше имя"
                class="become-companion-input"
                required
              />
            </div>

            <!-- Age and Gender -->
            <div class="become-companion-form-grid-2">
              <div class="become-companion-form-group">
                <label for="age" class="become-companion-label become-companion-label-required">
                  Возраст
                </label>
                <input
                  id="age"
                  v-model.number="form.age"
                  type="number"
                  min="18"
                  max="120"
                  placeholder="18+"
                  class="become-companion-input"
                  required
                />
              </div>
              <div class="become-companion-form-group">
                <label for="gender" class="become-companion-label become-companion-label-required">
                  Пол
                </label>
                <div class="become-companion-readonly">
                  <span>
                    {{ form.gender && (form.gender === 'Женщина' || form.gender === 'Мужчина') ? form.gender : (form.gender === 'male' ? 'Мужчина' : form.gender === 'female' ? 'Женщина' : 'Не указан') }}
                  </span>
                  <span class="become-companion-readonly-label">(из профиля)</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Experience -->
          <div class="become-companion-form-group">
            <label for="experience" class="become-companion-label become-companion-label-required">
              Уровень опыта в поддержке других людей
            </label>
            <select
              id="experience"
              v-model="form.experience"
              class="become-companion-select"
              required
            >
              <option value="до года">До 1 года (первый раз помогу людям)</option>
              <option value="1-3 года">1–3 года (имею опыт в поддержке)</option>
              <option value="более 3 лет">3+ лет (многолетний опыт в поддержке)</option>
            </select>
          </div>

          <!-- About You -->
          <div class="become-companion-form-group">
            <label for="bio" class="become-companion-label become-companion-label-required">
              Расскажите о себе <span class="become-companion-label-optional">(минимум 50 символов)</span>
            </label>
            <textarea
              id="bio"
              v-model="form.bio"
              placeholder="Опишите свой опыт, интересы, и почему вы хотите стать спутником..."
              class="become-companion-textarea"
              required
            ></textarea>
            <div class="become-companion-counter">
              {{ form.bio.length }} символов
            </div>
          </div>

          <!-- Areas of Support -->
          <div class="become-companion-form-group">
            <label class="become-companion-label become-companion-label-required">
              Области поддержки <span class="become-companion-label-optional">(выберите хотя бы одну)</span>
            </label>
            <div v-if="topics.length > 0" class="become-companion-topics-grid">
              <button
                v-for="topic in topics"
                :key="topic.id"
                type="button"
                @click="toggleTopic(topic.id)"
                :class="[
                  'become-companion-topic-btn',
                  form.topics.includes(topic.id) ? 'become-companion-topic-btn--selected' : ''
                ]"
              >
                <span v-if="form.topics.includes(topic.id)" class="become-companion-topic-btn-checkmark">✓</span>
                {{ topic.name }}
              </button>
            </div>
          </div>

          <!-- Motivation Message -->
          <div class="become-companion-form-group">
            <label for="message" class="become-companion-label">
              Почему вы хотите стать спутником? <span class="become-companion-label-optional">(опционально)</span>
            </label>
            <textarea
              id="message"
              v-model="form.message"
              placeholder="Расскажите о ваших мотивациях и целях..."
              class="become-companion-textarea"
            ></textarea>
          </div>

          <!-- Submit Buttons -->
          <div class="become-companion-form-actions">
            <button
              type="button"
              @click="router.back()"
              class="become-companion-btn become-companion-btn-secondary"
            >
              Отмена
            </button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="become-companion-btn become-companion-btn-primary"
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
