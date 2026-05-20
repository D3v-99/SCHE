const path = require('node:path')
const fs = require('node:fs')

require('dotenv').config()

const express = require('express')

const AD_LOGIN_URL =
  process.env.AD_LOGIN_URL ||
  'https://uatintegrationsistio.ncbagroup.com/ad-login/authentication'

const TEST_USERNAME = process.env.TEST_USERNAME || ''
const TEST_PASSWORD = process.env.TEST_PASSWORD || ''
const ALLOW_INSECURE_TLS = process.env.ALLOW_INSECURE_TLS === 'true'

if (ALLOW_INSECURE_TLS) {
  // WARNING: disables TLS certificate validation (use only for internal/test envs).
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
}

const PORT = Number(process.env.PORT || 3000)

const app = express()
app.disable('x-powered-by')
app.use(express.json({ limit: '20kb' }))

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

app.post('/api/test-login', async (_req, res) => {
  if (!TEST_USERNAME || !TEST_PASSWORD) {
    return res.status(400).json({
      error:
        'Missing TEST_USERNAME/TEST_PASSWORD. Set them in server/.env on the server.',
    })
  }

  try {
    const upstreamRes = await fetch(AD_LOGIN_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        username: TEST_USERNAME,
        password: TEST_PASSWORD,
      }),
    })

    const contentType = upstreamRes.headers.get('content-type') || ''
    const text = await upstreamRes.text()

    let body = text
    if (contentType.includes('application/json')) {
      try {
        body = JSON.parse(text)
      } catch {
        // keep as text
      }
    }

    return res.status(200).json({
      ok: upstreamRes.ok,
      upstreamStatus: upstreamRes.status,
      upstreamBody: body,
    })
  } catch (e) {
    return res.status(502).json({
      error: e instanceof Error ? e.message : String(e),
    })
  }
})

// In Docker Compose the frontend usually runs in its own container.
// Keep static serving optional so the backend can run standalone.
const clientDist = path.resolve(__dirname, '../client/dist')
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist))

  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`)
})
