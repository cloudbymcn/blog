import { useEffect, useRef, useState } from 'react'

/** Count-up com easing expo-out quando entra na viewport; `delay` alinha com a entrada do bloco. */
export function CountUp({
  to,
  duration = 1600,
  delay = 0,
}: {
  to: number
  duration?: number
  delay?: number
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const [reduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [value, setValue] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el || reduced) return
    let raf = 0
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      io.disconnect()
      const start = performance.now() + delay
      const tick = (now: number) => {
        const t = Math.max(0, Math.min(1, (now - start) / duration))
        setValue(Math.round(to * (t === 1 ? 1 : 1 - Math.pow(2, -10 * t))))
        if (t < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    })
    io.observe(el)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [to, duration, delay, reduced])

  return (
    <span ref={ref} className="tabular-nums">
      {reduced ? to : value}
    </span>
  )
}
