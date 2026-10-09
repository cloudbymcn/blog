import { Link } from 'react-router'
import { CATEGORIES, type ProjectMeta } from '../lib/content'
import { SpotlightCard } from './ui/SpotlightCard'

export function ProjectCard({ project: p }: { project: ProjectMeta }) {
  return (
    <SpotlightCard className="h-full">
      <Link to={`/projetos/${p.slug}`} className="flex h-full flex-col">
        <div className="aspect-[16/9] overflow-hidden border-b border-line bg-bg">
          {p.cover ? (
            <img
              src={p.cover}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="grain h-full w-full opacity-20" />
          )}
        </div>
        <div className="flex flex-1 flex-col p-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3">
            {CATEGORIES[p.category] ?? p.category}
            {p.tier === 'A' && <span className="ml-2 text-accent-2">case study</span>}
          </p>
          <h3 className="mt-2 font-display text-lg font-semibold leading-snug group-hover:text-accent">
            {p.title}
          </h3>
          <p className="mt-2 line-clamp-3 text-sm text-ink-2">{p.summary}</p>
          {p.metrics && p.metrics.length > 0 && (
            <dl className="mt-4 grid grid-cols-2 gap-3">
              {p.metrics.slice(0, 2).map((m) => (
                <div key={m.label} className="rounded-lg border border-line px-3 py-2">
                  <dt className="font-mono text-[10px] uppercase tracking-wider text-ink-3">{m.label}</dt>
                  <dd className="mt-0.5 text-sm">
                    <span className="text-ink-3 line-through decoration-ink-3/60">{m.before}</span>{' '}
                    <span className="font-semibold text-accent">→ {m.after}</span>
                  </dd>
                </div>
              ))}
            </dl>
          )}
          <ul className="mt-auto flex flex-wrap gap-1.5 pt-5">
            {p.stack.slice(0, 5).map((s) => (
              <li
                key={s}
                className="rounded-full border border-line px-2 py-0.5 font-mono text-[11px] text-ink-2"
              >
                {s}
              </li>
            ))}
          </ul>
        </div>
      </Link>
    </SpotlightCard>
  )
}
