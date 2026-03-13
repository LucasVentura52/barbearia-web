const digitsOnly = (value = '') => String(value).replace(/\D/g, '')
const maxLocalLength = (countryCode = '55') => (countryCode === '55' ? 11 : 15)

export const normalizePhone = (value = '', countryCode = '55') => {
  const digits = digitsOnly(value)
  return digits.slice(0, maxLocalLength(countryCode))
}

export const formatPhone = (value = '', countryCode = '55') => {
  const digits = normalizePhone(value, countryCode)
  if (!digits) return ''

  if (countryCode !== '55') {
    return digits
  }

  if (digits.length <= 2) {
    return `(${digits}`
  }

  const ddd = digits.slice(0, 2)
  const number = digits.slice(2, 11)

  let formattedNumber = ''
  if (number.length <= 4) {
    formattedNumber = number
  } else if (number.length <= 8) {
    formattedNumber = `${number.slice(0, 4)}-${number.slice(4)}`
  } else {
    formattedNumber = `${number.slice(0, 5)}-${number.slice(5, 9)}`
  }

  return `(${ddd}) ${formattedNumber}`.trim()
}

export const buildE164 = (countryCode = '55', localDigits = '') => `${countryCode}${normalizePhone(localDigits, countryCode)}`

export const formatPhoneFromE164 = (value = '', defaultCountryCode = '55') => {
  const digits = digitsOnly(value)
  if (!digits) return ''
  const countryCode = digitsOnly(defaultCountryCode) || '55'

  if (digits.startsWith('55') && digits.length > 2) {
    const local = normalizePhone(digits.slice(2), '55')
    return `+55 ${formatPhone(local, '55')}`.trim()
  }

  if (digits.startsWith(countryCode) && digits.length > countryCode.length) {
    const local = normalizePhone(digits.slice(countryCode.length), countryCode)
    if (countryCode === '55') {
      return `+55 ${formatPhone(local, '55')}`.trim()
    }
    return `+${countryCode} ${formatPhone(local, countryCode)}`.trim()
  }

  if (digits.length <= maxLocalLength(countryCode)) {
    return formatPhone(digits, countryCode)
  }

  return `+${digits}`
}
