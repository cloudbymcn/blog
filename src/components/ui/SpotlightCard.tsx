import type { ReactNode } from 'react'

/** SpotlightCard: brilho radial que segue o cursor dentro do card. */
export function SpotlightCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`)
    e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`)
  }
  return (
    <div
      onPointerMove={onMove}
      className={`spotlight-card group relative overflow-hidden rounded-2xl border border-line bg-bg-2 transition-colors hover:border-accent/40 ${className}`}
    >
      {children}
    </div>
  )
}
