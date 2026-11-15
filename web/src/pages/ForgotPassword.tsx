import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import AuthCard from '../components/AuthCard'
import Alert from '../components/Alert'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const res = await api.forgotPassword(email)
      setInfo(res.message)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthCard title="Reset your password" subtitle="Enter your email and we'll send you a reset link.">
      <Alert kind="danger" message={error} />
      <Alert kind="success" message={info} />
      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-4">
          <label htmlFor="email" className="form-label">Email</label>
          <input id="email" type="email" className="form-control" autoComplete="email" required
            value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <button type="submit" className="btn btn-brand w-100" disabled={busy || !email}>
          {busy ? 'Sending…' : 'Send reset link'}
        </button>
      </form>
      <p className="text-center mt-4 mb-0">
        <Link to="/login">Back to log in</Link>
      </p>
    </AuthCard>
  )
}
