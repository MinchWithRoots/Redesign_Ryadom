<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { currentUser, updateUserProfile, loadTopics, topics } from '../composables/useAppState'
import { isLoggedIn } from '../composables/useAppState'
import { supabase } from '@/utils/supabase'
import '@/assets/profile-setup.css'

const router = useRouter()
const step = ref(1) // Step 1: Age & Gender, Step 2: Bio & Topics, Step 3: Photo
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const totalSteps = 3

const profileSetup = ref({
  age: null as number | null,
  gender: '',
  bio: '',
  selectedTopics: [] as string[],
  image: '',
})

const previewImage = ref<string>('')

// Computed progress
const progress = computed(() => Math.round((step.value / totalSteps) * 100))

onMounted(async () => {
  // Check if user is logged in
  if (!isLoggedIn()) {
    router.push('/auth')
    return
  }

  // Load topics
  try {
    await loadTopics()
  } catch (err) {
    console.error('Failed to load topics:', err)
  }

  // Pre-populate with existing user data
  if (currentUser.value) {
    profileSetup.value.age = currentUser.value.age || null
    profileSetup.value.bio = currentUser.value.bio || ''
    profileSetup.value.image = currentUser.value.image || ''
    if (profileSetup.value.image) {
      previewImage.value = profileSetup.value.image
    }
  }
})

const handleImageUpload = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  // Show preview immediately
  const reader = new FileReader()
  reader.onload = (e) => {
    const preview = e.target?.result as string
    previewImage.value = preview
  }
  reader.readAsDataURL(file)

  try {
    errorMessage.value = ''

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      throw new Error('Размер файла не должен превышать 5MB')
    }

    // Upload to Supabase Storage
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

    profileSetup.value.image = publicUrlData.publicUrl
    console.log('Image uploaded successfully:', profileSetup.value.image)
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Ошибка при загрузке фото'
    errorMessage.value = `Ошибка: ${errorMsg}. Убедитесь, что бакет 'avatars' создан в Supabase Storage.`
    console.error('Image upload error:', err)
    previewImage.value = ''
  }
}

const handleNextStep = () => {
  errorMessage.value = ''

  if (step.value === 1) {
    if (!profileSetup.value.age) {
      errorMessage.value = 'Пожалуйста, укажите ваш возраст'
      return
    }
    if (!profileSetup.value.gender) {
      errorMessage.value = 'Пожалуйста, выберите ваш пол'
      return
    }
  } else if (step.value === 2) {
    if (!profileSetup.value.bio.trim()) {
      errorMessage.value = 'Пожалуйста, расскажите о себе'
      return
    }
    if (profileSetup.value.selectedTopics.length === 0) {
      errorMessage.value = 'Пожалуйста, выберите хотя бы одну тему'
      return
    }
  }

  step.value++
}

const handlePreviousStep = () => {
  step.value--
}

const toggleTopic = (topic: string) => {
  const index = profileSetup.value.selectedTopics.indexOf(topic)
  if (index > -1) {
    profileSetup.value.selectedTopics.splice(index, 1)
  } else {
    profileSetup.value.selectedTopics.push(topic)
  }
}

const handleCompleteSetup = async () => {
  errorMessage.value = ''
  isLoading.value = true

  try {
    await updateUserProfile({
      bio: profileSetup.value.bio,
      image: profileSetup.value.image || undefined,
      age: profileSetup.value.age || undefined,
      gender: profileSetup.value.gender || undefined,
      topics: profileSetup.value.selectedTopics,
    })

    successMessage.value = 'Анкета успешно создана!'
    setTimeout(() => {
      // Redirect to search page
      router.push('/search')
    }, 500)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Ошибка при сохранении анкеты'
    errorMessage.value = message
    console.error('Profile setup error:', message)
  } finally {
    isLoading.value = false
  }
}

const handleSkip = () => {
  // Allow skipping but still show minimal warning
  if (step.value < totalSteps) {
    handleNextStep()
  } else {
    handleCompleteSetup()
  }
}
</script>

