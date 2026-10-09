import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { Link } from 'react-router'

export interface CarouselItem {
  key: string
  href: string
  image?: string
  /** 'contain' pra diagrama SVG (sem print ainda), 'cover' pra screenshot */
  fit: 'cover' | 'contain'
  title: string
  subtitle: string
}

const STEP_DEG = 12 // rotação por passo nas laterais; o palco é de ponta a ponta (mx-[calc(50%-50vw)])
const VISIBLE = 3 // cartões de cada lado do central (no 4º passo ele já viria ~2x maior)
const AUTOPLAY_MS = 6000
const WHEEL_THRESHOLD = 40

/** Distância circular assinada de i até o centro (o carrossel dá a volta). */
function ringOffset(i: number, center: number, n: number) {
  let d = i - center
  d -= Math.round(d / n) * n
  return d
}

const reducedQuery = '(prefers-reduced-motion: reduce)'

/**
 * Concave Carousel (SPEC §0-bis, inspirado no preview do React Bits Pro): parede de galeria curvada
 * em volta do observador. Cada cartão fica num cilindro com o observador dentro: ângulo φ = passo × 12°,
 * translateX(R·sinφ) translateZ(R·(1−cosφ)) rotateY(−φ); as pontas vêm pra frente e giram pra dentro.
 * CSS 3D puro (sem three), com arraste, wheel/trackpad horizontal, teclado, snap e autoplay.
 */
export function ConcaveCarousel({ items, label }: { items: CarouselItem[]; label: string }) {
  const n = items.length
  const [index, setIndex] = useState(0)
  const [drag, setDrag] = useState(0) // deslocamento fracionário durante o arraste (em passos)
  const [dragging, setDragging] = useState(false)
  const [paused, setPaused] = useState(false)
  const [userPaused, setUserPaused] = useState(false)
  const [reduced] = useState(() => window.matchMedia(reducedQuery).matches)
  const [compact, setCompact] = useState(() => window.matchMedia('(max-width: 767px)').matches)
  const stage = useRef<HTMLDivElement>(null)
  const press = useRef<{ x: number; id: number; moved: boolean } | null>(null)
  const wheel = useRef({ acc: 0, lock: 0 })

  const go = useCallback((delta: number) => setIndex((i) => (((i + delta) % n) + n) % n), [n])

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const on = () => setCompact(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  // autoplay lento; para no hover/foco/arraste, com reduced-motion ou pausado pelo usuário
  useEffect(() => {
    if (reduced || paused || userPaused || dragging || n < 2) return
    const t = window.setTimeout(() => go(1), AUTOPLAY_MS)
    return () => window.clearTimeout(t)
  }, [index, reduced, paused, userPaused, dragging, n, go])

  // wheel/trackpad horizontal (deltaX ou shift+wheel); o vertical segue rolando a página
  useEffect(() => {
    const el = stage.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      const dx = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.shiftKey ? e.deltaY : 0
      if (!dx) return
      e.preventDefault()
      const now = performance.now()
      if (now < wheel.current.lock) return
      wheel.current.acc += dx
      if (Math.abs(wheel.current.acc) > WHEEL_THRESHOLD) {
        go(wheel.current.acc > 0 ? 1 : -1)
        wheel.current = { acc: 0, lock: now + 450 }
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [go])

  const cardW = compact ? 220 : 360
  const gap = compact ? 12 : 18
  const stepRad = (STEP_DEG * Math.PI) / 180
  const radius = (cardW + gap) / stepRad

  function onPointerDown(e: React.PointerEvent) {
    if (e.button > 0) return
    press.current = { x: e.clientX, id: e.pointerId, moved: false }
  }

  function onPointerMove(e: React.PointerEvent) {
    const p = press.current
    if (!p || p.id !== e.pointerId) return
    const dx = e.clientX - p.x
    if (!p.moved && Math.abs(dx) < 6) return
    if (!p.moved) {
      p.moved = true
      setDragging(true)
      try {
        ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
      } catch {
        // ponteiro já liberado: segue sem captura
      }
    }
    setDrag(-dx / (cardW + gap))
  }

  function onPointerUp(e: React.PointerEvent) {
    const p = press.current
    if (!p || p.id !== e.pointerId) return
    if (p.moved) {
      go(Math.round(drag))
      setDrag(0)
      setDragging(false)
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

  const center = index + drag
  const visible = compact ? 2 : VISIBLE
  const pad = (k: number) => String(k).padStart(2, '0')
  const current = items[index]

  return (
    <div
      role="region"
      aria-roledescription="carrossel"
      aria-label={label}
      className="relative select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
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
        aria-label="Use as setas do teclado para navegar"
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
            const d = ringOffset(i, center, n)
            if (Math.abs(d) > visible + 0.5) return null
            const phi = d * stepRad
            const isCenter = Math.round(d) === 0
            const fade = Math.max(0, 1 - Math.max(0, Math.abs(d) - (visible - 1)) * 0.9)
            const transform = `translateX(-50%) translateX(${(radius * Math.sin(phi)).toFixed(1)}px) translateZ(${(radius * (1 - Math.cos(phi))).toFixed(1)}px) rotateY(${(-d * STEP_DEG).toFixed(2)}deg)`
            return (
              <div
                key={item.key}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} de ${n}: ${item.title}`}
                aria-hidden={!isCenter}
                className="concave-card absolute left-1/2"
                style={{
                  width: cardW,
                  top: compact ? 28 : 56,
                  transform,
                  opacity: fade,
                  zIndex: 100 - Math.round(Math.abs(d) * 10),
                  transition: dragging || reduced ? 'none' : undefined,
                }}
              >
                <Link
                  to={item.href}
                  tabIndex={isCenter ? 0 : -1}
                  draggable={false}
                  onClick={(e) => {
                    if (!isCenter) {
                      e.preventDefault()
                      go(Math.round(d))
                    }
                  }}
                  className="block"
                >
                  <div className="aspect-[16/10] overflow-hidden rounded-2xl border border-line bg-white shadow-[0_12px_40px_rgba(0,0,0,0.10)]">
                    {item.image && (
                      <img
                        src={item.image}
                        alt=""
                        draggable={false}
                        loading="lazy"
                        decoding="async"
                        className={`h-full w-full ${item.fit === 'cover' ? 'object-cover' : 'object-contain p-5'}`}
                      />
                    )}
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
        <p className="truncate font-display text-xl font-semibold tracking-[-0.02em] text-ink">
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
        <p className="min-w-[5.5rem] text-center font-mono text-sm tabular-nums text-ink-2">
          <span className="text-ink">{pad(index + 1)}</span> / {pad(n)}
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
