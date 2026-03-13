export const resolveMediaUrl = (url) => {
  if (!url) return ''

  const defaultApiUrl = import.meta.env.PROD
    ? 'https://barbearia-api-uhux.onrender.com'
    : 'http://127.0.0.1:8000'
  const base = String(import.meta.env.VITE_API_URL || defaultApiUrl).replace(/\/+$/, '')
  const value = String(url).trim()

  if (!value) return ''
  if (/^(data|blob):/i.test(value)) return value

  if (/^https?:\/\//i.test(value)) {
    try {
      const parsed = new URL(value)
      const path = parsed.pathname || ''
      if (path.startsWith('/storage/')) {
        return `${base}${path}${parsed.search || ''}${parsed.hash || ''}`
      }
    } catch {
      return value
    }

    return value
  }

  const normalizedPath = value.startsWith('/') ? value : `/${value}`
  return `${base}${normalizedPath}`
}
