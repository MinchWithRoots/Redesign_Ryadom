<template>
  <div class="retention-settings">
    <div class="retention-header">
      <h3 class="retention-title">Политика хранения сообщений</h3>
      <p class="retention-description">
        Все сообщения шифруются. Выберите, как долго хранить историю:
      </p>
    </div>

    <div class="retention-options">
      <label
        v-for="(option, idx) in retentionOptions"
        :key="`retention-${idx}`"
        class="retention-option"
      >
        <input
          type="radio"
          :value="option.value"
          v-model="selectedRetention"
          class="retention-radio"
        />
        <div class="retention-label-content">
          <span class="retention-label-text">{{ option.label }}</span>
          <span class="retention-label-hint">{{ option.hint }}</span>
        </div>
      </label>
    </div>

    <div class="retention-info">
      <svg class="retention-info-icon" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
      </svg>
      <p class="retention-info-text">
        После истечения периода сообщения удаляются из базы, но ключ шифрования остаётся
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { messageRetentionService } from '@/services/messageRetentionService'
import type { RetentionPeriod } from '@/services/messageRetentionService'

interface Props {
  modelValue?: RetentionPeriod
}

interface Emits {
  (e: 'update:modelValue', value: RetentionPeriod): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: 720,
})

const emit = defineEmits<Emits>()

const selectedRetention = ref<RetentionPeriod>(props.modelValue)

interface RetentionOption {
  value: RetentionPeriod
  label: string
  hint: string
}

const retentionOptions: RetentionOption[] = [
  {
    value: 1,
    label: '1 час',
    hint: 'Для краткосрочной поддержки',
  },
  {
    value: 24,
    label: '1 день',
    hint: 'Базовая конфиденциальность',
  },
  {
    value: 720,
    label: '1 месяц (рекомендуется)',
    hint: 'Баланс между приватностью и историей',
  },
  {
    value: 2160,
    label: '3 месяца',
    hint: 'Долгая история чата',
  },
  {
    value: null,
    label: 'Никогда не удалять',
    hint: 'Полная история (максимум данных)',
  },
]
</script>

<style scoped>
.retention-settings {
  padding: 1.5rem;
  background: #f9fafb;
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
}

.retention-header {
  margin-bottom: 1.5rem;
}

.retention-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}

.retention-description {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.retention-options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.retention-option {
  display: flex;
  align-items: flex-start;
  padding: 0.75rem;
  background: white;
  border: 1.5px solid #e5e7eb;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.retention-option:hover {
  border-color: #3b82f6;
  background: #f0f4ff;
}

.retention-option input:checked + .retention-label-content {
  color: #3b82f6;
}

input:checked ~ .retention-label-content {
  font-weight: 500;
}

.retention-radio {
  margin-top: 0.25rem;
  margin-right: 0.75rem;
  width: 1rem;
  height: 1rem;
  cursor: pointer;
  accent-color: #3b82f6;
  flex-shrink: 0;
}

.retention-label-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.retention-label-text {
  font-size: 0.9375rem;
  color: #1f2937;
  font-weight: 500;
}

.retention-label-hint {
  font-size: 0.8125rem;
  color: #9ca3af;
}

.retention-info {
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 0.5rem;
}

.retention-info-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: #3b82f6;
  flex-shrink: 0;
}

.retention-info-text {
  font-size: 0.8125rem;
  color: #1e40af;
  margin: 0;
  line-height: 1.4;
}
</style>
