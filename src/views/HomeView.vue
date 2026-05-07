<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/utils/supabase'
import ReviewSlider from '@/components/ReviewSlider.vue'

const router = useRouter()
const reviews = ref<any[]>([])
const isLoadingReviews = ref(false)

const navigate = (path: string) => {
  router.push(path)
  window.scrollTo(0, 0)
}

// Fetch reviews from Supabase or use defaults
const fetchReviews = async () => {
  try {
    isLoadingReviews.value = true

    // Check if Supabase is configured
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

    if (supabaseUrl && supabaseKey) {
      const { data, error } = await supabase
        .from('reviews')
        .select('*, users (name, image)')
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(6)

      if (!error && data && data.length > 0) {
        reviews.value = data.map((review: any) => ({
          id: review.id,
          name: review.users?.name || 'Анонимно',
          title: review.title || 'Пользователь платформы',
          text: review.comment,
          avatar: review.users?.image || getPlaceholderAvatar(review.users?.name || 'User'),
        }))
        return
      }
    }

    // Fallback to default reviews
    loadDefaultReviews()
  } catch (err) {
    console.warn('Failed to fetch reviews, using defaults:', err instanceof Error ? err.message : err)
    loadDefaultReviews()
  } finally {
    isLoadingReviews.value = false
  }
}

