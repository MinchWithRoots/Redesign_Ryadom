<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/utils/supabase'

const router = useRouter()
const reviews = ref<any[]>([])
const isLoadingReviews = ref(false)

const navigate = (path: string) => {
  router.push(path)
  window.scrollTo(0, 0)
}

// Fetch reviews from Supabase
const fetchReviews = async () => {
  try {
    isLoadingReviews.value = true

    // Check if Supabase is configured
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.warn('⚠️ Supabase not configured. Using default reviews.')
      throw new Error('Supabase credentials missing - see .env.local')
    }

    const { data, error } = await supabase
      .from('reviews')
      .select('*, users (name, image)')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(3)

    if (error) {
      console.error('Supabase error details:', {
        message: error.message,
        code: error.code,
        hint: error.hint,
      })
      throw error
    }

    reviews.value = (data || []).map((review: any) => ({
      id: review.id,
      name: review.users?.name || 'Анонимно',
      title: review.title || 'Пользователь платформы',
      text: review.comment,
      avatar: review.users?.image || 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg',
    }))
  } catch (err) {
    console.warn('Failed to fetch reviews from Supabase, using defaults:', err instanceof Error ? err.message : err)
    // Fallback to default reviews if fetch fails
    reviews.value = [
      {
        id: 1,
        name: 'Мария К.',
        title: 'В процессе терапии',
        text: 'Платформа помогла мне найти людей, которые понимают мой путь. Благодарна за возможность конфиденциального общения с теми, кто прошёл то же самое.',
        avatar: 'https://images.pexels.com/photos/27603433/pexels-photo-27603433.jpeg',
      },
      {
        id: 2,
        name: 'Алексей М.',
        title: 'Рос свой опыт в терапии',
        text: 'Классный сервис для людей в терапии, которые ищут понимания и поддержки друг у друга. Удобный интерфейс и надежная система защиты.',
        avatar: 'https://images.pexels.com/photos/11156392/pexels-photo-11156392.jpeg',
      },
      {
        id: 3,
        name: 'Елена В.',
        title: 'Путь выздоровления',
        text: 'Наконец-то нашла людей, с которыми можно открыто говорить о переживаниях. Спасибо за такое безопасное сообщество!',
        avatar: 'https://images.pexels.com/photos/16574941/pexels-photo-16574941.jpeg',
      },
    ]
  } finally {
    isLoadingReviews.value = false
  }
}

