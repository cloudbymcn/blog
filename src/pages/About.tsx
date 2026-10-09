import { PAGES } from '../lib/seoMeta'
import { useSeo } from '../lib/useSeo'
import { About as AboutSection } from '../components/About'
import { Certs } from '../components/Certs'

export function About() {
  useSeo(PAGES['/sobre'])
  return (
    <div className="pt-[var(--nav-h)]">
      <AboutSection />
      <Certs />
    </div>
  )
}
