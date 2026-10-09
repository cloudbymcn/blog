import { useEffect, useRef, useState } from 'react'

/** Parâmetros do Signal Type (React Bits Pro), com os nomes das props de lá. */
const S = {
  flickers: 3, // falsas partidas, em média, antes de a letra ficar acesa
  speed: 1,
  stagger: 0.045,
  delay: 0.15,
  glow: 0.22, // halo fixo da letra acesa (azul bem suave no tema claro)
  flash: 0.85, // pico do halo quando a letra "bate"
  instability: 0.3,
  interference: 1,
  interferenceRadius: 90,
}

interface Glyph {
  el: HTMLElement
  events: [number, boolean][] // (tempo, acesa?) em ordem
  lit: boolean
  lastOn: number
  shown: string // último --lit/--glow/--base escrito (evita mexer no estilo à toa)
}

const rand = (a: number, b: number) => a + Math.random() * (b - a)

/** Uma partida: `n` falsas partidas (liga/desliga rápido) e depois fica acesa. */
function strike(start: number, n: number) {
  const ev: [number, boolean][] = []
  let t = start
  for (let k = 0; k < n; k++) {
    ev.push([t, true])
    t += rand(0.03, 0.07) / S.speed
    ev.push([t, false])
    t += rand(0.04, 0.13) / S.speed
  }
  ev.push([t, true])
  return ev
}

/** Falsas partidas por letra: ~Poisson em volta de `S.flickers`. */
const flickerCount = (avg = S.flickers) => Math.max(0, Math.round(avg + (Math.random() - 0.5) * avg * 1.2))

/**
 * Signal Type (SPEC §0-bis, reproduzido do React Bits Pro) no nome do hero: letreiro que acende letra
 * por letra com flicker. Cada letra tem o texto real uma vez só (contorno de "tubo apagado" via filtro
 * SVG); o halo e o preenchimento são ::before/::after com `content: attr(data-ch)`, controlados pelas
 * variáveis --lit/--glow/--base que o scheduler (rAF só enquanto algo pisca) escreve. Liga quando entra
 * na tela; de vez em quando uma letra perde energia (instability); ponteiro rápido faz as acesas
 * estalarem (interference); clique apaga em onda a partir do ponto e religa. Reduced-motion: aceso.
 */
