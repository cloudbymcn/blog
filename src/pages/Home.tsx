import { About } from '../components/About'
import { Certs } from '../components/Certs'
import { Contact } from '../components/Contact'
import { FeaturedProjects } from '../components/FeaturedProjects'
import { Hero } from '../components/Hero'
import { StackLoop } from '../components/StackLoop'

export function Home() {
  return (
    <>
      <Hero />
      <FeaturedProjects />
      <About />
      <StackLoop />
      <Certs />
      <Contact />
    </>
  )
}
