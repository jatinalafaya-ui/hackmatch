import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import AuthCard from '../components/AuthCard'
import Alert from '../components/Alert'

export default function Register() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [sentTo, setSentTo] = useState('')
  const [busy, setBusy] = useState(false)

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (form.password !== form.confirm) {
      setError('Passwords do not match')
      return
    }
    setBusy(true)
    try {
      await api.register({
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
      })
      setSentTo(form.email)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setBusy(false)
    }
  }

  if (sentTo) {
    return (
      <AuthCard title="Check your email">
        <p>
          We sent a verification link to <strong>{sentTo}</strong>. Open it to finish creating your account. The link
          expires in 24 hours.
        </p>
        <Link to="/login" className="btn btn-brand w-100">Back to log in</Link>
      </AuthCard>
    )
  }

  return (
    <AuthCard title="Create your account" subtitle="It takes a minute. We'll email you a link to verify it.">
      <Alert kind="danger" message={error} />
      <form onSubmit={handleSubmit} noValidate>
        <div className="row g-3 mb-3">
          <div className="col-sm-6">
            <label htmlFor="firstName" className="form-label">First name</label>
            <input id="firstName" className="form-control" autoComplete="given-name" required
              value={form.firstName} onChange={(e) => update('firstName', e.target.value)} />
          </div>
          <div className="col-sm-6">
            <label htmlFor="lastName" className="form-label">Last name</label>
            <input id="lastName" className="form-control" autoComplete="family-name" required
              value={form.lastName} onChange={(e) => update('lastName', e.target.value)} />
          </div>
        </div>
        <div className="mb-3">
          <label htmlFor="email" className="form-label">Email</label>
          <input id="email" type="email" className="form-control" autoComplete="email" required
            value={form.email} onChange={(e) => update('email', e.target.value)} />
        </div>
        <div className="mb-3">
          <label htmlFor="password" className="form-label">Password</label>
          <input id="password" type="password" className="form-control" autoComplete="new-password" required
            aria-describedby="passwordHelp" value={form.password} onChange={(e) => update('password', e.target.value)} />
          <div id="passwordHelp" className="form-text">At least 8 characters, with a letter and a number.</div>
        </div>
        <div className="mb-4">
          <label htmlFor="confirm" className="form-label">Confirm password</label>
          <input id="confirm" type="password" className="form-control" autoComplete="new-password" required
            value={form.confirm} onChange={(e) => update('confirm', e.target.value)} />
        </div>
        <button type="submit" className="btn btn-brand w-100" disabled={busy}>
          {busy ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p className="text-center mt-4 mb-0">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </AuthCard>
  )
}
