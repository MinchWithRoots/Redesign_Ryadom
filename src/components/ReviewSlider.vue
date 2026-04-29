<script setup lang="ts">
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Navigation, Pagination, Autoplay } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

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
</script>

<template>
  <div class="review-slider-container">
    <Swiper
      :modules="modules"
      :slides-per-view="1"
      :space-between="24"
      :pagination="{ clickable: true, bulletClass: 'review-bullet', bulletActiveClass: 'review-bullet-active' }"
      :navigation="{ nextEl: '.swiper-button-next-custom', prevEl: '.swiper-button-prev-custom' }"
      :autoplay="{ delay: 6000, disableOnInteraction: false }"
      :loop="true"
      :breakpoints="{
        576: { slidesPerView: 1, spaceBetween: 24 },
        768: { slidesPerView: 2, spaceBetween: 24 },
        1024: { slidesPerView: 3, spaceBetween: 32 }
      }"
      class="review-swiper"
    >
      <SwiperSlide v-for="review in reviews" :key="review.id" class="review-slide">
        <!-- Centered Quote Card Design (Stripe inspired) -->
        <div class="h-full flex flex-col items-center justify-center bg-white rounded-2xl border border-border/40 p-8 md:p-10 hover:border-primary/30 transition-all duration-300">
          <!-- Stars -->
          <div class="flex gap-1.5 mb-6 md:mb-8">
            <img v-for="starIndex in 5" :key="starIndex" src="../images/star.svg" alt="Star" class="w-4 h-4 md:w-5 md:h-5 object-contain" />
          </div>

          <!-- Quote text - centered -->
          <p class="text-secondary/80 text-base md:text-lg leading-relaxed text-center mb-8 md:mb-10 flex-1 max-w-xs">
            "{{ review.text }}"
          </p>

          <!-- Avatar, Name and Role -->
          <div class="flex flex-col items-center gap-3">
            <img
              :src="review.avatar"
              :alt="review.name"
              class="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border-2 border-primary/20"
            />
            <div class="text-center">
              <h4 class="font-semibold text-secondary text-base md:text-lg">{{ review.name }}</h4>
              <p class="text-xs md:text-sm text-secondary/60 mt-1">{{ review.title }}</p>
            </div>
          </div>
        </div>
      </SwiperSlide>
    </Swiper>

    <!-- Navigation Controls -->
    <div class="mt-8 md:mt-12 flex items-center justify-center gap-6">
      <!-- Previous Button -->
      <button
        class="swiper-button-prev-custom w-10 h-10 md:w-12 md:h-12 rounded-full border border-primary/40 hover:border-primary hover:bg-primary/5 text-primary/60 hover:text-primary flex items-center justify-center transition-all duration-300 group"
        aria-label="Previous review"
      >
        <svg class="w-5 h-5 md:w-6 md:h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <!-- Pagination Dots -->
      <div class="swiper-pagination-custom flex gap-2"></div>

      <!-- Next Button -->
      <button
        class="swiper-button-next-custom w-10 h-10 md:w-12 md:h-12 rounded-full border border-primary/40 hover:border-primary hover:bg-primary/5 text-primary/60 hover:text-primary flex items-center justify-center transition-all duration-300 group"
        aria-label="Next review"
      >
        <svg class="w-5 h-5 md:w-6 md:h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>

    <!-- Pagination Dots for Mobile -->
    <div class="mt-6 md:hidden flex justify-center">
      <div class="swiper-pagination"></div>
    </div>
  </div>
</template>

<style scoped>
.review-slider-container {
  width: 100%;
}

.review-swiper {
  padding: 0;
  overflow: visible;
}

.review-swiper :deep(.swiper-wrapper) {
  align-items: stretch;
}

.review-slide {
  height: auto;
  display: flex;
  align-items: stretch;
}

/* Card minimum heights for consistent layout */
@media (max-width: 576px) {
  .review-slide {
    min-height: 380px;
  }
}

@media (min-width: 577px) and (max-width: 768px) {
  .review-slide {
    min-height: 400px;
  }
}

@media (min-width: 769px) {
  .review-slide {
    min-height: 420px;
  }
}

/* Clean pagination dots */
.swiper-pagination {
  position: relative;
  bottom: auto;
  padding: 0;
  margin-top: 1.5rem;
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.review-bullet {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(51, 51, 51, 0.2);
  cursor: pointer;
  transition: all 0.3s ease;
  opacity: 1;
  margin: 0 4px;
}

.review-bullet:hover {
  background: rgba(51, 51, 51, 0.4);
  transform: scale(1.1);
}

.review-bullet-active {
  background: #ff6b9d;
  width: 24px;
  border-radius: 4px;
  transform: scale(1);
}

/* Navigation buttons */
.swiper-button-prev-custom,
.swiper-button-next-custom {
  position: relative;
  cursor: pointer;
  flex-shrink: 0;
}

/* Hide default pagination on desktop */
@media (min-width: 769px) {
  .swiper-pagination {
    display: none;
  }
}

/* Responsive card spacing */
@media (max-width: 576px) {
  .review-swiper :deep(.swiper-slide) > div {
    padding: 1.5rem;
  }
}

@media (min-width: 577px) and (max-width: 768px) {
  .review-swiper :deep(.swiper-slide) > div {
    padding: 2rem;
  }
}

@media (min-width: 769px) {
  .review-swiper :deep(.swiper-slide) > div {
    padding: 2.5rem;
  }
}
</style>
