import { defineStore } from 'pinia'
import { cachedGet } from '@/lib/api'

const readInitialSlug = () => localStorage.getItem('company_slug') || import.meta.env.VITE_COMPANY_SLUG || ''
const COMPANIES_TTL_MS = 60_000

export const useCompanyStore = defineStore('company', {
  state: () => ({
    currentSlug: readInitialSlug(),
    companies: [],
    loading: false,
    publicLoadedAt: 0,
    myLoadedAt: 0,
    publicLoadPromise: null,
    myLoadPromise: null,
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
    async loadPublicCompanies(options = {}) {
      const force = Boolean(options.force)
      const hasFreshData =
        !force &&
        this.companies.length > 0 &&
        this.publicLoadedAt > 0 &&
        Date.now() - this.publicLoadedAt < COMPANIES_TTL_MS

      if (hasFreshData) {
        return this.companies
      }

      if (!force && this.publicLoadPromise) {
        return this.publicLoadPromise
      }

      this.loading = true
      this.publicLoadPromise = cachedGet('/api/companies', {}, { ttl: COMPANIES_TTL_MS, force })
        .then(({ data }) => {
          const companies = Array.isArray(data?.companies) ? data.companies : []
          this.companies = companies
          this.publicLoadedAt = Date.now()
          this.applyCurrentFromPayload(data)
          return companies
        })
        .finally(() => {
          this.publicLoadPromise = null
          this.loading = false
        })

      return this.publicLoadPromise
    },
    async loadMyCompanies(options = {}) {
      const force = Boolean(options.force)
      const hasFreshData =
        !force &&
        this.companies.length > 0 &&
        this.myLoadedAt > 0 &&
        Date.now() - this.myLoadedAt < COMPANIES_TTL_MS

      if (hasFreshData) {
        return this.companies
      }

      if (!force && this.myLoadPromise) {
        return this.myLoadPromise
      }

      this.loading = true
      this.myLoadPromise = cachedGet('/api/companies/my', {}, { ttl: COMPANIES_TTL_MS, force })
        .then(({ data }) => {
          const companies = Array.isArray(data?.companies) ? data.companies : []
          this.companies = companies
          this.myLoadedAt = Date.now()
          this.applyCurrentFromPayload(data)
          return companies
        })
        .finally(() => {
          this.myLoadPromise = null
          this.loading = false
        })

      return this.myLoadPromise
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
