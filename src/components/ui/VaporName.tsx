import { useEffect, useRef, type ReactNode } from 'react'

/** Parâmetros do Vapor Type (React Bits Pro), com os nomes das props de lá. */
const V = {
  density: 1, // partículas por px² de letra (cai se passar de MAX)
  particleSize: 1.2,
  spread: 1.2, // quanto o vapor viaja, em font-size
  rise: 1,
  turbulence: 0.8,
  diffusion: 0.35,
  grain: 1, // tamanho dos grumos em que as letras quebram
  stagger: 0.8, // 0 = palavra inteira de uma vez; 1 = varredura pura da esquerda
  condense: 1.8,
  dissolve: 2,
  overlap: 0.6, // fração do dissolve em que a recondensação começa
  breath: 1,
  breathRadius: 0.8, // em font-size
  recovery: 1.2,
  vapor: '#9fb3cc',
}
const MAX = 9000
const READY_MS = 1700 // espera a entrada em máscara do h1 terminar antes de medir

function rgb(color: string): [number, number, number] {
  const m = color.match(/[\d.]+/g)?.map(Number) ?? [29, 29, 31]
  if (color.startsWith('#')) {
    const c = parseInt(color.slice(1), 16)
    return [(c >> 16) & 255, (c >> 8) & 255, c & 255]
  }
  return [m[0], m[1], m[2]]
}

/** Hash 2D → 0..1 (grumos: células vizinhas saem juntas). */
function hash(a: number, b: number) {
  let h = (a * 374761393 + b * 668265263) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295
}

const easeOut = (k: number) => 1 - (1 - k) ** 3

interface Layout {
  font: number
  step: number
  n: number
  hx: Float32Array
  hy: Float32Array
  cov: Float32Array
  xn: Float32Array
  clump: Float32Array
  base: [number, number, number]
  bg: string
}

/**
 * Vapor Type (SPEC §0-bis, reproduzido do preview do React Bits Pro) no nome do hero. O h1 real fica
 * sempre no DOM e visível (SEO/leitor de tela); um canvas 2D por cima só entra na animação: no hover
 * o nome evapora em grãos a partir da esquerda, o vapor sobe em mechas e some na cor `vapor`, e as
 * letras recondensam; o ponteiro passando rápido sopra partículas. Pra não trocar o texto real por
 * uma cópia, o canvas pinta com a cor do fundo só as células das letras que saíram do lugar e desenha
 * as partículas por cima. Loop de rAF só enquanto há algo se mexendo; reduced-motion = sem efeito;
 * toque dispara uma vez.
 */
