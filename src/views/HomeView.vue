в отдельный <script setup lang="ts">
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
              <span class="hero-heading-main">Найди свою поддержку</span>
              <span class="hero-heading-accent">Рядом</span>
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
          <!-- Image -->
          <div class="about-image-section">
            <!-- Decorative elements -->
            <div class="about-decorative-1"></div>
            <div class="about-decorative-2"></div>

            <div class="about-image-container">
              <div class="about-image-wrapper">
                <img
                  src="https://images.pexels.com/photos/14904695/pexels-photo-14904695.jpeg"
                  alt="Two people hugging with care and support"
                />
                <!-- Gradient overlay -->
                <div class="about-image-overlay"></div>
              </div>
              <!-- Decorative cards -->
              <div class="about-card">
                <p>Безопасность</p>
                <p>Все данные защищены по стандартам GDPR</p>
              </div>
            </div>
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
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
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
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h-2m0 0H10m2 0v2m0-2v-2m7 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
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
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </div>
                <div class="about-feature-content">
                  <h3>Развитие</h3>
                  <p>
                    Мы постоянно развиваемся, чтобы предложить лучший сервис и наиболее эффективные способы поддержки
                  </p>
                </div>
              </div>
            </div>

            <button
              @click="navigate('/search')"
              class="btn-about"
            >
              Присоединиться сейчас
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
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

<style scoped>
/* LAYOUT AND CONTAINER STYLES */
.layout-landing {
  width: 100%;
}

.container-wide {
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1rem;
}

@media (min-width: 1024px) {
  .container-wide {
    padding: 0 2rem;
  }
}

/* HERO SECTION */
.hero-section {
  position: relative;
  overflow: hidden;
  min-height: 750px;
  display: flex;
  align-items: center;
}

@media (min-width: 1024px) {
  .hero-section {
    min-height: 850px;
  }
}

.hero-bg-image {
  position: absolute;
  inset: 0;
  width: auto;
  height: auto;
  object-fit: cover;
  object-position: center;
  pointer-events: none;
  user-select: none;
  top: 50px;
}

.hero-content {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1.5rem;
  padding-top: 80px;
  padding-bottom: 4rem;
}

@media (min-width: 1024px) {
  .hero-content {
    padding: 0 3rem;
    padding-top: 80px;
    padding-bottom: 6rem;
  }
}

.hero-grid {
  display: grid;
  grid-template-columns: 1fr;
  align-items: center;
  gap: 2.5rem;
  position: relative;
  bottom: 80px;
}

@media (min-width: 1024px) {
  .hero-grid {
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
  }
}

.hero-text-group {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

@media (min-width: 1024px) {
  .hero-text-group {
    gap: 2rem;
  }
}

.hero-heading {
  display: flex;
  flex-wrap: nowrap;
  align-items: flex-start;
  gap: 1rem;
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  color: #f8f7fc;
}

.hero-heading-main {
  display: block;
  font-size: 48px;
  line-height: 1.2;
  width: 400px;
}

@media (min-width: 640px) {
  .hero-heading-main {
    font-size: 56px;
  }
}

@media (min-width: 1024px) {
  .hero-heading-main {
    font-size: 64px;
  }
}

.hero-heading-accent {
  font-family: 'Pacifico', cursive;
  font-weight: 400;
  color: white;
  font-size: 72px;
  line-height: 1.2;
}

@media (min-width: 640px) {
  .hero-heading-accent {
    font-size: 90px;
  }
}

@media (min-width: 1024px) {
  .hero-heading-accent {
    font-size: 100px;
  }
}

.hero-subtitle {
  font-family: 'Inter', sans-serif;
  font-weight: 300;
  color: #f8f7fc;
  font-size: 1.25rem;
  line-height: 2rem;
  max-width: 513px;
}

@media (min-width: 1024px) {
  .hero-subtitle {
    font-size: 1.5rem;
  }
}

.hero-buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: fit-content;
}

