import express from 'express'
import jwt from 'jsonwebtoken'
import { requireAdmin } from '../middleware/auth.js'

const router = express.Router()

router.post('/login', (req, res) => {
  const { username, password } = req.body || {}

  const adminUsername = process.env.ADMIN_USERNAME || 'admin'
  const adminPassword = process.env.ADMIN_PASSWORD
  const secret = process.env.JWT_SECRET

  if (!adminPassword) {
    return res.status(500).json({ message: 'ADMIN_PASSWORD not configured' })
  }

  if (!secret) {
    return res.status(500).json({ message: 'JWT_SECRET not configured' })
  }

  if (username !== adminUsername || password !== adminPassword) {
    return res.status(401).json({ message: 'Invalid credentials' })
  }

  const token = jwt.sign(
    {
      role: 'admin',
      username: adminUsername
    },
    secret,
    { expiresIn: '12h' }
  )

  return res.json({ token, user: { username: adminUsername, role: 'admin' } })
})

router.get('/me', requireAdmin, (req, res) => {
  res.json({ user: { username: req.auth?.username || 'admin', role: 'admin' } })
})

router.post('/logout', (req, res) => {
  res.json({ ok: true })
})

export default router
