import { STACK } from '../lib/stack'
import { stagger } from '../lib/motion'
import { StackIcon } from './StackIcon'
import { Reveal } from './ui/Reveal'
import { Section } from './ui/Section'

/**
 * Fileiras da seção (ordem = destaque): agentes de IA primeiro, com chips maiores. Os nomes vêm do
 * vocabulário (src/lib/stack.ts), então ícone e grupo continuam consistentes com os projetos.
 */
const ROWS: { label: string; items: readonly string[]; big?: boolean }[] = [
  {
    label: 'agentes & ia',
    items: ['Claude Code', 'Codex', 'Antigravity', 'Maestri', 'Strands Agents', 'Bedrock', 'Gemini'],
    big: true,
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
  },
  // todos os serviços AWS do vocabulário, menos o Bedrock (fica uma vez só, em agentes & ia)
  { label: 'aws', items: STACK.AWS.filter((s) => s !== 'Bedrock') },
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
  },
]

/** Chips parados e quebrando linha: tudo visível de uma vez (antes era um loop passando). */
function Chips({ items, big }: { items: readonly string[]; big?: boolean }) {
  return (
    <ul className={`flex flex-wrap ${big ? 'gap-2.5 md:gap-3' : 'gap-2'}`}>
      {items.map((name) => (
        <li
          key={name}
          className={`lc glass flex items-center rounded-full text-ink-2 ${
            big ? 'gap-2.5 px-5 py-2.5 text-[15px] text-ink' : 'gap-2 px-3.5 py-1.5 text-sm'
          }`}
        >
          <StackIcon name={name} className={`${big ? 'size-5' : 'size-4'} text-ink`} />
          {name}
        </li>
      ))}
    </ul>
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
      <div className="mt-12 space-y-8 md:mt-16 md:space-y-7">
        {ROWS.map((row, i) => (
          <Reveal key={row.label} delay={stagger(i)}>
            <div className="grid items-start gap-3 md:grid-cols-[9rem_minmax(0,1fr)] md:gap-6">
              <h3 className="lc pt-2 font-mono text-xs text-ink-3">{row.label}</h3>
              <Chips items={row.items} big={row.big} />
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}