onMounted(() => {
  fetchReviews()
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-white via-white to-light-bg overflow-hidden">
    <!-- Hero Section -->
    <section class="pt-[140px] pb-24 lg:pb-32 px-4 lg:px-8 relative">
      <div class="container mx-auto max-w-7xl relative z-10">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <!-- Left Content -->
          <div class="flex flex-col gap-8 lg:gap-10">
            <div class="space-y-4 lg:space-y-6">
              <p class="text-primary font-semibold text-lg tracking-wide">✨ Добро пожаловать</p>
              <h1 class="text-5xl lg:text-7xl font-bold text-secondary leading-tight">
                Найди свою <span class="bg-gradient-to-r from-primary to-secondary/70 bg-clip-text text-transparent">поддержку</span>
              </h1>
            </div>
            <p class="text-xl lg:text-2xl text-secondary/60 leading-relaxed font-light max-w-xl">
              Безопасное пространство для общения с людьми, которые поймут и поддержат тебя
            </p>
            <div class="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                @click="navigate('/search')"
                class="inline-flex items-center justify-center gap-3 px-8 py-4 lg:px-10 lg:py-5 bg-gradient-to-r from-primary to-primary/90 text-white font-semibold rounded-full shadow-soft hover:shadow-hover hover:translate-y-[-2px] transition-all w-fit text-base lg:text-lg group"
              >
                Начать поиск
                <svg class="w-5 h-5 lg:w-6 lg:h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
              <button
                @click="navigate('/')"
                class="inline-flex items-center justify-center gap-2 px-8 py-4 text-secondary font-semibold border-2 border-border rounded-full hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
              >
                Узнать больше
              </button>
            </div>

            <!-- Stats -->
            <div class="flex gap-8 pt-8 border-t border-border/50">
              <div>
                <p class="text-3xl font-bold text-primary">500+</p>
                <p class="text-sm text-secondary/60 mt-1">Активных пользователей</p>
              </div>
              <div>
                <p class="text-3xl font-bold text-primary">98%</p>
                <p class="text-sm text-secondary/60 mt-1">Рекомендуют друзьям</p>
              </div>
              <div>
                <p class="text-3xl font-bold text-primary">24/7</p>
                <p class="text-sm text-secondary/60 mt-1">Поддержка</p>
              </div>
            </div>
          </div>

          <!-- Right - Modern Illustration Area -->
          <div class="relative h-full min-h-[500px] lg:min-h-[600px]">
            <!-- Decorative blobs -->
            <div class="absolute -top-20 -right-20 w-72 h-72 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full blur-3xl opacity-60"></div>
            <div class="absolute bottom-0 left-10 w-96 h-96 bg-gradient-to-br from-secondary/10 to-primary/10 rounded-full blur-3xl opacity-40"></div>

            <!-- Main visual element -->
            <div class="relative h-full flex items-center justify-center">
              <div class="w-full max-w-sm aspect-square">
                <!-- Outer ring -->
                <div class="absolute inset-0 border-2 border-primary/20 rounded-full"></div>

                <!-- Inner circle with gradient -->
                <div class="absolute inset-8 bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent rounded-full border border-primary/10"></div>

                <!-- Icons arranged in circle -->
                <div class="absolute inset-0 flex items-center justify-center">
                  <div class="relative w-48 h-48">
                    <!-- Center icon -->
                    <div class="absolute inset-0 flex items-center justify-center">
                      <div class="w-24 h-24 bg-gradient-to-br from-primary to-secondary rounded-3xl flex items-center justify-center text-5xl shadow-card">
                        💬
                      </div>
                    </div>

                    <!-- Floating icons -->
                    <div class="absolute -top-4 left-1/2 -translate-x-1/2 w-16 h-16 bg-white border-2 border-primary/20 rounded-2xl flex items-center justify-center text-2xl shadow-card animate-bounce" style="animation-delay: 0s">
                      👂
                    </div>
                    <div class="absolute top-8 -right-4 w-16 h-16 bg-white border-2 border-primary/20 rounded-2xl flex items-center justify-center text-2xl shadow-card animate-bounce" style="animation-delay: 0.2s">
                      💝
                    </div>
                    <div class="absolute bottom-8 -right-4 w-16 h-16 bg-white border-2 border-primary/20 rounded-2xl flex items-center justify-center text-2xl shadow-card animate-bounce" style="animation-delay: 0.4s">
                      🤝
                    </div>
                    <div class="absolute -bottom-4 left-1/2 -translate-x-1/2 w-16 h-16 bg-white border-2 border-primary/20 rounded-2xl flex items-center justify-center text-2xl shadow-card animate-bounce" style="animation-delay: 0.6s">
                      ✨
                    </div>
                    <div class="absolute bottom-8 -left-4 w-16 h-16 bg-white border-2 border-primary/20 rounded-2xl flex items-center justify-center text-2xl shadow-card animate-bounce" style="animation-delay: 0.8s">
                      💪
                    </div>
                    <div class="absolute top-8 -left-4 w-16 h-16 bg-white border-2 border-primary/20 rounded-2xl flex items-center justify-center text-2xl shadow-card animate-bounce" style="animation-delay: 1s">
                      🌟
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Decorative bottom wave -->
      <div class="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-light-bg to-transparent pointer-events-none"></div>
    </section>

    <!-- About Section -->
    <section id="about" class="py-24 lg:py-32 px-4 lg:px-8 relative">
      <div class="container mx-auto max-w-7xl">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          <!-- Image -->
          <div class="order-2 lg:order-1 flex justify-center relative">
            <!-- Decorative elements -->
            <div class="absolute -top-10 -left-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl"></div>
            <div class="absolute -bottom-10 -right-10 w-48 h-48 bg-secondary/10 rounded-full blur-3xl"></div>

            <div class="relative w-full max-w-md lg:max-w-lg">
              <div class="aspect-square rounded-3xl overflow-hidden shadow-hover relative group">
                <img
                  src="https://images.pexels.com/photos/14904695/pexels-photo-14904695.jpeg"
                  alt="Two people hugging with care and support"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <!-- Gradient overlay -->
                <div class="absolute inset-0 bg-gradient-to-t from-primary/20 via-transparent to-transparent"></div>
              </div>
              <!-- Decorative cards -->
              <div class="absolute -bottom-6 -right-6 bg-white p-4 rounded-2xl shadow-card border border-border/50 max-w-xs">
                <p class="text-sm font-semibold text-secondary">Безопасность</p>
                <p class="text-xs text-secondary/60 mt-1">Все данные защищены по стандартам GDPR</p>
              </div>
            </div>
          </div>

          <!-- Content -->
          <div class="order-1 lg:order-2 flex flex-col gap-8">
            <div class="space-y-4">
              <p class="text-primary font-semibold text-lg">О нас</p>
              <h2 class="text-4xl lg:text-5xl font-bold text-secondary leading-tight">
                Платформа доверия и<br/>поддержки
              </h2>
            </div>

            <div class="space-y-6">
              <div class="flex gap-4">
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                  <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 class="font-semibold text-secondary mb-2">Наша миссия</h3>
                  <p class="text-secondary/60 leading-relaxed">
                    Создать безопасное, конфиденциальное пространство, где каждый может найти помощь и поддержку без страха и стыда
                  </p>
                </div>
              </div>

              <div class="flex gap-4">
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                  <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h-2m0 0H10m2 0v2m0-2v-2m7 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 class="font-semibold text-secondary mb-2">Наши ценности</h3>
                  <p class="text-secondary/60 leading-relaxed">
                    Мы верим в силу сочувствия и поддержки людей, которые вместе проходят свой путь в терапии
                  </p>
                </div>
              </div>

              <div class="flex gap-4">
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                  <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </div>
                <div>
                  <h3 class="font-semibold text-secondary mb-2">Развитие</h3>
                  <p class="text-secondary/60 leading-relaxed">
                    Мы постоянно развиваемся, чтобы предложить лучший сервис и наиболее эффективные способы поддержки
                  </p>
                </div>
              </div>
            </div>

            <button
              @click="navigate('/search')"
              class="inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-primary to-primary/90 text-white font-semibold rounded-full shadow-soft hover:shadow-hover hover:translate-y-[-2px] transition-all w-fit group"
            >
              Присоединиться сейчас
              <svg class="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Reviews Section -->
    <section id="reviews" class="py-24 lg:py-32 px-4 lg:px-8 bg-gradient-to-b from-white to-light-bg relative overflow-hidden">
      <!-- Decorative elements -->
      <div class="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10"></div>
      <div class="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl -z-10"></div>

      <div class="container mx-auto max-w-7xl">
        <div class="flex flex-col gap-12 lg:gap-16">
          <div class="text-center space-y-4">
            <p class="text-primary font-semibold text-lg">⭐ Отзывы</p>
            <h2 class="text-4xl lg:text-5xl font-bold text-secondary">
              Истории людей,<br/>которым мы помогли
            </h2>
            <p class="text-xl text-secondary/60 max-w-2xl mx-auto">
              Узнайте, как наша платформа изменила жизни тысячи людей
            </p>
          </div>

          <!-- Reviews Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            <div
              v-for="review in reviews"
              :key="review.id"
              class="group bg-white border border-border/50 rounded-3xl p-8 shadow-card hover:shadow-hover hover:translate-y-[-8px] transition-all duration-300 relative overflow-hidden"
            >
              <!-- Gradient overlay on hover -->
              <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>

              <!-- Stars -->
              <div class="flex gap-1 mb-6">
                <span v-for="i in 5" :key="i" class="text-primary text-xl">★</span>
              </div>

              <!-- Quote with icon -->
              <p class="text-secondary/70 text-lg leading-relaxed mb-8 relative">
                <span class="text-4xl text-primary/30 absolute -top-4 -left-2">"</span>
                {{ review.text }}
              </p>

              <!-- Bottom divider -->
              <div class="border-t border-border/50 pt-6">
                <!-- Avatar and Info -->
                <div class="flex items-center gap-4">
                  <img
                    :src="review.avatar"
                    :alt="review.name"
                    class="w-14 h-14 rounded-full object-cover flex-shrink-0 shadow-soft border-2 border-primary/20"
                  />
                  <div class="flex-1">
                    <h4 class="font-bold text-secondary text-lg">{{ review.name }}</h4>
                    <p class="text-sm text-secondary/60">{{ review.title }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="py-24 lg:py-32 px-4 lg:px-8 relative overflow-hidden">
      <!-- Gradient background -->
      <div class="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5"></div>

      <!-- Decorative blobs -->
      <div class="absolute top-1/2 -right-48 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2"></div>
      <div class="absolute bottom-0 -left-48 w-96 h-96 bg-secondary/10 rounded-full blur-3xl"></div>

      <div class="container mx-auto max-w-3xl text-center relative z-10">
        <div class="space-y-6 mb-12">
          <h2 class="text-4xl lg:text-5xl font-bold text-secondary leading-tight">
            Готов начать<br/>свой путь к поддержке?
          </h2>
          <p class="text-xl text-secondary/60 leading-relaxed">
            Присоединись к сообществу людей, которые находят понимание, поддержку и новых друзей
          </p>
        </div>

        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            @click="navigate('/auth')"
            class="px-10 py-4 bg-gradient-to-r from-primary to-primary/90 text-white font-semibold rounded-full shadow-soft hover:shadow-hover hover:translate-y-[-2px] transition-all group text-lg"
          >
            Начать сейчас
            <span class="inline-block group-hover:translate-x-1 transition-transform">→</span>
          </button>
          <button
            @click="navigate('/')"
            class="px-10 py-4 text-secondary font-semibold border-2 border-border rounded-full hover:border-primary hover:text-primary hover:bg-primary/5 transition-all text-lg"
          >
            Узнать больше
          </button>
        </div>

        <!-- Trust badges -->
        <div class="mt-16 flex flex-col sm:flex-row gap-6 justify-center items-center text-sm">
          <div class="flex items-center gap-2 text-secondary/70 font-medium">
            <svg class="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>
            <span>Проверенный контент</span>
          </div>
          <div class="hidden sm:block text-secondary/30">•</div>
          <div class="flex items-center gap-2 text-secondary/70 font-medium">
            <svg class="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20"><path d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" /></svg>
            <span>Защита данных</span>
          </div>
          <div class="hidden sm:block text-secondary/30">•</div>
          <div class="flex items-center gap-2 text-secondary/70 font-medium">
            <svg class="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
            <span>500+ отзывов 5★</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped></style>
