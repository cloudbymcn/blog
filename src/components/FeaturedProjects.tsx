import { Link } from 'react-router'
import { featured } from '../lib/content'
import { ProjectCard } from './ProjectCard'
import { Reveal } from './ui/Reveal'
import { Section } from './ui/Section'

export function FeaturedProjects() {
  return (
    <Section id="projetos" eyebrow="Projetos" title="Case studies de produção." tint>
      {featured.length === 0 ? (
        <p className="text-ink-3">Os case studies estão sendo migrados.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {featured.map((p, i) => (
            <li key={p.slug}>
              <Reveal delay={(i % 3) * 100} className="h-full">
                <ProjectCard project={p} />
              </Reveal>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-16 text-center">
        <Link
          to="/projetos"
          className="inline-flex items-center gap-1 text-[17px] text-accent hover:underline"
        >
          Ver todos os projetos <span aria-hidden="true">›</span>
        </Link>
      </div>
    </Section>
  )
}
