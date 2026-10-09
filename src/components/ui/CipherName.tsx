import { useEffect, useRef, useState } from 'react'

/** Parâmetros do Cipher Reveal (React Bits Pro), com os nomes das props de lá. */
const C = {
  duration: 1.4, // decode da linha inteira
  scramble: 0.45, // cada letra embaralha isso antes de travar
  rate: 14, // trocas por segundo
  scrambleOpacity: 0.42,
  hoverRadius: 0.6, // em
}

// charset "auto": caracteres de largura parecida com a letra final (minúsculo, como o h1)
const GROUPS = ['ijlrtf', 'mw', 'abcdeghknopqsuvxyz']
const groupOf = (ch: string) => GROUPS.find((g) => g.includes(ch.toLowerCase())) ?? GROUPS[2]

interface Glyph {
  face: HTMLElement
  mask: HTMLElement
  group: string
  width: number
  start: number // quando começa a embaralhar (s)
  lock: number // quando trava na letra final (s)
  next: number // próxima troca de caractere
  state: 'blank' | 'scramble' | 'done'
}

/**
 * Cipher Reveal (SPEC §0-bis, reproduzido do React Bits Pro) no nome do hero: o h1 decodifica a partir
 * de caracteres embaralhados, da esquerda pra direita, na própria fonte. Cada letra real fica no fluxo
 * (some enquanto embaralha) e uma máscara absoluta mostra a cifra, esticada na largura exata da letra
 * final: a linha nunca pula. Liga quando o h1 entra na tela; o ponteiro re-embaralha as letras por onde
 * passa e elas decodificam de novo atrás dele. Scheduler em rAF só enquanto há letra mexendo.
 * Reduced-motion: texto final direto.
 */
export function CipherName({ lines, className = '' }: { lines: string[]; className?: string }) {
  const ref = useRef<HTMLHeadingElement>(null)
  const [reduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)

  useEffect(() => {
    const h1 = ref.current
    if (!h1 || reduced) return
    const widths = new Map<string, number>()
    const probe = document.createElement('span')
    probe.style.cssText = 'position:absolute;visibility:hidden;white-space:pre'
    h1.appendChild(probe)
    const widthOf = (ch: string) => {
      let w = widths.get(ch)
      if (w === undefined) {
        probe.textContent = ch
        w = probe.getBoundingClientRect().width
        widths.set(ch, w)
      }
      return w
    }
    const glyphs: Glyph[] = Array.from(h1.querySelectorAll<HTMLElement>('.cipher-g'), (el) => {
      const face = el.firstElementChild as HTMLElement
      return {
        face,
        mask: el.lastElementChild as HTMLElement,
        group: groupOf(face.textContent ?? ''),
        width: 0,
        start: Infinity,
        lock: Infinity,
        next: 0,
        state: 'blank',
      }
    })
    const measure = () => {
      for (const g of glyphs) g.width = g.face.getBoundingClientRect().width
      for (const g of GROUPS) for (const ch of g) widthOf(ch)
    }
    measure()

    let raf = 0
    let started = false
    const clock = () => performance.now() / 1000

    const show = (g: Glyph) => {
      const ch = g.group[Math.floor(Math.random() * g.group.length)]
      g.mask.textContent = ch
      g.mask.style.setProperty('--sx', (g.width / (widthOf(ch) || g.width || 1)).toFixed(3))
    }

    const frame = () => {
      raf = 0
      const now = clock()
      let busy = false
      for (const g of glyphs) {
        if (g.state === 'done') continue
        busy = true
        if (now >= g.lock) {
          g.state = 'done'
          g.face.style.opacity = '1'
          g.mask.style.opacity = '0'
          g.mask.textContent = ''
          continue
        }
        if (now < g.start) continue
        if (g.state === 'blank') {
          g.state = 'scramble'
          g.face.style.opacity = '0'
          g.next = 0
        }
        if (now >= g.next) {
          show(g)
          g.next = now + 1 / C.rate
        }
        // clareia de 0.42 até 1 conforme chega a hora de travar
        const k = Math.min(1, Math.max(0, (now - g.start) / Math.max(0.01, g.lock - g.start)))
        g.mask.style.opacity = (C.scrambleOpacity + (1 - C.scrambleOpacity) * k * k).toFixed(3)
      }
      if (busy) raf = requestAnimationFrame(frame)
    }
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(frame)
    }

    // da esquerda pra direita, começando do vazio: a linha inteira em `duration`
    const reveal = () => {
      started = true
      h1.classList.remove('cipher-pending')
      measure()
      const now = clock()
      const span = Math.max(0, C.duration - C.scramble)
      glyphs.forEach((g, i) => {
        g.start = now + (span * i) / Math.max(1, glyphs.length - 1)
        g.lock = g.start + C.scramble
        g.state = 'blank'
        g.face.style.opacity = '0'
      })
      kick()
    }

    // trail: o ponteiro re-embaralha as letras em volta; elas decodificam de novo quando ele sai
    const onMove = (e: PointerEvent) => {
      if (!started || e.pointerType !== 'mouse') return
      const R = C.hoverRadius * parseFloat(getComputedStyle(h1).fontSize)
      const now = clock()
      let hit = false
      for (const g of glyphs) {
        const r = g.face.getBoundingClientRect()
        const d = Math.hypot(r.left + r.width / 2 - e.clientX, r.top + r.height / 2 - e.clientY)
        if (d > R) continue
        hit = true
        if (g.state === 'done') {
          g.state = 'scramble'
          g.start = now
          g.next = 0
          g.face.style.opacity = '0'
        }
        g.lock = Math.max(g.lock === Infinity ? 0 : g.lock, now + C.scramble * 0.8)
      }
      if (hit) kick()
    }

    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started) reveal()
    })
    io.observe(h1)
    h1.addEventListener('pointermove', onMove, { passive: true })
    const ro = new ResizeObserver(measure)
    ro.observe(h1)

    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      ro.disconnect()
      h1.removeEventListener('pointermove', onMove)
      probe.remove()
    }
  }, [reduced])

  return (
    <h1 ref={ref} aria-label={lines.join(' ')} className={`${reduced ? '' : 'cipher-pending'} ${className}`}>
      {lines.map((line, li) => (
        <span key={li} aria-hidden="true" className="block pb-[0.08em]">
          {li > 0 && ' ' /* espaço no texto (SEO/cópia); não aparece entre blocos */}
          {Array.from(line, (ch, ci) => (
            <span key={ci} className="cipher-g">
              <span className="cipher-face">{ch}</span>
              <span className="cipher-mask" />
            </span>
          ))}
        </span>
      ))}
    </h1>
  )
}
