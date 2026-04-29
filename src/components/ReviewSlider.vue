<script setup lang="ts">
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Navigation, Pagination, Autoplay, EffectCoverflow } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import 'swiper/css/effect-coverflow'

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

const modules = [Navigation, Pagination, Autoplay, EffectCoverflow]
</script>

<template>
  <div class="review-slider-container">
    <Swiper
      :modules="modules"
      :slides-per-view="1"
      :space-between="24"
      :pagination="{ clickable: true, bulletClass: 'review-bullet', bulletActiveClass: 'review-bullet-active' }"
      :navigation="{ nextEl: '.swiper-button-next-custom', prevEl: '.swiper-button-prev-custom' }"
      :autoplay="{ delay: 5000, disableOnInteraction: false }"
      :loop="true"
      :effect="'coverflow'"
      :cover-flow-effect="{ rotate: 0, stretch: 0, depth: 100, modifier: 1, slideShadows: false }"
      :breakpoints="{
        576: { slidesPerView: 1, spaceBetween: 24 },
        768: { slidesPerView: 2, spaceBetween: 24 },
        1024: { slidesPerView: 3, spaceBetween: 32 }
      }"
      class="review-swiper"
    >
      <SwiperSlide v-for="review in reviews" :key="review.id" class="review-slide">
        <div
          class="group bg-white border border-border/50 rounded-3xl p-6 md:p-8 shadow-card hover:shadow-hover hover:translate-y-[-8px] transition-all duration-300 relative overflow-hidden h-full flex flex-col"
        >
          <!-- Gradient overlay on hover -->
          <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>

          <!-- Stars -->
          <div class="flex gap-1 mb-4 md:mb-6">
            <img v-for="starIndex in 5" :key="starIndex" src="../images/star.svg" alt="Star" class="w-4 md:w-5 h-4 md:h-5 object-contain" />
          </div>

          <!-- Quote with icon -->
          <div class="relative mb-6 md:mb-8 flex-1">
            <div class="w-6 md:w-8 h-6 md:h-8 absolute -top-2 -left-2">
              <img src="../images/heart-add.svg" alt="Quote" class="w-full h-full object-contain opacity-30" />
            </div>
            <p class="text-secondary/70 text-base md:text-lg leading-relaxed">{{ review.text }}</p>
          </div>

          <!-- Bottom divider -->
          <div class="border-t border-border/50 pt-4 md:pt-6">
            <!-- Avatar and Info -->
            <div class="flex items-center gap-4">
              <img
                :src="review.avatar"
                :alt="review.name"
                class="w-12 md:w-14 h-12 md:h-14 rounded-full object-cover flex-shrink-0 shadow-soft border-2 border-primary/20"
              />
              <div class="flex-1 min-w-0">
                <h4 class="font-bold text-secondary text-base md:text-lg truncate">{{ review.name }}</h4>
                <p class="text-xs md:text-sm text-secondary/60 truncate">{{ review.title }}</p>
              </div>
            </div>
          </div>
        </div>
      </SwiperSlide>
    </Swiper>

    <!-- Custom Navigation Buttons -->
    <div class="mt-8 md:mt-12 flex items-center justify-center gap-4">
      <button
        class="swiper-button-prev-custom w-12 h-12 md:w-14 md:h-14 rounded-full border-2 border-primary/30 hover:border-primary hover:bg-primary/10 text-primary flex items-center justify-center transition-all duration-300 group"
        aria-label="Previous review"
      >
        <svg class="w-5 h-5 md:w-6 md:h-6 group-hover:translate-x-[-2px] transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        class="swiper-button-next-custom w-12 h-12 md:w-14 md:h-14 rounded-full border-2 border-primary/30 hover:border-primary hover:bg-primary/10 text-primary flex items-center justify-center transition-all duration-300 group"
        aria-label="Next review"
      >
        <svg class="w-5 h-5 md:w-6 md:h-6 group-hover:translate-x-[2px] transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>

    <!-- Pagination Dots (visible on mobile, hidden on larger screens) -->
    <div class="mt-6 md:mt-8 flex justify-center md:hidden">
      <div class="swiper-pagination"></div>
    </div>
  </div>
</template>

<style scoped>
.review-slider-container {
  width: 100%;
}

.review-swiper {
  overflow: visible;
  padding: 0 0 0 0;
}

.review-swiper :deep(.swiper-wrapper) {
  align-items: stretch;
}

.review-slide {
  height: auto;
  min-height: 400px;
}

/* Mobile and tablet styles */
@media (max-width: 768px) {
  .review-slide {
    min-height: 380px;
  }
}

/* Navigation buttons styles */
.swiper-button-prev-custom,
.swiper-button-next-custom {
  position: relative;
  cursor: pointer;
}

/* Pagination dots styles */
.swiper-pagination {
  position: relative;
  padding: 0;
  bottom: auto;
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.review-bullet {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #ccc;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.review-bullet:hover {
  background: #aaa;
  transform: scale(1.2);
}

.review-bullet-active {
  background: #ff6b9d;
  box-shadow: 0 0 0 3px rgba(255, 107, 157, 0.2);
}

/* Tablet - show 2 slides */
@media (min-width: 768px) and (max-width: 1023px) {
  .review-swiper :deep(.swiper-slide) {
    min-height: 420px;
  }
}

/* Desktop - show 3 slides */
@media (min-width: 1024px) {
  .review-swiper :deep(.swiper-slide) {
    min-height: 440px;
  }

  .swiper-pagination {
    display: none;
  }
}

/* Responsive text sizes */
@media (max-width: 640px) {
  .review-swiper :deep(.swiper-slide) {
    font-size: 0.875rem;
  }
}
</style>
