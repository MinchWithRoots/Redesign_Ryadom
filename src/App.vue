<script setup lang="ts">
import Header from './components/Header.vue'
import Footer from './components/Footer.vue'
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

/* Add mobile top padding equal to header height */
@media (max-width: 768px) {
  .app-main {
    padding-top: 85px;
  }
}
</style>
