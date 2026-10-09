import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router'
import { Footer } from './Footer'
import { Nav } from './Nav'

/** Rola pro topo a cada rota, ou pra âncora quando a URL tem hash. */
function useScrollRestore() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView()
    else window.scrollTo(0, 0)
  }, [pathname, hash])
}

export function Layout() {
  useScrollRestore()
  return (
    <>
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded focus:bg-accent focus:px-3 focus:py-2 focus:text-bg"
      >
        Pular para o conteúdo
      </a>
      <Nav />
      <main id="conteudo">
        <Outlet />
      </main>
      <Footer />
    </>
  )
}
