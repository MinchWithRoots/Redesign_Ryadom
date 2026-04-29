<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { loadCurrentUser } from '@/composables/useAppState'

const router = useRouter()

onMounted(async () => {
  try {
    // Load current user from database
    await loadCurrentUser()
    
    // Redirect to profile page after successful OAuth
    setTimeout(() => {
      router.push('/profile')
    }, 500)
  } catch (err) {
    console.error('Auth callback error:', err)
    // If there's an error, redirect to auth page
    setTimeout(() => {
      router.push('/auth')
    }, 1000)
  }
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-white to-light-bg flex items-center justify-center">
    <div class="text-center">
      <div class="mb-6">
        <div class="inline-block animate-spin">
          <svg class="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
      </div>
      <h2 class="text-2xl font-bold text-secondary mb-2">Завершение входа...</h2>
      <p class="text-secondary/60">Пожалуйста, подождите</p>
    </div>
  </div>
</template>
