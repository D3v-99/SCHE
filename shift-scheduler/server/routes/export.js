import express from 'express'
import Schedule from '../models/Schedule.js'
import Holiday from '../models/Holiday.js'
import { dateKey, endOfWeek, startOfWeek, toStartOfDay } from '../utils/date.js'

const router = express.Router()

const getMonthRange = (month, year) => {
  const first = new Date(year, month - 1, 1)
  const last = new Date(year, month, 0)
  return {
    monthStart: toStartOfDay(first),
    monthEnd: toStartOfDay(last),
    rangeStart: startOfWeek(first),
    rangeEnd: endOfWeek(last)
  }
}

const escapeCsv = (value) => {
  const safe = value || ''
  if (safe.includes(',') || safe.includes('"') || safe.includes('\n')) {
    return `"${safe.replace(/"/g, '""')}"`
  }
  return safe
}

router.get('/', async (req, res) => {
  const month = Number(req.query.month)
  const year = Number(req.query.year)

  if (!month || !year) {
    return res.status(400).json({ message: 'month and year are required' })
  }

  const range = getMonthRange(month, year)

  const schedules = await Schedule.find({
    weekStart: { $gte: range.rangeStart, $lte: range.rangeEnd }
  })
    .populate('memberId')
    .populate('teamId')

  const holidays = await Holiday.find({
    date: { $gte: range.monthStart, $lte: range.monthEnd }
  }).sort({ date: 1 })

  const holidayByDate = new Map()
  holidays.forEach((holiday) => {
    holidayByDate.set(dateKey(holiday.date), holiday.name)
  })

  const scheduleMap = new Map()
  schedules.forEach((entry) => {
    const teamType = entry.teamId?.type
    const weekKey = dateKey(entry.weekStart)
    if (teamType) {
      scheduleMap.set(`${teamType}-${weekKey}`, entry.memberId?.name || '')
    }
  })

  const rows = ['Date,Retail On-Call,Corporate On-Call,Holiday']
  const daysInMonth = new Date(year, month, 0).getDate()

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month - 1, day)
    const weekKey = dateKey(startOfWeek(date))
    const retail = scheduleMap.get(`retail-${weekKey}`) || ''
    const corporate = scheduleMap.get(`corporate-${weekKey}`) || ''
    const holiday = holidayByDate.get(dateKey(date)) || ''

    rows.push(
      [dateKey(date), escapeCsv(retail), escapeCsv(corporate), escapeCsv(holiday)].join(',')
    )
  }

  const filename = `schedule-${year}-${String(month).padStart(2, '0')}.csv`
  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
  res.send(rows.join('\n'))
})

export default router
