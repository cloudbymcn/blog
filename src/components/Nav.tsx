import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router'

/** Seção da home visível no momento (pra indicador ativo no dock). */
function useActiveSection(enabled: boolean) {
  const [active, setActive] = useState<string | null>(null)
  useEffect(() => {
    if (!enabled) return
    const sections = document.querySelectorAll<HTMLElement>('[data-section]')
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.getAttribute('data-section'))
      },
      { rootMargin: '-45% 0px -50% 0px' },
    )
    sections.forEach((s) => io.observe(s))
    return () => io.disconnect()
  }, [enabled])
  return enabled ? active : null
}

/** true depois de rolar um pouco: a barra ganha vidro (estilo apple.com). */
function useScrolled(threshold = 8) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => setScrolled(window.scrollY > threshold))
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
    }
  }, [threshold])
  return scrolled
}

/** Barra superior fina: só o wordmark (os links moram no dock). */
export function Nav() {
  const scrolled = useScrolled()
  return (
    <header
      data-lanyard-block
      className={`pointer-events-none fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color,backdrop-filter] duration-500 ease-out ${
        scrolled
          ? 'border-line bg-white/72 backdrop-blur-[20px] backdrop-saturate-[180%]'
          : 'border-transparent bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-[var(--nav-h)] max-w-6xl items-center px-4 sm:px-6 md:px-8">
        {/* wordmark 14px de altura (viewBox 572.72 x 109.07 -> ~74px) */}
        <Link to="/" className="pointer-events-auto rounded-md" aria-label="cloudbymcn, início">
          <img src="/img/logo-wordmark.svg" alt="" width={74} height={14} className="h-3.5 w-auto" />
        </Link>
      </div>
    </header>
  )
}

// ícones lineares (lucide: briefcase, mail), 24px, traço 1.75
const iconProps = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

interface DockItem {
  key: string
  label: string
  /** rota fora da home / âncora na home */
  to: string
  section: string
  icon: (active: boolean) => ReactNode
}

const ITEMS: DockItem[] = [
  {
    key: 'inicio',
    label: 'início',
    to: '/',
    section: 'inicio',
    // ícone da logo; aceso vira negativo (squircle escuro, 'm' branco)
    icon: (active) => (
      <img
        src="/img/logo-icon.svg"
        alt=""
        width={30}
        height={30}
        className={`size-[30px] transition-[filter] duration-300 ${active ? 'invert' : ''}`}
      />
    ),
  },
  {
    key: 'projetos',
    label: 'projetos',
    to: '/projetos',
    section: 'projetos',
    icon: () => (
      <svg {...iconProps}>
        <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        <rect width="20" height="14" x="2" y="6" rx="2" />
      </svg>
    ),
  },
  {
    key: 'contato',
    label: 'contato',
    to: '/contato',
    section: 'contato',
    icon: () => (
      <svg {...iconProps}>
        <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" />
        <rect x="2" y="4" width="20" height="16" rx="2" />
      </svg>
    ),
  },
]

const SIZE = 52
const GAP = 12
const PITCH = SIZE + GAP

/** Escala estilo dock do macOS pela distância do ponteiro ao centro: 1.25 embaixo, 1.1 no vizinho. */
function magnify(distance: number) {
  const d = Math.abs(distance)
  if (d < PITCH) return 1.25 - 0.15 * (d / PITCH)
  if (d < PITCH * 2) return 1.1 - 0.1 * ((d - PITCH) / PITCH)
  return 1
}

/**
 * Dock lateral (SPEC §0-bis, adaptado do "Navigation 4" do React Bits Pro): coluna fixa à esquerda,
 * centrada na vertical, com o ícone da logo (início), projetos e contato. Hover amplia o botão sob o
 * ponteiro e os vizinhos como o dock do macOS (mola via CSS) e mostra o rótulo à direita. Item ativo:
 * fundo #1d1d1f e ícone branco. Abaixo de 1270px (onde o dock encostaria no texto) vira barra inferior.
 */
export function Dock() {
  const { pathname } = useLocation()
  const isHome = pathname === '/'
  const section = useActiveSection(isHome)
  const list = useRef<HTMLUListElement>(null)
  const [pointerY, setPointerY] = useState<number | null>(null)
  const [side, setSide] = useState(() => window.matchMedia('(min-width: 1270px)').matches)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1270px)')
    const on = () => setSide(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  const isActive = (item: DockItem) =>
    isHome ? (section ?? 'inicio') === item.section : item.to !== '/' && pathname.startsWith(item.to)

  return (
    <nav
      aria-label="navegação principal"
      data-lanyard-block
      className={
        side
          ? 'fixed left-6 top-1/2 z-40 -translate-y-1/2'
          : 'fixed inset-x-0 bottom-4 z-40 flex justify-center px-4'
      }
    >
      <ul
        ref={list}
        onPointerMove={(e) => {
          if (!side || e.pointerType !== 'mouse') return
          setPointerY(e.clientY - (list.current?.getBoundingClientRect().top ?? 0))
        }}
        onPointerLeave={() => setPointerY(null)}
        className={`flex ${side ? 'flex-col gap-3' : 'glass flex-row gap-2 rounded-[22px] p-2'}`}
      >
        {ITEMS.map((item, i) => {
          const active = isActive(item)
          const center = i * PITCH + SIZE / 2
          const scale = side && pointerY !== null ? magnify(pointerY - center) : 1
          const href = isHome ? (item.section === 'inicio' ? '/#inicio' : `/#${item.section}`) : item.to
          return (
            <li key={item.key} className="group relative">
              <Link
                to={href}
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center justify-center rounded-2xl outline-none transition-[transform,background-color,color] duration-300 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 ${
                  side ? 'size-[52px] origin-left' : 'size-12'
                } ${active ? 'bg-ink text-white shadow-[0_8px_30px_rgba(0,0,0,0.12)]' : `${side ? 'glass' : 'bg-white/70'} text-ink hover:bg-white`}`}
                style={{ transform: `scale(${scale})` }}
              >
                {item.icon(active)}
              </Link>
              {side && (
                // rótulo à direita, aparece no hover/foco
                <span
                  aria-hidden="true"
                  className="glass pointer-events-none absolute left-full top-1/2 ml-5 -translate-x-1 -translate-y-1/2 whitespace-nowrap rounded-full px-3 py-1 text-[13px] text-ink opacity-0 transition duration-200 group-focus-within:translate-x-0 group-focus-within:opacity-100 group-hover:translate-x-0 group-hover:opacity-100"
                >
                  {item.label}
                </span>
              )}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
