<template>
  <div class="bg-white border border-border/50 rounded-3xl p-8 shadow-card">
    <h2 class="text-2xl font-bold text-secondary mb-6">
      {{ isEdit ? 'Редактировать спутника' : 'Добавить спутника' }}
    </h2>

    <!-- Form -->
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Name -->
      <div>
        <label class="block text-sm font-semibold text-secondary mb-2">Имя</label>
        <input
          v-model="formData.name"
          type="text"
          required
          class="w-full px-4 py-2 border border-border rounded-xl text-secondary focus:outline-none focus:border-primary"
        />
      </div>

      <!-- Age and Gender -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-semibold text-secondary mb-2">Возраст</label>
          <input
            v-model.number="formData.age"
            type="number"
            min="18"
            max="120"
            required
            class="w-full px-4 py-2 border border-border rounded-xl text-secondary focus:outline-none focus:border-primary"
          />
        </div>
        <div>
          <label class="block text-sm font-semibold text-secondary mb-2">Пол</label>
          <select
            v-model="formData.gender"
            class="w-full px-4 py-2 border border-border rounded-xl text-secondary focus:outline-none focus:border-primary"
          >
            <option value="female">Женщина</option>
            <option value="male">Мужчина</option>
          </select>
        </div>
      </div>

      <!-- Experience -->
      <div>
        <label class="block text-sm font-semibold text-secondary mb-2">Опыт в терапии</label>
        <select
          v-model="formData.experience"
          class="w-full px-4 py-2 border border-border rounded-xl text-secondary focus:outline-none focus:border-primary"
        >
          <option value="beginner">До 1 года</option>
          <option value="experienced">2+ года</option>
          <option value="expert">5+ лет</option>
        </select>
      </div>

      <!-- Bio -->
      <div>
        <label class="block text-sm font-semibold text-secondary mb-2">Описание</label>
        <textarea
          v-model="formData.bio"
          rows="4"
          class="w-full px-4 py-2 border border-border rounded-xl text-secondary focus:outline-none focus:border-primary"
        ></textarea>
      </div>

      <!-- Specializations -->
      <div>
        <label class="block text-sm font-semibold text-secondary mb-3">Направления</label>
        <div class="space-y-2 max-h-48 overflow-y-auto">
          <label v-for="spec in specializations" :key="spec.id" class="flex items-center gap-2">
            <input
              type="checkbox"
              :value="spec.id"
              v-model.number="formData.specializationIds"
              class="w-4 h-4 accent-primary rounded"
            />
            <span class="text-secondary">{{ spec.name }}</span>
          </label>
        </div>
        <p v-if="formData.specializationIds.length > 0" class="text-xs text-secondary/60 mt-2">
          Выбрано: {{ formData.specializationIds.length }}
        </p>
      </div>

      <!-- Image -->
      <div>
        <label class="block text-sm font-semibold text-secondary mb-2">Фото (URL)</label>
        <input
          v-model="formData.image"
          type="url"
          class="w-full px-4 py-2 border border-border rounded-xl text-secondary focus:outline-none focus:border-primary"
        />
      </div>

      <!-- Is Available -->
      <div class="flex items-center gap-2">
        <input
          v-model="formData.is_available"
          type="checkbox"
          class="w-4 h-4 accent-primary rounded"
        />
        <label class="text-sm font-semibold text-secondary">Доступен</label>
      </div>

      <!-- Error Message -->
      <div v-if="errorMessage" class="p-3 bg-red-100 border border-red-300 rounded-xl text-red-700 text-sm">
        {{ errorMessage }}
      </div>

      <!-- Buttons -->
      <div class="flex gap-3 pt-4">
        <button
          type="submit"
          :disabled="isLoading"
          class="flex-1 py-3 bg-gradient-to-r from-primary to-primary/90 text-white font-semibold rounded-full shadow-soft hover:shadow-hover transition-all disabled:opacity-50"
        >
          {{ isLoading ? 'Сохранение...' : isEdit ? 'Обновить' : 'Добавить' }}
        </button>
        <button
          type="button"
          @click="$emit('close')"
          class="flex-1 py-3 text-secondary font-semibold border-2 border-border rounded-full hover:border-primary hover:text-primary transition-all"
        >
          Отмена
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/utils/supabase'
import { loadSpecializations, specializations, getCompanionSpecializations, updateCompanionSpecializations } from '@/composables/useAppState'

interface Props {
  companion?: any
  isEdit?: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'saved'): void
}

const props = withDefaults(defineProps<Props>(), {
  isEdit: false
})

const emit = defineEmits<Emits>()

const isLoading = ref(false)
const errorMessage = ref('')

const formData = ref({
  name: '',
  age: 28,
  gender: 'female',
  experience: 'experienced',
  bio: '',
  image: '',
  specializationIds: [] as number[],
  is_available: true
})

onMounted(async () => {
  // Load specializations
  await loadSpecializations()

  // If editing, load companion data
  if (props.isEdit && props.companion) {
    formData.value.name = props.companion.name
    formData.value.age = props.companion.age
    formData.value.gender = props.companion.gender || 'female'
    formData.value.experience = props.companion.experience || 'experienced'
    formData.value.bio = props.companion.bio
    formData.value.image = props.companion.image
    formData.value.is_available = props.companion.is_available !== false

    // Load companion specializations
    const specs = await getCompanionSpecializations(props.companion.id)
    formData.value.specializationIds = specs.map(s => s.id)
  }
})

const handleSubmit = async () => {
  try {
    isLoading.value = true
    errorMessage.value = ''

    if (props.isEdit && props.companion) {
      // Update existing companion
      const { error: updateError } = await supabase
        .from('companions')
        .update({
          name: formData.value.name,
          age: formData.value.age,
          gender: formData.value.gender,
          experience: formData.value.experience,
          bio: formData.value.bio,
          image: formData.value.image,
          is_available: formData.value.is_available
        })
        .eq('id', props.companion.id)

      if (updateError) throw updateError

      // Update specializations
      await updateCompanionSpecializations(props.companion.id, formData.value.specializationIds)
    } else {
      // Create new companion
      const { data: newCompanion, error: createError } = await supabase
        .from('companions')
        .insert([{
          name: formData.value.name,
          age: formData.value.age,
          gender: formData.value.gender,
          experience: formData.value.experience,
          bio: formData.value.bio,
          image: formData.value.image,
          is_available: formData.value.is_available,
          specialization: '' // Legacy field
        }])
        .select()
        .single()

      if (createError) throw createError

      // Add specializations
      if (formData.value.specializationIds.length > 0) {
        await updateCompanionSpecializations(newCompanion.id, formData.value.specializationIds)
      }
    }

    emit('saved')
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Ошибка при сохранении'
    console.error('Error saving companion:', err)
  } finally {
    isLoading.value = false
  }
}
</script>
