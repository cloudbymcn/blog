import { lazy, Suspense, useState, useSyncExternalStore } from 'react'

const Lanyard = lazy(() => import('./Lanyard'))

const FRONT = '/lanyard/card-front.png'

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
export function LanyardPlaceholder() {
  const [failed, setFailed] = useState(false)
  return (
    <div className="flex h-full w-full items-start justify-center pt-6" aria-hidden="true">
      <div className="lanyard-sway flex flex-col items-center">
        <div className="h-28 w-3 rounded-sm bg-[#111]" />
        <div className="-mt-1 h-4 w-8 rounded-sm bg-gradient-to-b from-zinc-500 to-zinc-700" />
        {failed ? (
          <div className="mt-1 flex aspect-[2/3] w-56 flex-col justify-end rounded-2xl border border-line bg-[#f4f4f5] p-5 text-left text-zinc-900 shadow-2xl">
            <span className="font-display text-lg font-bold leading-tight">MATHEUS NASCIMENTO</span>
            <span className="font-mono text-xs text-zinc-600">Cloud Engineer · AWS</span>
          </div>
        ) : (
          <img
            src={FRONT}
            alt=""
            width={1024}
            height={1440}
            decoding="async"
            onError={() => setFailed(true)}
            className="mt-1 w-56 rounded-2xl shadow-2xl"
          />
        )}
      </div>
    </div>
  )
}

export function LanyardStage() {
  const reduced = useSyncExternalStore(subscribeReducedMotion, prefersReducedMotion, () => true)
  const [lowEnd] = useState(isLowEnd)

  return (
    <div className="relative h-full min-h-[520px] w-full">
      {/* absolute: o canvas do Lanyard se redimensiona pelo container; com altura auto ele cresce em loop */}
      <div className="absolute inset-0">
        {reduced || lowEnd ? (
          <LanyardPlaceholder />
        ) : (
          <Suspense fallback={<LanyardPlaceholder />}>
            <Lanyard
              frontImage={FRONT}
              backImage="/lanyard/card-back.png"
              strapImage="/lanyard/strap.png"
              imageFit="cover"
              cardColor="#0e0e10"
              orientation="portrait"
              finish="glossy"
              cornerRadius={0.35}
              size={0.62}
              anchor="center"
              strapLength={0.45}
              strapColor="#111111"
              strapWidth={0.65}
              metal="graphite"
              gravity={1}
              damping={0.5}
              elasticity={0.5}
              breeze={0.5}
              interactive
              intro
            />
          </Suspense>
        )}
      </div>
    </div>
  )
}
