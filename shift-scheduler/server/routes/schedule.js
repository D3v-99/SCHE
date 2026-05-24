import express from 'express'
import Schedule from '../models/Schedule.js'
import { endOfWeek, parseDate, startOfWeek, toStartOfDay } from '../utils/date.js'
import { requireAdmin } from '../middleware/auth.js'

const router = express.Router()

const getMonthRange = (month, year) => {
  const first = new Date(year, month - 1, 1)
  const last = new Date(year, month, 0)
  return {
    rangeStart: startOfWeek(first),
    rangeEnd: endOfWeek(last)
  }
}

router.get('/', async (req, res) => {
  const { month, year, teamId, start, end, before, limit } = req.query
  const query = {}

  if (teamId) {
    query.teamId = teamId
  }

  if (month && year) {
    const range = getMonthRange(Number(month), Number(year))
    query.weekStart = { $gte: range.rangeStart, $lte: range.rangeEnd }
  } else if (start || end) {
    const startValue = start ? parseDate(start) : null
    const endValue = end ? parseDate(end) : null
    const startDate = startValue ? startOfWeek(startValue) : null
    const endDate = endValue ? endOfWeek(endValue) : null

    if (startDate && endDate) {
      query.weekStart = { $gte: startDate, $lte: endDate }
    } else if (startDate) {
      query.weekStart = { $gte: startDate }
    } else if (endDate) {
      query.weekStart = { $lte: endDate }
    }
  } else if (before) {
    const beforeValue = parseDate(before)
    if (beforeValue) {
      query.weekStart = { $lt: startOfWeek(beforeValue) }
    }
  }

  const limitValue = Number(limit) || 0

  if (before && limitValue === 1) {
    const entry = await Schedule.findOne(query)
      .sort({ weekStart: -1 })
      .populate('memberId')
      .populate('teamId')

    return res.json({ schedule: entry ? [entry] : [] })
  }

  let scheduleQuery = Schedule.find(query).sort({ weekStart: 1 })
  if (limitValue > 0) {
    scheduleQuery = scheduleQuery.limit(limitValue)
  }

  const schedule = await scheduleQuery.populate('memberId').populate('teamId')
  res.json({ schedule })
})

router.post('/', requireAdmin, async (req, res) => {
  const entries = Array.isArray(req.body.entries) ? req.body.entries : []

  if (!entries.length) {
    return res.status(400).json({ message: 'entries array is required' })
  }

  const operations = entries
    .map((entry) => {
      const parsedWeekStart = parseDate(entry.weekStart)
      if (!parsedWeekStart) return null
      const weekStart = startOfWeek(parsedWeekStart)
      const weekEnd = endOfWeek(weekStart)

      return {
        updateOne: {
          filter: { teamId: entry.teamId, weekStart },
          update: {
            $set: {
              memberId: entry.memberId,
              weekEnd
            }
          },
          upsert: true
        }
      }
    })
    .filter(Boolean)

  if (!operations.length) {
    return res.status(400).json({ message: 'No valid entries provided' })
  }

  await Schedule.bulkWrite(operations)

  const orConditions = entries
    .map((entry) => {
      const parsedWeekStart = parseDate(entry.weekStart)
      if (!parsedWeekStart) return null
      return { teamId: entry.teamId, weekStart: startOfWeek(parsedWeekStart) }
    })
    .filter(Boolean)

  const schedule = await Schedule.find({ $or: orConditions })
    .sort({ weekStart: 1 })
    .populate('memberId')
    .populate('teamId')

  res.json({ schedule })
})

export default router
