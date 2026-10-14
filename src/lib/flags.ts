/**
 * Flags de experimento visual. `?ribbons=0|1` na URL sobrepõe a constante (avaliar no portal sem rebuild).
 */
export const HERO_RIBBONS = true

export function heroRibbonsEnabled(): boolean {
  const q = new URLSearchParams(window.location.search).get('ribbons')
  return q === null ? HERO_RIBBONS : q !== '0'
}
