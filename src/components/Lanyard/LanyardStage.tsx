import { lazy, Suspense, useEffect, useState, useSyncExternalStore } from 'react'
import { whenIdle } from '../../lib/immersive'
import { LANYARD_DEFAULTS, type LanyardSettings } from './settings'

const Lanyard = lazy(() => import('./Lanyard'))

// cartão v3 da Lente (SPEC §0-bis): foto, logo e @cloudbymcn sobre branco.
// WebP derivados do card-front.png (826 KB): textura do 3D em 1024px e placeholder/LCP em 480px.
const FRONT = '/lanyard/card-front.webp'
const FRONT_SMALL = '/lanyard/card-front-480.webp'

const reducedMotionQuery = '(prefers-reduced-motion: reduce)'

function subscribeReducedMotion(cb: () => void) {
  const mq = window.matchMedia(reducedMotionQuery)
  mq.addEventListener('change', cb)
  return () => mq.removeEventListener('change', cb)
}

function prefersReducedMotion() {
  return window.matchMedia(reducedMotionQuery).matches
}

/** GPU fraca (SPEC §2): mobile com <= 4 núcleos, ou sem WebGL. */
function isLowEnd(): boolean {
  const mobile = window.matchMedia('(pointer: coarse)').matches
  if (mobile && (navigator.hardwareConcurrency ?? 8) <= 4) return true
  try {
    const c = document.createElement('canvas')
    return !(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return true
  }
}

/** Cartão estático com balanço CSS. Usado como fallback do Suspense e em reduced-motion/GPU fraca. */
type Anchor = 'left' | 'center' | 'right'

// mesmas posições do Lanyard (ANCHORS), pro placeholder pender do mesmo ponto
const ANCHOR_X: Record<Anchor, string> = { left: '27%', center: '50%', right: '73%' }

/**
 * Mesmo enquadramento do Lanyard: topo do cartão em mix(0.12, 0.42, strapLength) da altura
 * e altura do cartão = size (frações do container), pra troca placeholder → 3D não pular.
 */
export function LanyardPlaceholder({
  anchor = 'center',
  size = LANYARD_DEFAULTS.size,
  strapLength = LANYARD_DEFAULTS.strapLength,
  still = false,
}: {
  anchor?: Anchor
  size?: number
  strapLength?: number
  /** parado na pose de repouso (o 3D vai assumir daqui): sem o balanço CSS, pra a troca não pular */
  still?: boolean
}) {
  const [failed, setFailed] = useState(false)
  const cardTop = 0.12 + (0.42 - 0.12) * strapLength
  return (
    <div
      className="absolute top-0 flex h-full -translate-x-1/2 items-start justify-center"
      style={{ left: ANCHOR_X[anchor] }}
      aria-hidden="true"
    >
      <div className={`${still ? '' : 'lanyard-sway '}flex h-full flex-col items-center`}>
        <div
          className="w-3 shrink-0 rounded-sm bg-[#111]"
          style={{ height: `calc(${cardTop * 100}% - 1rem)` }}
        />
        <div className="-mt-1 h-4 w-8 rounded-sm bg-gradient-to-b from-[#e5e5ea] to-[#a1a1a6]" />
        {failed ? (
          <div
            style={{ height: `${size * 100}%` }}
            className="mt-1 flex aspect-[2/3] flex-col justify-end rounded-2xl border border-line bg-white p-5 text-left text-ink shadow-2xl"
          >
            <span className="font-display text-lg font-semibold leading-tight">Matheus Nascimento</span>
            <span className="font-mono text-xs text-ink-2">@cloudbymcn</span>
          </div>
        ) : (
          <img
            src={FRONT_SMALL}
            fetchPriority="high"
            alt=""
            width={480}
            height={675}
            decoding="async"
            onError={() => setFailed(true)}
            style={{ height: `${size * 100}%` }}
            className="mt-1 w-auto rounded-2xl border border-line bg-white shadow-2xl"
          />
        )}
      </div>
    </div>
  )
}

const desktopPointer = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches

/**
 * Quando montar o crachá 3D (three.js ~560 KB): nunca antes do LCP.
 * Desktop com mouse: logo depois do load + idle curto (o placeholder fica até o 3D desenhar o primeiro
 * frame, então não há pulo). Toque: só na primeira interação (carregar three num celular no boot
 * derruba TBT/LCP).
 */
function useDeferredStart() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    if (desktopPointer()) return whenIdle(() => setReady(true))
    const events = ['pointerdown', 'touchstart', 'scroll', 'keydown'] as const
    const go = () => {
      events.forEach((e) => window.removeEventListener(e, go))
      setReady(true)
    }
    events.forEach((e) => window.addEventListener(e, go, { once: true, passive: true }))
    return () => events.forEach((e) => window.removeEventListener(e, go))
  }, [])
  return ready
}

