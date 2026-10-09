import { Link } from 'react-router'
import { featured } from '../lib/content'
import { ProjectCard } from './ProjectCard'
import { Magnet } from './ui/Magnet'
import { stagger } from '../lib/motion'
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
              <Reveal delay={stagger(i)} className="h-full">
                <ProjectCard project={p} />
              </Reveal>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-16 text-center">
        <Magnet>
          <Link
            to="/projetos"
            className="glass inline-flex items-center gap-1 rounded-full px-6 py-3 text-[17px] font-medium text-accent transition-colors hover:bg-white"
          >
            Ver todos os projetos <span aria-hidden="true">›</span>
          </Link>
        </Magnet>
      </div>
    </Section>
  )
}
