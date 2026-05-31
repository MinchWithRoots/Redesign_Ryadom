<script setup lang="ts">
import { onMounted } from 'vue'
import Header from './components/Header.vue'
import Footer from './components/Footer.vue'
import { syncAllCompanionSessionCounts } from './composables/useAppState'

onMounted(async () => {
  // One-time sync of companion session counts on app load to fix any inconsistencies
  await syncAllCompanionSessionCounts()
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
