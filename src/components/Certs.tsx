import { TrajectoryBook, type BookTone } from './TrajectoryBook'
import { Reveal } from './ui/Reveal'
import { Section } from './ui/Section'

/** Trajetória (SPEC §0-bis): livro aberto em Paper Mono com certificações e marcos. */
export function Certs() {
  // ?book=ink mostra a variante escura (pra comparar com o papel claro padrão)
  const tone: BookTone = new URLSearchParams(window.location.search).get('book') === 'ink' ? 'ink' : 'paper'
  return (
    <Section id="certificacoes" eyebrow="Certificações" title="Trajetória.">
      <Reveal>
        <TrajectoryBook tone={tone} />
      </Reveal>
    </Section>
  )
}
