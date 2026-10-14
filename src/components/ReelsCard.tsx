import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { siInstagram } from 'simple-icons'
import data from '../content/reels.json'
import { motionAllowed } from '../lib/motion'
import { Magnet } from './ui/Magnet'
import { Reveal } from './ui/Reveal'
import './ReelsCard.css'

/** Um reel em `src/content/reels.json` (gerado por scripts/fetch-reels.mjs ou scripts/import-reels.mjs). */
export interface Reel {
  id: string
  permalink: string
  caption: string
  video: string
  poster: string
}

const reels = data as Reel[]

/** Legenda pro site: sem hashtags (no card elas só fazem ruído), linhas juntas, espaços simples. */
function cleanCaption(text: string) {
  return text
    .replace(/#[\p{L}\p{N}_]+/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

const PROFILE = 'https://instagram.com/cloudbymcn'

const CARD_W = 252 // reel central no desktop; 9:16 dá 448px de altura
const CARD_H = Math.round((CARD_W * 16) / 9)
const VISIBLE = 3 // slots de cada lado do central
const DRIFT_PX_S = 18 // deslize contínuo (~14s por reel)
const HOVER_FACTOR = 0.3
const RESUME_MS = 1800
const FRICTION = 4
const MAX_VEL = 10
const SPRING_K = 90

const clock = () => performance.now()
const mod = (a: number, n: number) => ((a % n) + n) % n
const clamp = (v: number, max: number) => Math.max(-max, Math.min(max, v))
const unit01 = (v: number) => Math.max(0, Math.min(1, v))

/** Posição, escala e opacidade de um slot a `d` passos do centro (fracionário durante o deslize). */
function layout(d: number) {
  const a = Math.abs(d)
  const s1 = Math.min(a, 1)
  const s2 = unit01(a - 1)
  const s3 = unit01(a - 2)
  // vizinhos encolhem e somem aos poucos; o vão entre as bordas fica ~20px em qualquer escala
  const scale = 1 - 0.2 * s1 - 0.14 * s2 - 0.1 * s3
  const x = Math.sign(d) * CARD_W * (0.98 * s1 + 0.81 * s2 + 0.69 * s3)
  const opacity = 1 - 0.45 * s1 - 0.25 * s2 - 0.3 * s3
  return { x, scale, opacity }
}

type Mode = 'drift' | 'coast' | 'snap' | 'drag'

interface Motion {
  pos: number // posição contínua em slots; o central é round(pos)
  vel: number
  mode: Mode
  target: number
  gain: number
  lastInput: number
  hover: boolean
  focus: boolean
}

/** Glifo do Instagram com o gradiente oficial da marca (radial a partir do canto inferior esquerdo). */
function InstagramIcon() {
  const id = `ig-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}` // ids do useId trazem ":" ou "«»"
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <radialGradient id={id} cx="0.3" cy="1.07" r="1.3" gradientUnits="objectBoundingBox">
          <stop offset="0" stopColor="#feda75" />
          <stop offset="0.25" stopColor="#fa7e1e" />
          <stop offset="0.5" stopColor="#d62976" />
          <stop offset="0.75" stopColor="#962fbf" />
          <stop offset="1" stopColor="#4f5bd5" />
        </radialGradient>
      </defs>
      <path d={siInstagram.path} fill={`url(#${id})`} />
    </svg>
  )
}

/** Poster sempre; o vídeo só no reel ativo, com movimento liberado e o card na tela. */
function ReelMedia({ reel, play }: { reel: Reel; play: boolean }) {
  const ref = useRef<HTMLVideoElement>(null)
  const [failed, setFailed] = useState(false)
  const video = play && !failed

  useEffect(() => {
    const el = ref.current
    if (!el) return
    // atributo além da propriedade: o Safari iOS só deixa dar autoplay com `muted` no HTML
    el.muted = true
    el.setAttribute('muted', '')
    el.play().catch(() => {})
    return () => el.pause()
  }, [video])

  const cls = 'reels-media'
  return (
    <>
      <img src={reel.poster} alt="" draggable={false} loading="lazy" decoding="async" className={cls} />
      {video && (
        <video
          ref={ref}
          src={reel.video}
          poster={reel.poster}
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          disablePictureInPicture
          draggable={false}
          onError={() => setFailed(true)}
          aria-hidden="true"
          className={cls}
        />
      )}
    </>
  )
}

/** Selo "abrir no instagram" que aparece sobre o reel ativo. */
function OpenHint() {
  return (
    <span className="lc reels-hint">
      abrir
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
        <path d="M7 17 17 7M9 7h8v8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

const tileCls = 'reels-tile'

function label(reel: Reel, i: number, n: number) {
  const text = cleanCaption(reel.caption.split('\n')[0]).slice(0, 90)
  return `Reel ${i + 1} de ${n}${text ? `: ${text}` : ''} (abre no Instagram)`
}

/**
 * Desktop: faixa de reels 9:16 com o central em destaque e os vizinhos menores e esmaecidos. Mesmo motor
 * do ConcaveCarousel: posição contínua em rAF que desliza devagar (desacelera no hover), arraste com
 * arremesso, trackpad horizontal com inércia e snap por mola; setas e teclado. Slots virtuais (k inteiro,
 * reel = k mod n): o loop não tem emenda mesmo com 2 ou 3 reels.
 */
function Strip({ play, onCenter }: { play: boolean; onCenter: (i: number) => void }) {
  const n = reels.length
  const [reduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [center, setCenter] = useState(0) // slot central (inteiro, sem módulo)
  const [dragging, setDragging] = useState(false)
  const stage = useRef<HTMLDivElement>(null)
  const slots = useRef(new Map<number, HTMLAnchorElement>())
  const motion = useRef<Motion>({
    pos: 0,
    vel: 0,
    mode: 'drift',
    target: 0,
    gain: 0,
    lastInput: 0,
    hover: false,
    focus: false,
  })
  const press = useRef<{
    x: number
    id: number
    moved: boolean
    startPos: number
    lastX: number
    lastT: number
    vx: number
  } | null>(null)
  const apply = useRef<() => void>(() => {})
  const kick = useRef<() => void>(() => {})
  const unit = CARD_W

  useLayoutEffect(() => {
    apply.current = () => {
      const pos = motion.current.pos
      for (const [k, el] of slots.current) {
        const d = k - pos
        const { x, scale, opacity } = layout(d)
        el.style.transform = `translateX(-50%) translateX(${x.toFixed(1)}px) scale(${scale.toFixed(4)})`
        el.style.opacity = Math.max(0, opacity).toFixed(3)
        el.style.zIndex = String(100 - Math.round(Math.abs(d) * 10))
      }
    }
    apply.current()
  })

  useEffect(() => {
    onCenter(mod(center, n))
  }, [center, n, onCenter])

  useEffect(() => {
    const el = stage.current
    if (!el) return
    const m = motion.current
    const drift = DRIFT_PX_S / unit
    let raf = 0
    let last = 0
    let inView = false
    let shown = Math.round(m.pos)

    const still = () => m.mode === 'drift' && (reduced || n < 2) && m.gain < 1e-4

    const frame = (now: number) => {
      raf = 0
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0
      last = now
      const before = m.pos

      if (m.mode === 'snap') {
        if (reduced) {
          m.pos = m.target
          m.vel = 0
        } else {
          m.vel += (SPRING_K * (m.target - m.pos) - 2 * Math.sqrt(SPRING_K) * m.vel) * dt
          m.pos += m.vel * dt
        }
        if (Math.abs(m.target - m.pos) < 5e-4 && Math.abs(m.vel) < 0.01) {
          m.pos = m.target
          m.vel = 0
          m.mode = 'drift'
          m.lastInput = now
        }
      } else if (m.mode === 'coast') {
        m.pos += m.vel * dt
        m.vel *= Math.exp(-FRICTION * dt)
        if (Math.abs(m.vel) < 1.2 && now - m.lastInput > 140) {
          m.mode = 'snap'
          m.target = Math.round(m.pos + m.vel / FRICTION)
        }
      } else if (m.mode === 'drift') {
        const stop = reduced || m.focus || n < 2 || now - m.lastInput < RESUME_MS
        const want = stop ? 0 : m.hover ? HOVER_FACTOR : 1
        const tau = want > m.gain ? 1.2 : 0.35
        m.gain += (want - m.gain) * (1 - Math.exp(-dt / tau))
        if (m.gain < 1e-4 && want === 0) m.gain = 0
        m.pos += drift * m.gain * dt
      }

      if (m.pos !== before) apply.current()
      const c = Math.round(m.pos)
      if (c !== shown) {
        shown = c
        setCenter(c)
      }
      if (inView && !still()) raf = requestAnimationFrame(frame)
      else last = 0
    }

    kick.current = () => {
      if (!raf && inView) raf = requestAnimationFrame(frame)
    }

    const io = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting
      if (inView) kick.current()
    })
    io.observe(el)

    // só gesto horizontal (trackpad ou shift+roda): a rolagem vertical continua sendo da página
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || n < 2) return
      const horizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY)
      if (!horizontal && !e.shiftKey) return
      const scale = e.deltaMode === 1 ? 33 : 1
      const delta = (horizontal ? e.deltaX : e.deltaY) * scale
      if (!delta) return
      e.preventDefault()
      e.stopPropagation() // o Lenis escuta no window
      m.lastInput = performance.now()
      if (reduced) {
        if (m.mode !== 'snap' && Math.abs(delta) > 20) {
          m.target = Math.round(m.pos) + Math.sign(delta)
          m.mode = 'snap'
        }
      } else {
        if (m.mode !== 'coast' && m.mode !== 'snap') m.vel = 0
        m.mode = 'coast'
        m.vel = clamp(m.vel + (delta / unit) * FRICTION, MAX_VEL)
      }
      kick.current()
    }
    el.addEventListener('wheel', onWheel, { passive: false })

    return () => {
      io.disconnect()
      el.removeEventListener('wheel', onWheel)
      cancelAnimationFrame(raf)
      kick.current = () => {}
    }
  }, [n, unit, reduced])

  function go(delta: number) {
    const m = motion.current
    const base = m.mode === 'snap' ? m.target : Math.round(m.pos)
    m.target = base + delta
    m.mode = 'snap'
    m.lastInput = clock()
    kick.current()
  }

  function onPointerDown(e: React.PointerEvent) {
    if (e.button > 0 || n < 2) return
    const now = clock()
    press.current = {
      x: e.clientX,
      id: e.pointerId,
      moved: false,
      startPos: 0,
      lastX: e.clientX,
      lastT: now,
      vx: 0,
    }
    motion.current.lastInput = now
  }

  function onPointerMove(e: React.PointerEvent) {
    const p = press.current
    if (!p || p.id !== e.pointerId) return
    const dx = e.clientX - p.x
    if (!p.moved && Math.abs(dx) < 6) return
    const m = motion.current
    const now = clock()
    if (!p.moved) {
      p.moved = true
      p.startPos = m.pos
      p.x = e.clientX
      setDragging(true)
      try {
        ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
      } catch {
        // ponteiro já liberado: segue sem captura
      }
    }
    const dt = now - p.lastT
    if (dt > 0) p.vx = p.vx * 0.6 + ((e.clientX - p.lastX) / dt) * 1000 * 0.4
    p.lastX = e.clientX
    p.lastT = now
    m.mode = 'drag'
    m.vel = 0
    m.pos = p.startPos - (e.clientX - p.x) / unit
    m.lastInput = now
    apply.current()
    kick.current()
  }

  function onPointerUp(e: React.PointerEvent) {
    const p = press.current
    if (!p || p.id !== e.pointerId) return
    if (p.moved) {
      const m = motion.current
      const flick = clock() - p.lastT < 80 && !reduced ? -p.vx / unit : 0
      m.vel = clamp(flick, MAX_VEL)
      m.mode = 'coast'
      m.lastInput = 0
      setDragging(false)
      kick.current()
    }
    window.setTimeout(() => (press.current = null), 0)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      go(1)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      go(-1)
    }
  }

  function setHover(v: boolean) {
    motion.current.hover = v
    kick.current()
  }

  const ks: number[] = []
  // um slot a mais de cada lado cobre a posição fracionária do deslize; reel único fica sozinho
  const side = n > 1 ? VISIBLE + 1 : 0
  for (let k = center - side; k <= center + side; k++) ks.push(k)
  const active = mod(center, n)
  const pad = (v: number) => String(v).padStart(2, '0')

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={(e) => {
        motion.current.focus = e.target.matches(':focus-visible')
        kick.current()
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          motion.current.focus = false
          kick.current()
        }
      }}
    >
      <div
        ref={stage}
        role="region"
        aria-roledescription="carrossel"
        aria-label="Reels do Instagram @cloudbymcn. Use as setas do teclado para navegar"
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClickCapture={(e) => {
          if (press.current?.moved) {
            e.preventDefault()
            e.stopPropagation()
          }
        }}
        className="reels-stage"
        style={{
          height: CARD_H + 72, // folga embaixo pra sombra do central não cortar
          touchAction: 'pan-y',
          cursor: n > 1 ? (dragging ? 'grabbing' : 'grab') : undefined,
        }}
      >
        {ks.map((k) => {
          const i = mod(k, n)
          const reel = reels[i]
          const isCenter = k === center
          return (
            <a
              key={k}
              ref={(node) => {
                if (node) slots.current.set(k, node)
                else slots.current.delete(k)
              }}
              href={reel.permalink}
              target="_blank"
              rel="noopener noreferrer"
              draggable={false}
              tabIndex={isCenter ? 0 : -1}
              aria-hidden={!isCenter}
              aria-label={label(reel, i, n)}
              onClick={(e) => {
                // vizinho: traz pro centro em vez de abrir
                if (!isCenter) {
                  e.preventDefault()
                  go(k - center)
                }
              }}
              className={`${tileCls} reels-slot`}
              style={{ width: CARD_W }}
            >
              <ReelMedia reel={reel} play={play && isCenter} />
              {isCenter && <OpenHint />}
            </a>
          )
        })}
      </div>

      {n > 1 && (
        <div className="reels-controls">
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Reel anterior"
            className="glass reels-arrow"
          >
            <span aria-hidden="true">‹</span>
          </button>
          <p className="lc reels-count">
            <span>{pad(active + 1)}</span> / {pad(n)}
          </p>
          <button type="button" onClick={() => go(1)} aria-label="Próximo reel" className="glass reels-arrow">
            <span aria-hidden="true">›</span>
          </button>
        </div>
      )}
    </div>
  )
}

