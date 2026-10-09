import { lazy, Suspense, useState, useSyncExternalStore } from 'react'
import { LANYARD_DEFAULTS, type LanyardSettings } from './settings'

const Lanyard = lazy(() => import('./Lanyard'))

// temporário até a Lente entregar o card-front claro (SPEC §0-bis): foto P&B sobre branco
const FRONT = '/lanyard/card-front-temp.webp'

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

export function LanyardPlaceholder({ anchor = 'center' }: { anchor?: Anchor }) {
  const [failed, setFailed] = useState(false)
  return (
    <div
      className="absolute top-0 flex h-full -translate-x-1/2 items-start justify-center pt-6"
      style={{ left: ANCHOR_X[anchor] }}
      aria-hidden="true"
    >
      <div className="lanyard-sway flex flex-col items-center">
        <div className="h-28 w-3 rounded-sm bg-[#111]" />
        <div className="-mt-1 h-4 w-8 rounded-sm bg-gradient-to-b from-[#e5e5ea] to-[#a1a1a6]" />
        {failed ? (
          <div className="mt-1 flex aspect-[2/3] w-56 flex-col justify-end rounded-2xl border border-line bg-white p-5 text-left text-ink shadow-2xl">
            <span className="font-display text-lg font-semibold leading-tight">Matheus Nascimento</span>
            <span className="font-mono text-xs text-ink-2">@cloudbymcn</span>
          </div>
        ) : (
          <img
            src={FRONT}
            alt=""
            width={1024}
            height={1440}
            decoding="async"
            onError={() => setFailed(true)}
            className="mt-1 w-56 rounded-2xl border border-line bg-white shadow-2xl"
          />
        )}
      </div>
    </div>
  )
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
  const { plainBand, ...look } = settings

  return (
    <div className="relative h-full w-full">
      {/* absolute: o canvas do Lanyard se redimensiona pelo container; com altura auto ele cresce em loop */}
      <div className={`absolute inset-0 ${passThrough ? 'pointer-events-none' : ''}`}>
        {reduced || lowEnd ? (
          <LanyardPlaceholder anchor={anchor} />
        ) : (
          <Suspense fallback={<LanyardPlaceholder anchor={anchor} />}>
            <Lanyard
              {...look}
              frontImage={FRONT}
              backImage="/lanyard/card-back.png"
              strapImage={plainBand ? undefined : '/lanyard/strap.png'}
              imageFit="cover"
              orientation="portrait"
              anchor={anchor}
              passThrough={passThrough}
            />
          </Suspense>
        )}
      </div>
    </div>
  )
}
