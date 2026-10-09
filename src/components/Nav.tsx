import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router'

const LINKS = [
  { to: '/projetos', label: 'Projetos', section: 'projetos' },
  { to: '/sobre', label: 'Sobre', section: 'sobre' },
  { to: '/contato', label: 'Contato', section: 'contato' },
]

/** Seção da home visível no momento (pra indicador ativo na nav). */
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

/** true depois de rolar um pouco: a nav encolhe e ganha vidro (estilo apple.com). */
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

export function Nav() {
  const scrolled = useScrolled()
  const { pathname } = useLocation()
  const isHome = pathname === '/'
  const active = useActiveSection(isHome)

  return (
    // translúcida estilo apple.com (SPEC §0-bis)
    <header
      data-lanyard-block
      className={`fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color,backdrop-filter] duration-500 ease-out ${
        scrolled
          ? 'border-line bg-white/72 backdrop-blur-[20px] backdrop-saturate-[180%]'
          : // no topo: vidro leve (o strap do crachá passa por trás e o link segue legível)
            'border-transparent bg-white/60 backdrop-blur-[12px] backdrop-saturate-[140%]'
      }`}
    >
      <nav
        className={`mx-auto flex max-w-6xl items-center justify-between px-4 transition-[height] duration-500 ease-out sm:px-6 md:px-8 ${
          scrolled ? 'h-[var(--nav-h)]' : 'h-16'
        }`}
      >
        <Link to="/" className="flex items-center gap-2" aria-label="Cloud by MCN, início">
          <img src="/img/logo-icon.svg" alt="" width={28} height={28} className="size-7" />
          {/* wordmark 14px de altura (viewBox 572.72 x 109.07 -> ~74px); some abaixo de 400px */}
          <img
            src="/img/logo-wordmark.svg"
            alt=""
            width={74}
            height={14}
            className="hidden h-3.5 w-auto min-[400px]:block"
          />
        </Link>
        <ul className="flex items-center gap-1 text-[13px]">
          {LINKS.map((l) => (
            <li key={l.to}>
              <NavLink
                to={isHome ? `/#${l.section}` : l.to}
                className={({ isActive }) =>
                  `relative rounded-full px-2 py-1.5 sm:px-3 transition-colors hover:text-ink ${
                    (isHome ? active === l.section : isActive) ? 'text-ink' : 'text-ink/70'
                  }`
                }
              >
                {l.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}
