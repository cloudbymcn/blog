import { useEffect, useState, type ComponentType } from 'react'
import { canRunImmersive, whenIdle } from '../../lib/immersive'

/**
 * Carrega um componente three.js decorativo só quando vale a pena: gate de dispositivo + depois do load/idle.
 * Até lá (e sempre no mobile/reduced-motion) não renderiza nada: o layout não depende dele.
 */
export function ImmersiveSlot({
  load,
  className = '',
}: {
  load: () => Promise<{ default: ComponentType }>
  className?: string
}) {
  const [Comp, setComp] = useState<ComponentType | null>(null)

  useEffect(() => {
    if (!canRunImmersive()) return
    let alive = true
    const cancel = whenIdle(() => {
      load().then((m) => alive && setComp(() => m.default))
    })
    return () => {
      alive = false
      cancel()
    }
  }, [load])

  if (!Comp) return null
  return (
    <div className={`pointer-events-none ${className}`} aria-hidden="true">
      <Comp />
    </div>
  )
}
