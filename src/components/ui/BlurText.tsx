import type { ElementType } from 'react'

/** BlurText: palavras entram com blur escalonado (CSS puro). */
export function BlurText({
  text,
  as: Tag = 'span',
  className = '',
  delay = 0,
  step = 80,
}: {
  text: string
  as?: ElementType
  className?: string
  delay?: number
  step?: number
}) {
  const words = text.split(' ')
  return (
    <Tag className={className} aria-label={text}>
      {words.map((w, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="blur-in inline-block"
          style={{ animationDelay: `${delay + i * step}ms` }}
        >
          {w}
          {i < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </Tag>
  )
}
