import { TrajectoryBook } from './TrajectoryBook'
import { Reveal } from './ui/Reveal'
import { Section } from './ui/Section'

/** Trajetória (SPEC §0-bis): livro aberto em Paper Mono com certificações e marcos. */
export function Certs() {
  return (
    <Section id="certificacoes" eyebrow="Certificações" title="Trajetória.">
      <Reveal>
        <TrajectoryBook />
      </Reveal>
    </Section>
  )
}
