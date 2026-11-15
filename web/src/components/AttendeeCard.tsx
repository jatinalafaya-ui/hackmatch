import type { ReactNode } from 'react'
import type { Attendee } from '../api'

function initials(person: Pick<Attendee, 'firstName' | 'lastName'>) {
  return `${person.firstName[0] ?? ''}${person.lastName[0] ?? ''}`.toUpperCase()
}

export default function AttendeeCard({ person, children }: { person: Attendee; children?: ReactNode }) {
  return (
    <article className="card h-100 border-0 shadow-sm attendee-card">
      <div className="card-body d-flex flex-column">
        <div className="d-flex align-items-center gap-3 mb-3">
          <div className="avatar" aria-hidden="true">{initials(person)}</div>
          <div>
            <h2 className="h6 fw-bold mb-0">
              {person.firstName} {person.lastName}
            </h2>
            <div className="small text-secondary">
              <span className={`badge me-1 ${person.role === 'mentor' ? 'badge-mentor' : 'badge-hacker'}`}>
                {person.role === 'mentor' ? 'Mentor' : 'Hacker'}
              </span>
              {person.school}
            </div>
          </div>
        </div>
        {person.skills.length > 0 && (
          <ul className="list-unstyled d-flex flex-wrap gap-1 mb-2" aria-label="Skills">
            {person.skills.map((skill) => (
              <li key={skill} className="skill-chip">{skill}</li>
            ))}
          </ul>
        )}
        {person.lookingFor && (
          <p className="small mb-3">
            <span className="fw-semibold">Looking for:</span> {person.lookingFor}
          </p>
        )}
        <div className="mt-auto">{children}</div>
      </div>
    </article>
  )
}