<template>
  <div class="profile-setup-layout">
    <div class="layout-container">
      <!-- Header -->
      <div class="profile-setup__header">
        <h1 class="profile-setup__title">
          Создайте вашу <span class="profile-setup__title-highlight">анкету</span>
        </h1>
        <p class="profile-setup__subtitle">
          Помогите другим понять, кто вы, чтобы мы смогли найти подходящих собеседников
        </p>
      </div>

      <!-- Progress Bar -->
      <div class="profile-setup__progress">
        <div class="profile-setup__progress-info">
          <span class="profile-setup__progress-step">Шаг {{ step }} из {{ totalSteps }}</span>
          <span class="profile-setup__progress-percentage">{{ progress }}%</span>
        </div>
        <div class="profile-setup__progress-bar">
          <div
            class="profile-setup__progress-fill"
            :style="{ width: `${progress}%` }"
          ></div>
        </div>
      </div>

      <!-- Error Message -->
      <transition name="fade">
        <div v-if="errorMessage" class="profile-setup__message profile-setup__message--error">
          {{ errorMessage }}
        </div>
      </transition>

      <!-- Success Message -->
      <transition name="fade">
        <div v-if="successMessage" class="profile-setup__message profile-setup__message--success">
          {{ successMessage }}
        </div>
      </transition>

      <!-- Form Content -->
      <div class="card">
        <!-- Step 1: Age & Gender -->
        <div v-if="step === 1" class="profile-setup__fade-in">
          <div class="profile-setup__section">
            <h2 class="profile-setup__section-title">Основная информация</h2>

            <!-- Age -->
            <div class="profile-setup__bio-container">
              <label class="form-label">Ваш возраст *</label>
              <div class="profile-setup__age-input-group">
                <input
                  v-model.number="profileSetup.age"
                  type="number"
                  min="18"
                  max="120"
                  placeholder="Введите возраст"
                  class="input"
                />
                <div v-if="profileSetup.age" class="profile-setup__age-display">
                  <span>{{ profileSetup.age }}</span>
                </div>
              </div>
            </div>

            <!-- Gender -->
            <div class="profile-setup__bio-container">
              <label class="form-label">Ваш пол *</label>
              <div class="profile-setup__gender-grid">
                <button
                  @click="profileSetup.gender = 'Женщина'"
                  :class="[
                    'profile-setup__gender-button',
                    { 'is-selected': profileSetup.gender === 'Женщина' }
                  ]"
                >
                  Женщина
                </button>
                <button
                  @click="profileSetup.gender = 'Мужчина'"
                  :class="[
                    'profile-setup__gender-button',
                    { 'is-selected': profileSetup.gender === 'Мужчина' }
                  ]"
                >
                  Мужчина
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 2: Bio & Topics -->
        <div v-if="step === 2" class="profile-setup__fade-in">
          <div class="profile-setup__section">
            <h2 class="profile-setup__section-title">О вас</h2>

            <!-- Bio -->
            <div class="profile-setup__bio-container">
              <label class="form-label">Расскажите о себе *</label>
              <p class="profile-setup__bio-label">
                Поделитесь информацией о себе, своих интересах или том, что вы ищете в разговорах
              </p>
              <textarea
                v-model="profileSetup.bio"
                rows="5"
                placeholder="Напишите несколько предложений о себе..."
                class="profile-setup__bio-input"
              ></textarea>
              <p class="profile-setup__bio-counter">
                {{ profileSetup.bio.length }}/500 символов
              </p>
            </div>

            <!-- Topics -->
            <div>
              <label class="form-label">Выберите темы для разговоров *</label>
              <p class="profile-setup__bio-label" style="margin-bottom: 1rem;">
                Выберите хотя бы одну тему, которая вас интересует
              </p>
              <div class="profile-setup__topics-container">
                <button
                  v-for="topic in topics"
                  :key="topic"
                  @click="toggleTopic(topic)"
                  :class="[
                    'profile-setup__topic-button',
                    { 'is-selected': profileSetup.selectedTopics.includes(topic) }
                  ]"
                >
                  {{ topic }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 3: Photo -->
        <div v-if="step === 3" class="profile-setup__fade-in">
          <div class="profile-setup__photo-section">
            <h2 class="profile-setup__photo-title">Загрузите фото (опционально)</h2>

            <!-- Photo Preview -->
            <div class="profile-setup__photo-display">
              <div v-if="previewImage">
                <img
                  :src="previewImage"
                  alt="Profile preview"
                  class="profile-setup__photo-preview-image"
                />
              </div>
              <div v-else class="profile-setup__photo-placeholder-container">
                <span>📸</span>
              </div>
            </div>

            <!-- Upload Input -->
            <div class="profile-setup__file-input-wrapper">
              <label class="profile-setup__file-input-label">
                <span class="sr-only">Выберите фото</span>
                <input
                  type="file"
                  accept="image/*"
                  @change="handleImageUpload"
                  class="profile-setup__file-input-hidden"
                />
              </label>
              <p class="profile-setup__file-size-info">Максимальный размер: 5MB</p>
            </div>

            <!-- Info -->
            <div class="profile-setup__photo-info-box">
              <p>
                Фото помогает другим пользователям лучше вас узнать. Вы можете загрузить его сейчас или позже в настройках профиля.
              </p>
            </div>
          </div>
        </div>

        <!-- Buttons -->
        <div class="profile-setup__buttons">
          <button
            v-if="step > 1"
            @click="handlePreviousStep"
            class="profile-setup__button profile-setup__button--secondary"
          >
            Назад
          </button>

          <button
            v-if="step < totalSteps"
            @click="handleNextStep"
            class="profile-setup__button profile-setup__button--primary"
          >
            Далее
          </button>

          <button
            v-if="step === totalSteps"
            @click="handleCompleteSetup"
            :disabled="isLoading"
            class="profile-setup__button profile-setup__button--primary"
          >
            <span v-if="!isLoading">Завершить и найти собеседников</span>
            <span v-else>Сохранение...</span>
          </button>
        </div>
      </div>

      <!-- Skip Link -->
      <div class="profile-setup__skip">
        <button
          @click="handleSkip"
          class="profile-setup__skip-button"
        >
          Пропустить шаг
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
