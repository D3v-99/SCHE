import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import morgan from 'morgan'
import teamsRoutes from './routes/teams.js'
import scheduleRoutes from './routes/schedule.js'
import swapRoutes from './routes/swap.js'
import holidayRoutes from './routes/holidays.js'
import exportRoutes from './routes/export.js'
import Team from './models/Team.js'
import Member from './models/Member.js'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json({ limit: '1mb' }))
app.use(morgan('tiny'))

app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/teams', teamsRoutes)
app.use('/api/schedule', scheduleRoutes)
app.use('/api/swap', swapRoutes)
app.use('/api/holidays', holidayRoutes)
app.use('/api/export', exportRoutes)

const { MONGO_URI, PORT = 5000 } = process.env

if (!MONGO_URI) {
  console.error('MONGO_URI is required')
  process.exit(1)
}

const DEFAULT_MEMBERS = {
  retail: ['Retail 1', 'Retail 2', 'Retail 3', 'Retail 4', 'Retail 5'],
  corporate: ['Corporate 1', 'Corporate 2', 'Corporate 3', 'Corporate 4', 'Corporate 5']
}

const ensureDefaults = async () => {
  const teamDefinitions = [
    { name: 'Retail Channels', type: 'retail' },
    { name: 'Corporate Channels', type: 'corporate' }
  ]

  for (const def of teamDefinitions) {
    let team = await Team.findOne({ type: def.type })
    if (!team) {
      team = await Team.create(def)
    }

    const memberCount = await Member.countDocuments({ teamId: team._id })
    if (memberCount === 0) {
      const seedMembers = DEFAULT_MEMBERS[def.type] || []
      const docs = seedMembers.map((name) => ({ name, teamId: team._id, active: true }))
      if (docs.length) {
        await Member.insertMany(docs)
      }
    }
  }
}

mongoose
  .connect(MONGO_URI)
  .then(async () => {
    await ensureDefaults()
    app.listen(PORT, () => {
      console.log(`API listening on port ${PORT}`)
    })
  })
  .catch((error) => {
    console.error('MongoDB connection error', error)
    process.exit(1)
  })
