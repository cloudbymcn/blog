/** Atraso do item i numa lista (stagger de 60ms, teto pra lista longa não demorar). */
export const stagger = (i: number, step = 60, max = 360) => Math.min(i * step, max)

type Connection = { saveData?: boolean; effectiveType?: string }

/** Vídeo só com movimento liberado e rede boa: reduced-motion, economia de dados e 2g ficam no poster. */
export function motionAllowed() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  const c = (navigator as Navigator & { connection?: Connection }).connection
  if (c?.saveData) return false
  return !/2g$/.test(c?.effectiveType ?? '')
}
