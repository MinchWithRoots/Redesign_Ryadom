<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/utils/supabase'
import ReviewSlider from '@/components/ReviewSlider.vue'
import '@/assets/home.css'

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
    <section class="hero-section">
      <!-- Background image -->
      <img
        src="/src/images/hero.png"
        alt=""
        class="hero-bg-image"
        aria-hidden="true"
      />

      <!-- Content -->
      <div class="hero-content">
        <div class="hero-grid">
          <!-- Left: text + buttons -->
          <div class="hero-text-group">
            <!-- Heading -->
            <h1 class="hero-heading">
              <span class="hero-heading-line1">Найди свою поддержку</span>
              <span class="hero-heading-line2">
                <span class="hero-heading-accent">Рядом</span>
              </span>
            </h1>

            <!-- Subtitle -->
            <p class="hero-subtitle">
              Безопасное пространство для общения с людьми, которые поймут и поддержат тебя
            </p>

            <!-- Buttons -->
            <div class="hero-buttons">
              <button
                @click="navigate('/search')"
                class="btn-primary-hero"
              >
                Начать поиск
                <svg fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13 17L18 12L13 7M18 12H6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
              <button
                @click="navigate('/become-companion')"
                class="btn-secondary"
              >
                Стать спутником
              </button>
            </div>
          </div>

          <!-- Right: Planet illustration -->
          <div class="hero-planet">
            <img
              src="/src/images/Planet-with-stars.png"
              alt="Planet with stars"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- About Section -->
    <section id="about">
      <div class="container-wide">
        <div class="about-grid">
          <!-- Illustration -->
          <div class="about-image-section">
            <img
              src="/src/images/amico.svg"
              alt="Поддержка и доверие"
              class="about-illustration"
            />
          </div>

          <!-- Content -->
          <div class="about-content">
            <div class="about-header">
              <p class="about-label">О нас</p>
              <h2 class="about-title">
                Платформа доверия и<br/>поддержки
              </h2>
            </div>

            <div class="about-features">
              <div class="about-feature">
                <div class="about-feature-icon">
                  <img src="/src/images/stars.svg" alt="" aria-hidden="true" class="about-feature-icon-img" />
                </div>
                <div class="about-feature-content">
                  <h3>Наша миссия</h3>
                  <p>
                    Создать безопасное, конфиденциальное пространство, где каждый может найти помощь и поддержку без страха и стыда
                  </p>
                </div>
              </div>

              <div class="about-feature">
                <div class="about-feature-icon">
                  <img src="/src/images/home-love.svg" alt="" aria-hidden="true" class="about-feature-icon-img" />
                </div>
                <div class="about-feature-content">
                  <h3>Наши ценности</h3>
                  <p>
                    Мы верим в силу сочувствия и поддержки людей, которые вместе проходят свой путь в терапии
                  </p>
                </div>
              </div>

              <div class="about-feature">
                <div class="about-feature-icon">
                  <img src="/src/images/stars-shiny.svg" alt="" aria-hidden="true" class="about-feature-icon-img" />
                </div>
                <div class="about-feature-content">
                  <h3>Развитие</h3>
                  <p>
                    Мы постоянно развиваемся, чтобы предложить лучший сервис и наиболее эффективные способы поддержки
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Reviews Section -->
    <section id="reviews">
      <!-- Background wave image -->
      <img src="../images/left-wave.png" class="reviews-left-wave" alt="" aria-hidden="true" />
      <img src="../images/right-wave.png" class="reviews-right-wave" alt="" aria-hidden="true" />

      <!-- Left decorative group -->
      <div class="reviews-deco-left">
        <div class="reviews-deco-blur"></div>
        <!-- Small sparkles -->
        <svg class="reviews-sparkle reviews-sparkle-lt" width="17" height="19" viewBox="0 0 17 19" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M10.3102 11.8078L6.02942 18.1763L5.19705 10.4026L0 8.58953L4.75639 6.08141L4.23179 2.28147L7.55427 4.30609L10.4431 0L11.863 5.6508L16.2627 5.27307L13.5487 8.71041L16.2766 13.8097L10.3102 11.8078Z" fill="#FF725E"/>
        </svg>
        <svg class="reviews-sparkle reviews-sparkle-lb" width="42" height="47" viewBox="0 0 42 47" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M26.6042 30.1698L15.5582 46.4418L13.4104 26.5795L0 21.9469L12.2733 15.5385L10.9196 5.82933L19.4929 11.0024L26.9471 0L30.6111 14.4382L41.9639 13.4731L34.9609 22.2558L42 35.285L26.6042 30.1698Z" fill="#FF725E"/>
        </svg>
        <svg class="reviews-sparkle reviews-sparkle-lt2" width="17" height="12" viewBox="0 0 17 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M10.3102 7.79341L6.02942 11.9968L5.19705 6.86597L0 5.66929L4.75639 4.01387L4.23179 1.50582L7.55427 2.84212L10.4431 0L11.863 3.72966L16.2627 3.48035L13.5487 5.74907L16.2766 9.11475L10.3102 7.79341Z" fill="#FF725E"/>
        </svg>
        <!-- Rotated star -->
        <div class="reviews-star-left">
          <svg width="68" height="68" viewBox="0 0 68 68" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M39.6912 18.1026C41.2043 17.2559 43.1104 18.2567 43.2725 19.983L44.1029 28.8271C44.1586 29.421 44.4369 29.9751 44.8825 30.3795L51.5177 36.4014C52.8129 37.5769 52.4628 39.6745 50.8601 40.3427L42.6489 43.7655C42.0973 43.9954 41.6552 44.4233 41.41 44.9647L37.7589 53.0242C37.0463 54.5974 34.924 54.8929 33.7713 53.5797L27.8662 46.8511C27.4696 46.3991 26.9181 46.1095 26.3208 46.0397L17.4292 44.9989C15.6937 44.7956 14.732 42.8807 15.6224 41.4008L20.184 33.8195C20.4904 33.3102 20.5916 32.7034 20.4678 32.1188L18.6234 23.4161C18.2634 21.7173 19.7915 20.2382 21.4945 20.637L30.2188 22.68C30.8048 22.8172 31.4188 22.7317 31.9395 22.4403L39.6912 18.1026Z" fill="#FF725E"/>
          </svg>
        </div>
      </div>

      <!-- Right decorative group -->
      <div class="reviews-deco-right">
        <div class="reviews-deco-blur"></div>
        <img src="../images/planet.png" class="reviews-planet" alt="" aria-hidden="true" />
        <!-- Small sparkles -->
        <svg class="reviews-sparkle reviews-sparkle-rt" width="17" height="12" viewBox="0 0 17 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M10.3102 7.79341L6.02942 11.9968L5.19705 6.86597L0 5.66929L4.75639 4.01387L4.23179 1.50582L7.55427 2.84212L10.4431 0L11.863 3.72966L16.2627 3.48035L13.5487 5.74907L16.2766 9.11475L10.3102 7.79341Z" fill="#FF725E"/>
        </svg>
        <svg class="reviews-sparkle reviews-sparkle-rt2" width="17" height="12" viewBox="0 0 17 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M10.3102 7.79341L6.02942 11.9968L5.19705 6.86597L0 5.66929L4.75639 4.01387L4.23179 1.50582L7.55427 2.84212L10.4431 0L11.863 3.72966L16.2627 3.48035L13.5487 5.74907L16.2766 9.11475L10.3102 7.79341Z" fill="#FF725E"/>
        </svg>
        <svg class="reviews-sparkle reviews-sparkle-rt3" width="17" height="12" viewBox="0 0 17 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M10.3102 7.79341L6.02942 11.9968L5.19705 6.86597L0 5.66929L4.75639 4.01387L4.23179 1.50582L7.55427 2.84212L10.4431 0L11.863 3.72966L16.2627 3.48035L13.5487 5.74907L16.2766 9.11475L10.3102 7.79341Z" fill="#FF725E"/>
        </svg>
        <!-- Rotated star -->
        <div class="reviews-star-right">
          <svg width="63" height="63" viewBox="0 0 63 63" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M33.8113 14.5386C35.1297 13.4124 37.1947 14.0214 37.6911 15.6828L40.2341 24.1939C40.4048 24.7655 40.7861 25.2544 41.3021 25.564L48.9864 30.1728C50.4863 31.0724 50.553 33.198 49.1118 34.1666L41.728 39.1284C41.232 39.4617 40.8821 39.9677 40.7475 40.5466L38.7421 49.1643C38.3508 50.8464 36.3271 51.5511 34.94 50.4885L27.8336 45.0439C27.3563 44.6781 26.7588 44.5019 26.1595 44.5502L17.2359 45.2675C15.4941 45.4074 14.1767 43.7174 14.7606 42.092L17.7524 33.7653C17.9533 33.2059 17.934 32.591 17.6983 32.0419L14.1885 23.8676C13.5034 22.2719 14.7128 20.5227 16.4609 20.5809L25.4163 20.8792C26.0178 20.8992 26.6033 20.6953 27.0569 20.3079L33.8113 14.5386Z" fill="#FF725E"/>
          </svg>
        </div>
      </div>

      <div class="container-wide">
        <div class="reviews-container">
          <div class="reviews-header">
            <div class="reviews-label">
              <img src="../images/star.svg" alt="Star" />
              <p>Отзывы</p>
            </div>
            <h2 class="reviews-title">
              Истории людей,<br/>которым мы помогли
            </h2>
            <p class="reviews-subtitle">
              Узнайте, как наша платформа изменила жизни тысячи людей
            </p>
          </div>

          <!-- Reviews Slider -->
          <ReviewSlider :reviews="reviews" />
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta-section">
      <!-- Background image -->
      <img src="../images/last-section.png" class="cta-bg-image" alt="" aria-hidden="true" />

      <!-- Gradient overlay -->
      <div class="cta-bg-gradient"></div>

      <!-- Decorative blobs -->
      <div class="cta-decorative-1"></div>
      <div class="cta-decorative-2"></div>
      <div class="cta-decorative-3"></div>

      <div class="cta-inner">
        <div class="cta-content">
          <h2 class="cta-title">
            Готов начать<br/>свой путь к поддержке?
          </h2>
          <p class="cta-description">
            Присоединись к сообществу людей, которые находят понимание, поддержку и новых друзей
          </p>
        </div>

        <div class="cta-buttons">
          <button
            @click="navigate('/auth')"
            class="btn-cta-primary"
          >
            Начать сейчас <span>→</span>
          </button>
          <button
            @click="navigate('/')"
            class="btn-cta-secondary"
          >
            Узнать больше
          </button>
        </div>

        <!-- Trust badges -->
        <div class="cta-badges">
          <div class="cta-badge">
            <img src="../images/shield-tick.svg" alt="Verified" />
            <span>Проверенный контент</span>
          </div>
          <div class="cta-divider">•</div>
          <div class="cta-badge">
            <img src="../images/lock.svg" alt="Security" />
            <span>Защита данных</span>
          </div>
          <div class="cta-divider">•</div>
          <div class="cta-badge">
            <img src="../images/star.svg" alt="Reviews" />
            <span>Отзывы от реальных пользователей</span>
          </div>
        </div>
      </div>
    </section>

  </div>
</template>

<style scoped></style>