/**
 * passThrough: canvas cobre a área inteira (inclusive por cima do texto) e só o cartão captura ponteiro.
 * anchor: de onde o strap pende ('right' no desktop, com o texto à esquerda).
 * settings: ajustes ao vivo vindos do <LanyardControls> (padrão em LANYARD_DEFAULTS).
 */
export function LanyardStage({
  anchor = 'center',
  passThrough = false,
  settings = LANYARD_DEFAULTS,
}: {
  anchor?: Anchor
  passThrough?: boolean
  settings?: LanyardSettings
}) {
  const reduced = useSyncExternalStore(subscribeReducedMotion, prefersReducedMotion, () => true)
  const [lowEnd] = useState(isLowEnd)
  const ready = useDeferredStart()
  const [desktop] = useState(desktopPointer)
  // 'wait': placeholder por cima, canvas invisível; 'fade': crossfade 250ms; 'done': só o 3D; 'gave-up': só o placeholder
  const [phase, setPhase] = useState<'wait' | 'fade' | 'done' | 'gave-up'>('wait')
  const { plainBand, ...look } = settings
  const with3d = !reduced && !lowEnd && ready && phase !== 'gave-up'

  // 3D que não desenha em 3s (rede lenta, GPU ruim): fica o placeholder, como antes. Conta só tempo com
  // frames de verdade (rAF), pra uma aba aberta em segundo plano não desistir do 3D antes de ser vista.
  useEffect(() => {
    if (!with3d || phase !== 'wait') return
    let raf = 0
    let last = 0
    let shown = 0
    const tick = (now: number) => {
      if (last) shown += Math.min(100, now - last)
      last = now
      if (shown > 3000) setPhase('gave-up')
      else raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [with3d, phase])

  useEffect(() => {
    if (phase !== 'fade') return
    const t = window.setTimeout(() => setPhase('done'), 300)
    return () => window.clearTimeout(t)
  }, [phase])

  const placeholder = (
    <LanyardPlaceholder
      anchor={anchor}
      size={settings.size}
      strapLength={settings.strapLength}
      still={desktop && !reduced && !lowEnd && phase !== 'gave-up'}
    />
  )

  return (
    <div className="relative h-full w-full">
      {/* absolute: o canvas do Lanyard se redimensiona pelo container; com altura auto ele cresce em loop */}
      <div className={`absolute inset-0 ${passThrough ? 'pointer-events-none' : ''}`}>
        {with3d && (
          <div
            className="absolute inset-0 transition-opacity duration-[250ms] ease-out"
            style={{ opacity: phase === 'wait' ? 0 : 1 }}
          >
            <Suspense fallback={null}>
              <Lanyard
                {...look}
                frontImage={FRONT}
                backImage="/lanyard/card-back.png"
                strapImage={plainBand ? undefined : '/lanyard/strap.png'}
                imageFit="cover"
                orientation="portrait"
                anchor={anchor}
                passThrough={passThrough}
                onFirstFrame={() => setPhase((p) => (p === 'wait' ? 'fade' : p))}
              />
            </Suspense>
          </div>
        )}
        {/* o placeholder (imagem LCP) segura a tela até o 3D desenhar o primeiro frame, depois some em 250ms */}
        {phase !== 'done' && (
          <div
            className="absolute inset-0 transition-opacity duration-[250ms] ease-out"
            style={{ opacity: phase === 'fade' ? 0 : 1 }}
          >
            {placeholder}
          </div>
        )}
      </div>
    </div>
  )
}
