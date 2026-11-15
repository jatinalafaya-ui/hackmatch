export default function Logo({ className = '', light = false }: { className?: string; light?: boolean }) {
  return (
    <div className={`d-flex align-items-center gap-2 ${className}`}>
      <img src="/favicon.svg" alt="" width={36} height={36} />
      <span className={`fs-4 fw-bold ${light ? 'text-white' : 'text-brand'}`}>HackMatch</span>
    </div>
  )
}
