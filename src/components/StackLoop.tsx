import type { CSSProperties } from 'react'
import { STACK } from '../lib/stack'
import { stagger } from '../lib/motion'
import { StackIcon } from './StackIcon'
import { Reveal } from './ui/Reveal'
import { Section } from './ui/Section'

/**
 * Fileiras da seção (ordem = destaque): agentes de IA primeiro, com chips maiores. Os nomes vêm do
 * vocabulário (src/lib/stack.ts), então ícone e grupo continuam consistentes com os projetos.
 */
const ROWS: { label: string; items: readonly string[]; big?: boolean; duration: number }[] = [
  {
    label: 'agentes & ia',
    items: [
      'Claude Code',
      'Codex',
      'Antigravity',
      'Maestri',
      'Strands Agents',
      'Bedrock (Claude)',
      'Bedrock (Nova)',
      'Gemini',
      'Bedrock (Nova Canvas)',
    ],
    big: true,
    duration: 48,
  },
  {
    label: 'editor & workflow',
    items: [
      'VS Code',
      'Obsidian',
      'uv',
      'Git',
      'GitHub',
      'GitHub Actions',
      'Terraform',
      'SST',
      'Docker',
      'PowerShell',
      'Bash',
    ],
    duration: 52,
  },
  // todos os serviços AWS do vocabulário (os que aparecem nos 18 projetos + os que o Matheus cita)
  { label: 'aws', items: STACK.AWS, duration: 90 },
  {
    label: 'linguagens & web',
    items: [
      'Python',
      'TypeScript',
      'JavaScript',
      'Node.js',
      'SQL',
      'React',
      'Next.js',
      'Vite',
      'Tailwind',
      'shadcn/ui',
      'three.js',
      'PWA',
    ],
    duration: 56,
  },
]

function Loop({
  items,
  reverse,
  big,
  duration,
}: {
  items: readonly string[]
  reverse?: boolean
  big?: boolean
  duration: number
}) {
  return (
    <div className="marquee-pause min-w-0 overflow-hidden py-1.5 [mask-image:linear-gradient(90deg,transparent,#000_6%,#000_94%,transparent)]">
      <ul
        className={`marquee flex w-max ${big ? 'gap-3' : 'gap-2.5'} ${reverse ? 'marquee-reverse' : ''}`}
        style={{ '--marquee-duration': `${duration}s` } as CSSProperties}
      >
        {[...items, ...items].map((name, i) => (
          <li
            key={i}
            aria-hidden={i >= items.length}
            className={`lc glass flex items-center rounded-full text-ink-2 ${
              big ? 'gap-2.5 px-5 py-2.5 text-[15px] text-ink' : 'gap-2 px-4 py-2 text-sm'
            }`}
          >
            <StackIcon name={name} className={`${big ? 'size-5' : 'size-4'} text-ink`} />
            {name}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function StackLoop() {
  return (
    <Section id="stack" eyebrow="Stack" title="Ferramentas do dia a dia." tint>
      <Reveal>
        <p className="-mt-6 max-w-2xl text-lg text-ink-2 md:-mt-10">
          orquestro agentes de ia (claude code, codex, antigravity) no dia a dia e acompanho tudo que sai de
          novo.
        </p>
      </Reveal>
      <div className="mt-12 space-y-5 md:mt-16 md:space-y-4">
        {ROWS.map((row, i) => (
          <Reveal key={row.label} delay={stagger(i)}>
            <div className="grid items-center gap-2 md:grid-cols-[9rem_minmax(0,1fr)] md:gap-6">
              <h3 className="lc font-mono text-xs text-ink-3">{row.label}</h3>
              {/* screen reader: a lista uma vez só (o loop duplica pra emendar) */}
              <ul className="sr-only">
                {row.items.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
              <div aria-hidden="true" className="-mx-6 min-w-0 md:mx-0">
                <Loop items={row.items} reverse={i % 2 === 1} big={row.big} duration={row.duration} />
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}
