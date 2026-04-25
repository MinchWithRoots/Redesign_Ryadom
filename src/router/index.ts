import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { isLoggedIn, isAdmin } from '../composables/useAppState'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomeView,
  },
  {
    path: '/recommendations',
    name: 'Recommendations',
    component: () => import('../views/RecommendationsView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/search',
    name: 'Search',
    component: () => import('../views/SearchView.vue'),
  },
  {
    path: '/profile-setup',
    name: 'ProfileSetup',
    component: () => import('../views/ProfileSetupView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/ProfileView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/chat',
    name: 'Chat',
    component: () => import('../views/ChatView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/user/:id',
    name: 'UserProfile',
    component: () => import('../views/UserProfileView.vue'),
  },
  {
    path: '/auth',
    name: 'Auth',
    component: () => import('../views/AuthView.vue'),
  },
  {
    path: '/admin',
    name: 'AdminDashboard',
    component: () => import('../views/AdminDashboardView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// Navigation guard to check authentication and authorization
router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin)
  const userIsLoggedIn = isLoggedIn()
  const userIsAdmin = isAdmin()

  // Check if route requires authentication
  if (requiresAuth && !userIsLoggedIn) {
    next('/auth')
    return
  }

  // Check if route requires admin role
  if (requiresAdmin && !userIsAdmin) {
    next('/profile')
    return
  }

  // If user is logged in and tries to access auth page (but not profile-setup), redirect to home
  if (to.path === '/auth' && userIsLoggedIn) {
    next('/')
    return
  }

  // Allow navigation
  next()
})

export default router
