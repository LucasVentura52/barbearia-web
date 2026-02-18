import { defineStore } from 'pinia'
import api from '@/lib/api'

const applyCompanyFromUser = (user) => {
  const slug = user?.company?.slug
  if (slug) {
    localStorage.setItem('company_slug', slug)
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    user: null,
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.token),
    isStaff: (state) => ['staff', 'admin', 'super_admin'].includes(state.user?.role),
    isClient: (state) => state.user?.role === 'client',
    isSuperAdmin: (state) => state.user?.role === 'super_admin',
  },
  actions: {
    clearSession() {
      this.token = ''
      this.user = null
      localStorage.removeItem('token')
    },
    async registerClient({ name, phone, email, password }) {
      const { data } = await api.post('/api/auth/register', { name, phone, email, password })
      this.token = data.token
      this.user = data.user
      applyCompanyFromUser(data.user)
      localStorage.setItem('token', data.token)
      return data
    },
    async login({ phone, password }) {
      const { data } = await api.post('/api/auth/login', { phone, password })
      this.token = data.token
      this.user = data.user
      applyCompanyFromUser(data.user)
      localStorage.setItem('token', data.token)
      return data
    },
    async restoreSession() {
      if (!this.token) return true
      if (this.user) return true

      try {
        await this.loadMe()
        return true
      } catch (error) {
        if (error?.response?.status === 401) {
          this.clearSession()
          return false
        }
        throw error
      }
    },
    async loadMe() {
      if (!this.token) return null
      const { data } = await api.get('/api/me')
      this.user = data
      applyCompanyFromUser(data)
      return data
    },
    async logout() {
      try {
        await api.post('/api/auth/logout')
      } catch (err) {
        // ignore
      }
      this.clearSession()
    },
  },
})
