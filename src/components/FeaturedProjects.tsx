import { Link } from 'react-router'
import { featured } from '../lib/content'
import { ProjectCard } from './ProjectCard'
import { Reveal } from './ui/Reveal'
import { Section } from './ui/Section'

export function FeaturedProjects() {
  return (
    <Section id="projetos" eyebrow="Projetos em destaque" title="Case studies de produção">
      {featured.length === 0 ? (
        <p className="text-ink-3">Os case studies estão sendo migrados.</p>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((p, i) => (
            <li key={p.slug}>
              <Reveal delay={(i % 3) * 100} className="h-full">
                <ProjectCard project={p} />
              </Reveal>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-12 text-center">
        <Link
          to="/projetos"
          className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm font-semibold transition-colors hover:border-accent hover:text-accent"
        >
          Todos os projetos <span aria-hidden="true">→</span>
        </Link>
      </div>
    </Section>
  )
}
