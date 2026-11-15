import { useEffect, useState } from 'react'
import { api } from '../api'
import type { Attendee, Role } from '../api'
import AttendeeCard from '../components/AttendeeCard'
import Alert from '../components/Alert'

export default function Search() {
  const [query, setQuery] = useState('')
  const [role, setRole] = useState<Role | ''>('')
  const [page, setPage] = useState(1)
  const [results, setResults] = useState<Attendee[]>([])
  const [total, setTotal] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState<Record<string, string>>({})

  // Search as the user types, but wait until they pause so we don't send a
  // request for every keystroke.
  useEffect(() => {
    let cancelled = false
    const timer = setTimeout(() => {
      setLoading(true)
      api
        .search(query, role, page)
        .then((res) => {
          if (cancelled) return
          setResults(res.results)
          setTotal(res.total)
          setPageSize(res.pageSize)
          setError('')
        })
        .catch((err) => !cancelled && setError(err instanceof Error ? err.message : 'Search failed'))
        .finally(() => !cancelled && setLoading(false))
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [query, role, page])

  async function addToShortlist(person: Attendee) {
    try {
      await api.addToShortlist(person.id, '')
      setSaved((prev) => ({ ...prev, [person.id]: 'Added to your shortlist' }))
    } catch (err) {
      setSaved((prev) => ({ ...prev, [person.id]: err instanceof Error ? err.message : 'Could not add' }))
    }
  }

  const pages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <>
      <h1 className="h3 fw-bold mb-1">Find teammates and mentors</h1>
      <p className="text-secondary">Search by name, school, skill, or what someone is looking for. Partial words work.</p>

      <form className="row g-2 mb-3" role="search" onSubmit={(e) => e.preventDefault()}>
        <div className="col-md-8">
          <label htmlFor="q" className="visually-hidden">Search attendees</label>
          <input
            id="q"
            type="search"
            className="form-control form-control-lg"
            placeholder="Try “rea”, “flutter usf” or “mentor aws”"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPage(1)
            }}
          />
        </div>
        <div className="col-md-4">
          <label htmlFor="role" className="visually-hidden">Role</label>
          <select
            id="role"
            className="form-select form-select-lg"
            value={role}
            onChange={(e) => {
              setRole(e.target.value as Role | '')
              setPage(1)
            }}
          >
            <option value="">Hackers and mentors</option>
            <option value="hacker">Hackers only</option>
            <option value="mentor">Mentors only</option>
          </select>
        </div>
      </form>

      <Alert kind="danger" message={error} />
      <p className="small text-secondary" aria-live="polite">
        {loading ? 'Searching…' : `${total} ${total === 1 ? 'person' : 'people'} found`}
      </p>

      <div className="row g-3">
        {results.map((person) => (
          <div className="col-sm-6 col-lg-4" key={person.id}>
            <AttendeeCard person={person}>
              {saved[person.id] ? (
                <p className="small text-success mb-0" role="status">{saved[person.id]}</p>
              ) : (
                <button type="button" className="btn btn-outline-brand btn-sm" onClick={() => addToShortlist(person)}>
                  Add to shortlist
                </button>
              )}
            </AttendeeCard>
          </div>
        ))}
      </div>

      {pages > 1 && (
        <nav className="d-flex justify-content-center align-items-center gap-3 mt-4" aria-label="Search pages">
          <button type="button" className="btn btn-outline-secondary btn-sm" disabled={page <= 1}
            onClick={() => setPage(page - 1)}>Previous</button>
          <span className="small">Page {page} of {pages}</span>
          <button type="button" className="btn btn-outline-secondary btn-sm" disabled={page >= pages}
            onClick={() => setPage(page + 1)}>Next</button>
        </nav>
      )}
    </>
  )
}
