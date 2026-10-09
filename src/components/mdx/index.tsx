import type { ComponentProps, ReactNode } from 'react'

/** Componentes disponíveis dentro dos MDX (contrato combinado com o Cartógrafo na nota do time). */

const CALLOUT = {
  info: { border: 'border-accent/40', bg: 'bg-accent/5', label: 'Nota', color: 'text-accent' },
  success: {
    border: 'border-emerald-400/40',
    bg: 'bg-emerald-400/5',
    label: 'Resultado',
    color: 'text-emerald-400',
  },
  warn: { border: 'border-accent-2/40', bg: 'bg-accent-2/5', label: 'Atenção', color: 'text-accent-2' },
  danger: { border: 'border-rose-400/40', bg: 'bg-rose-400/5', label: 'Cuidado', color: 'text-rose-400' },
}

export function Callout({ type = 'info', children }: { type?: keyof typeof CALLOUT; children: ReactNode }) {
  const c = CALLOUT[type] ?? CALLOUT.info
  return (
    <aside className={`not-prose my-6 rounded-xl border ${c.border} ${c.bg} px-5 py-4`}>
      <p className={`font-mono text-[11px] uppercase tracking-[0.18em] ${c.color}`}>{c.label}</p>
      <div className="mdx-inner mt-1 text-ink-2">{children}</div>
    </aside>
  )
}

export function Metrics({ children }: { children: ReactNode }) {
  return <div className="not-prose my-8 grid grid-cols-2 gap-3 md:grid-cols-4">{children}</div>
}

export function Metric({ value, label }: { value: ReactNode; label: ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-bg-2 px-4 py-3">
      <p className="font-display text-2xl font-semibold text-accent">{value}</p>
      <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-ink-3">{label}</p>
    </div>
  )
}

/** Wrapper opcional: os posts usam <Step> solto, então Step não depende de lista. */
export function Steps({ children }: { children: ReactNode }) {
  return <div className="my-8">{children}</div>
}

export function Step({ n, children }: { n: number | string; children: ReactNode }) {
  return (
    <div className="my-8 flex gap-4">
      <span className="not-prose flex size-8 shrink-0 items-center justify-center rounded-full border border-accent/40 font-mono text-sm text-accent">
        {n}
      </span>
      <div className="min-w-0 flex-1 [&>:first-child]:mt-1">{children}</div>
    </div>
  )
}

export function Card({ title, children }: { title?: ReactNode; children: ReactNode }) {
  return (
    <div className="not-prose my-6 rounded-xl border border-line bg-bg-2 px-5 py-4">
      {title && <p className="font-display font-semibold text-ink">{title}</p>}
      <div className="mdx-inner mt-1 text-ink-2">{children}</div>
    </div>
  )
}

export function CostCompare({ children }: { children: ReactNode }) {
  return <div className="not-prose my-8 space-y-3 rounded-xl border border-line bg-bg-2 p-5">{children}</div>
}

export function CostBar({
  label,
  value,
  pct,
  variant = 'new',
}: {
  label: ReactNode
  value: ReactNode
  pct: number
  variant?: 'old' | 'new'
}) {
  const w = Math.max(2, Math.min(100, pct))
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="text-ink-2">{label}</span>
        <span className={variant === 'old' ? 'text-ink-3' : 'font-semibold text-accent'}>{value}</span>
      </div>
      <div className="mt-1.5 h-2 rounded-full bg-white/5">
        <div
          className={`h-full rounded-full ${variant === 'old' ? 'bg-ink-3/60' : 'bg-accent'}`}
          style={{ width: `${w}%` }}
        />
      </div>
    </div>
  )
}

export function Instruction({ title, children }: { title?: ReactNode; children: ReactNode }) {
  return (
    <div className="not-prose my-6 overflow-hidden rounded-xl border border-line">
      <p className="border-b border-line bg-white/[0.03] px-5 py-2 font-mono text-xs text-ink-2">
        {title ?? 'Passo a passo'}
      </p>
      <div className="mdx-inner px-5 py-4 text-ink-2">{children}</div>
    </div>
  )
}

export function Figure({ src, alt, caption }: { src: string; alt: string; caption?: ReactNode }) {
  return (
    <figure className="not-prose my-8">
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className="w-full rounded-xl border border-line bg-bg-2"
      />
      {caption && <figcaption className="mt-2 text-center text-sm text-ink-3">{caption}</figcaption>}
    </figure>
  )
}

/** Tabelas GFM rolam na horizontal no mobile em vez de estourar a página. */
export function Table(props: ComponentProps<'table'>) {
  return (
    <div className="my-6 overflow-x-auto">
      <table {...props} className="my-0" />
    </div>
  )
}
