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

      <form ref="reviewForm" class="review-modal__form rating" @submit.prevent="submitReview">
        <!-- Rating with Animation -->
        <div class="form-group">
          <label class="form-label">Оценка</label>
          <div class="rating__stars">
            <input
              v-for="i in 5"
              :key="`rating-${i}`"
              :id="`rating-${i}`"
              v-model.number="formData.rating"
              type="radio"
              :value="i"
              name="rating"
              class="rating__input"
              :class="`rating__input-${i}`"
            />
            <label
              v-for="i in 5"
              :key="`label-${i}`"
              :for="`rating-${i}`"
              class="rating__label"
            >
              <svg
                class="rating__star"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  class="rating__star-path"
                  d="M12 2L15.09 10.26H24L17.55 15.74L20.64 24L12 18.52L3.36 24L6.45 15.74L0 10.26H8.91L12 2Z"
                  fill="currentColor"
                  stroke="currentColor"
                  stroke-width="0.5"
                />
              </svg>
            </label>
            <div
              class="rating__display"
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              <span v-for="i in 5" :key="`display-${i}`" v-show="formData.rating === i" :data-rating="i">
                {{ ratingNames[i - 1] }}
              </span>
            </div>
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
import { ref, watch } from 'vue'
import { addReview } from '@/services/supabaseService'
import { cacheManager } from '@/utils/cacheManager'

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

const reviewForm = ref<HTMLFormElement | null>(null)
const isSubmitting = ref(false)
const errorMessage = ref('')
const prevRatingID = ref(0)

const ratingNames = ['Ужасно', 'Плохо', 'Нормально', 'Хорошо', 'Отлично']

const formData = ref({
  rating: 0,
  title: '',
  comment: '',
  isAnonymous: false,
})

const updateRatingAnimation = () => {
  if (!reviewForm.value) return

  // Clear animation delays
  Array.from(reviewForm.value.querySelectorAll('[for*="rating"]')).forEach((el: Element) => {
    el.className = 'rating__label'
  })

  let delay = 0
  const ratingLabels = reviewForm.value.querySelectorAll('[for*="rating"]')

  ratingLabels.forEach((label: Element, index: number) => {
    const id = index + 1
    // Add delays for stars that are being filled
    if (id > prevRatingID.value + 1 && id <= formData.value.rating) {
      ++delay
      label.classList.add(`rating__label--delay${delay}`)
    }
  })

  prevRatingID.value = formData.value.rating
}

