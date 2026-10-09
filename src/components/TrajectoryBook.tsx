import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { CERTS } from '../lib/certs'
import { CertBadge } from './CertBadge'

/** Um marco = uma página do livro. */
interface Milestone {
  year: string
  title: string
  text: string
  cert?: string // código da certificação (badge na página)
}

const MILESTONES: Milestone[] = [
  {
    year: '2024',
    title: 'aws certified cloud practitioner',
    text: 'o primeiro passo formal: fundamentos de nuvem, faturamento, segurança e o vocabulário da aws.',
    cert: 'CLF-C02',
  },
  {
    year: '2024',
    title: 'aws certified ai practitioner',
    text: 'ia generativa na prática: bedrock, prompts, rag e onde ia ajuda (e onde não ajuda) um negócio real.',
    cert: 'AIF-C01',
  },
  {
    year: '2025',
    title: 'aws certified solutions architect – associate',
    text: 'arquitetura de verdade: trade-offs de custo, resiliência e segurança em sistemas que rodam em produção.',
    cert: 'SAA-C03',
  },
  {
    year: '2026',
    title: 'aws certified cloudops engineer – associate',
    text: 'operação: observabilidade, automação, deploy e o dia a dia de manter a nuvem de pé.',
    cert: 'SOA-C03',
  },
  {
    year: '2026',
    title: 'lançamento do cloud by mcn',
    text: 'o caderno aberto: cada problema resolvido em produção vira case, com decisões, custos e o que eu faria diferente.',
  },
  {
    year: '2026',
    title: 'pós-graduação em arquitetura cloud',
    text: 'foco em ia, escalabilidade e sistemas distribuídos. em andamento.',
  },
  {
    year: 'hoje',
    title: 'engenheiro de infraestrutura cloud',
    text: 'desenhando e colocando em produção arquiteturas aws: integrações, pipelines orientados a eventos, automação e ia aplicada.',
  },
]

/** Página 0 = abertura; depois um marco por página. */
const PAGE_COUNT = MILESTONES.length + 1

const FLIP_MS = 700
const reducedQuery = '(prefers-reduced-motion: reduce)'
const pad = (n: number) => String(n).padStart(2, '0')

function PageContent({ index }: { index: number }) {
  if (index < 0 || index >= PAGE_COUNT) return null
  if (index === 0) {
    return (
      <div className="flex h-full flex-col justify-center">
        <p className="book-mono book-muted text-xs">trajetória</p>
        <p className="mt-3 text-[clamp(1.75rem,3.2vw,2.75rem)] font-semibold leading-[1.05] tracking-[-0.02em]">
          um caderno
          <br />
          de marcos.
        </p>
        <p className="mt-4 max-w-[30ch] text-[13px] leading-relaxed text-ink-2 xl:text-sm">
          certificações, estudos e o que mudou no caminho. vire a página ›
        </p>
      </div>
    )
  }
  const m = MILESTONES[index - 1]
  const cert = m.cert ? CERTS.find((c) => c.code === m.cert) : undefined
  return (
    <div className="flex h-full flex-col justify-center">
      <p className="book-accent text-[clamp(1.75rem,3vw,2.5rem)] font-semibold leading-none tracking-[-0.02em]">
        {m.year}
      </p>
      <p className="mt-3 text-[clamp(0.95rem,1.4vw,1.15rem)] font-semibold leading-snug tracking-[-0.02em]">
        {m.title}
      </p>
      <p className="mt-2 max-w-[36ch] text-[13px] font-normal leading-relaxed text-ink-2 xl:text-sm">
        {m.text}
      </p>
      {cert && (
        <div className="mt-4 flex items-end gap-3">
          <CertBadge {...cert} className="w-[clamp(4.5rem,7vw,7.5rem)]" />
          <span className="book-mono book-muted pb-1 text-[11px]">{cert.code.toLowerCase()}</span>
        </div>
      )}
    </div>
  )
}

/** Uma face de página: papel, marginália, conteúdo e número. `side` define de que lado fica a lombada. */
function Page({ index, side, children }: { index: number; side: 'left' | 'right'; children?: ReactNode }) {
  const blank = index < 0 || index >= PAGE_COUNT
  return (
    <div className={`book-page book-page-${side} absolute inset-0 flex flex-col px-[7%] py-[6%]`}>
      {!blank && (
        <>
          <div className="book-mono book-muted flex justify-between text-[11px]">
            <span>{side === 'left' ? 'by cloudbymcn' : 'trajetória'}</span>
            <span>{side === 'left' ? '' : 'v2026'}</span>
          </div>
          <div className="min-h-0 flex-1 pt-4">{children ?? <PageContent index={index} />}</div>
          <p
            className={`book-mono book-muted pt-3 text-[11px] ${side === 'left' ? 'text-left' : 'text-right'}`}
          >
            {pad(index + 1)}
          </p>
        </>
      )}
    </div>
  )
}

type Flip = { dir: 'next' | 'prev' } | null

/**
 * Trajetória como livro aberto (SPEC §0-bis) em Paper Mono. Desktop: spread de duas páginas com
 * lombada; mobile: uma página. Virar = folha girando na lombada (rotateY, 700ms) com sombra que
 * acompanha. Setas, teclado (← →), clique na página e swipe; reduced-motion troca sem girar.
 */
