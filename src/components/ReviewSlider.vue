<script setup lang="ts">
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Navigation, Pagination, Autoplay } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import { ref, onMounted } from 'vue'

interface Review {
  id: number | string
  name: string
  title: string
  text: string
  avatar: string
}

defineProps<{
  reviews: Review[]
}>()

const modules = [Navigation, Pagination, Autoplay]
const swiperInstance = ref<any>(null)

const handleSwiperInit = (swiper: any) => {
  swiperInstance.value = swiper
}
</script>

<template>
  <div class="emotions-slider">
    <!-- Slider Navigation -->
    <div class="emotions-slider__nav slider-nav">
      <div
        tabindex="0"
        class="slider-nav__item slider-nav__item_prev"
        @click="swiperInstance?.slidePrev()"
        aria-label="Previous review"
      >
        <svg width="16" height="28" viewBox="0 0 16 28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 26L2 14L14 2" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </div>
      <div
        tabindex="0"
        class="slider-nav__item slider-nav__item_next"
        @click="swiperInstance?.slideNext()"
        aria-label="Next review"
      >
        <svg width="16" height="28" viewBox="0 0 16 28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 26L14 14L2 2" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </div>
    </div>

    <!-- Slider Content -->
    <Swiper
      :modules="modules"
      :slides-per-view="'auto'"
      :space-between="20"
      :speed="600"
      :centered-slides="true"
      :initial-slide="1"
      :autoplay="{ delay: 6000, disableOnInteraction: false }"
      :pagination="{ el: '.emotions-slider__pagination', clickable: true, type: 'bullets' }"
      :breakpoints="{
        768: { spaceBetween: 40 }
      }"
      @swiper="handleSwiperInit"
      class="emotions-slider__slider swiper"
    >
      <SwiperSlide v-for="review in reviews" :key="review.id" class="emotions-slider__slide swiper-slide">
        <div class="emotions-slider__item emotions-slider-item">
          <!-- Avatar as Image -->
          <div class="emotions-slider-item__image">
            <img :src="review.avatar" :alt="review.name" />
          </div>

          <!-- Content -->
          <div class="emotions-slider-item__content">
            <!-- Header with Stars and Author -->
            <div class="emotions-slider-item__header">
              <div class="emotions-slider-item__header-inner">
                <!-- Rating Stars -->
                <div class="emotions-slider-item__rating">
                  <img v-for="n in 5" :key="n" src="../images/star.svg" alt="Star" class="emotions-slider-item__star" />
                </div>
                <!-- Author -->
                <div class="emotions-slider-item__author">
                  <div class="emotions-slider-item__author-image">
                    <img :src="review.avatar" :alt="review.name" />
                  </div>
                  <div class="emotions-slider-item__author-name">
                    {{ review.name }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Info -->
            <div class="emotions-slider-item__info">
              <h2 class="emotions-slider-item__title">
                {{ review.name }}
              </h2>
              <div class="emotions-slider-item__subtitle">
                {{ review.title }}
              </div>
              <div class="emotions-slider-item__text">
                {{ review.text }}
              </div>
            </div>

            <!-- Footer with Button -->
            <div class="emotions-slider-item__footer">
              <a class="emotions-slider-item__btn" href="/" @click.prevent>
                <span class="emotions-slider-item__btn-text">Прочитать</span>
                <span class="emotions-slider-item__btn-icon"></span>
              </a>
            </div>
          </div>
        </div>
      </SwiperSlide>
    </Swiper>

    <!-- Slider Pagination -->
    <div class="emotions-slider__pagination slider-pagination"></div>
  </div>
</template>

<style scoped>
.emotions-slider {
  --color-gray: #818181;
  --color-gray-dark: #1e1e1e;
  --color-primary: #ff6b9d;

  padding-inline: 98px;
  position: relative;
}

.emotions-slider__slide {
  display: flex;
  align-items: center;
  min-height: 550px;
}

@media screen and (max-width: 1023px) {
  .emotions-slider {
    padding-inline: 60px;
  }

  .emotions-slider__slide {
    min-height: 480px;
  }
}

@media screen and (max-width: 767.9px) {
  .emotions-slider {
    padding: 0;
    margin-inline: -20px;
  }

  .emotions-slider__slide {
    min-height: 400px;
  }
}

/* Slider Navigation */

.slider-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  position: absolute;
  top: 50%;
  left: 0;
  translate: 0 -50%;
  z-index: 10;
  pointer-events: none;
}

.slider-nav__item {
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
  width: 48px;
  pointer-events: auto;
  cursor: pointer;
  transition: all 0.3s ease-out;
  color: var(--color-gray);
}

.slider-nav__item.disabled {
  cursor: default;
  opacity: 0.5;
}

.slider-nav__item svg path {
  stroke: currentColor;
}

@media (hover: hover) and (pointer: fine) {
  .slider-nav__item:not(.disabled):hover {
    color: var(--color-primary);
    transform: scale(1.1);
  }
}

@media (hover: none) {
  .slider-nav__item:not(.disabled):active {
    color: var(--color-primary);
  }
}

@media screen and (max-width: 767.9px) {
  .slider-nav {
    display: none;
  }
}

