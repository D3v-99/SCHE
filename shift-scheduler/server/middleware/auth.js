import jwt from 'jsonwebtoken'

const getBearerToken = (req) => {
  const header = req.headers.authorization || ''
  const match = header.match(/^Bearer\s+(.+)$/i)
  return match ? match[1] : null
}

export const requireAdmin = (req, res, next) => {
  const token = getBearerToken(req)
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const secret = process.env.JWT_SECRET
  if (!secret) {
    return res.status(500).json({ message: 'JWT_SECRET not configured' })
  }

  try {
    const payload = jwt.verify(token, secret)
    if (payload?.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' })
    }

    req.auth = payload
    return next()
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized' })
  }
}
