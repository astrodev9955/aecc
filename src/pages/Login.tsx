import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { AuthSplit } from '../components/AuthSplit'
import { useAuth } from '../context/Auth'
import { ApiError, type AuthUser } from '../lib/api'

function afterSignIn(user: AuthUser) {
  if (user.role === 'admin') return '/admin'
  if (user.planStatus === 'expired' || user.planStatus === 'pending_payment') return '/app/billing'
  if (user.pendingPlanId && user.pendingPlanId !== 'free') return `/app/billing?checkout=${user.pendingPlanId}`
  return '/app'
}

export default function Login() {
  const { user, ready, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (ready && user) {
    return <Navigate to={afterSignIn(user)} replace />
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const next = await login({ email, password })
      navigate(afterSignIn(next))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not sign in')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthSplit kicker="Welcome back">
      <form className="auth-form" onSubmit={(e) => void submit(e)}>
        <h1>Sign in</h1>
        <p className="muted">Use the email on your Circular account.</p>
        {error && <p className="banner warn">{error}</p>}
        <label>
          Email
          <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Password
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <button type="submit" className="btn" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        <p className="muted tiny">
          No account yet? <Link to="/register">Create one</Link>
        </p>
      </form>
    </AuthSplit>
  )
}
