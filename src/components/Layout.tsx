import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router'
import { scrollToTarget, startSmoothScroll, stopSmoothScroll } from '../lib/smoothScroll'
import { Footer } from './Footer'
import { Dock, Nav } from './Nav'

/** Rola pro topo a cada rota, ou pra âncora quando a URL tem hash. */
function useScrollRestore() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    const el = hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null
    scrollToTarget(el ?? 0, !el)
  }, [pathname, hash])
}

export function Layout() {
  useEffect(() => {
    startSmoothScroll()
    return stopSmoothScroll
  }, [])
  useScrollRestore()
  return (
    <>
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded focus:bg-accent focus:px-3 focus:py-2 focus:text-white"
      >
        Pular para o conteúdo
      </a>
      <Nav />
      <Dock />
      <main id="conteudo">
        <Outlet />
      </main>
      <Footer />
      {/* abaixo de 1270px o dock vira barra inferior: folga pra ele não cobrir o rodapé */}
      <div aria-hidden="true" className="h-24 bg-bg-2 min-[1270px]:hidden" />
    </>
  )
}
