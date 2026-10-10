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

const ENGAGE_EVENTS = ['pointermove', 'pointerdown', 'wheel', 'scroll', 'keydown', 'touchstart'] as const

/**
 * Decorativo pesado (three.js) no desktop: só depois da primeira interação (mexer o mouse, rolar,
 * tecla) ou de `fallbackMs` após o load, e ainda assim num respiro ocioso (+ `delayMs` pra escalonar).
 * Assim a inicialização não cai no TBT/TTI do carregamento.
 */
export function whenEngaged(cb: () => void, { fallbackMs = 6000, delayMs = 0 } = {}): () => void {
  let cancelled = false
  let fired = false
  let timer = 0
  let cancelIdle = () => {}
  const go = () => {
    if (fired || cancelled) return
    fired = true
    ENGAGE_EVENTS.forEach((e) => window.removeEventListener(e, go))
    window.clearTimeout(timer)
    timer = window.setTimeout(() => (cancelIdle = whenIdle(cb)), delayMs)
  }
  ENGAGE_EVENTS.forEach((e) => window.addEventListener(e, go, { once: true, passive: true }))
  const arm = () => {
    if (!fired) timer = window.setTimeout(go, fallbackMs)
  }
  if (document.readyState === 'complete') arm()
  else window.addEventListener('load', arm, { once: true })
  return () => {
    cancelled = true
    ENGAGE_EVENTS.forEach((e) => window.removeEventListener(e, go))
    window.removeEventListener('load', arm)
    window.clearTimeout(timer)
    cancelIdle()
  }
}
