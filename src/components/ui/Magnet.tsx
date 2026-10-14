import { useRef, type ReactNode } from 'react'

const fine = '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)'

/**
 * Botão magnético: o filho é puxado na direção do cursor e volta com mola ao sair.
 * A área de captura passa 12px da borda (padding + margem negativa), como em apple.com.
 */
export function Magnet({
  children,
  strength = 0.2,
  className = 'inline-block',
}: {
  children: ReactNode
  strength?: number
  /** display do wrapper ('block' pra ocupar a célula de um grid) */
  className?: string
}) {
  const inner = useRef<HTMLSpanElement>(null)

  function onMove(e: React.PointerEvent<HTMLSpanElement>) {
    const el = inner.current
    if (!el || e.pointerType !== 'mouse' || !window.matchMedia(fine).matches) return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - (r.left + r.width / 2)) * strength
    const y = (e.clientY - (r.top + r.height / 2)) * strength
    el.style.transition = 'transform 0.2s ease-out'
    el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`
  }

  function onLeave() {
    const el = inner.current
    if (!el) return
    el.style.transition = 'transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)'
    el.style.transform = ''
  }

  return (
    <span onPointerMove={onMove} onPointerLeave={onLeave} className={`-m-3 p-3 ${className}`}>
      <span ref={inner} className={`${className} will-change-transform`}>
        {children}
      </span>
    </span>
  )
}
