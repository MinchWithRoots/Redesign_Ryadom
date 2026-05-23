<script setup lang="ts">
import { ref, computed, onMounted, onActivated } from 'vue'
import { useRouter } from 'vue-router'
import { currentUser, companions, chats, sendConnectionRequest, loadCompanions, topics, loadTopics } from '../composables/useAppState'
import AuthRequiredModal from '../components/AuthRequiredModal.vue'
import ImageWithFallback from '../components/ImageWithFallback.vue'
import { getAgeForm } from '../utils/ageForm'
import { getExperienceText } from '../utils/experienceForm'
import '@/assets/search.css'

const router = useRouter()
const authModal = ref<InstanceType<typeof AuthRequiredModal> | null>(null)
const selectedCompanion = ref<(typeof companions)['value'][0] | null>(null)
const showNotification = ref('')

const filters = ref({
  gender: 'all',
  ageMin: 18,
  ageMax: 65,
  experience: 'all',
  topic: 'all',
})

const filteredCompanions = computed(() => {
  let filteredCompanionList = [...companions.value]

  // Filter by gender
  if (filters.value.gender !== 'all') {
    filteredCompanionList = filteredCompanionList.filter(companion => companion.gender === filters.value.gender)
  }

  // Filter by age
  filteredCompanionList = filteredCompanionList.filter(
    companion => companion.age >= filters.value.ageMin && companion.age <= filters.value.ageMax
  )

  // Filter by experience
  if (filters.value.experience !== 'all') {
    filteredCompanionList = filteredCompanionList.filter(companion => companion.experience === filters.value.experience)
  }

  // Filter by topic
  if (filters.value.topic !== 'all') {
    filteredCompanionList = filteredCompanionList.filter(
      companion => companion.topics && companion.topics.includes(filters.value.topic)
    )
  }

  return filteredCompanionList
})


const loadData = async () => {
  try {
    await Promise.all([
      loadCompanions(),
      loadTopics()
    ])
  } catch (err) {
    console.error('Failed to load companions or topics:', err)
  }
}

onMounted(loadData)

onActivated(loadData)

const resetFilters = async () => {
  filters.value = {
    gender: 'all',
    ageMin: 18,
    ageMax: 65,
    experience: 'all',
    topic: 'all',
  }
  try {
    await loadCompanions()
  } catch (err) {
    console.error('Failed to load companions:', err)
  }
}

const handleConnectionRequest = async (companionId: string | number) => {
  try {
    await sendConnectionRequest(companionId.toString())
    showNotification.value = `Запрос отправлен ${selectedCompanion.value?.name}!`
    setTimeout(() => {
      showNotification.value = ''
      selectedCompanion.value = null
    }, 3000)
  } catch (err) {
    let errorMessage = 'Ошибка при отправке запроса'

    if (err instanceof Error) {
      errorMessage = err.message

      if (errorMessage === 'NOT_LOGGED_IN') {
        authModal.value?.openModal()
        return
      }
    }

    console.error('Failed to send connection request:', errorMessage)
    if (err instanceof Error) {
      console.error('Error details:', err.message)
    } else {
      console.error('Error object:', JSON.stringify(err, null, 2))
    }
    showNotification.value = errorMessage
    setTimeout(() => {
      showNotification.value = ''
    }, 4000)
  }
}

const navigateToChat = (companionId: string | number) => {
  const selectedChat = chats.value.find(chatItem => chatItem.companion_id === companionId.toString())
  if (selectedChat) {
    router.push(`/chat?id=${selectedChat.id}`)
  }
}

const navigateToProfile = (companionId: string | number) => {
  // Clear cached companion data to force fresh load on profile page
  router.push(`/user/${companionId}`)
}

const getRussianPlural = (count: number, word: string) => {
  if (count === 0) return 'отзывов'
  const remainder = count % 100
  if (remainder >= 11 && remainder <= 19) return 'отзывов'
  const lastDigit = count % 10
  if (lastDigit === 1) return 'отзыв'
  if (lastDigit >= 2 && lastDigit <= 4) return 'отзыва'
  return 'отзывов'
}
</script>

