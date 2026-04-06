const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

let authToken: string | null = localStorage.getItem('authToken')

// Set token
export const setAuthToken = (token: string) => {
  authToken = token
  localStorage.setItem('authToken', token)
}

// Get token
export const getAuthToken = () => {
  return authToken || localStorage.getItem('authToken')
}

// Clear token
export const clearAuthToken = () => {
  authToken = null
  localStorage.removeItem('authToken')
}

// Helper function for API calls
const fetchAPI = async (endpoint: string, options: RequestInit = {}) => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  const token = getAuthToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'API Error')
  }

  return response.json()
}

// Auth API
export const authAPI = {
  register: (fullName: string, email: string, password: string) =>
    fetchAPI('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ fullName, email, password }),
    }),

  login: (email: string, password: string) =>
    fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getCurrentUser: () => fetchAPI('/auth/me'),
}

// Companions API
export const companionsAPI = {
  getAll: (filters: { ageMin?: number; ageMax?: number; experience?: string; topic?: string }) => {
    const params = new URLSearchParams()
    if (filters.ageMin) params.append('ageMin', filters.ageMin.toString())
    if (filters.ageMax) params.append('ageMax', filters.ageMax.toString())
    if (filters.experience) params.append('experience', filters.experience)
    if (filters.topic) params.append('topic', filters.topic)

    return fetchAPI(`/companions?${params.toString()}`)
  },

  getById: (id: number) => fetchAPI(`/companions/${id}`),
}

// Chats API
export const chatsAPI = {
  getAll: () => fetchAPI('/chats'),

  create: (companionId: number) =>
    fetchAPI('/chats/create', {
      method: 'POST',
      body: JSON.stringify({ companionId }),
    }),

  getMessages: (chatId: number) => fetchAPI(`/chats/${chatId}/messages`),

  sendMessage: (chatId: number, text: string) =>
    fetchAPI(`/chats/${chatId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),

  delete: (chatId: number) =>
    fetchAPI(`/chats/${chatId}`, { method: 'DELETE' }),

  endSession: (chatId: number) =>
    fetchAPI(`/chats/${chatId}/end-session`, { method: 'POST' }),
}

// Users API
export const usersAPI = {
  getProfile: () => fetchAPI('/users/profile'),

  updateProfile: (bio: string, image?: string) =>
    fetchAPI('/users/profile', {
      method: 'PUT',
      body: JSON.stringify({ bio, image }),
    }),
}