// Generate placeholder avatars with initials
const getPlaceholderAvatar = (name: string) => {
  const initials = name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const colors = ['FF6B9D', '6B5DFF', '00BCD4', '4CAF50', 'FF9800', 'E91E63']
  const colorIndex = name.length % colors.length
  const bgColor = colors[colorIndex]

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bgColor}&color=fff&size=200&bold=true`
}

// Load default reviews
const loadDefaultReviews = () => {
  reviews.value = [
    {
      id: 1,
      name: 'Мария Кузнецова',
      title: 'В процессе терапии',
      text: 'Платформа помогла мне найти людей, которые понимают мой путь. Благодарна за возможность конфиденциального общения с теми, кто прошёл то же самое.',
      avatar: '/src/images/users/id1-image.jpg',
    },
    {
      id: 2,
      name: 'Алексей Морозов',
      title: 'Прошел курс терапии',
      text: 'Классный сервис для людей в терапии, которые ищут понимания и поддержки друг у друга. Удобный интерфейс и надежная система защиты.',
      avatar: '/src/images/users/id2-image.jpg',
    },
    {
      id: 3,
      name: 'Елена Волкова',
      title: 'Путь выздоровления',
      text: 'Наконец-то нашла людей, с которыми можно открыто говорить о переживаниях. Спасибо за такое безопасное сообщество!',
      avatar: '/src/images/users/id3-image.jpg',
    },
    {
      id: 4,
      name: 'Дмитрий Петров',
      title: 'Активный участник',
      text: 'Сервис действительно поддерживает. Нашел здесь не только понимание, но и новых друзей. Рекомендую всем, кто ищет настоящую поддержку.',
      avatar: '/src/images/users/id4-image.jpg',
    },
    {
      id: 5,
      name: 'Анна Сидорова',
      title: 'Консультант',
      text: 'Работаю в сфере психического здоровья и с уверенностью говорю — эта платформа создает действительно безопасное пространство для людей.',
      avatar: '/src/images/users/id5-image.jpg',
    },
    {
      id: 6,
      name: 'Иван Новиков',
      title: 'Пользователь',
      text: 'Благодарен за эту платформу. Здесь я нашел поддержку, которую не мог найти нигде. Каждый день общения здесь помогает мне становиться лучше.',
      avatar: '/src/images/users/id1-image.jpg',
    },
  ]
}

onMounted(() => {
  fetchReviews()
})
</script>

<template>
  <div class="layout-landing">
    <!-- Hero Section -->
    <section class="section-hero">
      <div class="hero-container">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <!-- Left Content -->
          <div class="flex flex-col gap-8 lg:gap-10">
            <div class="space-y-4 lg:space-y-6">
              <div class="flex items-center gap-2">
                <img src="../images/shield-tick.svg" alt="Добро пожаловать" class="w-[50px] h-[50px] object-contain" />
                <p class="text-primary font-semibold text-lg tracking-wide">Добро пожаловать</p>
              </div>
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
                class="inline-flex items-center justify-center gap-3 px-8 py-4 lg:px-10 lg:py-5 bg-gradient-to-r from-[#FF6330] to-[#D32032] text-white font-semibold rounded-full shadow-soft hover:shadow-hover hover:translate-y-[-2px] transition-all w-fit text-base lg:text-lg group"
              >
                Начать поиск
                <svg class="w-5 h-5 lg:w-6 lg:h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
              <button
                @click="navigate('/become-companion')"
                class="inline-flex items-center justify-center gap-2 px-8 py-4 text-secondary font-semibold border-2 border-border rounded-full hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
              >
                Стать спутником
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
                      <div class="w-24 h-24 bg-gradient-to-br from-primary to-secondary rounded-3xl flex items-center justify-center shadow-card border border-white opacity-100">
                        <img src="../images/user-story.svg" alt="Menu" class="w-[65px] h-[65px] object-contain" />
                      </div>
                    </div>

                    <!-- Floating icons -->
                    <div class="absolute -top-4 left-1/2 -translate-x-1/2 w-16 h-16 bg-white border-2 border-primary/20 rounded-2xl flex items-center justify-center shadow-card animate-bounce" style="animation-delay: 0s">
                      <img src="../images/heart-add.svg" alt="Bookmark" class="w-[45px] h-[45px] object-contain" />
                    </div>
                    <div class="absolute top-8 -right-4 w-16 h-16 bg-white border-2 border-primary/20 rounded-2xl flex items-center justify-center shadow-card animate-bounce" style="animation-delay: 0.2s">
                      <img src="../images/heart.svg" alt="Heart" class="w-[45px] h-[45px] object-contain" />
                    </div>
                    <div class="absolute bottom-8 -right-4 w-16 h-16 bg-white border-2 border-primary/20 rounded-2xl flex items-center justify-center shadow-card animate-bounce" style="animation-delay: 0.4s">
                      <img src="../images/settings.svg" alt="Setting" class="w-[45px] h-[45px] object-contain" />
                    </div>
                    <div class="absolute -bottom-4 left-1/2 -translate-x-1/2 w-16 h-16 bg-white border-2 border-primary/20 rounded-2xl flex items-center justify-center shadow-card animate-bounce" style="animation-delay: 0.6s">
                      <img src="../images/message-add-alt.svg" alt="Notification" class="w-[45px] h-[45px] object-contain" />
                    </div>
                    <div class="absolute bottom-8 -left-4 w-16 h-16 bg-white border-2 border-primary/20 rounded-2xl flex items-center justify-center shadow-card animate-bounce" style="animation-delay: 0.8s">
                      <img src="../images/lock.svg" alt="Danger" class="w-[45px] h-[45px] object-contain" />
                    </div>
                    <div class="absolute top-8 -left-4 w-16 h-16 bg-white border-2 border-primary/20 rounded-2xl flex items-center justify-center shadow-card animate-bounce" style="animation-delay: 1s">
                      <img src="../images/support.svg" alt="Info" class="w-[45px] h-[45px] object-contain" />
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
      <div class="container-wide">
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
              class="inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-[#FF6330] to-[#D32032] text-white font-semibold rounded-full shadow-soft hover:shadow-hover hover:translate-y-[-2px] transition-all w-fit group"
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

      <div class="container-wide">
        <div class="flex flex-col gap-12 lg:gap-16">
          <div class="text-center space-y-4">
            <div class="flex items-center justify-center gap-2">
              <img src="../images/star.svg" alt="Star" class="w-[50px] h-[50px] object-contain" />
              <p class="text-primary font-semibold text-lg">Отзывы</p>
            </div>
            <h2 class="text-4xl lg:text-5xl font-bold text-secondary">
              Истории людей,<br/>которым мы помогли
            </h2>
            <p class="text-xl text-secondary/60 max-w-2xl mx-auto">
              Узнайте, как наша платформа изменила жизни тысячи людей
            </p>
          </div>

          <!-- Reviews Slider -->
          <ReviewSlider :reviews="reviews" />
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
            class="px-10 py-4 bg-gradient-to-r from-[#FF6330] to-[#D32032] text-white font-semibold rounded-full shadow-soft hover:shadow-hover hover:translate-y-[-2px] transition-all group text-lg"
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
            <img src="../images/shield-tick.svg" alt="Verified" class="w-[40px] h-[40px] object-contain" />
            <span>Проверенный контент</span>
          </div>
          <div class="hidden sm:block text-secondary/30">•</div>
          <div class="flex items-center gap-2 text-secondary/70 font-medium">
            <img src="../images/lock.svg" alt="Security" class="w-[40px] h-[40px] object-contain" />
            <span>Защита данных</span>
          </div>
          <div class="hidden sm:block text-secondary/30">•</div>
          <div class="flex items-center gap-2 text-secondary/70 font-medium">
            <img src="../images/star.svg" alt="Reviews" class="w-[40px] h-[40px] object-contain" />
            <span>500+ отзывов 5★</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Contacts Section -->
    <section id="contacts" class="py-24 lg:py-32 px-4 lg:px-8 bg-gradient-to-b from-light-bg to-white relative">
      <div class="container mx-auto max-w-2xl">
        <div class="text-center space-y-8">
          <div class="space-y-4">
            <p class="text-primary font-semibold text-lg">Контакты</p>
            <h2 class="text-4xl lg:text-5xl font-bold text-secondary">
              Свяжитесь с нами
            </h2>
            <p class="text-xl text-secondary/60">
              У вас есть вопросы или предложения? Мы всегда готовы помочь
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
            <!-- Email -->
            <a
              href="mailto:info@ryandom.ru"
              class="p-6 bg-white rounded-2xl border-2 border-border hover:border-primary hover:shadow-hover transition-all group"
            >
              <div class="flex items-start gap-4">
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                  <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div class="text-left">
                  <p class="font-semibold text-secondary mb-1">Электронная почта</p>
                  <p class="text-secondary/60 group-hover:text-primary transition-colors">info@ryandom.ru</p>
                </div>
              </div>
            </a>

            <!-- Phone -->
            <a
              href="tel:+79000000000"
              class="p-6 bg-white rounded-2xl border-2 border-border hover:border-primary hover:shadow-hover transition-all group"
            >
              <div class="flex items-start gap-4">
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                  <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 00.948.684l1.498 4.493a1 1 0 00.502.756l2.73 1.365a1 1 0 001.006-.19c.235-.172.482-.311.735-.427a1 1 0 00.503-1.35l-1.498-4.493a1 1 0 00-.948-.684H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2h-3.28a1 1 0 00.948.684l1.498 4.493a1 1 0 00.502.756l2.73 1.365a1 1 0 001.006-.19c.235-.172.482-.311.735-.427a1 1 0 00.503-1.35l-1.498-4.493" />
                  </svg>
                </div>
                <div class="text-left">
                  <p class="font-semibold text-secondary mb-1">Телефон</p>
                  <p class="text-secondary/60 group-hover:text-primary transition-colors">+7 (900) 000-00-00</p>
                </div>
              </div>
            </a>
          </div>

          <div class="mt-12 p-6 bg-primary/5 border border-primary/20 rounded-2xl">
            <p class="text-secondary/70">
              Мы стараемся ответить на все запросы в течение 24 часов
            </p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped></style>
