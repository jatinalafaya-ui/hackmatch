import type { ReactNode } from 'react'
import Logo from './Logo'

export default function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <main id="main" className="auth-page d-flex align-items-center justify-content-center px-3 py-5">
      <div className="card auth-card shadow-sm border-0 w-100">
        <div className="card-body p-4 p-md-5">
          <Logo className="mb-4" />
          <h1 className="h3 fw-bold mb-1">{title}</h1>
          {subtitle && <p className="text-secondary mb-4">{subtitle}</p>}
          {children}
        </div>
      </div>
    </main>
  )
}
