import { Reveal } from './ui/Reveal'
import { Section } from './ui/Section'

const CERTS = [
  { src: '/img/cert-clf.webp', name: 'AWS Certified Cloud Practitioner', code: 'CLF-C02' },
  { src: '/img/cert-aif.png', name: 'AWS Certified AI Practitioner', code: 'AIF-C01' },
  { src: '/img/cert-saa.png', name: 'AWS Certified Solutions Architect – Associate', code: 'SAA-C03' },
]

const TIMELINE = [
  { year: '2024', text: 'AWS Cloud Practitioner (CLF-C02)' },
  { year: '2024', text: 'AWS AI Practitioner (AIF-C01)' },
  { year: '2025', text: 'AWS Solutions Architect – Associate (SAA-C03)' },
  { year: '2026', text: 'Lançamento do Cloud by MCN' },
  { year: '2026', text: 'Pós-graduação em Arquitetura Cloud' },
]

export function Certs() {
  return (
    <Section id="certificacoes" eyebrow="Certificações" title="Trajetória.">
      <div className="grid gap-16 md:grid-cols-2">
        <ul className="grid grid-cols-3 gap-4 self-start">
          {CERTS.map((c, i) => (
            <li key={c.code}>
              <Reveal delay={i * 100} className="flex flex-col items-center text-center">
                <img
                  src={c.src}
                  alt={c.name}
                  width={160}
                  height={160}
                  loading="lazy"
                  decoding="async"
                  className="aspect-square w-full max-w-40 object-contain transition-transform duration-300 hover:-translate-y-1"
                />
                <span className="mt-3 font-mono text-xs text-ink-3">{c.code}</span>
              </Reveal>
            </li>
          ))}
        </ul>
        <ol className="relative border-l border-line pl-8">
          {TIMELINE.map((t, i) => (
            <li key={t.text} className="relative mb-10 last:mb-0">
              <span
                aria-hidden="true"
                className="absolute -left-[37px] top-1.5 size-2.5 rounded-full bg-accent"
              />
              <Reveal delay={i * 80}>
                <p className="text-sm font-semibold text-ink-2">{t.year}</p>
                <p className="mt-1 text-ink">{t.text}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  )
}
