<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
    <div class="mx-auto max-w-6xl">
      <h1 class="mb-8 text-4xl font-bold text-white">Спутники (из Supabase)</h1>

      <!-- Поиск -->
      <div class="mb-8">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Поиск по названию или специальности..."
          class="w-full rounded-lg bg-slate-700 px-4 py-3 text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500"
          @input="handleSearch"
        />
      </div>

      <!-- Загрузка -->
      <div v-if="loading" class="text-center text-xl text-slate-300">
        ⏳ Загрузка данных...
      </div>

      <!-- Ошибка -->
      <div v-else-if="error" class="rounded-lg bg-red-900/50 p-4 text-red-200">
        ❌ Ошибка: {{ error }}
      </div>

      <!-- Список спутников -->
      <div v-else class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="companion in companions"
          :key="companion.id"
          class="overflow-hidden rounded-lg bg-slate-700 shadow-lg transition hover:shadow-xl hover:shadow-blue-500/20"
        >
          <!-- Изображение -->
          <div class="h-48 overflow-hidden bg-slate-600">
            <img
              :src="companion.image"
              :alt="companion.name"
              class="h-full w-full object-cover"
            />
          </div>

          <!-- Содержимое -->
          <div class="p-6">
            <h3 class="text-xl font-bold text-white">{{ companion.name }}</h3>
            <p class="text-sm text-blue-400">
              {{ companion.specialization }}
            </p>
            <p class="mt-2 text-slate-300">{{ companion.bio }}</p>

            <!-- Testimonials -->
            <div class="mt-4 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-sm text-slate-400">{{ companion.reviews }} благодарностей</span>
              </div>
              <span class="text-sm font-semibold text-blue-400">
                {{ companion.experience }}
              </span>
            </div>

            <!-- Темы -->
            <div v-if="companion.companion_topics" class="mt-4">
              <div class="mb-2 text-xs font-semibold uppercase text-slate-300">
                Темы:
              </div>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="topic in companion.companion_topics"
                  :key="topic.id"
                  class="rounded-full bg-blue-600/50 px-3 py-1 text-xs text-blue-200"
                >
                  {{ topic.topic }}
                </span>
              </div>
            </div>

            <!-- Кнопка -->
            <button
              class="mt-6 w-full rounded-lg bg-blue-600 py-2 font-semibold text-white transition hover:bg-blue-700"
            >
              Написать
            </button>
          </div>
        </div>
      </div>

      <!-- Нет результатов -->
      <div
        v-if="!loading && companions.length === 0"
        class="text-center text-xl text-slate-300"
      >
        😔 Спутники не найдены
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useCompanions } from '@/composables/useSupabase'

const { companions, loading, error, fetchCompanions, searchCompanions } =
  useCompanions()

const searchQuery = ref('')
let searchTimeout: NodeJS.Timeout

// Загрузить спутников при монтировании
onMounted(() => {
  fetchCompanions()
})

// Поиск с debounce (чтобы не запрашивать БД на каждый символ)
const handleSearch = () => {
  clearTimeout(searchTimeout)

  if (!searchQuery.value.trim()) {
    fetchCompanions()
    return
  }

  searchTimeout = setTimeout(() => {
    searchCompanions(searchQuery.value)
  }, 500)
}
</script>