watch(() => formData.value.rating, () => {
  updateRatingAnimation()
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
  prevRatingID.value = 0
  errorMessage.value = ''

  // Clear animation delays
  if (reviewForm.value) {
    Array.from(reviewForm.value.querySelectorAll('[for*="rating"]')).forEach((el: Element) => {
      el.className = 'rating__label'
    })
  }
}

const submitReview = async () => {
  errorMessage.value = ''

  // Validation
  if (formData.value.rating === 0) {
    errorMessage.value = 'Пожалуйста, выберите оценку'
    return
  }

  // Trigger animation update on submit if needed
  updateRatingAnimation()

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

    // Clear the reviews cache on home page so new review appears immediately
    cacheManager.clear('reviews_home')

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

/* Rating Styles */
.rating {
  --color-primary-star: #FF725E;
}

.rating__stars {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  position: relative;
  padding-top: 0.5rem;
  padding-bottom: 1.5rem;
  gap: 0.5rem;
}

.rating__display {
  font-size: 1rem;
  font-weight: 500;
  min-height: 1.25em;
  position: absolute;
  top: 3.5rem;
  width: 100%;
  text-align: center;
  color: var(--color-secondary);
}

.rating__stars > :last-child > span {
  animation-duration: 1s;
}

.rating__input {
  position: absolute;
  -webkit-appearance: none;
  appearance: none;
  pointer-events: none;
}

.rating__label {
  cursor: pointer;
  padding: 0.125em;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* Star Animation Delays */
.rating__label--delay1 .rating__star-ring,
.rating__label--delay1 .rating__star-fill,
.rating__label--delay1 .rating__star-line,
.rating__label--delay1 .rating__star-stroke {
  animation-delay: 0.05s;
}

.rating__label--delay2 .rating__star-ring,
.rating__label--delay2 .rating__star-fill,
.rating__label--delay2 .rating__star-line,
.rating__label--delay2 .rating__star-stroke {
  animation-delay: 0.1s;
}

.rating__label--delay3 .rating__star-ring,
.rating__label--delay3 .rating__star-fill,
.rating__label--delay3 .rating__star-line,
.rating__label--delay3 .rating__star-stroke {
  animation-delay: 0.15s;
}

.rating__label--delay4 .rating__star-ring,
.rating__label--delay4 .rating__star-fill,
.rating__label--delay4 .rating__star-line,
.rating__label--delay4 .rating__star-stroke {
  animation-delay: 0.2s;
}

.rating__star {
  width: 3rem;
  height: 3rem;
  color: var(--color-primary-star);
  transition: transform 0.3s ease;
}

.rating__label:hover .rating__star {
  transform: scale(1.1);
}

.rating__star-ring,
.rating__star-fill,
.rating__star-line,
.rating__star-stroke {
  animation-duration: 1s;
  animation-timing-function: ease-in-out;
  animation-fill-mode: forwards;
}

.rating__star-fill {
  fill: var(--color-primary-star);
  transform: scale(0);
  transition: fill 0.3s cubic-bezier(0.42, 0, 0.58, 1), transform 0.3s cubic-bezier(0.42, 0, 0.58, 1);
}

.rating__star-line {
  stroke-dasharray: 12 13;
  stroke-dashoffset: -13;
}

.rating__star-stroke {
  stroke: hsl(0, 0%, 80%);
  transition: stroke 0.3s;
}

/* Hover states - smooth fill animation */
.rating__input-1:hover ~ .rating__label:nth-of-type(1) .rating__star-stroke,
.rating__input-2:hover ~ .rating__label:nth-of-type(1) .rating__star-stroke,
.rating__input-2:hover ~ .rating__label:nth-of-type(2) .rating__star-stroke,
.rating__input-3:hover ~ .rating__label:nth-of-type(1) .rating__star-stroke,
.rating__input-3:hover ~ .rating__label:nth-of-type(2) .rating__star-stroke,
.rating__input-3:hover ~ .rating__label:nth-of-type(3) .rating__star-stroke,
.rating__input-4:hover ~ .rating__label:nth-of-type(1) .rating__star-stroke,
.rating__input-4:hover ~ .rating__label:nth-of-type(2) .rating__star-stroke,
.rating__input-4:hover ~ .rating__label:nth-of-type(3) .rating__star-stroke,
.rating__input-4:hover ~ .rating__label:nth-of-type(4) .rating__star-stroke,
.rating__input-5:hover ~ .rating__label:nth-of-type(1) .rating__star-stroke,
.rating__input-5:hover ~ .rating__label:nth-of-type(2) .rating__star-stroke,
.rating__input-5:hover ~ .rating__label:nth-of-type(3) .rating__star-stroke,
.rating__input-5:hover ~ .rating__label:nth-of-type(4) .rating__star-stroke,
.rating__input-5:hover ~ .rating__label:nth-of-type(5) .rating__star-stroke {
  stroke: var(--color-primary-star);
  stroke-width: 2;
  transition: stroke 0.3s cubic-bezier(0.42, 0, 0.58, 1);
}

.rating__input-1:hover ~ .rating__label:nth-of-type(1) .rating__star-fill,
.rating__input-2:hover ~ .rating__label:nth-of-type(1) .rating__star-fill,
.rating__input-2:hover ~ .rating__label:nth-of-type(2) .rating__star-fill,
.rating__input-3:hover ~ .rating__label:nth-of-type(1) .rating__star-fill,
.rating__input-3:hover ~ .rating__label:nth-of-type(2) .rating__star-fill,
.rating__input-3:hover ~ .rating__label:nth-of-type(3) .rating__star-fill,
.rating__input-4:hover ~ .rating__label:nth-of-type(1) .rating__star-fill,
.rating__input-4:hover ~ .rating__label:nth-of-type(2) .rating__star-fill,
.rating__input-4:hover ~ .rating__label:nth-of-type(3) .rating__star-fill,
.rating__input-4:hover ~ .rating__label:nth-of-type(4) .rating__star-fill,
.rating__input-5:hover ~ .rating__label:nth-of-type(1) .rating__star-fill,
.rating__input-5:hover ~ .rating__label:nth-of-type(2) .rating__star-fill,
.rating__input-5:hover ~ .rating__label:nth-of-type(3) .rating__star-fill,
.rating__input-5:hover ~ .rating__label:nth-of-type(4) .rating__star-fill,
.rating__input-5:hover ~ .rating__label:nth-of-type(5) .rating__star-fill {
  transform: scale(1);
  transition: transform 0.3s cubic-bezier(0.42, 0, 0.58, 1);
}

/* Checked states - trigger animations */
.rating__input-1:checked ~ .rating__label:nth-of-type(1) .rating__star-ring,
.rating__input-1:checked ~ .rating__label:nth-of-type(1) .rating__star {
  animation-name: starRing, starBounce;
  animation-duration: 1s, 0.5s;
}

.rating__input-2:checked ~ .rating__label:nth-of-type(1) .rating__star-ring,
.rating__input-2:checked ~ .rating__label:nth-of-type(1) .rating__star,
.rating__input-2:checked ~ .rating__label:nth-of-type(2) .rating__star-ring,
.rating__input-2:checked ~ .rating__label:nth-of-type(2) .rating__star {
  animation-name: starRing, starBounce;
  animation-duration: 1s, 0.5s;
}

.rating__input-3:checked ~ .rating__label:nth-of-type(1) .rating__star-ring,
.rating__input-3:checked ~ .rating__label:nth-of-type(1) .rating__star,
.rating__input-3:checked ~ .rating__label:nth-of-type(2) .rating__star-ring,
.rating__input-3:checked ~ .rating__label:nth-of-type(2) .rating__star,
.rating__input-3:checked ~ .rating__label:nth-of-type(3) .rating__star-ring,
.rating__input-3:checked ~ .rating__label:nth-of-type(3) .rating__star {
  animation-name: starRing, starBounce;
  animation-duration: 1s, 0.5s;
}

.rating__input-4:checked ~ .rating__label:nth-of-type(1) .rating__star-ring,
.rating__input-4:checked ~ .rating__label:nth-of-type(1) .rating__star,
.rating__input-4:checked ~ .rating__label:nth-of-type(2) .rating__star-ring,
.rating__input-4:checked ~ .rating__label:nth-of-type(2) .rating__star,
.rating__input-4:checked ~ .rating__label:nth-of-type(3) .rating__star-ring,
.rating__input-4:checked ~ .rating__label:nth-of-type(3) .rating__star,
.rating__input-4:checked ~ .rating__label:nth-of-type(4) .rating__star-ring,
.rating__input-4:checked ~ .rating__label:nth-of-type(4) .rating__star {
  animation-name: starRing, starBounce;
  animation-duration: 1s, 0.5s;
}

.rating__input-5:checked ~ .rating__label:nth-of-type(1) .rating__star-ring,
.rating__input-5:checked ~ .rating__label:nth-of-type(1) .rating__star,
.rating__input-5:checked ~ .rating__label:nth-of-type(2) .rating__star-ring,
.rating__input-5:checked ~ .rating__label:nth-of-type(2) .rating__star,
.rating__input-5:checked ~ .rating__label:nth-of-type(3) .rating__star-ring,
.rating__input-5:checked ~ .rating__label:nth-of-type(3) .rating__star,
.rating__input-5:checked ~ .rating__label:nth-of-type(4) .rating__star-ring,
.rating__input-5:checked ~ .rating__label:nth-of-type(4) .rating__star,
.rating__input-5:checked ~ .rating__label:nth-of-type(5) .rating__star-ring,
.rating__input-5:checked ~ .rating__label:nth-of-type(5) .rating__star {
  animation-name: starRing, starBounce;
  animation-duration: 1s, 0.5s;
}

/* Stroke animations */
.rating__input-1:checked ~ .rating__label:nth-of-type(1) .rating__star-stroke {
  animation-name: starStroke;
}

.rating__input-2:checked ~ .rating__label:nth-of-type(1) .rating__star-stroke,
.rating__input-2:checked ~ .rating__label:nth-of-type(2) .rating__star-stroke {
  animation-name: starStroke;
}

.rating__input-3:checked ~ .rating__label:nth-of-type(1) .rating__star-stroke,
.rating__input-3:checked ~ .rating__label:nth-of-type(2) .rating__star-stroke,
.rating__input-3:checked ~ .rating__label:nth-of-type(3) .rating__star-stroke {
  animation-name: starStroke;
}

.rating__input-4:checked ~ .rating__label:nth-of-type(1) .rating__star-stroke,
.rating__input-4:checked ~ .rating__label:nth-of-type(2) .rating__star-stroke,
.rating__input-4:checked ~ .rating__label:nth-of-type(3) .rating__star-stroke,
.rating__input-4:checked ~ .rating__label:nth-of-type(4) .rating__star-stroke {
  animation-name: starStroke;
}

.rating__input-5:checked ~ .rating__label:nth-of-type(1) .rating__star-stroke,
.rating__input-5:checked ~ .rating__label:nth-of-type(2) .rating__star-stroke,
.rating__input-5:checked ~ .rating__label:nth-of-type(3) .rating__star-stroke,
.rating__input-5:checked ~ .rating__label:nth-of-type(4) .rating__star-stroke,
.rating__input-5:checked ~ .rating__label:nth-of-type(5) .rating__star-stroke {
  animation-name: starStroke;
}

/* Line animations */
.rating__input-1:checked ~ .rating__label:nth-of-type(1) .rating__star-line {
  animation-name: starLine;
}

.rating__input-2:checked ~ .rating__label:nth-of-type(1) .rating__star-line,
.rating__input-2:checked ~ .rating__label:nth-of-type(2) .rating__star-line {
  animation-name: starLine;
}

.rating__input-3:checked ~ .rating__label:nth-of-type(1) .rating__star-line,
.rating__input-3:checked ~ .rating__label:nth-of-type(2) .rating__star-line,
.rating__input-3:checked ~ .rating__label:nth-of-type(3) .rating__star-line {
  animation-name: starLine;
}

.rating__input-4:checked ~ .rating__label:nth-of-type(1) .rating__star-line,
.rating__input-4:checked ~ .rating__label:nth-of-type(2) .rating__star-line,
.rating__input-4:checked ~ .rating__label:nth-of-type(3) .rating__star-line,
.rating__input-4:checked ~ .rating__label:nth-of-type(4) .rating__star-line {
  animation-name: starLine;
}

.rating__input-5:checked ~ .rating__label:nth-of-type(1) .rating__star-line,
.rating__input-5:checked ~ .rating__label:nth-of-type(2) .rating__star-line,
.rating__input-5:checked ~ .rating__label:nth-of-type(3) .rating__star-line,
.rating__input-5:checked ~ .rating__label:nth-of-type(4) .rating__star-line,
.rating__input-5:checked ~ .rating__label:nth-of-type(5) .rating__star-line {
  animation-name: starLine;
}

/* Fill animations */
.rating__input-1:checked ~ .rating__label:nth-of-type(1) .rating__star-fill {
  animation-name: starFill;
}

.rating__input-2:checked ~ .rating__label:nth-of-type(1) .rating__star-fill,
.rating__input-2:checked ~ .rating__label:nth-of-type(2) .rating__star-fill {
  animation-name: starFill;
}

.rating__input-3:checked ~ .rating__label:nth-of-type(1) .rating__star-fill,
.rating__input-3:checked ~ .rating__label:nth-of-type(2) .rating__star-fill,
.rating__input-3:checked ~ .rating__label:nth-of-type(3) .rating__star-fill {
  animation-name: starFill;
}

.rating__input-4:checked ~ .rating__label:nth-of-type(1) .rating__star-fill,
.rating__input-4:checked ~ .rating__label:nth-of-type(2) .rating__star-fill,
.rating__input-4:checked ~ .rating__label:nth-of-type(3) .rating__star-fill,
.rating__input-4:checked ~ .rating__label:nth-of-type(4) .rating__star-fill {
  animation-name: starFill;
}

.rating__input-5:checked ~ .rating__label:nth-of-type(1) .rating__star-fill,
.rating__input-5:checked ~ .rating__label:nth-of-type(2) .rating__star-fill,
.rating__input-5:checked ~ .rating__label:nth-of-type(3) .rating__star-fill,
.rating__input-5:checked ~ .rating__label:nth-of-type(4) .rating__star-fill,
.rating__input-5:checked ~ .rating__label:nth-of-type(5) .rating__star-fill {
  animation-name: starFill;
}

/* Animations */
@keyframes starRing {
  from,
  20% {
    animation-timing-function: ease-in;
    opacity: 1;
    r: 8px;
    stroke-width: 16px;
    transform: scale(0);
  }
  35% {
    animation-timing-function: ease-out;
    opacity: 0.5;
    r: 8px;
    stroke-width: 16px;
    transform: scale(1);
  }
  50%,
  to {
    opacity: 0;
    r: 16px;
    stroke-width: 0;
    transform: scale(1);
  }
}

@keyframes starFill {
  from,
  40% {
    animation-timing-function: ease-out;
    transform: scale(0);
  }
  60% {
    animation-timing-function: ease-in-out;
    transform: scale(1.2);
  }
  80% {
    transform: scale(0.9);
  }
  to {
    transform: scale(1);
  }
}

@keyframes starBounce {
  0% {
    transform: scale(1);
  }
  25% {
    transform: scale(1.15);
  }
  50% {
    transform: scale(0.95);
  }
  75% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes starStroke {
  from {
    transform: scale(1);
  }
  20%,
  to {
    transform: scale(0);
  }
}

@keyframes starLine {
  from,
  40% {
    animation-timing-function: ease-out;
    stroke-dasharray: 1 23;
    stroke-dashoffset: 1;
  }
  60%,
  to {
    stroke-dasharray: 12 13;
    stroke-dashoffset: -13;
  }
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
