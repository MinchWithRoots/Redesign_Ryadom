<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const navigate = (path: string) => {
  router.push(path)
  window.scrollTo(0, 0)
}

const scrollToSection = (sectionId: string) => {
  if (route.path !== '/') {
    router.push('/').then(() => {
      setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    })
  } else {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' })
  }
}
</script>

<template>
  <footer id="contacts" class="footer">
    <div class="footer__container">
      <div class="footer__grid">
        <!-- Logo and description -->
        <div class="footer__brand">
          <div class="footer__logo" @click="navigate('/')">
            <svg width="39" height="33" viewBox="0 0 39 33" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M37.9662 14.6969C36.0953 22.6194 25.1503 29.642 20.8759 32.1193C19.8083 32.738 18.5251 32.738 17.4575 32.1193C13.183 29.642 2.23799 22.6194 0.367092 14.6969C-1.32228 7.54316 2.96523 0.110145 10.2256 0.00332708C10.3755 0.0011221 10.5276 0 10.6819 0C13.6047 0 16.214 1.45987 17.7437 2.53919C18.5795 3.12884 19.7539 3.12884 20.5896 2.53919C22.1193 1.45987 24.7287 0 27.6514 0C27.8057 0 27.9578 0.0011221 28.1077 0.00332708C35.3681 0.110145 39.6556 7.54316 37.9662 14.6969Z" fill="#FF7D2D"/>
            </svg>
            <span class="footer__logo-text">Рядом</span>
          </div>
          <p class="footer__description">
            Платформа для подбора собеседника и партнёра для психологической поддержки и терапии
          </p>
        </div>

        <!-- Navigation -->
        <div class="footer__nav-col">
          <h3 class="footer__col-title">Навигация</h3>
          <nav class="footer__nav">
            <button @click="navigate('/')" class="footer__nav-link">Главная</button>
            <button @click="scrollToSection('about')" class="footer__nav-link">О нас</button>
            <button @click="scrollToSection('reviews')" class="footer__nav-link">Отзывы</button>
            <button @click="scrollToSection('contacts')" class="footer__nav-link">Контакты</button>
          </nav>
        </div>

        <!-- Contact Info -->
        <div class="footer__contact-col">
          <h3 class="footer__col-title">Контакты</h3>
          <div class="footer__contact-list">
            <a href="mailto:info@ryandom.ru" class="footer__contact-link">info@ryandom.ru</a>
            <a href="tel:+79000000000" class="footer__contact-link">+7 (900) 000-00-00</a>
          </div>
        </div>
      </div>

      <div class="footer__divider"></div>

      <p class="footer__copyright">© 2026 Рядом. Все права защищены.</p>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  background: #090B2E;
  border-top: 1px solid rgba(211, 210, 227, 0.30);
  padding: 80px 0;
}

.footer__container {
  max-width: 1536px;
  margin: 0 auto;
  padding: 0 clamp(1.5rem, 5vw, 11rem);
  display: flex;
  flex-direction: column;
  gap: 64px;
}

.footer__grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 48px;
  align-items: flex-start;
}

.footer__brand {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.footer__logo {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.footer__logo-text {
  color: #fff;
  font-family: Inter, sans-serif;
  font-size: 20px;
  font-weight: 700;
  line-height: 28px;
}

.footer__description {
  color: #fff;
  font-family: Inter, sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 22.75px;
  margin: 0;
}

.footer__col-title {
  color: #fff;
  font-family: Inter, sans-serif;
  font-size: 15px;
  font-weight: 600;
  line-height: 24px;
  margin: 0 0 24px;
}

.footer__nav {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.footer__nav-link {
  background: none;
  border: none;
  padding: 0;
  color: #fff;
  font-family: Inter, sans-serif;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  cursor: pointer;
  text-align: left;
  transition: opacity 0.2s;
}

.footer__nav-link:hover {
  opacity: 0.7;
}

.footer__contact-col {
  display: flex;
  flex-direction: column;
}

.footer__contact-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.footer__contact-link {
  color: #fff;
  font-family: Inter, sans-serif;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  text-decoration: none;
  transition: opacity 0.2s;
}

.footer__contact-link:hover {
  opacity: 0.7;
}

.footer__divider {
  height: 1px;
  background: rgba(211, 210, 227, 0.30);
}

.footer__copyright {
  color: #fff;
  font-family: Inter, sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 22px;
  text-align: center;
  margin: 0;
}

@media (max-width: 768px) {
  .footer {
    padding: 48px 0;
  }

  .footer__container {
    gap: 40px;
  }

  .footer__grid {
    grid-template-columns: 1fr;
    gap: 32px;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .footer__grid {
    grid-template-columns: 1fr 1fr;
  }

  .footer__brand {
    grid-column: 1 / -1;
  }
}
</style>
