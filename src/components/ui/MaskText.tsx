import type { ElementType } from 'react'

/** Entrada em máscara linha a linha (cada linha sobe de dentro de um overflow-hidden). */
export function MaskText({
  lines,
  as: Tag = 'span',
  className = '',
  delay = 0,
  step = 90,
}: {
  lines: string[]
  as?: ElementType
  className?: string
  delay?: number
  step?: number
}) {
  return (
    <Tag className={className} aria-label={lines.join(' ')}>
      {lines.map((line, i) => (
        <span key={i} aria-hidden="true" className="block overflow-hidden pb-[0.08em]">
          <span className="mask-up block" style={{ animationDelay: `${delay + i * step}ms` }}>
            {line}
          </span>
        </span>
      ))}
    </Tag>
  )
}
