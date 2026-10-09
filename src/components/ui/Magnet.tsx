import { useRef, type ReactNode } from 'react'

/** Magnet: o filho é puxado levemente na direção do cursor. */
export function Magnet({ children, strength = 0.25 }: { children: ReactNode; strength?: number }) {
  const ref = useRef<HTMLSpanElement>(null)

  function onMove(e: React.PointerEvent) {
    const el = ref.current
    if (!el || e.pointerType !== 'mouse') return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - (r.left + r.width / 2)) * strength
    const y = (e.clientY - (r.top + r.height / 2)) * strength
    el.style.transform = `translate(${x}px, ${y}px)`
  }

  function onLeave() {
    if (ref.current) ref.current.style.transform = ''
  }

  return (
    <span
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className="inline-block transition-transform duration-300 ease-out"
    >
      {children}
    </span>
  )
}
