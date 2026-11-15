import { useState } from 'react'
import type { FormEvent } from 'react'
import { api } from '../api'
import type { Role } from '../api'
import { useAuth } from '../auth'
import Alert from '../components/Alert'

export default function Profile() {
  const { user, setUser } = useAuth()
  const [form, setForm] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    role: user?.role ?? 'hacker',
    school: user?.school ?? '',
    skills: user?.skills.join(', ') ?? '',
    lookingFor: user?.lookingFor ?? '',
    bio: user?.bio ?? '',
  })
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setInfo('')
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const res = await api.updateMe({
        ...form,
        role: form.role as Role,
        skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
      })
      setUser(res.user)
      setInfo('Profile saved. Other attendees will see these details in search.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your profile')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-lg-8">
        <h1 className="h3 fw-bold mb-1">My profile</h1>
        <p className="text-secondary">Signed in as {user?.email}</p>
        <Alert kind="danger" message={error} />
        <Alert kind="success" message={info} />
        <form className="card border-0 shadow-sm" onSubmit={handleSubmit} noValidate>
          <div className="card-body p-4">
            <div className="row g-3">
              <div className="col-sm-6">
                <label htmlFor="firstName" className="form-label">First name</label>
                <input id="firstName" className="form-control" required value={form.firstName}
                  onChange={(e) => update('firstName', e.target.value)} />
              </div>
              <div className="col-sm-6">
                <label htmlFor="lastName" className="form-label">Last name</label>
                <input id="lastName" className="form-control" required value={form.lastName}
                  onChange={(e) => update('lastName', e.target.value)} />
              </div>
              <div className="col-sm-6">
                <label htmlFor="role" className="form-label">I'm joining as a</label>
                <select id="role" className="form-select" value={form.role} onChange={(e) => update('role', e.target.value)}>
                  <option value="hacker">Hacker</option>
                  <option value="mentor">Mentor</option>
                </select>
              </div>
              <div className="col-sm-6">
                <label htmlFor="school" className="form-label">School or company</label>
                <input id="school" className="form-control" value={form.school}
                  onChange={(e) => update('school', e.target.value)} />
              </div>
              <div className="col-12">
                <label htmlFor="skills" className="form-label">Skills</label>
                <input id="skills" className="form-control" aria-describedby="skillsHelp" value={form.skills}
                  onChange={(e) => update('skills', e.target.value)} />
                <div id="skillsHelp" className="form-text">Separate skills with commas, for example React, MongoDB, Figma.</div>
              </div>
              <div className="col-12">
                <label htmlFor="lookingFor" className="form-label">Looking for</label>
                <input id="lookingFor" className="form-control" maxLength={200} value={form.lookingFor}
                  onChange={(e) => update('lookingFor', e.target.value)} />
              </div>
              <div className="col-12">
                <label htmlFor="bio" className="form-label">Short bio</label>
                <textarea id="bio" className="form-control" rows={3} maxLength={500} value={form.bio}
                  onChange={(e) => update('bio', e.target.value)} />
              </div>
            </div>
            <button type="submit" className="btn btn-brand mt-4" disabled={busy}>
              {busy ? 'Saving…' : 'Save profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