export function VaporName({ children }: { children: ReactNode }) {
  const wrap = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const el = wrap.current
    const cv = canvasRef.current
    const ctx = cv?.getContext('2d')
    if (!el || !cv || !ctx || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const readyAt = performance.now() + READY_MS
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const vapor = rgb(V.vapor)
    let L: Layout | null = null
    let pad = { l: 0, t: 0 }
    // letras: 0 parada, 1 saiu (some até recondensar), 2 recondensando, 3 soprada (mola de volta)
    let state = new Uint8Array(0)
    let lx = new Float32Array(0)
    let ly = new Float32Array(0)
    let lvx = new Float32Array(0)
    let lvy = new Float32Array(0)
    let heat = new Float32Array(0)
    let dep = new Float64Array(0)
    let cond = new Float64Array(0)
    let t0 = new Float64Array(0)
    let dur = new Float32Array(0)
    let sx = new Float32Array(0)
    let sy = new Float32Array(0)
    // vapor (fantasma que se solta da letra)
    let gx = new Float32Array(0)
    let gy = new Float32Array(0)
    let gvx = new Float32Array(0)
    let gvy = new Float32Array(0)
    let gl = new Float32Array(0) // vida 0..1; >= 1 = inativo
    let gd = new Float32Array(0)
    let order = new Int32Array(0)
    let bucket = new Uint8Array(0)
    let raf = 0
    let last = 0
    let busyUntil = 0

    const measure = (): Layout | null => {
      const h1 = el.querySelector('h1')
      const lines = h1 ? Array.from(h1.querySelectorAll<HTMLElement>('.mask-up')) : []
      if (!h1 || !lines.length) return null
      const cs = getComputedStyle(h1)
      const font = parseFloat(cs.fontSize)
      const box = el.getBoundingClientRect()
      pad = { l: Math.round(font * 0.4), t: Math.round(font * 1.5) }
      const w = Math.ceil(box.width + pad.l + font * 1.4)
      const h = Math.ceil(box.height + pad.t + font * 0.6)
      Object.assign(cv.style, { left: `${-pad.l}px`, top: `${-pad.t}px`, width: `${w}px`, height: `${h}px` })
      cv.width = Math.round(w * dpr)
      cv.height = Math.round(h * dpr)

      // texto rasterizado 2x com a mesma fonte/tracking do h1, nas posições reais de cada linha
      const S = 2
      const off = document.createElement('canvas')
      off.width = w * S
      off.height = h * S
      const o = off.getContext('2d', { willReadFrequently: true })
      if (!o) return null
      o.scale(S, S)
      o.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`
      o.letterSpacing = cs.letterSpacing
      o.textBaseline = 'alphabetic'
      for (const line of lines) {
        // a linha externa (overflow-hidden) não tem transform; a altura vem do layout da interna
        const r = (line.parentElement ?? line).getBoundingClientRect()
        const lh = line.offsetHeight
        const m = o.measureText(line.textContent ?? '')
        const asc = m.fontBoundingBoxAscent
        const baseline = r.top - box.top + pad.t + (lh - (asc + m.fontBoundingBoxDescent)) / 2 + asc
        o.fillText(line.textContent ?? '', r.left - box.left + pad.l, baseline)
      }
      const alpha = o.getImageData(0, 0, off.width, off.height).data
      // cobertura exata da célula s×s (média de todos os pixels 2x): pega também a borda antialias
      const coverage = (cx: number, cy: number, s: number) => {
        const x0 = Math.max(0, Math.floor((cx - s / 2) * S))
        const y0 = Math.max(0, Math.floor((cy - s / 2) * S))
        const x1 = Math.min(off.width, Math.ceil((cx + s / 2) * S))
        const y1 = Math.min(off.height, Math.ceil((cy + s / 2) * S))
        let sum = 0
        for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) sum += alpha[(y * off.width + x) * 4 + 3]
        return sum / (Math.max(1, (x1 - x0) * (y1 - y0)) * 255)
      }
      const collect = (s: number) => {
        const cells: number[] = []
        for (let y = s / 2; y < h; y += s)
          for (let x = s / 2; x < w; x += s) {
            const c = coverage(x, y, s)
            if (c > 0.004) cells.push(x, y, c)
          }
        return cells
      }
      let step = 1 / Math.sqrt(V.density)
      let cells = collect(step)
      if (cells.length / 3 > MAX) {
        step *= Math.sqrt(cells.length / 3 / MAX)
        cells = collect(step)
      }
      const n = cells.length / 3
      const hx = new Float32Array(n)
      const hy = new Float32Array(n)
      const cov = new Float32Array(n)
      let minX = Infinity
      let maxX = -Infinity
      for (let i = 0; i < n; i++) {
        hx[i] = cells[i * 3]
        hy[i] = cells[i * 3 + 1]
        cov[i] = Math.min(1, cells[i * 3 + 2] * 1.15)
        minX = Math.min(minX, hx[i])
        maxX = Math.max(maxX, hx[i])
      }
      const g = 6 * V.grain
      const xn = new Float32Array(n)
      const clump = new Float32Array(n)
      for (let i = 0; i < n; i++) {
        xn[i] = (hx[i] - minX) / Math.max(1, maxX - minX)
        clump[i] = hash(Math.floor(hx[i] / g), Math.floor(hy[i] / g)) * 0.8 + Math.random() * 0.2
      }

      // cor do fundo: primeiro ancestral com background sólido
      let bg = 'rgb(255, 255, 255)'
      for (let a: HTMLElement | null = el; a; a = a.parentElement) {
        const c = getComputedStyle(a).backgroundColor
        if (c && !c.startsWith('rgba(0, 0, 0, 0)') && c !== 'transparent') {
          bg = c
          break
        }
      }

      state = new Uint8Array(n)
      lx = hx.slice()
      ly = hy.slice()
      lvx = new Float32Array(n)
      lvy = new Float32Array(n)
      heat = new Float32Array(n)
      dep = new Float64Array(n).fill(Infinity)
      cond = new Float64Array(n).fill(Infinity)
      t0 = new Float64Array(n)
      dur = new Float32Array(n)
      sx = new Float32Array(n)
      sy = new Float32Array(n)
      gx = new Float32Array(n)
      gy = new Float32Array(n)
      gvx = new Float32Array(n)
      gvy = new Float32Array(n)
      gl = new Float32Array(n).fill(1)
      gd = new Float32Array(n)
      order = new Int32Array(n * 2)
      bucket = new Uint8Array(n * 2)
      return { font, step, n, hx, hy, cov, xn, clump, base: rgb(cs.color), bg }
    }

    const spawnGhost = (i: number, strength = 1) => {
      if (!L || gl[i] < 1) return
      gx[i] = lx[i]
      gy[i] = ly[i]
      // já sai subindo (sem arrancada do zero)
      gvx[i] = lvx[i] * 0.3 + (Math.random() - 0.3) * 30
      gvy[i] = lvy[i] * 0.3 - (V.spread * L.font * V.rise * 0.5) / V.dissolve
      gl[i] = 1 - strength
      gd[i] = V.dissolve * 0.5 * (0.7 + Math.random() * 0.6)
    }

    // correntes de ar: campo suave que enrola o vapor em mechas
    const flow = (x: number, y: number, t: number) =>
      Math.sin(x * 0.021 + t * 0.9) * Math.cos(y * 0.027 - t * 0.6) +
      0.5 * Math.sin((x + y) * 0.013 + t * 1.3)

    const MIX_LEVELS = 6
    const ALPHA_LEVELS = 8
    const styles = Array.from({ length: MIX_LEVELS }, (_, m) => m / (MIX_LEVELS - 1))

    const frame = (nowMs: number) => {
      raf = 0
      if (!L) return
      const now = nowMs / 1000
      const dt = last ? Math.min(0.05, now - last) : 1 / 60
      last = now
      const { n, hx, hy, cov, font, step, base } = L
      const ps = V.particleSize
      const omega = 4 / V.recovery
      let active = 0

      for (let i = 0; i < n; i++) {
        if (now >= dep[i]) {
          dep[i] = Infinity
          spawnGhost(i)
          state[i] = 1
        } else if (dep[i] !== Infinity) active++ // saída agendada mantém o loop vivo
        const s = state[i]
        if (s === 1) {
          active++
          if (now >= cond[i]) {
            cond[i] = Infinity
            state[i] = 2
            // volta de dentro da nuvem de vapor, acima e um pouco à direita
            sx[i] = hx[i] + (Math.random() - 0.35) * font * 0.9
            sy[i] = hy[i] - (0.25 + Math.random() * 0.75) * V.spread * font * 0.7 * V.rise
            t0[i] = now
            dur[i] = V.condense * 0.6 * (0.7 + Math.random() * 0.6)
          }
        } else if (s === 2) {
          active++
          const k = (now - t0[i]) / dur[i]
          if (k >= 1) {
            state[i] = 0
            lx[i] = hx[i]
            ly[i] = hy[i]
          } else {
            const e = easeOut(k)
            const wob = (1 - e) * Math.sin(k * 6 + i) * font * 0.08
            lx[i] = sx[i] + (hx[i] - sx[i]) * e + wob
            ly[i] = sy[i] + (hy[i] - sy[i]) * e
          }
        } else if (s === 3) {
          active++
          lvx[i] += (-omega * omega * (lx[i] - hx[i]) - 2 * omega * lvx[i]) * dt
          lvy[i] += (-omega * omega * (ly[i] - hy[i]) - 2 * omega * lvy[i]) * dt
          lx[i] += lvx[i] * dt
          ly[i] += lvy[i] * dt
          heat[i] *= Math.exp(-dt * 2.5)
          if (
            Math.abs(lx[i] - hx[i]) + Math.abs(ly[i] - hy[i]) < 0.3 &&
            Math.abs(lvx[i]) + Math.abs(lvy[i]) < 3
          ) {
            state[i] = 0
            lx[i] = hx[i]
            ly[i] = hy[i]
            heat[i] = 0
          }
        }
        if (gl[i] < 1) {
          active++
          gl[i] += dt / gd[i]
          const ang = -Math.PI / 2 + 0.35 + V.turbulence * 1.1 * flow(gx[i], gy[i], now)
          const speed = (V.spread * font) / gd[i]
          const k = 1 - Math.exp(-dt * 4)
          gvx[i] += (Math.cos(ang) * speed - gvx[i]) * k + (Math.random() - 0.5) * V.diffusion * 600 * dt
          gvy[i] +=
            (Math.sin(ang) * speed * V.rise - gvy[i]) * k + (Math.random() - 0.5) * V.diffusion * 600 * dt
          gx[i] += gvx[i] * dt
          gy[i] += gvy[i] * dt
        }
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, cv.width, cv.height)
      if (!active) {
        last = 0
        return
      }

      // 1) apaga (cor do fundo) as células das letras fora do lugar: o h1 real some só ali
      ctx.beginPath()
      const half = step / 2 + 0.6 // dilata um pouco: nenhum fio da letra real sobra na borda
      for (let i = 0; i < n; i++) if (state[i] !== 0) ctx.rect(hx[i] - half, hy[i] - half, half * 2, half * 2)
      ctx.fillStyle = L.bg
      ctx.fill()

      // 2) partículas (letras em movimento + vapor), agrupadas por cor/alfa pra poucos fill()
      let count = 0
      const counts = new Int32Array(MIX_LEVELS * ALPHA_LEVELS + 1)
      const put = (idx: number, mix: number, a: number) => {
        const al = Math.min(ALPHA_LEVELS - 1, Math.floor(a * ALPHA_LEVELS))
        if (al <= 0 && a < 0.06) return
        const b = Math.round(Math.min(1, Math.max(0, mix)) * (MIX_LEVELS - 1)) * ALPHA_LEVELS + al
        order[count] = idx
        bucket[count++] = b
        counts[b + 1]++
      }
      for (let i = 0; i < n; i++) {
        const s = state[i]
        if (s === 2) {
          const k = Math.min(1, (now - t0[i]) / dur[i])
          put(i, 1 - easeOut(k), cov[i] * Math.min(1, k * 1.6))
        } else if (s === 3) put(i, heat[i], cov[i])
        if (gl[i] < 1) {
          const life = gl[i]
          put(n + i, Math.min(1, life * 1.8), cov[i] * (1 - life) ** 1.5 * 0.9)
        }
      }
      for (let b = 1; b < counts.length; b++) counts[b] += counts[b - 1]
      const sorted = new Int32Array(count)
      const cursor = counts.slice()
      for (let k = 0; k < count; k++) sorted[cursor[bucket[k]]++] = order[k]
      for (let b = 0; b < MIX_LEVELS * ALPHA_LEVELS; b++) {
        const from = counts[b]
        const to = counts[b + 1]
        if (from === to) continue
        const m = styles[Math.floor(b / ALPHA_LEVELS)]
        const r = Math.round(base[0] + (vapor[0] - base[0]) * m)
        const g = Math.round(base[1] + (vapor[1] - base[1]) * m)
        const bl = Math.round(base[2] + (vapor[2] - base[2]) * m)
        ctx.fillStyle = `rgb(${r},${g},${bl})`
        ctx.globalAlpha = ((b % ALPHA_LEVELS) + 0.5) / ALPHA_LEVELS
        ctx.beginPath()
        for (let k = from; k < to; k++) {
          const idx = sorted[k]
          if (idx < n) {
            const sz = Math.max(ps, step)
            ctx.rect(lx[idx] - sz / 2, ly[idx] - sz / 2, sz, sz)
          } else {
            const i = idx - n
            ctx.rect(gx[i] - ps / 2, gy[i] - ps / 2, ps, ps)
          }
        }
        ctx.fill()
      }
      ctx.globalAlpha = 1
      raf = requestAnimationFrame(frame)
    }

    const kick = () => {
      if (!raf) raf = requestAnimationFrame(frame)
    }

    const ensure = () => {
      if (performance.now() < readyAt) return false
      // entrada em máscara ainda rodando: o texto não está no lugar final
      const h1 = el.querySelector('h1')
      if (h1?.getAnimations({ subtree: true }).some((a) => a.playState === 'running')) return false
      if (!L) L = measure()
      return !!L
    }

    /** Evapora o nome inteiro (varredura da esquerda) e agenda a recondensação. */
    const evaporate = () => {
      const nowMs = performance.now()
      if (nowMs < busyUntil || !ensure() || !L) return
      const now = nowMs / 1000
      const { n, xn, clump } = L
      const D = V.dissolve
      const C = V.condense
      for (let i = 0; i < n; i++) {
        const rank = V.stagger * xn[i] + (1 - V.stagger) * clump[i]
        dep[i] = now + D * 0.5 * rank
        cond[i] = Math.max(dep[i] + 0.25, now + V.overlap * D + C * 0.4 * rank)
      }
      busyUntil = nowMs + (V.overlap * D + C) * 1000
      kick()
    }

    // sopro: o ponteiro passando rápido sobre as letras empurra as partículas por perto
    let prev = { x: 0, y: 0, t: 0 }
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      const r = cv.getBoundingClientRect()
      const x = e.clientX - r.left
      const y = e.clientY - r.top
      const t = e.timeStamp
      const dtm = (t - prev.t) / 1000
      const mx = x - prev.x
      const my = y - prev.y
      prev = { x, y, t }
      if (dtm <= 0 || dtm > 0.1 || !ensure() || !L) return
      const speed = Math.hypot(mx, my) / dtm
      const strength = V.breath * Math.min(1, speed / 1800)
      if (strength < 0.08) return
      const R = V.breathRadius * L.font
      const ux = mx / (Math.hypot(mx, my) || 1)
      const uy = my / (Math.hypot(mx, my) || 1)
      const { n, hx, hy } = L
      for (let i = 0; i < n; i++) {
        const s = state[i]
        if (s !== 0 && s !== 3) continue
        const dx = hx[i] - x
        const dy = hy[i] - y
        const d = Math.hypot(dx, dy)
        if (d > R) continue
        const f = (1 - d / R) ** 2 * strength
        const k = 1 / (d || 1)
        lvx[i] += (ux * 420 + dx * k * 140) * f
        lvy[i] += (uy * 420 + dy * k * 140 - 160) * f
        heat[i] = Math.max(heat[i], f)
        state[i] = 3
        if (f > 0.3 && Math.random() < f) spawnGhost(i, 0.9)
      }
      kick()
    }
    const onEnter = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') evaporate()
    }
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') evaporate() // toque/caneta: dispara uma vez
    }
    el.addEventListener('pointerenter', onEnter)
    el.addEventListener('pointermove', onMove, { passive: true })
    el.addEventListener('pointerdown', onDown, { passive: true })
    const ro = new ResizeObserver(() => {
      // layout mudou: remede na próxima interação (se nada estiver animando)
      if (!raf) L = null
    })
    ro.observe(el)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      el.removeEventListener('pointerenter', onEnter)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerdown', onDown)
    }
  }, [])

  return (
    <div ref={wrap} className="relative">
      {children}
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute" />
    </div>
  )
}
