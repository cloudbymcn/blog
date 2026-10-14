import { PAGES } from '../lib/seoMeta'
import { useSeo } from '../lib/useSeo'
import { Certs } from '../components/Certs'
import { Contact } from '../components/Contact'
import { FeaturedProjects } from '../components/FeaturedProjects'
import { Hero } from '../components/Hero'
import { Reels } from '../components/Reels'
import { StackLoop } from '../components/StackLoop'

export function Home() {
  useSeo(PAGES['/'])
  return (
    <>
      <Hero />
      <FeaturedProjects />
      <StackLoop />
      <Certs />
      <Contact />
      {/* card do Instagram: some do bundle quando reels.json está vazio */}
      {__HAS_REELS__ && <Reels />}
    </>
  )
}
