import { Link } from 'react-router'
import { projects } from '../lib/content'
import { ConcaveCarousel, type CarouselItem } from './ConcaveCarousel'
import { Magnet } from './ui/Magnet'
import { Reveal } from './ui/Reveal'
import { Section } from './ui/Section'

// todos os projetos: case studies (Tier A) primeiro, depois o resto, mais recentes antes
const ITEMS: CarouselItem[] = [...projects]
  .sort((a, b) => (a.tier === b.tier ? 0 : a.tier === 'A' ? -1 : 1))
  .map((p) => ({
    key: p.slug,
    href: `/projetos/${p.slug}`,
    image: p.image ?? p.cover,
    fit: p.image ? 'cover' : 'contain',
    title: p.title,
    subtitle: p.summary,
  }))

export function FeaturedProjects() {
  return (
    <Section id="projetos" eyebrow="Projetos" title="Case studies de produção." tint>
      {ITEMS.length === 0 ? (
        <p className="text-ink-3">Os case studies estão sendo migrados.</p>
      ) : (
        <Reveal>
          <ConcaveCarousel items={ITEMS} label="Projetos" />
        </Reveal>
      )}
      <div className="mt-14 text-center">
        <Magnet>
          <Link
            to="/projetos"
            className="lc glass inline-flex items-center gap-1 rounded-full px-6 py-3 text-[17px] font-medium text-link transition-colors hover:bg-white"
          >
            Ver todos os projetos <span aria-hidden="true">›</span>
          </Link>
        </Magnet>
      </div>
    </Section>
  )
}
