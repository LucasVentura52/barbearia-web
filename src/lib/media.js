export const resolveMediaUrl = (url) => {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  const defaultApiUrl = import.meta.env.PROD
    ? 'https://barbearia-api-uhux.onrender.com'
    : 'http://127.0.0.1:8000'
  const base = import.meta.env.VITE_API_URL || defaultApiUrl
  const slash = url.startsWith('/') ? '' : '/'
  return `${base}${slash}${url}`
}
