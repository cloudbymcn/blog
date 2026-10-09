import type Lenis from 'lenis'
import { canRunImmersive } from './immersive'

/**
 * Scroll suave estilo apple.com (Lenis), só em desktop com mouse e sem reduced-motion.
 * Import dinâmico: fora do bundle principal e nunca carregado no mobile (toque fica nativo).
 * Elementos com `data-lenis-prevent` rolam por conta própria.
 */
let lenis: Lenis | null = null
let alive = false

export function startSmoothScroll() {
  if (alive || !canRunImmersive()) return
  alive = true
  Promise.all([import('lenis'), import('lenis/dist/lenis.css')]).then(([{ default: L }]) => {
    if (!alive || lenis) return
    lenis = new L({ duration: 1.1, anchors: { offset: 0 }, autoRaf: true })
  })
}

export function stopSmoothScroll() {
  alive = false
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
