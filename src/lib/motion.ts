/** Atraso do item i numa lista (stagger de 60ms, teto pra lista longa não demorar). */
export const stagger = (i: number, step = 60, max = 360) => Math.min(i * step, max)
