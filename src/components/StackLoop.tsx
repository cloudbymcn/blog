import type { CSSProperties } from 'react'
import { STACK, type StackGroup } from '../lib/stack'
import { StackIcon } from './StackIcon'
import { stagger } from '../lib/motion'
import { Reveal } from './ui/Reveal'
import { Section } from './ui/Section'

const ALL: string[] = Object.values(STACK).flat()
const half = Math.ceil(ALL.length / 2)
const ROWS = [ALL.slice(0, half), ALL.slice(half)]

function Loop({ items, reverse }: { items: string[]; reverse?: boolean }) {
  return (
    <div className="marquee-pause overflow-hidden py-2 [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
      <ul
        className={`marquee flex w-max gap-3 ${reverse ? 'marquee-reverse' : ''}`}
        style={{ '--marquee-duration': '55s' } as CSSProperties}
      >
        {[...items, ...items].map((name, i) => (
          <li
            key={i}
            aria-hidden={i >= items.length}
            className="lc glass flex items-center gap-2 rounded-full px-4 py-2 text-sm text-ink-2"
          >
            <StackIcon name={name} className="size-4 text-ink" />
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
      <div className="-mx-6 space-y-3 md:-mx-8">
        <Loop items={ROWS[0]} />
        <Loop items={ROWS[1]} reverse />
      </div>
      <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {(Object.entries(STACK) as [StackGroup, readonly string[]][]).map(([group, items], i) => (
          <Reveal key={group} delay={stagger(i)}>
            <h3 className="text-sm font-semibold text-ink">{group}</h3>
            <ul className="lc mt-3 flex flex-wrap gap-1.5">
              {items.map((s) => (
                <li key={s} className="rounded-full bg-white px-2.5 py-1 text-sm text-ink-2 ring-1 ring-line">
                  {s}
                </li>
              ))}
            </ul>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}
