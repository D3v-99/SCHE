import { useState } from 'react'

function AdminLogin({ onLogin, status }) {
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!username || !password) return

    setSubmitting(true)
    try {
      await onLogin({ username, password })
      setPassword('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="panel login">
      <h2>Admin sign in</h2>
      <p className="muted">
        Sign in to manage team members, update schedules, add holidays, and perform swaps.
      </p>
      <form className="login-form" onSubmit={handleSubmit}>
        <label>
          Username
          <input value={username} onChange={(event) => setUsername(event.target.value)} />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <button className="button" type="submit" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      {status ? <div className="status">{status}</div> : null}
    </div>
  )
}

export default AdminLogin
