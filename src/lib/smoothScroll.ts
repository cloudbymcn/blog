import Lenis from 'lenis'
import 'lenis/dist/lenis.css'

/**
 * Scroll suave estilo apple.com (Lenis). Só roda wheel/trackpad: toque fica nativo (mobile não trava).
 * Desligado em prefers-reduced-motion. Elementos com `data-lenis-prevent` rolam por conta própria.
 */
let lenis: Lenis | null = null

export function startSmoothScroll() {
  if (lenis || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  lenis = new Lenis({ duration: 1.1, anchors: { offset: 0 }, autoRaf: true })
}

export function stopSmoothScroll() {
  lenis?.destroy()
  lenis = null
}

/** Rola até um elemento/posição respeitando o Lenis quando ativo. */
export function scrollToTarget(target: HTMLElement | number, immediate = false) {
  if (lenis) {
    lenis.scrollTo(target, { immediate, force: true })
    return
  }
  if (typeof target === 'number') window.scrollTo({ top: target, behavior: 'auto' })
  else target.scrollIntoView()
}
