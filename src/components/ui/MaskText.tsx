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
    // texto real pra leitor de tela num sr-only (aria-label em <p>/<span> sem role é proibido)
    <Tag className={className}>
      <span className="sr-only">{lines.join(' ')}</span>
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
