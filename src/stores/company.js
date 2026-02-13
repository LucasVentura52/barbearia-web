import { defineStore } from 'pinia'
import api from '@/lib/api'

const readInitialSlug = () => localStorage.getItem('company_slug') || import.meta.env.VITE_COMPANY_SLUG || ''

export const useCompanyStore = defineStore('company', {
  state: () => ({
    currentSlug: readInitialSlug(),
    companies: [],
    loading: false,
  }),
  getters: {
    hasCompanies: (state) => state.companies.length > 0,
    currentCompany: (state) => state.companies.find((company) => company.slug === state.currentSlug) || null,
    options: (state) => state.companies.map((company) => ({
      title: company.name,
      value: company.slug,
    })),
  },
  actions: {
    setCurrentSlug(slug) {
      const value = String(slug || '').trim()
      this.currentSlug = value

      if (value) {
        localStorage.setItem('company_slug', value)
      } else {
        localStorage.removeItem('company_slug')
      }
    },

    async loadPublicCompanies() {
      this.loading = true
      try {
        const { data } = await api.get('/api/companies')
        const companies = Array.isArray(data?.companies) ? data.companies : []
        this.companies = companies
        this.applyCurrentFromPayload(data)
        return companies
      } finally {
        this.loading = false
      }
    },

    async loadMyCompanies() {
      this.loading = true
      try {
        const { data } = await api.get('/api/companies/my')
        const companies = Array.isArray(data?.companies) ? data.companies : []
        this.companies = companies
        this.applyCurrentFromPayload(data)
        return companies
      } finally {
        this.loading = false
      }
    },

    applyCurrentFromPayload(payload) {
      const payloadCurrentSlug = payload?.current?.slug ? String(payload.current.slug) : ''

      if (payloadCurrentSlug) {
        this.setCurrentSlug(payloadCurrentSlug)
        return
      }

      const hasCurrent = this.currentSlug && this.companies.some((company) => company.slug === this.currentSlug)
      if (hasCurrent) {
        return
      }

      if (this.companies.length > 0) {
        this.setCurrentSlug(this.companies[0].slug)
      }
    },
  },
})
