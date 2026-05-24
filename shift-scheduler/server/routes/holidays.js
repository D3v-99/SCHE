import express from 'express'
import Holiday from '../models/Holiday.js'
import { parseDate, toStartOfDay } from '../utils/date.js'
import { requireAdmin } from '../middleware/auth.js'

const router = express.Router()

router.get('/', async (req, res) => {
  const holidays = await Holiday.find({}).sort({ date: 1 })
  res.json({ holidays })
})

router.post('/', requireAdmin, async (req, res) => {
  const { remove, id, date, name } = req.body

  if (remove) {
    if (id) {
      await Holiday.findByIdAndDelete(id)
    } else if (date) {
      const parsed = parseDate(date)
      if (!parsed) {
        return res.status(400).json({ message: 'Invalid date' })
      }
      const normalized = toStartOfDay(parsed)
      await Holiday.deleteOne({ date: normalized })
    } else {
      return res.status(400).json({ message: 'id or date is required to remove a holiday' })
    }
  } else {
    if (!date || !name) {
      return res.status(400).json({ message: 'date and name are required' })
    }

    const parsed = parseDate(date)
    if (!parsed) {
      return res.status(400).json({ message: 'Invalid date' })
    }
    const normalized = toStartOfDay(parsed)
    await Holiday.findOneAndUpdate(
      { date: normalized },
      { date: normalized, name },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
  }

  const holidays = await Holiday.find({}).sort({ date: 1 })
  res.json({ holidays })
})

export default router
