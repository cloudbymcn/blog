import type { ComponentProps, ReactNode } from 'react'

/** Componentes disponíveis dentro dos MDX (contrato combinado com o Cartógrafo na nota do time). */

const CALLOUT = {
  // cores de sistema da Apple (modo claro); o fundo fica neutro, só o rótulo e a barra levam cor
  info: { bar: 'bg-accent', label: 'Nota', color: 'text-link' },
  success: { bar: 'bg-[#1a7f37]', label: 'Resultado', color: 'text-[#1a7f37]' },
  warn: { bar: 'bg-[#c93400]', label: 'Atenção', color: 'text-[#c93400]' },
  danger: { bar: 'bg-[#d70015]', label: 'Cuidado', color: 'text-[#d70015]' },
}

export function Callout({ type = 'info', children }: { type?: keyof typeof CALLOUT; children: ReactNode }) {
  const c = CALLOUT[type] ?? CALLOUT.info
  return (
    <aside className="not-prose relative my-8 overflow-hidden rounded-2xl bg-bg-2 px-6 py-5">
      <span className={`absolute inset-y-0 left-0 w-1 ${c.bar}`} aria-hidden="true" />
      <p className={`lc text-xs font-semibold ${c.color}`}>{c.label}</p>
      <div className="mdx-inner mt-1 text-ink-2">{children}</div>
    </aside>
  )
}

export function Metrics({ children }: { children: ReactNode }) {
  return <div className="not-prose my-8 grid grid-cols-2 gap-3 md:grid-cols-4">{children}</div>
}

export function Metric({ value, label }: { value: ReactNode; label: ReactNode }) {
  return (
    <div className="rounded-2xl bg-bg-2 px-5 py-4">
      <p className="font-display text-3xl font-semibold tracking-[-0.02em] text-ink">{value}</p>
      <p className="lc mt-1 text-xs font-medium text-ink-2">{label}</p>
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
      <span className="not-prose flex size-8 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white">
        {n}
      </span>
      <div className="min-w-0 flex-1 [&>:first-child]:mt-1">{children}</div>
    </div>
  )
}

export function Card({ title, children }: { title?: ReactNode; children: ReactNode }) {
  return (
    <div className="glass not-prose my-8 rounded-3xl px-6 py-5">
      {title && <p className="lc font-display text-lg font-semibold tracking-[-0.02em] text-ink">{title}</p>}
      <div className="mdx-inner mt-1 text-ink-2">{children}</div>
    </div>
  )
}

export function CostCompare({ children }: { children: ReactNode }) {
  return <div className="not-prose my-8 space-y-4 rounded-3xl bg-bg-2 p-6">{children}</div>
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
        <span className="lc text-ink-2">{label}</span>
        <span className={variant === 'old' ? 'text-ink-2' : 'font-semibold text-ink'}>{value}</span>
      </div>
      <div className="mt-1.5 h-2 rounded-full bg-black/[0.06]">
        <div
          className={`h-full rounded-full ${variant === 'old' ? 'bg-ink-3/50' : 'bg-accent'}`}
          style={{ width: `${w}%` }}
        />
      </div>
    </div>
  )
}

export function Instruction({ title, children }: { title?: ReactNode; children: ReactNode }) {
  return (
    <div className="glass not-prose my-8 overflow-hidden rounded-3xl">
      <p className="lc border-b border-line px-6 py-3 text-sm font-semibold text-ink">
        {title ?? 'Passo a passo'}
      </p>
      <div className="mdx-inner px-6 py-5 text-ink-2">{children}</div>
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
        className="w-full rounded-2xl border border-line bg-white"
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