/** Mobile: um reel por tela com scroll-snap nativo (swipe do próprio navegador); o central toca. */
function Swipe({ play, onCenter }: { play: boolean; onCenter: (i: number) => void }) {
  const n = reels.length
  const [active, setActive] = useState(0)
  const scroller = useRef<HTMLDivElement>(null)

  useEffect(() => {
    onCenter(active)
  }, [active, onCenter])

  useEffect(() => {
    const el = scroller.current
    if (!el) return
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const first = el.firstElementChild as HTMLElement | null
        const second = first?.nextElementSibling as HTMLElement | null
        if (!first) return
        const step = second ? second.offsetLeft - first.offsetLeft : first.offsetWidth
        setActive(Math.max(0, Math.min(n - 1, Math.round(el.scrollLeft / step))))
      })
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      el.removeEventListener('scroll', onScroll)
    }
  }, [n])

  return (
    <div
      ref={scroller}
      role="region"
      aria-roledescription="carrossel"
      aria-label="Reels do Instagram @cloudbymcn"
      className="reels-swipe"
    >
      {reels.map((reel, i) => {
        const isActive = i === active
        return (
          <a
            key={reel.id}
            href={reel.permalink}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label(reel, i, n)}
            onClick={(e) => {
              if (!isActive) {
                e.preventDefault()
                e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
              }
            }}
            className={isActive ? tileCls : `${tileCls} is-dim`}
          >
            <ReelMedia reel={reel} play={play && isActive} />
          </a>
        )
      })}
    </div>
  )
}

