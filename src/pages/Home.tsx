import { PAGES } from '../lib/seoMeta'
import { useSeo } from '../lib/useSeo'
import { Certs } from '../components/Certs'
import { Contact } from '../components/Contact'
import { FeaturedProjects } from '../components/FeaturedProjects'
import { Hero } from '../components/Hero'
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
    </>
  )
}
