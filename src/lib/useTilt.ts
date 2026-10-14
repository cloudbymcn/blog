import { useCallback, type PointerEvent } from 'react'

const MAX_DEG = 6

/** Hover com mouse e sem reduced-motion (toque não tem hover; evita trabalho à toa no mobile). */
function canTilt() {
  return window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)')
    .matches
}

/**
 * Tilt 3D sutil (máx 6°) + sombra e parallax que acompanham o mouse.
 * Escreve CSS vars (--rx, --ry, --mx, --my) direto no elemento: nenhum re-render no pointermove.
 * O CSS da classe `.tilt` consome as vars.
 */
export function useTilt<T extends HTMLElement>() {
  const onPointerMove = useCallback((e: PointerEvent<T>) => {
    if (e.pointerType !== 'mouse' || !canTilt()) return
    const el = e.currentTarget
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5 // -0.5..0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    el.style.setProperty('--ry', `${(x * 2 * MAX_DEG).toFixed(2)}deg`)
    el.style.setProperty('--rx', `${(-y * 2 * MAX_DEG).toFixed(2)}deg`)
    el.style.setProperty('--mx', x.toFixed(3))
    el.style.setProperty('--my', y.toFixed(3))
    el.classList.add('is-tilting')
  }, [])

  const onPointerLeave = useCallback((e: PointerEvent<T>) => {
    const el = e.currentTarget
    el.classList.remove('is-tilting')
    for (const v of ['--rx', '--ry', '--mx', '--my']) el.style.removeProperty(v)
  }, [])

  return { onPointerMove, onPointerLeave }
}
