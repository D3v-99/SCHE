import express from 'express'
import Schedule from '../models/Schedule.js'
import Swap from '../models/Swap.js'
import { parseDate, startOfWeek } from '../utils/date.js'

const router = express.Router()

router.post('/', async (req, res) => {
  const { teamId, weekStart, requestedBy, coveredBy, reason } = req.body

  if (!teamId || !weekStart || !requestedBy || !coveredBy) {
    return res.status(400).json({ message: 'teamId, weekStart, requestedBy, coveredBy are required' })
  }

  const parsedWeekStart = parseDate(weekStart)
  if (!parsedWeekStart) {
    return res.status(400).json({ message: 'Invalid weekStart date' })
  }

  const normalizedWeekStart = startOfWeek(parsedWeekStart)

  const schedule = await Schedule.findOne({ teamId, weekStart: normalizedWeekStart })
  if (!schedule) {
    return res.status(404).json({ message: 'Schedule not found for the requested week' })
  }

  schedule.memberId = coveredBy
  await schedule.save()

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
