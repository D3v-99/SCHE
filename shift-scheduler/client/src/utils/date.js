export const dateKey = (value) => {
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  return date.toISOString().slice(0, 10)
}

export const startOfWeek = (value) => {
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  const day = (date.getDay() + 6) % 7
  date.setDate(date.getDate() - day)
  return date
}

export const endOfWeek = (value) => {
  const date = startOfWeek(value)
  date.setDate(date.getDate() + 6)
  return date
}

export const addDays = (value, days) => {
  const date = new Date(value)
  date.setDate(date.getDate() + days)
  return date
}

export const getCalendarWeeks = (year, month) => {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const rangeStart = startOfWeek(first)
  const rangeEnd = endOfWeek(last)
  const weeks = []

  let cursor = new Date(rangeStart)
  while (cursor <= rangeEnd) {
    const weekStart = new Date(cursor)
    const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index))
    const weekEnd = endOfWeek(weekStart)
    weeks.push({ start: weekStart, end: weekEnd, days })
    cursor = addDays(weekStart, 7)
  }

  return weeks
}
