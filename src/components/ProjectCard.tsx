import { Link } from 'react-router'
import type { ProjectMeta } from '../lib/content'

/** Card glass minimalista (SPEC §0-bis): cover.webp 16:10, título, uma linha, chips de stack. */
export function ProjectCard({ project: p }: { project: ProjectMeta }) {
  return (
    <Link
      to={`/projetos/${p.slug}`}
      className="glass group flex h-full flex-col overflow-hidden rounded-3xl transition-shadow duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.12)]"
    >
      <div className="aspect-[16/10] overflow-hidden border-b border-line bg-bg-2">
        {p.image ? (
          <img
            src={p.image}
            alt=""
            loading="lazy"
            decoding="async"
            width={1600}
            height={1000}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
          />
        ) : (
          // sem print ainda: diagrama inteiro (contain) em vez de card vazio
          p.cover && (
            <img
              src={p.cover}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-full bg-white object-contain p-5 transition-transform duration-500 ease-out group-hover:scale-[1.02]"
            />
          )
        )}
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-display text-xl font-semibold leading-snug tracking-[-0.02em]">{p.title}</h3>
        <p className="mt-2 line-clamp-1 text-[15px] text-ink-2" title={p.summary}>
          {p.summary}
        </p>
        <ul className="mt-auto flex flex-wrap gap-1.5 pt-6">
          {p.stack.slice(0, 4).map((s) => (
            <li key={s} className="rounded-full bg-black/[0.04] px-2.5 py-1 text-xs font-medium text-ink-2">
              {s}
            </li>
          ))}
        </ul>
      </div>
    </Link>
  )
}
