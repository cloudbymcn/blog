import { lazy, Suspense, useEffect, useRef, useState } from 'react'

// PURE: com __HAS_REELS__ false o rollup descarta o módulo inteiro (e o chunk do card)
const ReelsCard = /* @__PURE__ */ lazy(() => import('./ReelsCard'))

/**
 * Casca do card de reels no fim da home: só um sentinela no bundle principal. O chunk do card (dados,
 * posters, vídeo) baixa quando o sentinela chega a ~800px da viewport. Com `src/content/reels.json`
 * vazio, `__HAS_REELS__` é false no build e a Home nem importa este arquivo.
 */
export function Reels() {
  const ref = useRef<HTMLDivElement>(null)
  const [near, setNear] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || near) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true)
          io.disconnect()
        }
      },
      { rootMargin: '800px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [near])

  return (
    <div ref={ref}>
      {near && (
        <Suspense fallback={null}>
          <ReelsCard />
        </Suspense>
      )}
    </div>
  )
}
