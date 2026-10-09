import { useState, useSyncExternalStore } from 'react'
import { Link } from 'react-router'
import { stats } from '../lib/content'
import { LanyardControls } from './Lanyard/LanyardControls'
import { LanyardStage } from './Lanyard/LanyardStage'
import { ImmersiveSlot } from './three/ImmersiveSlot'
import { LANYARD_DEFAULTS } from './Lanyard/settings'
import { MaskText } from './ui/MaskText'
import { CountUp } from './ui/CountUp'
import { Magnet } from './ui/Magnet'

const desktopQuery = '(min-width: 768px)'

// fundo three.js decorativo: chunk separado, só desktop e depois do load (ImmersiveSlot)
const loadBackdrop = () => import('./three/HeroBackdrop')

// mobile: canvas de 70svh no topo; escala o size pro cartão dar ~45% da tela (0.45 / 0.70 ≈ 0.64)
const MOBILE_SIZE_SCALE = 0.64 / 0.42

function subscribeDesktop(cb: () => void) {
  const mq = window.matchMedia(desktopQuery)
  mq.addEventListener('change', cb)
  return () => mq.removeEventListener('change', cb)
}

export function Hero() {
  const desktop = useSyncExternalStore(
    subscribeDesktop,
    () => window.matchMedia(desktopQuery).matches,
    () => true,
  )
  const [lanyard, setLanyard] = useState(LANYARD_DEFAULTS)

  const items = [
    { value: stats.projects, label: 'projetos publicados' },
    { value: stats.awsServices, label: 'serviços AWS usados' },
    { value: stats.certifications, label: 'certificações AWS' },
  ]

  return (
    <section
      id="inicio"
      data-section="inicio"
      className="relative isolate flex min-h-svh flex-col overflow-hidden bg-bg pt-[var(--nav-h)]"
    >
      <ImmersiveSlot load={loadBackdrop} delayMs={400} className="absolute inset-0 z-0" />

      {/* SPEC §0-bis: o canvas cobre a dobra inteira por cima do texto; só o cartão pega ponteiro */}
      <div className="pointer-events-none absolute inset-x-0 top-[var(--nav-h)] z-10 h-[70svh] md:inset-0 md:h-auto">
        {/* key: trocar layout ou ligar o Intro remonta o crachá (a animação de entrada só roda na montagem) */}
        <LanyardStage
          key={`${desktop ? 'd' : 'm'}-${lanyard.intro}`}
          anchor={desktop ? 'right' : 'center'}
          settings={desktop ? lanyard : { ...lanyard, size: Math.min(0.9, lanyard.size * MOBILE_SIZE_SCALE) }}
          passThrough
        />
      </div>
      <LanyardControls value={lanyard} onChange={setLanyard} />

      <div className="relative z-0 mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 items-center px-6 md:grid-cols-2 md:px-8">
        <div className="pb-16 pt-[calc(70svh-var(--nav-h)+1rem)] md:py-24">
          {/* entrada em máscara linha a linha; o resto sobe em fade logo depois */}
          <MaskText lines={['Cloud by MCN']} as="p" className="lc text-sm font-medium text-ink-2" />
          <MaskText
            as="h1"
            lines={['Matheus', 'Nascimento']}
            delay={80}
            className="mt-3 block font-display text-5xl font-semibold leading-[1.05] tracking-[-0.02em] md:text-7xl"
          />
          <MaskText
            as="p"
            lines={['Engenheiro de Infraestrutura Cloud']}
            delay={260}
            className="lc mt-3 block font-display text-xl font-medium tracking-[-0.01em] text-ink-2 md:text-2xl"
          />
          <p
            className="fade-up mt-6 max-w-md text-[17px] leading-relaxed text-ink-2"
            style={{ animationDelay: '380ms' }}
          >
            Arquiteturas AWS reais, decisões técnicas e implementações completas. Pós-graduando em Arquitetura
            Cloud, com foco em IA, escalabilidade e sistemas distribuídos.
          </p>
          <div className="fade-up mt-8 flex flex-wrap items-center gap-3" style={{ animationDelay: '460ms' }}>
            <Magnet>
              <Link
                to="/projetos"
                className="lc inline-flex items-center gap-1.5 rounded-full bg-accent px-5 py-2.5 text-[15px] font-medium text-white transition-opacity hover:opacity-90"
              >
                Ver projetos <span aria-hidden="true">›</span>
              </Link>
            </Magnet>
            <Magnet>
              <a
                href="#contato"
                className="lc glass inline-flex items-center rounded-full px-5 py-2.5 text-[15px] font-medium text-link transition-colors hover:bg-white"
              >
                Falar comigo
              </a>
            </Magnet>
          </div>
          <dl
            style={{ animationDelay: '540ms' }}
            className="lc fade-up mt-12 grid max-w-md grid-cols-3 gap-4 border-t border-line pt-6"
          >
            {items.map((s) => (
              <div key={s.label}>
                <dt className="sr-only">{s.label}</dt>
                <dd className="font-display text-3xl font-semibold tracking-[-0.02em]">
                  <CountUp to={s.value} delay={540} />
                </dd>
                <dd className="mt-1 text-xs leading-snug text-ink-2">{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <p
        className="lc pointer-events-none absolute bottom-6 right-[27%] z-0 hidden translate-x-1/2 text-xs text-ink-3 md:block"
        aria-hidden="true"
      >
        Try dragging
      </p>
    </section>
  )
}
