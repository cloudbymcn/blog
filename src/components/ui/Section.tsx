import type { ReactNode } from 'react'

/** Seção da home. `tint` = fundo #f5f5f7 de ponta a ponta (alternância estilo Apple, SPEC §0-bis). */
export function Section({
  id,
  eyebrow,
  title,
  children,
  tint = false,
  className = '',
}: {
  id: string
  eyebrow: string
  title: string
  children: ReactNode
  tint?: boolean
  className?: string
}) {
  return (
    <section id={id} data-section={id} className={tint ? 'bg-bg-2' : 'bg-bg'}>
      <div className={`mx-auto max-w-6xl px-6 py-28 md:px-8 md:py-40 ${className}`}>
        <p className="text-sm font-medium text-ink-2">{eyebrow}</p>
        <h2 className="mt-2 font-display text-4xl font-semibold tracking-[-0.02em] md:text-6xl">{title}</h2>
        <div className="mt-14 md:mt-20">{children}</div>
      </div>
    </section>
  )
}
