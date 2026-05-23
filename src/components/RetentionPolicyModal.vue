<template>
  <transition name="fade">
    <div v-if="isOpen" class="retention-overlay">
      <div class="retention-modal">
        <h2 class="retention-modal-title">Удаление сообщений</h2>
        <p class="retention-modal-description">
          Выберите, когда сообщения будут удалены из базы данных
        </p>

        <div class="retention-options">
          <button
            v-for="(option, idx) in retentionOptions"
            :key="`retention-${idx}`"
            @click="selectOption(option.hours)"
            :class="['retention-option', { 'retention-option--selected': currentRetention === option.hours }]"
          >
            <span class="retention-option-label">{{ option.label }}</span>
            <svg v-if="currentRetention === option.hours" class="retention-option-check" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
            </svg>
          </button>
        </div>

        <div class="retention-modal-actions">
          <button @click="handleCancel" class="retention-btn retention-btn--secondary">
            Отмена
          </button>
          <button @click="handleConfirm" :disabled="isLoading" class="retention-btn retention-btn--primary">
            <span v-if="!isLoading">Сохранить</span>
            <span v-else>Сохранение...</span>
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { messageRetentionService } from '@/services/messageRetentionService'
import type { RetentionPeriod } from '@/services/messageRetentionService'

interface Props {
  isOpen: boolean
  chatId: string
  initialRetention?: RetentionPeriod
}

interface Emit {
  (e: 'close'): void
  (e: 'confirm', hours: RetentionPeriod): void
}

const props = withDefaults(defineProps<Props>(), {
  initialRetention: 720,
})

const emit = defineEmits<Emit>()

const selectedRetention = ref<RetentionPeriod>(props.initialRetention)
const isLoading = ref(false)

const currentRetention = computed(() => selectedRetention.value)
const retentionOptions = messageRetentionService.retentionOptions

const selectOption = (hours: RetentionPeriod) => {
  selectedRetention.value = hours
}

const handleConfirm = async () => {
  if (isLoading.value) return

  isLoading.value = true
  try {
    const success = await messageRetentionService.setRetentionPolicy(props.chatId, selectedRetention.value)
    if (success) {
      emit('confirm', selectedRetention.value)
      emit('close')
    } else {
      alert('Ошибка при сохранении политики удаления')
    }
  } catch (err) {
    console.error('Error setting retention policy:', err)
    alert('Ошибка при сохранении политики удаления')
  } finally {
    isLoading.value = false
  }
}

const handleCancel = () => {
  selectedRetention.value = props.initialRetention || 720
  emit('close')
}
</script>

<style scoped>
.retention-overlay {
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

.retention-modal {
  background: white;
  border-radius: 12px;
  padding: 24px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.retention-modal-title {
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 8px;
}

.retention-modal-description {
  font-size: 14px;
  color: #666;
  margin: 0 0 24px;
}

.retention-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.retention-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.retention-option:hover {
  border-color: #0066cc;
  background: #f5f9ff;
}

.retention-option--selected {
  border-color: #0066cc;
  background: #e6f2ff;
  color: #0066cc;
}

.retention-option-label {
  flex: 1;
  text-align: left;
}

.retention-option-check {
  width: 20px;
  height: 20px;
  color: #0066cc;
  flex-shrink: 0;
}

.retention-modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.retention-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.retention-btn--secondary {
  background: #f0f0f0;
  color: #333;
}

.retention-btn--secondary:hover {
  background: #e0e0e0;
}

.retention-btn--primary {
  background: #0066cc;
  color: white;
}

.retention-btn--primary:hover:not(:disabled) {
  background: #0052a3;
}

.retention-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
