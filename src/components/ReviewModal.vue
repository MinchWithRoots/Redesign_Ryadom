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
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
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
  chatId?: string | null
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
    await addReview(
      props.companionId,
      props.userId,
      formData.value.rating,
      formData.value.title,
      formData.value.comment
    )

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
  background: white;
  border-radius: 12px;
  padding: 32px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.review-modal__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.review-modal__title {
  font-size: 22px;
  font-weight: 600;
  color: #000;
  margin: 0;
}

.review-modal__close {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  transition: color 0.2s;
}

.review-modal__close:hover {
  color: #000;
}

.review-modal__form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.rating-stars {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.rating-star {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s;
  color: #ddd;
}

.rating-star:hover {
  transform: scale(1.1);
}

.rating-star--filled {
  color: #ffc107;
}

.form-input,
.form-textarea {
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #3b82f6;
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.form-hint {
  font-size: 12px;
  color: #999;
  text-align: right;
}

.checkbox-group {
  gap: 8px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.checkbox-input {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.checkbox-text {
  font-size: 14px;
  color: #333;
}

.error-message {
  padding: 12px;
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 8px;
  color: #c33;
  font-size: 14px;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 12px;
}

.btn-primary,
.btn-secondary {
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  flex: 1;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
}

.btn-secondary:hover {
  background: #e0e0e0;
}
</style>
