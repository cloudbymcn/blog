import type { ReactNode } from 'react'

export function Section({
  id,
  eyebrow,
  title,
  children,
  className = '',
}: {
  id: string
  eyebrow: string
  title: string
  children: ReactNode
  className?: string
}) {
  return (
    <section
      id={id}
      data-section={id}
      className={`mx-auto max-w-6xl px-5 py-24 md:px-8 md:py-32 ${className}`}
    >
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">{eyebrow}</p>
      <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-5xl">{title}</h2>
      <div className="mt-12">{children}</div>
    </section>
  )
}
