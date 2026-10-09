import { Link } from 'react-router'
import { stats } from '../lib/content'
import { LanyardStage } from './Lanyard/LanyardStage'
import { BlurText } from './ui/BlurText'
import { CountUp } from './ui/CountUp'
import { Magnet } from './ui/Magnet'

export function Hero() {
  function onMove(e: React.PointerEvent<HTMLElement>) {
    if (e.pointerType !== 'mouse') return
    e.currentTarget.style.setProperty('--sx', `${e.clientX}px`)
    e.currentTarget.style.setProperty('--sy', `${e.clientY}px`)
  }

  const items = [
    { value: stats.projects, label: 'projetos publicados' },
    { value: stats.awsServices, label: 'serviços AWS usados' },
    { value: stats.certifications, label: 'certificações AWS' },
  ]

  return (
    <section
      id="inicio"
      data-section="inicio"
      onPointerMove={onMove}
      className="relative isolate flex min-h-svh flex-col overflow-hidden pt-[var(--nav-h)]"
    >
      <div className="grain pointer-events-none absolute inset-0 -z-10 opacity-[0.07]" aria-hidden="true" />
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(600px circle at var(--sx, 70%) var(--sy, 30%), rgba(56,189,248,0.10), transparent 60%)',
        }}
      />

      <div className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 items-center gap-6 px-5 md:grid-cols-2 md:px-8">
        <div className="order-2 pb-10 md:order-1 md:pb-0">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Cloud by MCN</p>
          <BlurText
            as="h1"
            text="Matheus Nascimento"
            className="mt-4 block font-display text-5xl font-bold leading-[1.02] tracking-tight md:text-7xl"
          />
          <BlurText
            as="p"
            text="Engenheiro de Infraestrutura Cloud"
            delay={250}
            step={60}
            className="mt-3 block font-display text-xl text-ink-2 md:text-2xl"
          />
          <p className="mt-6 max-w-md text-ink-2">
            Arquiteturas AWS reais, decisões técnicas e implementações completas. Pós-graduando em Arquitetura
            Cloud, com foco em IA, escalabilidade e sistemas distribuídos.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Magnet>
              <Link
                to="/projetos"
                className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-bg transition-shadow hover:shadow-[0_0_30px_var(--ring)]"
              >
                Ver projetos <span aria-hidden="true">→</span>
              </Link>
            </Magnet>
            <a
              href="#contato"
              className="inline-flex items-center rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-ink-3"
            >
              Falar comigo
            </a>
          </div>
          <dl className="mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-line pt-6">
            {items.map((s) => (
              <div key={s.label}>
                <dt className="sr-only">{s.label}</dt>
                <dd className="font-display text-3xl font-semibold">
                  <CountUp to={s.value} />
                </dd>
                <dd className="mt-1 text-xs leading-snug text-ink-3">{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="order-1 h-[520px] md:order-2 md:h-[min(780px,calc(100svh-var(--nav-h)))]">
          <LanyardStage />
        </div>
      </div>

      <a
        href="#sobre"
        className="scroll-hint mx-auto mb-6 hidden text-ink-3 hover:text-ink md:block"
        aria-label="Rolar para a próxima seção"
      >
        <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 4v16m0 0-6-6m6 6 6-6" />
        </svg>
      </a>
    </section>
  )
}
