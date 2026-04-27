<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { currentUser, updateUserProfile, loadTopics, topics } from '../composables/useAppState'
import { isLoggedIn } from '../composables/useAppState'
import { supabase } from '@/utils/supabase'

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
  <div class="min-h-screen bg-gradient-to-b from-primary/5 via-white to-white pt-[140px] pb-12">
    <div class="layout-container max-w-2xl">
      <!-- Header -->
      <div class="text-center mb-12">
        <h1 class="text-4xl lg:text-5xl font-bold text-secondary mb-4">
          Создайте вашу <span class="text-primary">анкету</span>
        </h1>
        <p class="text-xl text-secondary/60">
          Помогите другим понять, кто вы, чтобы мы смогли найти подходящих собеседников
        </p>
      </div>

      <!-- Progress Bar -->
      <div class="mb-12">
        <div class="flex justify-between mb-3">
          <span class="text-sm font-semibold text-secondary">Шаг {{ step }} из {{ totalSteps }}</span>
          <span class="text-sm font-semibold text-primary">{{ progress }}%</span>
        </div>
        <div class="w-full h-2 bg-light-bg rounded-full overflow-hidden">
          <div
            class="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-300 ease-out"
            :style="{ width: `${progress}%` }"
          ></div>
        </div>
      </div>

      <!-- Error Message -->
      <transition name="fade">
        <div v-if="errorMessage" class="mb-6 p-4 bg-red-100 border border-red-300 rounded-2xl text-red-700 text-sm">
          {{ errorMessage }}
        </div>
      </transition>

      <!-- Success Message -->
      <transition name="fade">
        <div v-if="successMessage" class="mb-6 p-4 bg-green-100 border border-green-300 rounded-2xl text-green-700 text-sm">
          {{ successMessage }}
        </div>
      </transition>

      <!-- Form Content -->
      <div class="card">
        <!-- Step 1: Age & Gender -->
        <div v-if="step === 1" class="space-y-8 animate-fade-in">
          <div>
            <h2 class="text-2xl font-bold text-secondary mb-6">Основная информация</h2>

            <!-- Age -->
            <div class="mb-8">
              <label class="form-label">Ваш возраст *</label>
              <div class="flex gap-3 mb-4">
                <input
                  v-model.number="profileSetup.age"
                  type="number"
                  min="18"
                  max="120"
                  placeholder="Введите возраст"
                  class="input flex-1"
                />
                <div v-if="profileSetup.age" class="flex items-center gap-2 px-4 py-3 bg-light-bg rounded-xl">
                  <span class="text-sm text-secondary">{{ profileSetup.age }}</span>
                </div>
              </div>
            </div>

            <!-- Gender -->
            <div>
              <label class="form-label">Ваш пол *</label>
              <div class="grid grid-cols-2 gap-4">
                <button
                  @click="profileSetup.gender = 'Женщина'"
                  :class="[
                    'p-4 rounded-2xl border-2 transition-all text-center font-semibold',
                    profileSetup.gender === 'Женщина'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-white text-secondary hover:border-primary/50'
                  ]"
                >
                  Женщина
                </button>
                <button
                  @click="profileSetup.gender = 'Мужчина'"
                  :class="[
                    'p-4 rounded-2xl border-2 transition-all text-center font-semibold',
                    profileSetup.gender === 'Мужчина'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-white text-secondary hover:border-primary/50'
                  ]"
                >
                  Мужчина
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 2: Bio & Topics -->
        <div v-if="step === 2" class="space-y-8 animate-fade-in">
          <div>
            <h2 class="text-2xl font-bold text-secondary mb-6">О вас</h2>

            <!-- Bio -->
            <div class="mb-8">
              <label class="form-label">Расскажите о себе *</label>
              <p class="text-xs text-secondary/60 mb-2">
                Поделитесь информацией о себе, своих интересах или том, что вы ищете в разговорах
              </p>
              <textarea
                v-model="profileSetup.bio"
                rows="5"
                placeholder="Напишите несколько предложений о себе..."
                class="w-full px-4 py-3 border border-border rounded-xl text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              ></textarea>
              <p class="text-xs text-secondary/50 mt-2">
                {{ profileSetup.bio.length }}/500 символов
              </p>
            </div>

            <!-- Topics -->
            <div>
              <label class="form-label">Выберите темы для разговоров *</label>
              <p class="text-xs text-secondary/60 mb-4">
                Выберите хотя бы одну тему, которая вас интересует
              </p>
              <div class="flex flex-wrap gap-3">
                <button
                  v-for="topic in topics"
                  :key="topic"
                  @click="toggleTopic(topic)"
                  :class="[
                    'px-4 py-2 rounded-full text-sm font-medium transition-all',
                    profileSetup.selectedTopics.includes(topic)
                      ? 'bg-primary text-white shadow-soft'
                      : 'bg-white border border-border/50 text-secondary hover:border-primary hover:text-primary'
                  ]"
                >
                  {{ topic }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 3: Photo -->
        <div v-if="step === 3" class="space-y-8 animate-fade-in">
          <div>
            <h2 class="text-2xl font-bold text-secondary mb-6">Загрузите фото (опционально)</h2>

            <!-- Photo Preview -->
            <div class="mb-8 text-center">
              <div v-if="previewImage" class="mb-6">
                <img
                  :src="previewImage"
                  alt="Profile preview"
                  class="w-40 h-40 rounded-full mx-auto object-cover border-4 border-primary/20"
                />
              </div>
              <div v-else class="mb-6 w-40 h-40 rounded-full mx-auto bg-light-bg border-4 border-dashed border-border flex items-center justify-center">
                <span class="text-4xl">📸</span>
              </div>
            </div>

            <!-- Upload Input -->
            <div class="mb-6">
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
              <p class="text-xs text-secondary/60 mt-2">Максимальный размер: 5MB</p>
            </div>

            <!-- Info -->
            <div class="p-4 bg-light-bg rounded-2xl">
              <p class="text-sm text-secondary/70">
                Фото помогает другим пользователям лучше вас узнать. Вы можете загрузить его сейчас или позже в настройках профиля.
              </p>
            </div>
          </div>
        </div>

        <!-- Buttons -->
        <div class="mt-12 flex gap-4">
          <button
            v-if="step > 1"
            @click="handlePreviousStep"
            class="px-8 py-3 text-secondary font-semibold border border-border rounded-full hover:border-primary hover:text-primary transition-all"
          >
            Назад
          </button>

          <button
            v-if="step < totalSteps"
            @click="handleNextStep"
            class="flex-1 px-8 py-3 bg-gradient-to-r from-primary to-primary/90 text-white font-semibold rounded-full shadow-soft hover:shadow-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Далее
          </button>

          <button
            v-if="step === totalSteps"
            @click="handleCompleteSetup"
            :disabled="isLoading"
            class="flex-1 px-8 py-3 bg-gradient-to-r from-primary to-primary/90 text-white font-semibold rounded-full shadow-soft hover:shadow-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="!isLoading">Завершить и найти собеседников</span>
            <span v-else>Сохранение...</span>
          </button>
        </div>
      </div>

      <!-- Skip Link -->
      <div class="text-center mt-8">
        <button
          @click="handleSkip"
          class="text-secondary/60 hover:text-secondary text-sm font-medium transition-colors"
        >
          Пропустить шаг
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

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