export function TrajectoryBook() {
  const [single, setSingle] = useState(() => window.matchMedia('(max-width: 767px)').matches)
  const [reduced] = useState(() => window.matchMedia(reducedQuery).matches)
  const [pos, setPos] = useState(0) // primeira página visível (par no spread)
  const [flip, setFlip] = useState<Flip>(null)
  const swipe = useRef<{ x: number; id: number } | null>(null)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const on = () => {
      setSingle(mq.matches)
      setFlip(null)
      setPos((p) => (mq.matches ? p : p - (p % 2)))
    }
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  const step = single ? 1 : 2
  const canPrev = pos > 0
  const canNext = pos + step < PAGE_COUNT

  const turn = useCallback(
    (dir: 'next' | 'prev') => {
      if (flip) return
      if (dir === 'next' && !canNext) return
      if (dir === 'prev' && !canPrev) return
      if (reduced) setPos((p) => p + (dir === 'next' ? step : -step))
      else setFlip({ dir })
    },
    [flip, canNext, canPrev, reduced, step],
  )

  const finish = useCallback(() => {
    if (!flip) return
    setPos((p) => p + (flip.dir === 'next' ? step : -step))
    setFlip(null)
  }, [flip, step])

  // segurança: se o animationend não chegar (aba em segundo plano, página sem pintar), conclui assim mesmo
  useEffect(() => {
    if (!flip) return
    const t = window.setTimeout(finish, FLIP_MS + 150)
    return () => window.clearTimeout(t)
  }, [flip, finish])

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      turn('next')
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      turn('prev')
    }
  }

  // o que fica parado embaixo da folha que gira
  const next = flip?.dir === 'next'
  const prev = flip?.dir === 'prev'
  const staticLeft = single ? -1 : prev ? pos - 2 : pos
  const staticRight = single ? (next ? pos + 1 : pos) : next ? pos + 3 : pos + 1

  // folha: avançando no spread gira a página direita (pos+1) e mostra pos+2 no verso; voltando gira a
  // esquerda (pos) e mostra pos-1. No mobile a folha é a página atual (saindo) ou a anterior (entrando).
  const leaf: { front: number; frontSide: 'left' | 'right'; back: number; backSide: 'left' | 'right' } =
    single
      ? { front: next ? pos : pos - 1, frontSide: 'right', back: -1, backSide: 'left' }
      : next
        ? { front: pos + 1, frontSide: 'right', back: pos + 2, backSide: 'left' }
        : { front: pos, frontSide: 'left', back: pos - 1, backSide: 'right' }

  const vars = {
    '--flip-ms': `${FLIP_MS}ms`,
  } as CSSProperties

  return (
    <div className="book-root" style={vars}>
      <div
        role="region"
        aria-roledescription="livro"
        aria-label="Trajetória: use as setas para virar as páginas"
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={(e) => (swipe.current = { x: e.clientX, id: e.pointerId })}
        onPointerUp={(e) => {
          const s = swipe.current
          swipe.current = null
          if (!s || s.id !== e.pointerId) return
          const dx = e.clientX - s.x
          if (Math.abs(dx) > 40) turn(dx < 0 ? 'next' : 'prev')
        }}
        className="book-stage relative mx-auto select-none outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        style={{ touchAction: 'pan-y' }}
      >
        <div className={`book ${single ? 'book-single' : 'book-spread'}`}>
          {/* páginas paradas; clique na metade esquerda volta, na direita avança */}
          {!single && (
            <div aria-hidden="true" onClick={() => turn('prev')} className="book-half book-half-left">
              <Page index={staticLeft} side="left" />
            </div>
          )}
          <div aria-hidden="true" onClick={() => turn('next')} className="book-half book-half-right">
            <Page index={staticRight} side="right" />
          </div>

          {/* folha girando na lombada: frente e verso */}
          {flip && (
            <div
              className={`book-leaf ${next ? 'book-leaf-next' : 'book-leaf-prev'} ${single ? 'book-leaf-single' : ''}`}
              onAnimationEnd={(e) => e.target === e.currentTarget && finish()}
            >
              <div className="book-face book-face-front">
                <Page index={leaf.front} side={leaf.frontSide} />
                <span className="book-shade" aria-hidden="true" />
              </div>
              {!single && (
                <div className="book-face book-face-back">
                  <Page index={leaf.back} side={leaf.backSide} />
                  <span className="book-shade" aria-hidden="true" />
                </div>
              )}
            </div>
          )}

          {!single && <span className="book-spine" aria-hidden="true" />}
        </div>
      </div>

      {/* texto acessível da(s) página(s) visível(is) */}
      <p className="sr-only" aria-live="polite">
        {`páginas ${pos + 1}${single ? '' : `-${Math.min(pos + 2, PAGE_COUNT)}`} de ${PAGE_COUNT}`}
      </p>

      <div className="mt-8 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => turn('prev')}
          disabled={!canPrev}
          aria-label="Página anterior"
          className="glass flex size-10 items-center justify-center rounded-full text-ink transition-opacity hover:bg-white disabled:opacity-40"
        >
          <span aria-hidden="true" className="text-xl leading-none">
            ‹
          </span>
        </button>
        <p className="min-w-[5.5rem] text-center font-mono text-sm tabular-nums text-ink-2">
          <span className="text-ink">{pad(pos + 1)}</span> / {pad(PAGE_COUNT)}
        </p>
        <button
          type="button"
          onClick={() => turn('next')}
          disabled={!canNext}
          aria-label="Próxima página"
          className="glass flex size-10 items-center justify-center rounded-full text-ink transition-opacity hover:bg-white disabled:opacity-40"
        >
          <span aria-hidden="true" className="text-xl leading-none">
            ›
          </span>
        </button>
      </div>
    </div>
  )
}
