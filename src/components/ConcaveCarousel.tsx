import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { Link } from 'react-router'
import type { CoverVideo } from '../lib/content'
import { CoverMedia } from './CoverMedia'

export interface CarouselItem {
  key: string
  href: string
  image?: string
  /** cover animado (webm/mp4/gif); toca só no central e nos vizinhos imediatos */
  video?: CoverVideo
  /** 'contain' pra diagrama SVG (sem print ainda), 'cover' pra screenshot */
  fit: 'cover' | 'contain'
  title: string
  subtitle: string
}

const STEP_DEG = 12 // rotação por passo nas laterais; o palco é de ponta a ponta (mx-[calc(50%-50vw)])
const VISIBLE = 3 // cartões de cada lado do central (no 4º passo ele já viria ~2x maior)
const DRIFT_PX_S = 14 // deslize contínuo, medido no arco
const HOVER_FACTOR = 0.2 // no hover o deslize cai pra 20% (desacelera, não para seco)
const RESUME_MS = 1800 // depois de uma interação o deslize espera isso e volta com easing
const FRICTION = 4 // decaimento da inércia (1/s): sobra vel/FRICTION de percurso
const WHEEL_PX_PER_CARD = 110 // ~1 entalhe de roda = 1 card
const MAX_VEL = 14 // cards/s
const WHEEL_GAP_MS = 220 // pausa que separa um gesto de wheel do próximo
const WHEEL_RELEASE_MS = 1200 // gesto vertical contínuo mais longo que isso devolve a rolagem pra página
const SPRING_K = 90 // mola do snap, criticamente amortecida

/** Distância circular assinada de i até o centro (o carrossel dá a volta); aceita centro fracionário. */
function ringOffset(i: number, center: number, n: number) {
  let d = i - center
  d -= Math.round(d / n) * n
  return d
}

/** Relógio dos handlers (fora do componente: nunca roda no render). */
const clock = () => performance.now()
const mod = (a: number, n: number) => ((a % n) + n) % n
const clamp = (v: number, max: number) => Math.max(-max, Math.min(max, v))

const reducedQuery = '(prefers-reduced-motion: reduce)'

type Mode = 'drift' | 'coast' | 'snap' | 'drag'

interface Motion {
  pos: number // posição contínua em cards; o central é round(pos)
  vel: number // cards/s (inércia de wheel/arraste e mola do snap)
  mode: Mode
  target: number
  gain: number // ganho atual do deslize, 0..1, suavizado
  lastInput: number
  wheelStart: number
  lastWheel: number
  wheelAcc: number // só reduced-motion: passo a passo por limiar
  hover: boolean
  focus: boolean
  userPaused: boolean
}

/**
 * Concave Carousel (SPEC §0-bis, inspirado no preview do React Bits Pro): parede de galeria curvada
 * em volta do observador. Cada cartão fica num cilindro com o observador dentro: ângulo φ = passo × 12°,
 * translateX(R·sinφ) translateZ(R·(1−cosφ)) rotateY(−φ); as pontas vêm pra frente e giram pra dentro.
 * CSS 3D puro (sem three). Posição contínua num loop de requestAnimationFrame: o arco desliza devagar
 * sem parar (desacelera no hover), a roda do mouse/trackpad empurra com inércia e encaixa no card mais
 * próximo; setas, teclado e arraste fazem snap com mola. Reduced-motion: sem deslize nem mola.
 */
