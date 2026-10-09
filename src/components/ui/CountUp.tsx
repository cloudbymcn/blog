import { useEffect, useRef, useState } from 'react'

export function CountUp({ to, duration = 1400 }: { to: number; duration?: number }) {
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
      const start = performance.now()
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration)
        setValue(Math.round(to * (1 - Math.pow(1 - t, 3))))
        if (t < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    })
    io.observe(el)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [to, duration, reduced])

  return (
    <span ref={ref} className="tabular-nums">
      {reduced ? to : value}
    </span>
  )
}
