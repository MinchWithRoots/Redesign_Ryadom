<script setup lang="ts">
import { onMounted } from 'vue'
import Header from './components/Header.vue'
import Footer from './components/Footer.vue'
import { initializeCompanionImages } from './utils/initializeImages'

// Initialize companion images on app load
onMounted(async () => {
  await initializeCompanionImages()
})
</script>

<template>
  <div class="flex flex-col min-h-screen">
    <Header />
    <main class="flex-1">
      <router-view />
    </main>
    <Footer />
  </div>
</template>

<style scoped></style>
