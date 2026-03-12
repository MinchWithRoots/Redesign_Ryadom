<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const activeTab = ref('chats')

const userProfile = {
  name: 'Александр К.',
  email: 'alexander@example.com',
  age: 29,
  joinDate: 'Присоединился 3 месяца назад',
  bio: 'Ищу поддержку и помощь в развитии',
  image: 'https://images.pexels.com/photos/31422830/pexels-photo-31422830.png',
  completedSessions: 12,
  rating: 4.8,
}

const chats = ref([
  {
    id: 1,
    name: 'Мария К.',
    lastMessage: 'Спасибо за помощь!',
    time: '2 часа назад',
    unread: 2,
    image: 'https://images.pexels.com/photos/27603433/pexels-photo-27603433.jpeg',
    status: 'active',
  },
  {
    id: 2,
    name: 'Алексей М.',
    lastMessage: 'Давайте попробуем завтра',
    time: '5 часов назад',
    unread: 0,
    image: 'https://images.pexels.com/photos/31422830/pexels-photo-31422830.png',
    status: 'active',
  },
  {
    id: 3,
    name: 'Елена В.',
    lastMessage: 'Сессия завершена',
    time: 'вчера',
    unread: 0,
    image: 'https://images.pexels.com/photos/20860595/pexels-photo-20860595.jpeg',
    status: 'offline',
  },
])

