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
                  <img src="/src/images/stars.svg" alt="" aria-hidden="true" class="about-feature-icon-img" />
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
                  <img src="/src/images/stars.svg" alt="" aria-hidden="true" class="about-feature-icon-img" />
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
      <!-- Decorative elements -->
      <div class="reviews-decorative-1"></div>
      <div class="reviews-decorative-2"></div>

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
      <!-- Gradient background -->
      <div class="cta-bg-gradient"></div>

      <!-- Decorative blobs -->
      <div class="cta-decorative-1"></div>
      <div class="cta-decorative-2"></div>

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
            Начать сейчас
            <span>→</span>
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
            <span>500+ отзывов 5★</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Contacts Section -->
    <section id="contacts">
      <div class="contacts-container">
        <div class="contacts-header">
          <div class="contacts-header-text">
            <p class="contacts-label">Контакты</p>
            <h2 class="contacts-title">
              Свяжитесь с нами
            </h2>
            <p class="contacts-subtitle">
              У вас есть вопросы или предложения? Мы всегда готовы помочь
            </p>
          </div>

          <div class="contacts-grid">
            <!-- Email -->
            <a
              href="mailto:info@ryandom.ru"
              class="contact-card"
            >
              <div class="contact-card-inner">
                <div class="contact-card-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div class="contact-card-text">
                  <p class="contact-card-title">Электронная почта</p>
                  <p class="contact-card-value">info@ryandom.ru</p>
                </div>
              </div>
            </a>

            <!-- Phone -->
            <a
              href="tel:+79000000000"
              class="contact-card"
            >
              <div class="contact-card-inner">
                <div class="contact-card-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 00.948.684l1.498 4.493a1 1 0 00.502.756l2.73 1.365a1 1 0 001.006-.19c.235-.172.482-.311.735-.427a1 1 0 00.503-1.35l-1.498-4.493a1 1 0 00-.948-.684H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2h-3.28a1 1 0 00.948.684l1.498 4.493a1 1 0 00.502.756l2.73 1.365a1 1 0 001.006-.19c.235-.172.482-.311.735-.427a1 1 0 00.503-1.35l-1.498-4.493" />
                  </svg>
                </div>
                <div class="contact-card-text">
                  <p class="contact-card-title">Телефон</p>
                  <p class="contact-card-value">+7 (900) 000-00-00</p>
                </div>
              </div>
            </a>
          </div>

          <div class="contacts-note">
            <p>
              Мы стараемся ответить на все запросы в течение 24 часов
            </p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped></style>
