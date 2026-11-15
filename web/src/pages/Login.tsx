import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { api, ApiError } from '../api'
import { useAuth } from '../auth'
import AuthCard from '../components/AuthCard'
import Alert from '../components/Alert'

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [needsVerify, setNeedsVerify] = useState(false)
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to="/search" replace />

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setInfo('')
    setNeedsVerify(false)
    setBusy(true)
    try {
      await login(email, password)
      navigate('/search')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
      setNeedsVerify(err instanceof ApiError && err.status === 403)
    } finally {
      setBusy(false)
    }
  }

  async function resend() {
    try {
      const res = await api.resendVerification(email)
      setError('')
      setNeedsVerify(false)
      setInfo(res.message)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resend the link')
    }
  }

  return (
    <AuthCard title="Log in" subtitle="Find teammates and mentors for your next hackathon.">
      <Alert kind="danger" message={error} />
      <Alert kind="success" message={info} />
      {needsVerify && (
        <button type="button" className="btn btn-link p-0 mb-3" onClick={resend}>
          Send me a new verification link
        </button>
      )}
      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-3">
          <label htmlFor="email" className="form-label">Email</label>
          <input
            id="email"
            type="email"
            className="form-control"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="mb-2">
          <label htmlFor="password" className="form-label">Password</label>
          <input
            id="password"
            type="password"
            className="form-control"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="text-end mb-4">
          <Link to="/forgot-password" className="small">Forgot password?</Link>
        </div>
        <button type="submit" className="btn btn-brand w-100" disabled={busy || !email || !password}>
          {busy ? 'Logging in…' : 'Log in'}
        </button>
      </form>
      <p className="text-center mt-4 mb-0">
        New here? <Link to="/register">Create an account</Link>
      </p>
    </AuthCard>
  )
}
