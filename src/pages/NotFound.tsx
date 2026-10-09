import { Link } from 'react-router'

export function NotFound() {
  return (
    <section className="mx-auto flex min-h-[70svh] max-w-6xl flex-col items-start justify-center px-5 pt-[var(--nav-h)] md:px-8">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">404</p>
      <h1 className="mt-3 font-display text-4xl font-semibold">Página não encontrada</h1>
      <Link to="/" className="mt-8 text-accent hover:underline">
        Voltar pro início
      </Link>
    </section>
  )
}