<template>
  <div class="layout-page">
    <!-- Auth Required Modal -->
    <AuthRequiredModal ref="authModal" />

    <div class="layout-container">
      <!-- Header -->
      <div class="search-header">
        <h1>
          Найди своего <span class="text-primary" style="font-weight: 900;">спутника</span>
        </h1>
        <p>
          Люди в терапии, готовые слушать и поддерживать друг друга
        </p>
      </div>

      <div class="grid-main">
        <!-- Filters Sidebar -->
        <div>
          <div class="filters-sidebar">
            <h3>Фильтры</h3>

            <!-- Gender Filter -->
            <div class="filter-group">
              <p>Пол</p>
              <div class="filter-options">
                <label class="filter-option">
                  <input
                    v-model="filters.gender"
                    type="radio"
                    value="all"
                  />
                  <span>Все</span>
                </label>
                <label class="filter-option">
                  <input
                    v-model="filters.gender"
                    type="radio"
                    value="female"
                  />
                  <span>Женщина</span>
                </label>
                <label class="filter-option">
                  <input
                    v-model="filters.gender"
                    type="radio"
                    value="male"
                  />
                  <span>Мужчина</span>
                </label>
              </div>
            </div>

            <!-- Age Range -->
            <div class="filter-group">
              <p>Возраст</p>
              <div class="filter-range-inputs">
                <input
                  v-model.number="filters.ageMin"
                  type="number"
                  min="18"
                  max="65"
                  class="filter-range-input"
                />
                <input
                  v-model.number="filters.ageMax"
                  type="number"
                  min="18"
                  max="65"
                  class="filter-range-input"
                />
              </div>
              <p class="filter-range-label">
                от {{ filters.ageMin }} {{ getAgeForm(filters.ageMin) }} до {{ filters.ageMax }} {{ getAgeForm(filters.ageMax) }}
              </p>
            </div>

            <!-- Experience -->
            <div class="filter-group">
              <p>Опыт в терапии</p>
              <div class="filter-options">
                <label class="filter-option">
                  <input
                    v-model="filters.experience"
                    type="radio"
                    value="all"
                  />
                  <span>Все</span>
                </label>
                <label class="filter-option">
                  <input
                    v-model="filters.experience"
                    type="radio"
                    value="до года"
                  />
                  <span>До 1 года</span>
                </label>
                <label class="filter-option">
                  <input
                    v-model="filters.experience"
                    type="radio"
                    value="1-3 года"
                  />
                  <span>1–3 года</span>
                </label>
                <label class="filter-option">
                  <input
                    v-model="filters.experience"
                    type="radio"
                    value="более 3 лет"
                  />
                  <span>3+ лет</span>
                </label>
              </div>
            </div>

            <!-- Reset Button -->
            <button
              @click="resetFilters"
              class="btn-reset-filters"
            >
              Сбросить фильтры
            </button>
          </div>
        </div>

        <!-- Main Content -->
        <div>
          <!-- Topic Tags -->
          <div class="topic-tags">
            <button
              @click="filters.topic = 'all'"
              :class="['topic-btn', filters.topic === 'all' ? 'active' : 'inactive']"
            >
              Все темы
            </button>
            <button
              v-for="topic in topics"
              :key="topic"
              @click="filters.topic = topic"
              :class="['topic-btn', filters.topic === topic ? 'active' : 'inactive']"
            >
              {{ topic }}
            </button>
          </div>

          <!-- Notification -->
          <transition name="slide">
            <div v-if="showNotification" class="notification">
              {{ showNotification }}
            </div>
          </transition>

          <!-- Companions Grid -->
          <div class="companions-grid">
            <div
              v-for="companion in filteredCompanions"
              :key="companion.id"
              class="companion-card"
              @click="selectedCompanion = companion"
            >
              <!-- Image -->
              <ImageWithFallback
                :src="companion.image"
                :alt="companion.name"
                class="companion-card-image"
                imageClass="companion-card-image__img"
                fallbackClass="companion-card-image__fallback"
                iconClass="companion-card-image__icon"
              />
              <div class="companion-card-overlay"></div>

              <!-- Info -->
              <div class="companion-card-content">
                <div class="companion-card-header">
                  <h3 class="companion-name">{{ companion.name }}</h3>
                  <div class="companion-meta">
                    <p>{{ companion.age }} {{ getAgeForm(companion.age) }}</p>
                    <span v-if="companion.gender === 'female'">• Женщина</span>
                    <span v-else-if="companion.gender === 'male'">• Мужчина</span>
                  </div>
                </div>
                <p class="companion-experience">Опыт в терапии: {{ getExperienceText(companion.experience) }}</p>
                <p v-if="companion.topics && companion.topics.length > 0" class="companion-topics">Темы: {{ companion.topics.join(', ') }}</p>
                <p class="companion-bio">{{ companion.bio }}</p>

                <!-- Topics -->
                <div class="companion-topic-tags">
                  <span
                    v-for="topic in companion.topics"
                    :key="topic"
                    class="companion-topic-tag"
                  >
                    {{ topic }}
                  </span>
                </div>

                <!-- Testimonials -->
                <div class="companion-reviews">
                  <div v-if="(companion.reviews_count ?? 0) > 0" class="companion-rating">
                    <span class="rating-stars">
                      <span v-for="i in 5" :key="i" class="star" :class="{ 'star--filled': i <= Math.round(companion.average_rating ?? 0) }">★</span>
                    </span>
                    <span class="reviews-count">{{ companion.reviews_count }} {{ getRussianPlural(companion.reviews_count ?? 0, 'отзыв') }}</span>
                  </div>
                </div>

                <!-- Button -->
                <button
                  @click.stop="selectedCompanion = companion"
                  class="btn-companion"
                >
                  Предложить связь
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Reply Modal (if companion selected) -->
    <transition name="fade">
      <div
        v-if="selectedCompanion"
        class="modal-overlay"
        @click="selectedCompanion = null"
      >
        <div
          class="modal-content"
          @click.stop
        >
          <button
            @click="selectedCompanion = null"
            class="modal-close"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div class="modal-center">
            <ImageWithFallback
              :src="selectedCompanion.image"
              :alt="selectedCompanion.name"
              class="modal-avatar-wrapper"
              imageClass="modal-avatar"
              fallbackClass="modal-avatar-fallback"
              iconClass="modal-avatar-icon"
            />
            <h2 class="modal-title">{{ selectedCompanion.name }}</h2>
            <p class="modal-subtitle">{{ selectedCompanion.age }} {{ getAgeForm(selectedCompanion.age) }}</p>
            <div v-if="(selectedCompanion.reviews_count ?? 0) > 0" class="modal-rating">
              <span class="modal-rating-stars">
                <span v-for="i in 5" :key="i" class="modal-star" :class="{ 'modal-star--filled': i <= Math.round(selectedCompanion.average_rating ?? 0) }">★</span>
              </span>
              <span class="modal-reviews-count">{{ selectedCompanion.reviews_count }} {{ getRussianPlural(selectedCompanion.reviews_count ?? 0, 'отзыв') }}</span>
            </div>
          </div>

          <div class="modal-buttons">
            <button
              @click="handleConnectionRequest(selectedCompanion.id)"
              class="btn-modal-primary"
            >
              Предложить связь
            </button>
            <button
              @click="navigateToProfile(selectedCompanion.id)"
              class="btn-modal-secondary"
            >
              Посмотреть профиль
            </button>
          </div>

          <p class="modal-notice">
            Ваш запрос будет отправлен {{ selectedCompanion.name }}. Они смогут ответить в течение 24 часов
          </p>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
