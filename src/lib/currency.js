const parseFlexibleNumber = (raw = '') => {
  const value = String(raw).trim()
  if (!value) return null

  const hasComma = value.includes(',')
  const hasDot = value.includes('.')

  let normalized = value
  if (hasComma && hasDot) {
    normalized = value.replace(/\./g, '').replace(',', '.')
  } else if (hasComma) {
    normalized = value.replace(',', '.')
  }

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

const toCents = (value, maxDigits = 12) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.round(value * 100))
  }

  const raw = String(value ?? '').trim()
  if (!raw) return null

  if (/^\d+$/.test(raw)) {
    return Number.parseInt(raw.slice(0, maxDigits), 10)
  }

  const parsed = parseFlexibleNumber(raw)
  if (parsed === null) return null
  return Math.max(0, Math.round(parsed * 100))
}

export const parseCurrencyInputToNumber = (value, maxDigits = 12) => {
  const cents = toCents(value, maxDigits)
  if (cents === null) return 0
  return Number((cents / 100).toFixed(2))
}

export const formatCurrencyInput = (value, maxDigits = 12) => {
  const cents = toCents(value, maxDigits)
  if (cents === null) return ''

  const integer = Math.floor(cents / 100)
  const decimal = String(cents % 100).padStart(2, '0')
  return `${integer.toLocaleString('pt-BR')},${decimal}`
}

export const formatCurrencyBRL = (value) => {
  const amount = Number(value ?? 0)
  const safeValue = Number.isFinite(amount) ? amount : 0
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safeValue)
}
