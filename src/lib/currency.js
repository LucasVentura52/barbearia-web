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