export function ConcaveCarousel({ items, label }: { items: CarouselItem[]; label: string }) {
  const n = items.length
  const [center, setCenter] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [paused, setPaused] = useState(false) // hover/foco, só pro aria-live
  const [userPaused, setUserPaused] = useState(false)
  const [reduced] = useState(() => window.matchMedia(reducedQuery).matches)
  const [compact, setCompact] = useState(() => window.matchMedia('(max-width: 767px)').matches)
  const stage = useRef<HTMLDivElement>(null)
  const cards = useRef(new Map<number, HTMLDivElement>())
  const press = useRef<{
    x: number
    id: number
    moved: boolean
    startPos: number
    lastX: number
    lastT: number
    vx: number
  } | null>(null)
  const motion = useRef<Motion>({
    pos: 0,
    vel: 0,
    mode: 'drift',
    target: 0,
    gain: 0,
    lastInput: 0,
    wheelStart: 0,
    lastWheel: 0,
    wheelAcc: 0,
    hover: false,
    focus: false,
    userPaused: false,
  })
  const apply = useRef<() => void>(() => {})
  const kick = useRef<() => void>(() => {})

  const cardW = compact ? 220 : 360
  const gap = compact ? 12 : 18
  const unit = cardW + gap
  const visible = compact ? 2 : VISIBLE

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const on = () => setCompact(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  // posiciona os cartões montados a partir da posição contínua (roda a cada render e a cada frame)
  useLayoutEffect(() => {
    const stepRad = (STEP_DEG * Math.PI) / 180
    const radius = unit / stepRad
    apply.current = () => {
      const pos = motion.current.pos
      for (const [i, el] of cards.current) {
        const d = ringOffset(i, pos, n)
        const shown = Math.abs(d) <= visible + 0.5
        const phi = d * stepRad
        const fade = shown ? Math.max(0, 1 - Math.max(0, Math.abs(d) - (visible - 1)) * 0.9) : 0
        el.style.transform = `translateX(-50%) translateX(${(radius * Math.sin(phi)).toFixed(1)}px) translateZ(${(radius * (1 - Math.cos(phi))).toFixed(1)}px) rotateY(${(-d * STEP_DEG).toFixed(2)}deg)`
        el.style.opacity = fade.toFixed(3)
        el.style.visibility = shown ? '' : 'hidden'
        el.style.zIndex = String(100 - Math.round(Math.abs(d) * 10))
      }
    }
    apply.current()
  })

  useEffect(() => {
    motion.current.userPaused = userPaused
    kick.current()
  }, [userPaused])

  // loop de animação: deslize, inércia, mola; para quando sai da tela ou não há nada pra mexer
  useEffect(() => {
    const el = stage.current
    if (!el || n < 1) return
    const m = motion.current
    const drift = DRIFT_PX_S / unit
    let raf = 0
    let last = 0
    let inView = false
    let shownCenter = mod(Math.round(m.pos), n)

    const settledStill = () => m.mode === 'drift' && (reduced || m.userPaused || n < 2) && m.gain < 1e-4

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
        const still = reduced || m.userPaused || m.focus || n < 2 || now - m.lastInput < RESUME_MS
        const want = still ? 0 : m.hover ? HOVER_FACTOR : 1
        // acelera devagar ao retomar (~1,2s), desacelera rápido mas sem tranco (~0,35s)
        const tau = want > m.gain ? 1.2 : 0.35
        m.gain += (want - m.gain) * (1 - Math.exp(-dt / tau))
        if (m.gain < 1e-4 && want === 0) m.gain = 0
        m.pos += drift * m.gain * dt
      }

      if (m.pos !== before) apply.current()
      const c = mod(Math.round(m.pos), n)
      if (c !== shownCenter) {
        shownCenter = c
        setCenter(c)
      }
      if (inView && !settledStill()) raf = requestAnimationFrame(frame)
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

    // roda sobre os cards: baixo avança, cima volta, com inércia; a página não rola enquanto isso
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.shiftKey || n < 2) return // pinça de zoom / shift: a página trata
      const horizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY)
      const scale = e.deltaMode === 1 ? 33 : e.deltaMode === 2 ? el.clientHeight : 1
      const delta = (horizontal ? e.deltaX : e.deltaY) * scale
      if (!delta) return
      const now = performance.now()
      if (now - m.lastWheel > WHEEL_GAP_MS) m.wheelStart = now
      m.lastWheel = now
      // rolando sem parar por mais de 1,2s: o usuário quer descer a página, deixa passar
      if (!horizontal && now - m.wheelStart > WHEEL_RELEASE_MS) return
      e.preventDefault()
      e.stopPropagation() // o Lenis escuta no window
      m.lastInput = now
      if (reduced) {
        // sem inércia: um passo por gesto, depois de acumular 40px
        if (m.wheelStart === now) m.wheelAcc = 0
        if (Number.isNaN(m.wheelAcc)) return
        m.wheelAcc += delta
        if (Math.abs(m.wheelAcc) < 40) return
        m.target = Math.round(m.pos) + Math.sign(m.wheelAcc)
        m.mode = 'snap'
        m.wheelAcc = NaN
      } else {
        if (m.mode !== 'coast' && m.mode !== 'snap') m.vel = 0
        m.mode = 'coast'
        m.vel = clamp(m.vel + (delta / WHEEL_PX_PER_CARD) * FRICTION, MAX_VEL)
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

  /** Snap relativo: setas/teclado acumulam em cima do alvo atual. */
  function go(delta: number) {
    const m = motion.current
    const base = m.mode === 'snap' ? m.target : Math.round(m.pos)
    m.target = base + delta
    m.mode = 'snap'
    m.lastInput = clock()
    kick.current()
  }

  /** Snap até o cartão i pelo caminho mais curto do anel. */
  function goTo(i: number) {
    const m = motion.current
    const base = Math.round(m.pos)
    m.target = base + ringOffset(i, base, n)
    m.mode = 'snap'
    m.lastInput = clock()
    kick.current()
  }

  function onPointerDown(e: React.PointerEvent) {
    if (e.button > 0) return
    const now = clock()
    press.current = {
      x: e.clientX,
      id: e.pointerId,
      moved: false,
      startPos: motion.current.pos,
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
      // solta com a velocidade do dedo; parado há mais de 80ms = sem arremesso
      const flick = clock() - p.lastT < 80 && !reduced ? -p.vx / unit : 0
      m.vel = clamp(flick, MAX_VEL)
      m.mode = 'coast'
      m.lastInput = 0
      setDragging(false)
      kick.current()
    }
    // o click logo depois de um arraste não navega (ver onClickCapture)
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
    setPaused(v || motion.current.focus)
    kick.current()
  }

  function setFocus(v: boolean) {
    motion.current.focus = v
    setPaused(v || motion.current.hover)
    kick.current()
  }

  const pad = (k: number) => String(k).padStart(2, '0')
  const current = items[center]

  return (
    <div
      role="region"
      aria-roledescription="carrossel"
      aria-label={label}
      className="relative select-none"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      // só foco de teclado congela o deslize; clicar numa seta não deve travar o carrossel
      onFocus={(e) => setFocus(e.target.matches(':focus-visible'))}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocus(false)
      }}
    >
      <div
        ref={stage}
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
        aria-label="Use as setas do teclado ou a roda do mouse para navegar"
        className="concave-stage relative mx-[calc(50%-50vw)] overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ring)]"
        style={
          {
            height: compact ? 250 : 380,
            perspective: '1200px',
            touchAction: 'pan-y',
            cursor: dragging ? 'grabbing' : 'grab',
          } as CSSProperties
        }
      >
        <div className="absolute inset-0" style={{ transformStyle: 'preserve-3d' }}>
          {items.map((item, i) => {
            // monta só a janela em volta do central (+1 pra cobrir a posição fracionária do deslize)
            const rel = ringOffset(i, center, n)
            if (Math.abs(rel) > visible + 1) return null
            const isCenter = rel === 0
            return (
              <div
                key={item.key}
                ref={(node) => {
                  if (node) cards.current.set(i, node)
                  else cards.current.delete(i)
                }}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} de ${n}: ${item.title}`}
                aria-hidden={!isCenter}
                className="concave-card absolute left-1/2"
                style={{ width: cardW, top: compact ? 28 : 56 }}
              >
                <Link
                  to={item.href}
                  tabIndex={isCenter ? 0 : -1}
                  draggable={false}
                  onClick={(e) => {
                    if (!isCenter) {
                      e.preventDefault()
                      goTo(i)
                    }
                  }}
                  className="block"
                >
                  <div className="aspect-[16/10] overflow-hidden rounded-2xl border border-line bg-white shadow-[0_12px_40px_rgba(0,0,0,0.10)]">
                    <CoverMedia
                      poster={item.image}
                      video={item.video}
                      active={Math.abs(rel) <= 1}
                      alt=""
                      className={`h-full w-full ${item.fit === 'cover' ? 'object-cover' : 'object-contain p-5'}`}
                    />
                  </div>
                  {/* reflexo suave no "chão" da galeria */}
                  <div
                    aria-hidden="true"
                    className="concave-reflection pointer-events-none mt-1 aspect-[16/10] overflow-hidden rounded-2xl"
                  >
                    {item.image && (
                      <img
                        src={item.image}
                        alt=""
                        draggable={false}
                        loading="lazy"
                        decoding="async"
                        className={`h-full w-full -scale-y-100 ${item.fit === 'cover' ? 'object-cover' : 'object-contain p-5'}`}
                      />
                    )}
                  </div>
                </Link>
              </div>
            )
          })}
        </div>
      </div>

      <div className="mx-auto mt-2 max-w-xl text-center" aria-live={userPaused || paused ? 'polite' : 'off'}>
        <p className="lc truncate font-display text-xl font-semibold tracking-[-0.02em] text-ink">
          {current?.title}
        </p>
        <p className="mt-1 line-clamp-1 text-[15px] text-ink-2">{current?.subtitle}</p>
      </div>

      <div className="mt-6 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="Projeto anterior"
          className="glass flex size-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-white"
        >
          <span aria-hidden="true" className="text-xl leading-none">
            ‹
          </span>
        </button>
        <p className="lc min-w-[5.5rem] text-center font-mono text-sm tabular-nums text-ink-2">
          <span className="text-ink">{pad(center + 1)}</span> / {pad(n)}
        </p>
        <button
          type="button"
          onClick={() => go(1)}
          aria-label="Próximo projeto"
          className="glass flex size-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-white"
        >
          <span aria-hidden="true" className="text-xl leading-none">
            ›
          </span>
        </button>
        {!reduced && (
          <button
            type="button"
            onClick={() => setUserPaused((v) => !v)}
            aria-label={userPaused ? 'Retomar rotação automática' : 'Pausar rotação automática'}
            aria-pressed={userPaused}
            className="ml-1 flex size-8 items-center justify-center rounded-full text-ink-2 hover:text-ink"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
              {userPaused ? <path d="M8 5v14l11-7z" /> : <path d="M7 5h4v14H7zM13 5h4v14h-4z" />}
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
