import { useState, type CSSProperties } from 'react'
import { Section } from './ui/Section'
import { Reveal } from './ui/Reveal'

const PHOTOS = [1, 2, 3, 4, 5].map((n) => ({
  src: `/photos/bastidores-${n}.webp`,
  small: `/photos/bastidores-${n}-600.webp`,
}))

function Photo({ src, small, decorative }: { src: string; small: string; decorative?: boolean }) {
  const [ok, setOk] = useState(true)
  if (!ok) return null
  return (
    <figure className="h-64 w-48 shrink-0 overflow-hidden rounded-xl border border-line bg-bg-2 md:h-80 md:w-60">
      <img
        src={src}
        srcSet={`${small} 600w, ${src} 1200w`}
        sizes="240px"
        alt={decorative ? '' : 'Bastidores: Matheus no ambiente de trabalho'}
        loading="lazy"
        decoding="async"
        onError={() => setOk(false)}
        className="h-full w-full object-cover grayscale-[30%] transition-transform duration-500 hover:scale-105 hover:grayscale-0"
      />
    </figure>
  )
}

export function About() {
  return (
    <Section id="sobre" eyebrow="Apresentação" title="Quem é o MCN.">
      <div className="grid gap-12 md:grid-cols-[1.1fr_1fr]">
        <Reveal>
          {/* TODO Matheus: texto final da apresentação (placeholder baseado na copy atual, SPEC §3) */}
          <div className="space-y-5 text-lg leading-relaxed text-ink-2">
            <p>
              Sou <strong className="text-ink">Matheus Nascimento</strong>, engenheiro de infraestrutura
              cloud. Trabalho desenhando e colocando em produção arquiteturas AWS para problemas reais de
              negócio: integrações, pipelines orientados a eventos, automação e IA aplicada.
            </p>
            <p>
              Cada vez que resolvo um problema em produção, documento. Cada vez que erro, documento melhor
              ainda. O Cloud by MCN é esse caderno aberto: decisões, trade-offs, custos e o que eu faria
              diferente.
            </p>
            <p>Pós-graduando em Arquitetura Cloud, com foco em IA, escalabilidade e sistemas distribuídos.</p>
          </div>
        </Reveal>
        <Reveal delay={120} className="min-w-0">
          <div className="marquee-pause overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]">
            <div
              className="marquee flex w-max gap-4"
              style={{ '--marquee-duration': '60s' } as CSSProperties}
            >
              {[...PHOTOS, ...PHOTOS].map((p, i) => (
                <Photo key={i} {...p} decorative={i >= PHOTOS.length} />
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  )
}
