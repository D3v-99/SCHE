import express from 'express'
import Schedule from '../models/Schedule.js'
import Swap from '../models/Swap.js'
import { endOfWeek, parseDate, startOfWeek } from '../utils/date.js'
import { requireAdmin } from '../middleware/auth.js'

const router = express.Router()

router.post('/', requireAdmin, async (req, res) => {
  const { teamId, weekStart, requestedBy, coveredBy, reason } = req.body

  if (!teamId || !weekStart || !requestedBy || !coveredBy) {
    return res.status(400).json({ message: 'teamId, weekStart, requestedBy, coveredBy are required' })
  }

  const parsedWeekStart = parseDate(weekStart)
  if (!parsedWeekStart) {
    return res.status(400).json({ message: 'Invalid weekStart date' })
  }

  const normalizedWeekStart = startOfWeek(parsedWeekStart)

  let schedule = await Schedule.findOne({ teamId, weekStart: normalizedWeekStart })
  if (!schedule) {
    schedule = await Schedule.create({
      teamId,
      weekStart: normalizedWeekStart,
      weekEnd: endOfWeek(normalizedWeekStart),
      memberId: coveredBy
    })
  } else {
    schedule.memberId = coveredBy
    await schedule.save()
  }

  const swap = await Swap.create({
    requestedBy,
    coveredBy,
    weekStart: normalizedWeekStart,
    teamId,
    reason: reason || ''
  })

  const updatedSchedule = await Schedule.findById(schedule._id)
    .populate('memberId')
    .populate('teamId')

  res.json({ schedule: updatedSchedule, swap })
})

export default router
