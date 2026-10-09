import { About as AboutSection } from '../components/About'
import { Certs } from '../components/Certs'

export function About() {
  return (
    <div className="pt-[var(--nav-h)]">
      <AboutSection />
      <Certs />
    </div>
  )
}