const navigate = (path: string) => {
  router.push(path)
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-white to-light-bg pt-[140px] pb-16">
    <div class="container mx-auto px-4 lg:px-8 max-w-7xl">
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <!-- Sidebar with Profile -->
        <div class="lg:col-span-1">
          <div class="bg-white border border-border/50 rounded-3xl p-6 shadow-card sticky top-[140px]">
            <!-- Profile Card -->
            <div class="text-center mb-6">
              <img
                :src="userProfile.image"
                :alt="userProfile.name"
                class="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
              />
              <h2 class="text-xl font-bold text-secondary mb-1">{{ userProfile.name }}</h2>
              <p class="text-sm text-secondary/60 mb-4">{{ userProfile.age }} лет</p>

              <!-- Stats -->
              <div class="grid grid-cols-2 gap-4 mb-6 p-4 bg-light-bg rounded-2xl">
                <div>
                  <p class="text-2xl font-bold text-primary">{{ userProfile.completedSessions }}</p>
                  <p class="text-xs text-secondary/60">сессий</p>
                </div>
                <div>
                  <div class="flex items-center justify-center gap-1 mb-1">
                    <svg class="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span class="font-bold text-primary">{{ userProfile.rating }}</span>
                  </div>
                  <p class="text-xs text-secondary/60">рейтинг</p>
                </div>
              </div>
            </div>

            <!-- Bio -->
            <p class="text-sm text-secondary/70 text-center mb-6 leading-relaxed">
              {{ userProfile.bio }}
            </p>

            <!-- Divider -->
            <div class="border-t border-border/50 my-6"></div>

            <!-- Menu -->
            <nav class="flex flex-col gap-2">
              <button
                @click="activeTab = 'profile'"
                :class="[
                  'text-left px-4 py-3 rounded-xl font-medium transition-all',
                  activeTab === 'profile'
                    ? 'bg-primary/10 text-primary'
                    : 'text-secondary/70 hover:bg-light-bg'
                ]"
              >
                📋 Мой профиль
              </button>
              <button
                @click="activeTab = 'chats'"
                :class="[
                  'text-left px-4 py-3 rounded-xl font-medium transition-all',
                  activeTab === 'chats'
                    ? 'bg-primary/10 text-primary'
                    : 'text-secondary/70 hover:bg-light-bg'
                ]"
              >
                💬 Мои чаты
              </button>
              <button
                @click="activeTab = 'settings'"
                :class="[
                  'text-left px-4 py-3 rounded-xl font-medium transition-all',
                  activeTab === 'settings'
                    ? 'bg-primary/10 text-primary'
                    : 'text-secondary/70 hover:bg-light-bg'
                ]"
              >
                ⚙️ Настройки
              </button>
            </nav>

            <!-- Logout -->
            <button
              @click="navigate('/')"
              class="w-full mt-6 py-2 text-secondary font-medium border border-border rounded-full hover:border-primary hover:text-primary transition-all text-sm"
            >
              Выйти
            </button>
          </div>
        </div>

        <!-- Main Content -->
        <div class="lg:col-span-3">
          <!-- Profile Tab -->
          <div v-if="activeTab === 'profile'" class="space-y-6">
            <!-- Edit Profile Card -->
            <div class="bg-white border border-border/50 rounded-3xl p-8 shadow-card">
              <h2 class="text-2xl font-bold text-secondary mb-6">Мой профиль</h2>

              <div class="space-y-6">
                <!-- Name -->
                <div>
                  <label class="text-sm font-semibold text-secondary block mb-2">Полное имя</label>
                  <input
                    type="text"
                    :value="userProfile.name"
                    disabled
                    class="w-full px-4 py-3 border border-border rounded-xl bg-light-bg text-secondary"
                  />
                </div>

                <!-- Email -->
                <div>
                  <label class="text-sm font-semibold text-secondary block mb-2">Email</label>
                  <input
                    type="email"
                    :value="userProfile.email"
                    disabled
                    class="w-full px-4 py-3 border border-border rounded-xl bg-light-bg text-secondary"
                  />
                </div>

                <!-- Bio -->
                <div>
                  <label class="text-sm font-semibold text-secondary block mb-2">О себе</label>
                  <textarea
                    :value="userProfile.bio"
                    rows="4"
                    class="w-full px-4 py-3 border border-border rounded-xl text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  ></textarea>
                </div>

                <!-- Buttons -->
                <div class="flex gap-4 pt-4">
                  <button
                    class="px-8 py-3 bg-gradient-to-r from-primary to-primary/90 text-white font-semibold rounded-full shadow-soft hover:shadow-hover transition-all"
                  >
                    Сохранить
                  </button>
                  <button
                    class="px-8 py-3 text-secondary font-semibold border-2 border-border rounded-full hover:border-primary hover:text-primary transition-all"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Chats Tab -->
          <div v-if="activeTab === 'chats'" class="space-y-4">
            <h2 class="text-2xl font-bold text-secondary mb-6">Мои чаты</h2>

            <div v-if="chats.length > 0" class="space-y-3">
              <div
                v-for="chat in chats"
                :key="chat.id"
                @click="navigate('/chat')"
                class="bg-white border border-border/50 rounded-2xl p-4 shadow-card hover:shadow-hover hover:translate-y-[-2px] transition-all cursor-pointer"
              >
                <div class="flex items-center gap-4">
                  <!-- Avatar -->
                  <div class="relative flex-shrink-0">
                    <img
                      :src="chat.image"
                      :alt="chat.name"
                      class="w-16 h-16 rounded-full object-cover"
                    />
                    <div
                      :class="[
                        'absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white',
                        chat.status === 'active' ? 'bg-green-500' : 'bg-secondary/30'
                      ]"
                    ></div>
                  </div>

                  <!-- Info -->
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                      <h3 class="font-bold text-secondary">{{ chat.name }}</h3>
                      <span v-if="chat.unread > 0" class="ml-auto px-2 py-1 bg-primary text-white text-xs font-bold rounded-full">
                        {{ chat.unread }}
                      </span>
                    </div>
                    <p class="text-sm text-secondary/60 truncate">{{ chat.lastMessage }}</p>
                    <p class="text-xs text-secondary/50 mt-1">{{ chat.time }}</p>
                  </div>

                  <!-- Arrow -->
                  <svg class="w-5 h-5 text-secondary/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <!-- Settings Tab -->
          <div v-if="activeTab === 'settings'" class="space-y-6">
            <div class="bg-white border border-border/50 rounded-3xl p-8 shadow-card">
              <h2 class="text-2xl font-bold text-secondary mb-6">Настройки</h2>

              <!-- Notifications -->
              <div class="mb-6 pb-6 border-b border-border/50">
                <h3 class="text-lg font-semibold text-secondary mb-4">Уведомления</h3>
                <div class="space-y-3">
                  <label class="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked class="w-5 h-5 accent-primary rounded" />
                    <span class="text-secondary/70">Email уведомления</span>
                  </label>
                  <label class="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked class="w-5 h-5 accent-primary rounded" />
                    <span class="text-secondary/70">Уведомления о новых сообщениях</span>
                  </label>
                  <label class="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" class="w-5 h-5 accent-primary rounded" />
                    <span class="text-secondary/70">Маркетинговые письма</span>
                  </label>
                </div>
              </div>

              <!-- Privacy -->
              <div class="mb-6 pb-6 border-b border-border/50">
                <h3 class="text-lg font-semibold text-secondary mb-4">Приватность</h3>
                <div class="space-y-3">
                  <label class="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked class="w-5 h-5 accent-primary rounded" />
                    <span class="text-secondary/70">Показывать мой статус онлайн</span>
                  </label>
                  <label class="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked class="w-5 h-5 accent-primary rounded" />
                    <span class="text-secondary/70">Позволить находить меня по email</span>
                  </label>
                </div>
              </div>

              <!-- Save -->
              <button
                class="px-8 py-3 bg-gradient-to-r from-primary to-primary/90 text-white font-semibold rounded-full shadow-soft hover:shadow-hover transition-all"
              >
                Сохранить настройки
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
