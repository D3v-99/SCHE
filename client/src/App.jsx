import { useState } from 'react'
import './App.css'
const baseUrl = import.meta.env.BASE_URL || ''; // Get the base URL from Vite
const apiUrl = `${baseUrl}api/test-login`; // Construct the full path

export default function App() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const handleTestLogin = async () => {
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const contentType = res.headers.get('content-type') || ''
      const body = contentType.includes('application/json')
        ? await res.json()
        : await res.text()

      setResult({ status: res.status, body })
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="page">
      <div className="card" role="region" aria-label="AD login test">
        <h1>AD Login Test</h1>
        <p className="muted">
          One-page smoke test: click the button to have the backend call your AD
          endpoint.
        </p>

        <button
          type="button"
          className="primary"
          onClick={handleTestLogin}
          disabled={loading}
        >
          {loading ? 'Testing…' : 'Test Login'}
        </button>

        <p className="hint">
          Configure `TEST_USERNAME` and `TEST_PASSWORD` in `server/.env`.
        </p>

        {error ? (
          <pre className="output" aria-label="Error">
            {error}
          </pre>
        ) : null}

        {result ? (
          <pre className="output" aria-label="Result">
            {JSON.stringify(result, null, 2)}
          </pre>
        ) : null}
      </div>
    </main>
  )
}
