import axios from 'axios'

const defaultApiUrl = import.meta.env.PROD
  ? 'https://barbearia-api-uhux.onrender.com'
  : 'http://127.0.0.1:8000'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || defaultApiUrl,
})

const normalizeRequestPath = (url = '') => {
  const value = String(url || '')

  if (!value) return ''

  if (value.startsWith('http://') || value.startsWith('https://')) {
    try {
      return new URL(value).pathname
    } catch {
      return value
    }
  }

  return value
}

const shouldSkipCompanyHeader = (config) => {
  if (config?.skipCompanyHeader) {
    return true
  }

  const method = String(config?.method || 'get').toLowerCase()
  const path = normalizeRequestPath(config?.url)

  if (path === '/api/auth/login' || path === '/api/auth/register') {
    return true
  }

  return method === 'get' && path === '/api/companies'
}

const getCache = new Map()
const pendingGetRequests = new Map()
const DEFAULT_GET_TTL_MS = 15_000

const cloneData = (value) => {
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(value)
    } catch {
      // fallback below
    }
  }

  try {
    return JSON.parse(JSON.stringify(value))
  } catch {
    return value
  }
}

const serializeParams = (params) => {
  if (!params) return ''
  if (typeof params === 'string') return params
  if (params instanceof URLSearchParams) return params.toString()

  const searchParams = new URLSearchParams()
  const sortedKeys = Object.keys(params).sort()

  sortedKeys.forEach((key) => {
    const value = params[key]
    if (value === undefined || value === null) return

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null) {
          searchParams.append(key, String(item))
        }
      })
      return
    }

    if (value instanceof Date) {
      searchParams.append(key, value.toISOString())
      return
    }

    if (typeof value === 'object') {
      searchParams.append(key, JSON.stringify(value))
      return
    }

    searchParams.append(key, String(value))
  })

  return searchParams.toString()
}

const buildGetCacheKey = (url, config = {}) => {
  const params = serializeParams(config.params)
  const companySlug = localStorage.getItem('company_slug') || import.meta.env.VITE_COMPANY_SLUG || ''
  const token = localStorage.getItem('token') || 'guest'
  return `${url}?${params}|company:${companySlug}|token:${token}`
}

const pruneExpiredGetCache = () => {
  const now = Date.now()
  getCache.forEach((entry, key) => {
    if (entry.expiresAt <= now) {
      getCache.delete(key)
    }
  })
}

export const clearGetCache = (predicate = null) => {
  if (typeof predicate !== 'function') {
    getCache.clear()
    pendingGetRequests.clear()
    return
  }

  getCache.forEach((_, key) => {
    if (predicate(key)) {
      getCache.delete(key)
    }
  })
}

export const cachedGet = async (url, config = {}, options = {}) => {
  const ttl = Number(options.ttl ?? DEFAULT_GET_TTL_MS)
  const force = Boolean(options.force)

  pruneExpiredGetCache()

  const cacheKey = buildGetCacheKey(url, config)
  const canReusePending = !config?.signal

  if (!force && ttl > 0) {
    const cached = getCache.get(cacheKey)
    if (cached && cached.expiresAt > Date.now()) {
      return {
        data: cloneData(cached.data),
        status: cached.status,
        statusText: cached.statusText,
        headers: cached.headers,
        config,
        request: null,
      }
    }
  }

  if (!force && canReusePending && pendingGetRequests.has(cacheKey)) {
    const pendingResponse = await pendingGetRequests.get(cacheKey)
    return {
      ...pendingResponse,
      data: cloneData(pendingResponse.data),
    }
  }

  const requestPromise = api.get(url, config).then((response) => {
    if (ttl > 0) {
      getCache.set(cacheKey, {
        data: cloneData(response.data),
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        expiresAt: Date.now() + ttl,
      })
    }
    return response
  })

  if (canReusePending) {
    pendingGetRequests.set(cacheKey, requestPromise)
  }

  try {
    return await requestPromise
  } finally {
    pendingGetRequests.delete(cacheKey)
  }
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  const companySlug = localStorage.getItem('company_slug') || import.meta.env.VITE_COMPANY_SLUG
  if (companySlug && !shouldSkipCompanyHeader(config)) {
    config.headers['X-Company-Slug'] = companySlug
  }

  return config
})

const parseErrorMessage = (error) => {
  const message = error?.response?.data?.message
  const errors = error?.response?.data?.errors

  if (message) return message

  if (errors && typeof errors === 'object') {
    const firstKey = Object.keys(errors)[0]
    if (firstKey && Array.isArray(errors[firstKey])) {
      return errors[firstKey][0]
    }
  }

  return 'Falha ao comunicar com o servidor.'
}

export const setupInterceptors = (auth, router, alerts) => {
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error?.response?.status
      const message = parseErrorMessage(error)

      if (status === 422 && message === 'Company context not found') {
        localStorage.removeItem('company_slug')
        clearGetCache()

        const requestConfig = error?.config || {}
        const method = String(requestConfig?.method || 'get').toLowerCase()
        const isSafeMethod = ['get', 'head', 'options'].includes(method)

        if (isSafeMethod && !requestConfig.__retriedAfterCompanyReset) {
          const retryHeaders = {
            ...(requestConfig.headers || {}),
          }
          delete retryHeaders['X-Company-Slug']
          delete retryHeaders['x-company-slug']

          return api.request({
            ...requestConfig,
            __retriedAfterCompanyReset: true,
            headers: retryHeaders,
          })
        }

        alerts?.warning('Empresa selecionada inválida. Selecione outra empresa.')
        return Promise.reject(error)
      }

      if (status === 401) {
        clearGetCache()
        if (typeof auth?.clearSession === 'function') {
          auth.clearSession()
        } else {
          auth.token = ''
          auth.user = null
          localStorage.removeItem('token')
        }
        alerts?.error('Sessão expirada. Faça login novamente.')
        if (router.currentRoute.value.name !== 'login') {
          router.replace({ name: 'login' })
        }
        return Promise.reject(error)
      }
      if (status === 403) {
        alerts?.warning('Você não tem permissão para essa ação.')
        return Promise.reject(error)
      }
      if (status === 422) {
        alerts?.warning(message)
        return Promise.reject(error)
      }
      if (status >= 500) {
        alerts?.error('Erro no servidor. Tente novamente em instantes.')
        return Promise.reject(error)
      }
      if (!status) {
        alerts?.error('Erro de conexão. Verifique sua internet ou a API.')
      } else {
        alerts?.error(message)
      }
      return Promise.reject(error)
    }
  )
}

export default api
