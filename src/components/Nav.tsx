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

export function Nav() {
  const { pathname } = useLocation()
  const isHome = pathname === '/'
  const active = useActiveSection(isHome)

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-line bg-bg/70 backdrop-blur-md">
      <nav className="mx-auto flex h-[var(--nav-h)] max-w-6xl items-center justify-between px-5 md:px-8">
        <Link to="/" className="flex items-center gap-2" aria-label="Cloud by MCN, início">
          <img src="/img/logo-mcn.png" alt="" width={32} height={32} className="size-8 rounded" />
          <span className="font-display text-sm font-semibold tracking-tight">cloudbymcn</span>
        </Link>
        <ul className="flex items-center gap-1 text-sm">
          {LINKS.map((l) => (
            <li key={l.to}>
              <NavLink
                to={isHome ? `/#${l.section}` : l.to}
                className={({ isActive }) =>
                  `relative rounded-full px-3 py-1.5 transition-colors hover:text-ink ${
                    (isHome ? active === l.section : isActive) ? 'bg-white/5 text-ink' : 'text-ink-2'
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
