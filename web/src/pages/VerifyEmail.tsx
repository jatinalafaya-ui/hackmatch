import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import AuthCard from '../components/AuthCard'
import Alert from '../components/Alert'

export default function VerifyEmail() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const [state, setState] = useState<'working' | 'done' | 'failed'>(token ? 'working' : 'failed')
  const [message, setMessage] = useState(token ? '' : 'This verification link is missing its token.')
  const started = useRef(false)

  // Tokens are single use, so make sure React's dev double-render
  // doesn't send the request twice.
  useEffect(() => {
    if (!token || started.current) return
    started.current = true
    api
      .verifyEmail(token)
      .then((res) => {
        setState('done')
        setMessage(res.message)
      })
      .catch((err) => {
        setState('failed')
        setMessage(err instanceof Error ? err.message : 'Verification failed')
      })
  }, [token])

  return (
    <AuthCard title={state === 'done' ? 'Email verified' : state === 'failed' ? 'Link not valid' : 'Verifying…'}>
      {state !== 'working' && <Alert kind={state === 'done' ? 'success' : 'danger'} message={message} />}
      {state === 'failed' && (
        <p>Log in with your email and password and we'll offer to send you a new link.</p>
      )}
      <Link to="/login" className="btn btn-brand w-100">Go to log in</Link>
    </AuthCard>
  )
}
