import { defineStore } from 'pinia'
import api, { cachedGet, clearGetCache } from '@/lib/api'

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
    meRequest: null,
    hasValidatedSession: false,
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.token),
    isClient: (state) => state.user?.role === 'client',
    isStaff: (state) => ['staff', 'admin', 'super_admin'].includes(state.user?.role),
    isOperationalStaff: (state) => ['staff', 'admin'].includes(state.user?.role),
    isSuperAdmin: (state) => state.user?.role === 'super_admin',
    isAdmin: (state) => ['admin', 'super_admin'].includes(state.user?.role),
  },
  actions: {
    clearSession() {
      this.token = ''
      this.user = null
      this.meRequest = null
      this.hasValidatedSession = false
      localStorage.removeItem('token')
      clearGetCache()
    },
    async login({ phone, password }) {
      const { data } = await api.post('/api/auth/login', { phone, password }, { skipCompanyHeader: true })
      this.token = data.token
      this.user = data.user
      this.meRequest = null
      this.hasValidatedSession = false
      applyCompanyFromUser(data.user)
      localStorage.setItem('token', data.token)
      clearGetCache()
      return data
    },
    async restoreSession() {
      if (!this.token) return true
      if (this.hasValidatedSession) return true

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
    async loadMe(force = false) {
      if (!this.token) return null
      if (!force && this.user && this.hasValidatedSession) return this.user
      if (!force && this.meRequest) return this.meRequest

      this.meRequest = cachedGet('/api/me', {}, { ttl: 20_000, force })
        .then(({ data }) => {
          this.user = data
          this.hasValidatedSession = true
          applyCompanyFromUser(data)
          return data
        })
        .finally(() => {
          this.meRequest = null
        })

      return this.meRequest
    },
    async logout() {
      try {
        await api.post('/api/auth/logout')
      } catch {
        // ignore logout transport errors
      }
      this.clearSession()
    },
  },
})
