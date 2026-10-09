import { PAGES } from '../lib/seoMeta'
import { useSeo } from '../lib/useSeo'
import { Contact as ContactSection } from '../components/Contact'

export function Contact() {
  useSeo(PAGES['/contato'])
  return (
    <div className="pt-[var(--nav-h)]">
      <ContactSection />
    </div>
  )
}
