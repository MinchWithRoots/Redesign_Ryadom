<template>
  <div v-if="isOpen" class="review-modal-overlay" @click.self="closeModal">
    <div class="review-modal">
      <div class="review-modal__header">
        <h2 class="review-modal__title">Оставить отзыв</h2>
        <button class="review-modal__close" @click="closeModal">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <form class="review-modal__form" @submit.prevent="submitReview">
        <!-- Rating -->
        <div class="form-group">
          <label class="form-label">Оценка</label>
          <div class="rating-stars">
            <button
              v-for="i in 5"
              :key="i"
              type="button"
              class="rating-star"
              :class="{ 'rating-star--filled': i <= formData.rating }"
              @click="formData.rating = i"
              @mouseenter="hoverRating = i"
              @mouseleave="hoverRating = 0"
            >
              <img src="/src/images/star.svg" alt="Star" class="rating-star__icon" />
            </button>
          </div>
        </div>

        <!-- Title -->
        <div class="form-group">
          <label class="form-label">Заголовок отзыва</label>
          <input
            v-model="formData.title"
            type="text"
            class="form-input"
            placeholder="Например: Очень помогла разобраться"
            maxlength="100"
          />
        </div>

        <!-- Comment -->
        <div class="form-group">
          <label class="form-label">Комментарий</label>
          <textarea
            v-model="formData.comment"
            class="form-textarea"
            placeholder="Поделитесь впечатлениями от сессии..."
            maxlength="500"
            rows="5"
          ></textarea>
          <div class="form-hint">{{ formData.comment.length }}/500</div>
        </div>

        <!-- Anonymous -->
        <div class="form-group checkbox-group">
          <label class="checkbox-label">
            <input v-model="formData.isAnonymous" type="checkbox" class="checkbox-input" />
            <span class="checkbox-text">Опубликовать анонимно</span>
          </label>
        </div>

        <!-- Error Message -->
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <!-- Submit Button -->
        <div class="form-actions">
          <button type="button" class="btn-secondary" @click="closeModal">Отмена</button>
          <button type="submit" class="btn-primary" :disabled="isSubmitting">
            {{ isSubmitting ? 'Отправка...' : 'Отправить отзыв' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { addReview } from '@/services/supabaseService'

interface Props {
  isOpen: boolean
  companionId: string
  companionName: string
  userId: string
  chatId?: string
}

interface Emits {
  (e: 'close'): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const hoverRating = ref(0)
const isSubmitting = ref(false)
const errorMessage = ref('')

const formData = ref({
  rating: 0,
  title: '',
  comment: '',
  isAnonymous: false,
})

const closeModal = () => {
  resetForm()
  emit('close')
}

const resetForm = () => {
  formData.value = {
    rating: 0,
    title: '',
    comment: '',
    isAnonymous: false,
  }
  errorMessage.value = ''
}

const submitReview = async () => {
  errorMessage.value = ''

  // Validation
  if (formData.value.rating === 0) {
    errorMessage.value = 'Пожалуйста, выберите оценку'
    return
  }

  if (!formData.value.comment.trim()) {
    errorMessage.value = 'Пожалуйста, напишите комментарий'
    return
  }

  isSubmitting.value = true
  try {
    const result = await addReview(
      props.companionId,
      props.userId,
      formData.value.rating,
      formData.value.title,
      formData.value.comment,
      props.chatId,
      formData.value.isAnonymous
    )

    if (!result) {
      throw new Error('Failed to save review')
    }

    resetForm()
    emit('success')
    emit('close')
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Ошибка при отправке отзыва'
    errorMessage.value = message
    console.error('Error submitting review:', err)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.review-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.review-modal {
  background: var(--color-white);
  border-radius: var(--radius-2xl);
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  font-family: 'Inter', sans-serif;
}

.review-modal__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.review-modal__title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-secondary);
  margin: 0;
  font-family: 'Inter', sans-serif;
}

.review-modal__close {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-secondary-60);
  transition: color var(--transition-fast);
  width: 2rem;
  height: 2rem;
}

.review-modal__close:hover {
  color: var(--color-secondary);
}

.review-modal__form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-secondary);
  font-family: 'Inter', sans-serif;
}

.rating-stars {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.rating-star {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform var(--transition-fast);
  opacity: 0.2;
}

.rating-star:hover {
  transform: scale(1.1);
}

.rating-star--filled {
  opacity: 1;
}

.rating-star__icon {
  width: 2rem;
  height: 2rem;
  color: var(--color-primary);
  filter: brightness(0) saturate(100%) invert(38%) sepia(62%) saturate(1373%) hue-rotate(342deg) brightness(107%) contrast(105%);
}

.rating-star--filled .rating-star__icon {
  filter: brightness(0) saturate(100%) invert(74%) sepia(44%) saturate(1219%) hue-rotate(342deg) brightness(104%) contrast(99%);
}

.form-input,
.form-textarea {
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-family: 'Inter', sans-serif;
  color: var(--color-secondary);
  transition: border-color var(--transition-fast);
  background-color: var(--color-white);
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(255, 106, 47, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.form-hint {
  font-size: var(--font-size-xs);
  color: var(--color-secondary-60);
  text-align: right;
  font-family: 'Inter', sans-serif;
}

.checkbox-group {
  gap: 0.5rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
}

.checkbox-input {
  width: 1.125rem;
  height: 1.125rem;
  cursor: pointer;
  accent-color: var(--color-primary);
}

.checkbox-text {
  font-size: var(--font-size-sm);
  color: var(--color-secondary);
  font-family: 'Inter', sans-serif;
}

.error-message {
  padding: 0.75rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: var(--radius-md);
  color: #dc2626;
  font-size: var(--font-size-sm);
  font-family: 'Inter', sans-serif;
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.75rem;
}

.btn-primary,
.btn-secondary {
  padding: 0.625rem 1.5rem;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
  flex: 1;
  font-family: 'Inter', sans-serif;
}

.btn-primary {
  background: var(--color-primary);
  color: var(--color-white);
}

.btn-primary:hover:not(:disabled) {
  background: #d32032;
  box-shadow: 0 4px 12px rgba(255, 106, 47, 0.3);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: transparent;
  color: var(--color-secondary-60);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover {
  background: var(--color-light-bg);
  color: var(--color-secondary);
}
</style>
