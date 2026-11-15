import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import type { ShortlistEntry, ShortlistStatus } from '../api'
import AttendeeCard from '../components/AttendeeCard'
import Alert from '../components/Alert'

const STATUS_LABELS: Record<ShortlistStatus, string> = {
  interested: 'Interested',
  contacted: 'Contacted',
  teamed: 'On my team',
}

function EntryEditor({ entry, onSaved, onRemoved }: {
  entry: ShortlistEntry
  onSaved: (entry: ShortlistEntry) => void
  onRemoved: (id: string) => void
}) {
  const [note, setNote] = useState(entry.note)
  const [status, setStatus] = useState(entry.status)
  const [message, setMessage] = useState('')
  const dirty = note !== entry.note || status !== entry.status

  async function save() {
    try {
      const res = await api.updateShortlistEntry(entry.id, { note, status })
      onSaved(res.entry)
      setMessage('Saved')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not save')
    }
  }

  async function remove() {
    if (!window.confirm(`Remove ${entry.member.firstName} from your shortlist?`)) return
    try {
      await api.removeFromShortlist(entry.id)
      onRemoved(entry.id)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not remove')
    }
  }

  return (
    <div className="border-top pt-3">
      <label htmlFor={`status-${entry.id}`} className="form-label small fw-semibold">Status</label>
      <select id={`status-${entry.id}`} className="form-select form-select-sm mb-2" value={status}
        onChange={(e) => setStatus(e.target.value as ShortlistStatus)}>
        {Object.entries(STATUS_LABELS).map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>
      <label htmlFor={`note-${entry.id}`} className="form-label small fw-semibold">My note</label>
      <textarea id={`note-${entry.id}`} className="form-control form-control-sm mb-2" rows={2} maxLength={300}
        value={note} onChange={(e) => { setNote(e.target.value); setMessage('') }} />
      <div className="d-flex align-items-center gap-2">
        <button type="button" className="btn btn-brand btn-sm" disabled={!dirty} onClick={save}>Save</button>
        <button type="button" className="btn btn-outline-danger btn-sm" onClick={remove}>Remove</button>
        <span className="small text-secondary" role="status">{message}</span>
      </div>
    </div>
  )
}

export default function Shortlist() {
  const [entries, setEntries] = useState<ShortlistEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .shortlist()
      .then((res) => setEntries(res.entries))
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load your shortlist'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <h1 className="h3 fw-bold mb-1">My shortlist</h1>
      <p className="text-secondary">People you want to team up with. Only you can see this list.</p>
      <Alert kind="danger" message={error} />
      {loading && <p>Loading…</p>}
      {!loading && entries.length === 0 && !error && (
        <div className="text-center py-5">
          <p className="mb-3">Your shortlist is empty.</p>
          <Link to="/search" className="btn btn-brand">Find people</Link>
        </div>
      )}
      <div className="row g-3">
        {entries.map((entry) => (
          <div className="col-md-6 col-lg-4" key={entry.id}>
            <AttendeeCard person={entry.member}>
              <EntryEditor
                entry={entry}
                onSaved={(updated) => setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)))}
                onRemoved={(id) => setEntries((prev) => prev.filter((e) => e.id !== id))}
              />
            </AttendeeCard>
          </div>
        ))}
      </div>
    </>
  )
}
