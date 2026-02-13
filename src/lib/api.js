import axios from 'axios'

const defaultApiUrl = import.meta.env.PROD
  ? 'https://barbearia-api-uhux.onrender.com'
  : 'http://127.0.0.1:8000'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || defaultApiUrl,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  const companySlug = localStorage.getItem('company_slug') || import.meta.env.VITE_COMPANY_SLUG
  if (companySlug) {
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
      if (status === 401) {
        auth.token = ''
        auth.user = null
        localStorage.removeItem('token')
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
        alerts?.warning(parseErrorMessage(error))
        return Promise.reject(error)
      }
      if (status >= 500) {
        alerts?.error('Erro no servidor. Tente novamente em instantes.')
        return Promise.reject(error)
      }
      if (!status) {
        alerts?.error('Erro de conexão. Verifique sua internet ou a API.')
      } else {
        alerts?.error(parseErrorMessage(error))
      }
      return Promise.reject(error)
    }
  )
}

export default api