@media (min-width: 640px) {
  .hero-buttons {
    flex-direction: row;
  }
}

.btn-primary-hero {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1.25rem 2.5rem;
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  color: white;
  font-size: 18px;
  line-height: 1.75rem;
  border-radius: 9999px;
  background: linear-gradient(to right, #ff6330, #d32032);
  box-shadow: 0 4px 8px rgba(212, 132, 106, 0.15);
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary-hero:hover {
  box-shadow: 0 8px 20px rgba(212, 132, 106, 0.35);
  transform: translateY(-2px);
}

.btn-primary-hero svg {
  width: 1.5rem;
  height: 1.5rem;
  transition: transform 0.2s ease;
}

.btn-primary-hero:hover svg {
  transform: translateX(4px);
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 1.25rem 2rem;
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  color: #5d5a88;
  font-size: 15px;
  border-radius: 9999px;
  background-color: white;
  border: 2px solid #ff725e;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background-color: rgba(255, 255, 255, 0.9);
}

.hero-planet {
  display: none;
  align-items: center;
  justify-content: center;
}

@media (min-width: 1024px) {
  .hero-planet {
    display: flex;
  }
}

.hero-planet img {
  width: 100%;
  max-width: 480px;
  filter: drop-shadow(0 4px 4px rgba(0, 0, 0, 0.25));
}

/* ABOUT SECTION */
#about {
  padding: 6rem 1rem;
}

@media (min-width: 1024px) {
  #about {
    padding: 8rem 2rem;
  }
}

.about-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 4rem;
  align-items: center;
}

@media (min-width: 1024px) {
  .about-grid {
    grid-template-columns: 1fr 1fr;
    gap: 6rem;
  }
}

.about-image-section {
  order: 2;
  display: flex;
  justify-content: center;
  position: relative;
}

@media (min-width: 1024px) {
  .about-image-section {
    order: 1;
  }
}

.about-decorative-1 {
  position: absolute;
  top: -40px;
  left: -40px;
  width: 160px;
  height: 160px;
  background-color: rgba(59, 130, 246, 0.1);
  border-radius: 9999px;
  filter: blur(96px);
}

.about-decorative-2 {
  position: absolute;
  bottom: -40px;
  right: -40px;
  width: 192px;
  height: 192px;
  background-color: rgba(100, 116, 139, 0.1);
  border-radius: 9999px;
  filter: blur(96px);
}

.about-image-container {
  position: relative;
  width: 100%;
  max-width: 448px;
}

@media (min-width: 1024px) {
  .about-image-container {
    max-width: 448px;
  }
}

.about-image-wrapper {
  aspect-ratio: 1;
  border-radius: 1.5rem;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  position: relative;
}

.about-image-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.about-image-wrapper:hover img {
  transform: scale(1.05);
}

.about-image-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(59, 130, 246, 0.2), transparent);
}

.about-card {
  position: absolute;
  bottom: -1.5rem;
  right: -1.5rem;
  background-color: white;
  padding: 1rem;
  border-radius: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 0, 0, 0.05);
  max-width: 320px;
}

.about-card p:first-child {
  font-size: 0.875rem;
  font-weight: 600;
  color: #5d5a88;
}

.about-card p:last-child {
  font-size: 0.75rem;
  color: rgba(93, 90, 136, 0.6);
  margin-top: 0.25rem;
}

