<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import Header from './components/Header.vue'
import Footer from './components/Footer.vue'

const handleAnchorClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  const link = target.closest('a[href*="#"]') as HTMLAnchorElement | null

  if (!link) return

  const href = link.getAttribute('href')
  if (!href || href === '#' || href === '#0') return

  const hash = href.split('#')[1]
  if (!hash) return

  const element = document.getElementById(hash)

  if (element) {
    event.preventDefault()
    const headerHeight = 80
    const elementPosition = element.getBoundingClientRect().top + window.scrollY - headerHeight
    window.scrollTo({
      top: elementPosition,
      behavior: 'smooth'
    })
  }
}

onMounted(() => {
  document.addEventListener('click', handleAnchorClick, true)
})

onUnmounted(() => {
  document.removeEventListener('click', handleAnchorClick, true)
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

/* Add mobile top padding equal to header height */
@media (max-width: 768px) {
  .app-main {
    padding-top: 85px;
  }
}
</style>
