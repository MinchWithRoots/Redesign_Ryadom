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
  <div class="app-layout">
    <Header />
    <main class="app-main">
      <router-view />
    </main>
    <Footer />
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-main {
  flex: 1;
}
</style>