/* Slider Pagination */

.slider-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
  padding-top: 40px;
}

.swiper-pagination-lock {
  display: none !important;
}

.emotions-slider__pagination :deep(.swiper-pagination-bullet) {
  width: 8px;
  height: 8px;
  border-radius: 99px;
  background: rgba(255, 107, 157, 0.2);
  transition: all 0.3s ease-out;
  opacity: 1;
  margin: 0 4px;
}

.emotions-slider__pagination :deep(.swiper-pagination-bullet-active) {
  width: 30px;
  background: var(--color-primary);
  opacity: 1;
  border-radius: 4px;
}

/* Slider Item */

.swiper-slide {
  width: auto;
  height: auto;
}

.emotions-slider-item {
  --border-radius: 10px;

  width: calc(100dvw - 60px);
  max-width: 400px;
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: var(--border-radius);
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

@media screen and (max-width: 767.9px) {
  .emotions-slider-item {
    width: calc(100dvw - 60px);
    max-width: 100%;
  }
}

.emotions-slider-item__image {
  aspect-ratio: 400 / 270;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.emotions-slider-item__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.emotions-slider-item__content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px 20px;
  color: var(--color-gray-dark);
}

.emotions-slider-item__header,
.emotions-slider-item__footer {
  max-height: 60px;
  overflow: hidden;
  transition: max-height 0.6s ease-in;
}

.emotions-slider-item__header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.emotions-slider-item__rating {
  display: flex;
  gap: 4px;
}

.emotions-slider-item__star {
  width: 16px;
  height: 16px;
}

.emotions-slider-item__author {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.emotions-slider-item__author-image {
  flex-shrink: 0;
  aspect-ratio: 1;
  width: 24px;
  border-radius: 100%;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.emotions-slider-item__author-image img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.emotions-slider-item__author-name {
  color: var(--color-gray);
  font-size: 12px;
  line-height: 1.3;
}

.emotions-slider-item__info {
  flex: 1;
}

.emotions-slider-item__title {
  font-weight: 600;
  font-size: 18px;
  line-height: 1.3;
  margin-bottom: 4px;
  color: var(--color-gray-dark);
}

.emotions-slider-item__subtitle {
  font-size: 12px;
  color: var(--color-primary);
  font-weight: 500;
  margin-bottom: 8px;
}

.emotions-slider-item__text {
  font-weight: 400;
  font-size: 14px;
  line-height: 1.5;
  opacity: 0.8;
  color: var(--color-gray);
}

.emotions-slider-item__btn {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  font-size: 14px;
  color: var(--color-primary);
  text-decoration: none;
  transition: all 0.3s ease;
  cursor: pointer;
}

.emotions-slider-item__btn-icon {
  flex-shrink: 0;
  display: block;
  aspect-ratio: 1;
  width: 20px;
  position: relative;
  overflow: hidden;
}

.emotions-slider-item__btn-icon::before,
.emotions-slider-item__btn-icon::after {
  content: '';
  display: block;
  width: 100%;
  height: 100%;
  background: url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M4 10h12M14 7l3 3-3 3' stroke='%23ff6b9d' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")
    center center no-repeat;
  background-size: 100%;
  transition: translate 0.4s ease;
}

.emotions-slider-item__btn-icon::after {
  position: absolute;
  top: 100%;
  right: 100%;
  translate: 100% -100%;
}

@keyframes btn-arrow-move {
  0% {
    translate: 0;
  }

  100% {
    translate: 100% -100%;
  }
}

/* Hide header/footer for non-active slides */
.emotions-slider__slide:not(.swiper-slide-active) .emotions-slider-item__header,
.emotions-slider__slide:not(.swiper-slide-active) .emotions-slider-item__footer {
  max-height: 0;
}

@media (hover: hover) and (pointer: fine) {
  .emotions-slider-item__btn:hover .emotions-slider-item__btn-icon::before,
  .emotions-slider-item__btn:hover .emotions-slider-item__btn-icon::after {
    animation: btn-arrow-move 0.4s ease forwards;
  }
}

@media (hover: none) {
  .emotions-slider-item__btn:active .emotions-slider-item__btn-icon::before,
  .emotions-slider-item__btn:active .emotions-slider-item__btn-icon::after {
    animation: btn-arrow-move 0.4s ease forwards;
  }
}

/* Responsive adjustments */
@media screen and (max-width: 1023px) {
  .emotions-slider-item {
    max-width: 350px;
  }

  .emotions-slider-item__content {
    gap: 16px;
    padding: 20px 16px;
  }

  .emotions-slider-item__title {
    font-size: 16px;
  }

  .emotions-slider-item__text {
    font-size: 13px;
  }
}

@media screen and (max-width: 767.9px) {
  .emotions-slider-item {
    max-width: 100%;
  }

  .emotions-slider-item__content {
    gap: 14px;
    padding: 18px 16px;
  }

  .emotions-slider-item__title {
    font-size: 16px;
  }

  .emotions-slider-item__star {
    width: 14px;
    height: 14px;
  }

  .emotions-slider-item__text {
    font-size: 13px;
    line-height: 1.4;
  }
}
</style>
