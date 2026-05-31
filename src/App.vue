<script setup lang="ts">
import { onMounted } from 'vue'
import Header from './components/Header.vue'
import Footer from './components/Footer.vue'
import { companions, loadCompanions, syncCompanionSessionCounts } from './composables/useAppState'

onMounted(async () => {
  // Sync session counts for all companions on app load (one-time fix for DB consistency)
  if (companions.value.length === 0) {
    await loadCompanions()
  }

  // Sync each companion's session count with actual chat count
  for (const companion of companions.value) {
    await syncCompanionSessionCounts(companion.id)
  }
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
