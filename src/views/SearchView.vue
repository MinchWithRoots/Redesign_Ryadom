<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const navigate = (path: string) => {
  router.push(path)
}
</script>

<template>
  <div class="min-h-screen pt-[140px] pb-16 px-4 lg:px-8">
    <div class="container mx-auto max-w-7xl">
      <div class="py-12 text-center">
        <h1 class="text-4xl font-bold text-secondary mb-4">Поиск собеседника</h1>
        <p class="text-xl text-secondary/70 mb-8">
          Эта страница находится в разработке
        </p>
        <p class="text-lg text-secondary/60 mb-8">
          Здесь вы сможете фильтровать и искать собеседников по полу, возрасту, тематике и опыту терапии
        </p>
        <button
          @click="navigate('/')"
          class="px-8 py-3 bg-primary text-white font-semibold rounded-full shadow-soft hover:shadow-hover transition-all"
        >
          Вернуться на главную
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
