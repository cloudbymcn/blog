import { Link } from 'react-router'

export function NotFound() {
  return (
    <section className="mx-auto flex min-h-[70svh] max-w-6xl flex-col items-start justify-center px-5 pt-[var(--nav-h)] md:px-8">
      <p className="text-sm font-medium text-ink-2">404</p>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-[-0.02em] md:text-6xl">
        Página não encontrada
      </h1>
      <Link to="/" className="mt-8 text-accent hover:underline">
        Voltar pro início
      </Link>
    </section>
  )
}
