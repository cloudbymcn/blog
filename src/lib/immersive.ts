/**
 * Gate da camada imersiva (SPEC §0-bis): three.js decorativo e Lenis só em desktop com mouse,
 * sem reduced-motion e com GPU razoável. Mobile fica com a versão estática (perf/LCP).
 */
export function canRunImmersive(): boolean {
  if (
    !window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)')
      .matches
  )
    return false
  if ((navigator.hardwareConcurrency ?? 8) < 4) return false
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

/** Roda depois do load e de um respiro ocioso: o decorativo nunca disputa o LCP. */
export function whenIdle(cb: () => void): () => void {
  let cancelled = false
  let idle = 0
  const run = () => {
    if (cancelled) return
    const ric = window.requestIdleCallback ?? ((f: () => void) => window.setTimeout(f, 200))
    idle = ric(() => !cancelled && cb(), { timeout: 2000 })
  }
  if (document.readyState === 'complete') run()
  else window.addEventListener('load', run, { once: true })
  return () => {
    cancelled = true
    window.removeEventListener('load', run)
    window.cancelIdleCallback?.(idle)
  }
}
