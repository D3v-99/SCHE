export const parseDate = (value) => {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export const toStartOfDay = (value) => {
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  return date
}

export const toEndOfDay = (value) => {
  const date = new Date(value)
  date.setHours(23, 59, 59, 999)
  return date
}

export const startOfWeek = (value) => {
  const date = toStartOfDay(value)
  const day = (date.getDay() + 6) % 7
  date.setDate(date.getDate() - day)
  return date
}

export const endOfWeek = (value) => {
  const date = startOfWeek(value)
  date.setDate(date.getDate() + 6)
  date.setHours(23, 59, 59, 999)
  return date
}

export const dateKey = (value) => toStartOfDay(value).toISOString().slice(0, 10)
