export default function Alert({ kind, message }: { kind: 'danger' | 'success' | 'info'; message: string }) {
  if (!message) return null
  return (
    <div className={`alert alert-${kind} py-2`} role={kind === 'danger' ? 'alert' : 'status'}>
      {message}
    </div>
  )
}
