import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import AuthCard from '../components/AuthCard'
import Alert from '../components/Alert'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState(token ? '' : 'This reset link is missing its token.')
  const [done, setDone] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    setBusy(true)
    try {
      const res = await api.resetPassword(token, password)
      setDone(res.message)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed')
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <AuthCard title="Password updated">
        <Alert kind="success" message={done} />
        <Link to="/login" className="btn btn-brand w-100">Go to log in</Link>
      </AuthCard>
    )
  }

  return (
    <AuthCard title="Choose a new password">
      <Alert kind="danger" message={error} />
      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-3">
          <label htmlFor="password" className="form-label">New password</label>
          <input id="password" type="password" className="form-control" autoComplete="new-password" required
            aria-describedby="passwordHelp" value={password} onChange={(e) => setPassword(e.target.value)} />
          <div id="passwordHelp" className="form-text">At least 8 characters, with a letter and a number.</div>
        </div>
        <div className="mb-4">
          <label htmlFor="confirm" className="form-label">Confirm new password</label>
          <input id="confirm" type="password" className="form-control" autoComplete="new-password" required
            value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>
        <button type="submit" className="btn btn-brand w-100" disabled={busy || !token}>
          {busy ? 'Saving…' : 'Save new password'}
        </button>
      </form>
    </AuthCard>
  )
}
