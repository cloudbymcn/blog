import { useState } from 'react'
import { CERTS } from '../lib/certs'
import { stagger } from '../lib/motion'
import { Reveal } from './ui/Reveal'
import { Section } from './ui/Section'

const TIMELINE = [
  { year: '2024', text: 'AWS Cloud Practitioner (CLF-C02)' },
  { year: '2024', text: 'AWS AI Practitioner (AIF-C01)' },
  { year: '2025', text: 'AWS Solutions Architect – Associate (SAA-C03)' },
  { year: '2026', text: 'AWS CloudOps Engineer – Associate (SOA-C03)' },
  { year: '2026', text: 'Lançamento do Cloud by MCN' },
  { year: '2026', text: 'Pós-graduação em Arquitetura Cloud' },
]

/** Badge da certificação; sem a imagem (ainda não commitada), cai num badge genérico no mesmo tamanho. */
function CertBadge({ src, name, code }: { src: string; name: string; code: string }) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return (
      <div
        role="img"
        aria-label={name}
        className="flex aspect-square w-full max-w-40 flex-col items-center justify-center rounded-[28%] border border-line bg-white text-center shadow-[0_8px_30px_rgba(0,0,0,0.06)]"
      >
        <span className="text-xs font-semibold text-ink-2">aws certified</span>
        <span className="mt-1 font-display text-lg font-semibold tracking-[-0.02em] text-ink">{code}</span>
      </div>
    )
  }
  return (
    <img
      src={src}
      alt={name}
      width={160}
      height={160}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className="aspect-square w-full max-w-40 object-contain transition-transform duration-300 hover:-translate-y-1"
    />
  )
}

export function Certs() {
  return (
    <Section id="certificacoes" eyebrow="Certificações" title="Trajetória.">
      <div className="grid gap-16 md:grid-cols-2">
        <ul className="grid grid-cols-2 gap-6 self-start">
          {CERTS.map((c, i) => (
            <li key={c.code}>
              <Reveal delay={stagger(i)} className="flex flex-col items-center text-center">
                <CertBadge {...c} />
                <span className="lc mt-3 font-mono text-xs text-ink-3">{c.code}</span>
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
              <Reveal delay={stagger(i)}>
                <p className="lc text-sm font-semibold text-ink-2">{t.year}</p>
                <p className="mt-1 text-ink">{t.text}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  )
}