.about-content {
  order: 1;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

@media (min-width: 1024px) {
  .about-content {
    order: 2;
  }
}

.about-header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.about-label {
  color: #3b82f6;
  font-weight: 600;
  font-size: 1.125rem;
}

.about-title {
  font-size: 2rem;
  line-height: 1.2;
  font-weight: 700;
  color: #5d5a88;
}

@media (min-width: 1024px) {
  .about-title {
    font-size: 2.25rem;
  }
}

.about-features {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.about-feature {
  display: flex;
  gap: 1rem;
}

.about-feature-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 0.75rem;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(59, 130, 246, 0.1));
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.about-feature-icon svg {
  width: 1.5rem;
  height: 1.5rem;
  color: #3b82f6;
}

.about-feature-content h3 {
  font-weight: 600;
  color: #5d5a88;
  margin-bottom: 0.5rem;
}

.about-feature-content p {
  color: rgba(93, 90, 136, 0.6);
  line-height: 1.5;
}

.btn-about {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem 2rem;
  background: linear-gradient(to right, #ff6330, #d32032);
  color: white;
  font-weight: 600;
  border-radius: 9999px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: none;
  cursor: pointer;
  width: fit-content;
  transition: all 0.2s ease;
}

.btn-about:hover {
  box-shadow: 0 8px 20px rgba(212, 132, 106, 0.35);
  transform: translateY(-2px);
}

.btn-about svg {
  width: 1.25rem;
  height: 1.25rem;
  transition: transform 0.2s ease;
}

.btn-about:hover svg {
  transform: translateX(4px);
}

/* REVIEWS SECTION */
#reviews {
  padding: 6rem 1rem;
  background: linear-gradient(to bottom, white, #f8f7fc);
  position: relative;
  overflow: hidden;
}

@media (min-width: 1024px) {
  #reviews {
    padding: 8rem 2rem;
  }
}

.reviews-decorative-1 {
  position: absolute;
  top: 0;
  right: 0;
  width: 384px;
  height: 384px;
  background-color: rgba(59, 130, 246, 0.05);
  border-radius: 9999px;
  filter: blur(96px);
  z-index: -10;
}

.reviews-decorative-2 {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 384px;
  height: 384px;
  background-color: rgba(100, 116, 139, 0.05);
  border-radius: 9999px;
  filter: blur(96px);
  z-index: -10;
}

.reviews-container {
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

@media (min-width: 1024px) {
  .reviews-container {
    gap: 4rem;
  }
}

.reviews-header {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.reviews-label {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.reviews-label img {
  width: 50px;
  height: 50px;
  object-fit: contain;
}

.reviews-label p {
  color: #3b82f6;
  font-weight: 600;
  font-size: 1.125rem;
}

.reviews-title {
  font-size: 2rem;
  font-weight: 700;
  color: #5d5a88;
  line-height: 1.2;
}

@media (min-width: 1024px) {
  .reviews-title {
    font-size: 2.25rem;
  }
}

.reviews-subtitle {
  font-size: 1.25rem;
  color: rgba(93, 90, 136, 0.6);
  max-width: 896px;
  margin: 0 auto;
}

/* CTA SECTION */
.cta-section {
  padding: 6rem 1rem;
  position: relative;
  overflow: hidden;
}

@media (min-width: 1024px) {
  .cta-section {
    padding: 8rem 2rem;
  }
}

.cta-bg-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(to right, rgba(59, 130, 246, 0.05), transparent, rgba(100, 116, 139, 0.05));
}

.cta-decorative-1 {
  position: absolute;
  top: 50%;
  right: -192px;
  width: 384px;
  height: 384px;
  background-color: rgba(59, 130, 246, 0.1);
  border-radius: 9999px;
  filter: blur(96px);
  transform: translateY(-50%);
}

.cta-decorative-2 {
  position: absolute;
  bottom: 0;
  left: -192px;
  width: 384px;
  height: 384px;
  background-color: rgba(100, 116, 139, 0.1);
  border-radius: 9999px;
  filter: blur(96px);
}

.cta-inner {
  max-width: 768px;
  margin: 0 auto;
  text-align: center;
  position: relative;
  z-index: 10;
}

.cta-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.cta-title {
  font-size: 2rem;
  font-weight: 700;
  color: #5d5a88;
  line-height: 1.2;
}

@media (min-width: 1024px) {
  .cta-title {
    font-size: 2.25rem;
  }
}

.cta-description {
  font-size: 1.25rem;
  color: rgba(93, 90, 136, 0.6);
  line-height: 1.5;
}

.cta-buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  justify-content: center;
}

@media (min-width: 640px) {
  .cta-buttons {
    flex-direction: row;
  }
}

.btn-cta-primary {
  padding: 1rem 2.5rem;
  background: linear-gradient(to right, #ff6330, #d32032);
  color: white;
  font-weight: 600;
  border-radius: 9999px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: none;
  cursor: pointer;
  font-size: 1.125rem;
  transition: all 0.2s ease;
}

.btn-cta-primary:hover {
  box-shadow: 0 8px 20px rgba(212, 132, 106, 0.35);
  transform: translateY(-2px);
}

.btn-cta-primary span {
  display: inline-block;
  transition: transform 0.2s ease;
}

.btn-cta-primary:hover span {
  transform: translateX(4px);
}

.btn-cta-secondary {
  padding: 1rem 2.5rem;
  color: #5d5a88;
  font-weight: 600;
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-radius: 9999px;
  background-color: transparent;
  cursor: pointer;
  font-size: 1.125rem;
  transition: all 0.2s ease;
}

.btn-cta-secondary:hover {
  border-color: #3b82f6;
  color: #3b82f6;
  background-color: rgba(59, 130, 246, 0.05);
}

.cta-badges {
  margin-top: 4rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  justify-content: center;
  align-items: center;
  font-size: 0.875rem;
}

@media (min-width: 640px) {
  .cta-badges {
    flex-direction: row;
    gap: 1.5rem;
  }
}

.cta-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: rgba(93, 90, 136, 0.7);
  font-weight: 500;
}

.cta-badge img {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.cta-divider {
  display: none;
  color: rgba(93, 90, 136, 0.3);
}

@media (min-width: 640px) {
  .cta-divider {
    display: block;
  }
}

/* CONTACTS SECTION */
#contacts {
  padding: 6rem 1rem;
  background: linear-gradient(to bottom, #f8f7fc, white);
  position: relative;
}

@media (min-width: 1024px) {
  #contacts {
    padding: 8rem 2rem;
  }
}

.contacts-container {
  width: 100%;
  max-width: 672px;
  margin: 0 auto;
}

.contacts-header {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.contacts-header-text {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.contacts-label {
  color: #3b82f6;
  font-weight: 600;
  font-size: 1.125rem;
}

.contacts-title {
  font-size: 2rem;
  font-weight: 700;
  color: #5d5a88;
}

@media (min-width: 1024px) {
  .contacts-title {
    font-size: 2.25rem;
  }
}

.contacts-subtitle {
  font-size: 1.25rem;
  color: rgba(93, 90, 136, 0.6);
}

.contacts-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  margin-top: 3rem;
}

@media (min-width: 768px) {
  .contacts-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.contact-card {
  padding: 1.5rem;
  background-color: white;
  border-radius: 1rem;
  border: 2px solid rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  text-decoration: none;
  color: inherit;
}

.contact-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 8px 20px rgba(212, 132, 106, 0.35);
}

.contact-card-inner {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.contact-card-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 0.75rem;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(59, 130, 246, 0.1));
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.contact-card-icon svg {
  width: 1.5rem;
  height: 1.5rem;
  color: #3b82f6;
}

.contact-card-text {
  text-align: left;
}

.contact-card-title {
  font-weight: 600;
  color: #5d5a88;
  margin-bottom: 0.25rem;
}

.contact-card-value {
  color: rgba(93, 90, 136, 0.6);
  transition: color 0.2s ease;
}

.contact-card:hover .contact-card-value {
  color: #3b82f6;
}

.contacts-note {
  margin-top: 3rem;
  padding: 1.5rem;
  background-color: rgba(59, 130, 246, 0.05);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 1rem;
  color: rgba(93, 90, 136, 0.7);
}
</style>
