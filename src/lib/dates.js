const toDate = (value) => {
  if (!value) return null
  const instance = value instanceof Date ? new Date(value) : new Date(value)
  return Number.isNaN(instance.getTime()) ? null : instance
}

export const formatDate = (value) => {
  const date = toDate(value)
  if (!date) return 'Sem data'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export const formatDateTime = (value) => {
  const date = toDate(value)
  if (!date) return 'Sem data'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export const formatTime = (value) => {
  const date = toDate(value)
  if (!date) return '--:--'
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export const formatTimeRange = (start, end) => `${formatTime(start)} - ${formatTime(end)}`

export const toApiDate = (value) => {
  const date = toDate(value)
  if (!date) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
