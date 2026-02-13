export const normalizePhone = (value = '', countryCode = '55') => {
  const digits = String(value).replace(/\D/g, '')
  const maxLen = countryCode === '55' ? 11 : 15
  return digits.slice(0, maxLen)
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

export const buildE164 = (countryCode = '55', localDigits = '') => {
  return `${countryCode}${normalizePhone(localDigits, countryCode)}`
}

export const formatPhoneFromE164 = (value = '') => {
  const digits = String(value).replace(/\D/g, '')
  if (!digits) return ''

  if (digits.startsWith('55') && digits.length >= 12) {
    const local = digits.slice(2)
    return `+55 ${formatPhone(local, '55')}`.trim()
  }

  return `+${digits}`
}