/**
 * Card do Instagram no fim da home (chunk carregado perto da viewport, ver Reels.tsx): cabeçalho com
 * @cloudbymcn e "seguir", reels 9:16 mudos em loop, só o central toca e só com o card na tela.
 * Reduced-motion, economia de dados e 2g ficam nos posters. Clicar no central abre o reel no Instagram.
 */
export default function ReelsCard() {
  const [motionOk] = useState(motionAllowed)
  const [compact, setCompact] = useState(() => window.matchMedia('(max-width: 767px)').matches)
  const [inView, setInView] = useState(false)
  const [current, setCurrent] = useState(0)
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const on = () => setCompact(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  useEffect(() => {
    const el = root.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.25 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  if (reels.length === 0) return null
  const play = motionOk && inView
  const caption = cleanCaption(reels[current]?.caption ?? '')

  return (
    <section aria-labelledby="reels-title" className="reels-section">
      <div className="reels-wrap">
        <Reveal>
          <div ref={root} className="glass reels-shell">
            <div className="reels-inner">
              <div className="reels-head">
                <a href={PROFILE} target="_blank" rel="noopener noreferrer" className="reels-profile">
                  <span className="reels-avatar">
                    <InstagramIcon />
                  </span>
                  <span>
                    <span id="reels-title" className="reels-handle">
                      @cloudbymcn
                    </span>
                    <span className="lc reels-sub">reels no instagram</span>
                  </span>
                </a>
                <Magnet>
                  <a
                    href={PROFILE}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Seguir @cloudbymcn no Instagram"
                    className="lc reels-follow"
                  >
                    seguir
                  </a>
                </Magnet>
              </div>

              {compact ? (
                <Swipe play={play} onCenter={setCurrent} />
              ) : (
                <Strip play={play} onCenter={setCurrent} />
              )}

              <p className="reels-caption">{caption}</p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
