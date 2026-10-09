import { useEffect, useRef, useState, type ComponentType } from 'react'
import { canRunImmersive, whenEngaged } from '../../lib/immersive'

/**
 * Carrega um componente three.js decorativo só quando vale a pena: gate de dispositivo + depois do load/idle.
 * Até lá (e sempre no mobile/reduced-motion) não renderiza nada: o layout não depende dele.
 */
export function ImmersiveSlot({
  load,
  media,
  delayMs = 0,
  onlyNearViewport = false,
  allowReducedMotion = false,
  className = '',
}: {
  load: () => Promise<{ default: ComponentType }>
  /** media query extra (ex.: só desktop largo, quando o slot fica oculto abaixo disso) */
  media?: string
  /** atraso extra depois do gatilho, pra não inicializar junto com o crachá */
  delayMs?: number
  /** só carrega quando o slot chega perto da viewport (seções abaixo da dobra) */
  onlyNearViewport?: boolean
  /** carrega também com reduced-motion (o componente renderiza parado) */
  allowReducedMotion?: boolean
  className?: string
}) {
  const [Comp, setComp] = useState<ComponentType | null>(null)
  const anchor = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!canRunImmersive({ allowReducedMotion }) || (media && !window.matchMedia(media).matches)) return
    let alive = true
    let cancel = () => {}
    const start = () => {
      cancel = whenEngaged(
        () => {
          load().then((m) => alive && setComp(() => m.default))
        },
        { delayMs },
      )
    }
    let io: IntersectionObserver | undefined
    if (onlyNearViewport && anchor.current) {
      io = new IntersectionObserver(
        ([e]) => {
          if (!e.isIntersecting) return
          io?.disconnect()
          start()
        },
        { rootMargin: '400px 0px' },
      )
      io.observe(anchor.current)
    } else start()
    return () => {
      alive = false
      io?.disconnect()
      cancel()
    }
  }, [load, media, delayMs, onlyNearViewport, allowReducedMotion])

  // âncora vazia pro IntersectionObserver enquanto o componente não carrega
  if (!Comp) return <div ref={anchor} className={`pointer-events-none ${className}`} aria-hidden="true" />
  return (
    <div className={`pointer-events-none ${className}`} aria-hidden="true">
      <Comp />
    </div>
  )
}