export function SignalName({ lines, className = '' }: { lines: string[]; className?: string }) {
  const ref = useRef<HTMLHeadingElement>(null)
  const [reduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)

  useEffect(() => {
    const h1 = ref.current
    if (!h1 || reduced) return
    const glyphs: Glyph[] = Array.from(h1.querySelectorAll<HTMLElement>('.signal-g'), (el) => ({
      el,
      events: [],
      lit: false,
      lastOn: -10,
      shown: '',
    }))
    let raf = 0
    let ignited = false
    let inView = false
    let idle = 0
    const clock = () => performance.now() / 1000

    const paint = (g: Glyph, now: number) => {
      const flash = g.lit ? S.flash * Math.exp(-(now - g.lastOn) / 0.14) : 0
      const glow = g.lit ? Math.min(1, S.glow + flash) : 0
      const key = `${g.lit ? 1 : 0}|${glow.toFixed(2)}`
      if (key === g.shown) return
      g.shown = key
      g.el.style.setProperty('--lit', g.lit ? '1' : '0')
      g.el.style.setProperty('--base', g.lit ? '0' : '1')
      g.el.style.setProperty('--glow', glow.toFixed(2))
    }

    const frame = () => {
      raf = 0
      const now = clock()
      let busy = false
      for (const g of glyphs) {
        while (g.events.length && g.events[0][0] <= now) {
          const [, on] = g.events.shift()!
          if (on && !g.lit) g.lastOn = now
          g.lit = on
        }
        paint(g, now)
        if (g.events.length || (g.lit && now - g.lastOn < 0.7)) busy = true
      }
      if (busy) raf = requestAnimationFrame(frame)
    }
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(frame)
    }

    // ordem aleatória, com stagger de 45ms entre os inícios
    const ignite = () => {
      ignited = true
      const now = clock()
      const order = glyphs.map((_, i) => i).sort(() => Math.random() - 0.5)
      order.forEach((gi, rank) => {
        glyphs[gi].events = strike(now + S.delay + rank * S.stagger, flickerCount())
      })
      kick()
      armInstability()
    }

    /** Perde energia por um instante (conexão frouxa). */
    const blip = (g: Glyph, now: number, short = false) => {
      if (!g.lit || g.events.length) return
      const off = rand(0.04, short ? 0.07 : 0.12) / S.speed
      g.events = [
        [now, false],
        [now + off, true],
      ]
      if (!short && Math.random() < 0.5) g.events.push([now + off + 0.04, false], [now + off + 0.09, true])
    }

    const armInstability = () => {
      window.clearTimeout(idle)
      if (!S.instability) return
      idle = window.setTimeout(
        () => {
          if (inView && !document.hidden) {
            const lit = glyphs.filter((g) => g.lit && !g.events.length)
            if (lit.length) {
              blip(lit[Math.floor(Math.random() * lit.length)], clock())
              kick()
            }
          }
          armInstability()
        },
        rand(1.5, 4.5) * (1 / S.instability) * 1000,
      )
    }

    const centers = () =>
      glyphs.map((g) => {
        const r = g.el.getBoundingClientRect()
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
      })

    // interference: o ponteiro passando rápido sobre letras acesas faz elas estalarem
    let prev = { x: 0, y: 0, t: 0 }
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || !ignited) return
      const t = e.timeStamp / 1000
      const dt = t - prev.t
      const speed = dt > 0 && dt < 0.1 ? Math.hypot(e.clientX - prev.x, e.clientY - prev.y) / dt : 0
      prev = { x: e.clientX, y: e.clientY, t }
      const energy = S.interference * Math.min(1, speed / 1600)
      if (energy < 0.05) return
      const now = clock()
      const R = S.interferenceRadius
      centers().forEach((c, i) => {
        const d = Math.hypot(c.x - e.clientX, c.y - e.clientY)
        if (d < R && Math.random() < energy * (1 - d / R) * 0.6) blip(glyphs[i], now, true)
      })
      kick()
    }

    // clique: apaga em onda a partir do ponto e religa (mesma onda, com flicker)
    const onClick = (e: MouseEvent) => {
      if (!ignited) return
      const now = clock()
      const cs = centers()
      glyphs.forEach((g, i) => {
        const delay = Math.hypot(cs[i].x - e.clientX, cs[i].y - e.clientY) / 900
        const back = now + delay + 0.35
        g.events = [[now + delay, false], ...strike(back + rand(0, 0.12), flickerCount(1.5))]
      })
      kick()
    }

    const io = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting
      if (inView && !ignited) ignite()
    })
    io.observe(h1)
    h1.addEventListener('pointermove', onMove, { passive: true })
    h1.addEventListener('click', onClick)

    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(idle)
      io.disconnect()
      h1.removeEventListener('pointermove', onMove)
      h1.removeEventListener('click', onClick)
    }
  }, [reduced])

  return (
    <h1
      ref={ref}
      aria-label={lines.join(' ')}
      className={`signal ${reduced ? 'signal-on' : ''} ${className}`}
    >
      {/* contorno de 1px (tubo apagado): dilata o alfa e tira o miolo */}
      <svg aria-hidden="true" width="0" height="0" className="absolute">
        <filter
          id="signal-outline"
          x="-25%"
          y="-25%"
          width="150%"
          height="150%"
          colorInterpolationFilters="sRGB"
        >
          <feMorphology in="SourceAlpha" operator="dilate" radius="1" result="grown" />
          <feComposite in="grown" in2="SourceAlpha" operator="out" result="ring" />
          <feFlood floodColor="#c7c7cc" />
          <feComposite in2="ring" operator="in" />
        </filter>
      </svg>
      {lines.map((line, li) => (
        <span key={li} aria-hidden="true" className="block pb-[0.08em]">
          {li > 0 && ' ' /* espaço no texto (SEO/cópia); não aparece entre blocos */}
          {Array.from(line, (ch, ci) => (
            <span key={ci} className="signal-g" data-ch={ch}>
              <span>{ch}</span>
            </span>
          ))}
        </span>
      ))}
    </h1>
  )
}
