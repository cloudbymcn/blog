import { MDXProvider } from '@mdx-js/react'
import { Suspense, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { mdxComponents } from '../components/mdx/components'
import { StackIcon } from '../components/StackIcon'
import { CATEGORIES, getProject, projectBodies } from '../lib/content'
import { NotFound } from './NotFound'

interface TocItem {
  id: string
  text: string
  level: number
}

function formatDate(iso: string) {
  const d = new Date(`${iso}T12:00:00`)
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

/** TOC lido do DOM renderizado (h2/h3 ganham id via rehype-slug). Observa mutações porque o corpo é lazy. */
function useToc(slug: string, container: React.RefObject<HTMLElement | null>) {
  const [toc, setToc] = useState<TocItem[]>([])
  const [active, setActive] = useState<string | null>(null)
  useEffect(() => {
    const root = container.current
    if (!root) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id)
      },
      { rootMargin: '-20% 0px -70% 0px' },
    )
    const read = () => {
      const heads = [...root.querySelectorAll<HTMLElement>('h2[id], h3[id]')]
      setToc(heads.map((h) => ({ id: h.id, text: h.textContent ?? '', level: h.tagName === 'H2' ? 2 : 3 })))
      io.disconnect()
      heads.forEach((h) => io.observe(h))
    }
    const mo = new MutationObserver(read)
    mo.observe(root, { childList: true, subtree: true })
    const raf = requestAnimationFrame(read)
    return () => {
      cancelAnimationFrame(raf)
      mo.disconnect()
      io.disconnect()
    }
  }, [slug, container])
  return { toc, active }
}

export function Project() {
  const { slug = '' } = useParams()
  const project = getProject(slug)
  const Body = projectBodies[slug]
  const articleRef = useRef<HTMLElement>(null)
  const { toc, active } = useToc(slug, articleRef)

  if (!project) return <NotFound />
  const p = project

  return (
    <article className="pb-24 pt-[var(--nav-h)]">
      <title>{`${p.title} · Cloud by MCN`}</title>
      <meta name="description" content={p.summary} />
      <meta property="og:title" content={p.title} />
      <meta property="og:description" content={p.summary} />
      {p.cover && <meta property="og:image" content={`https://cloudbymcn.com${p.cover}`} />}

      <header className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 pb-12 pt-12 md:px-8">
          <Link to="/projetos" className="font-mono text-xs text-ink-3 hover:text-accent">
            ← Todos os projetos
          </Link>
          <p className="mt-6 font-mono text-xs uppercase tracking-[0.2em] text-accent">
            {CATEGORIES[p.category] ?? p.category} · {formatDate(p.date)}
          </p>
          <h1 className="mt-3 max-w-4xl font-display text-3xl font-semibold leading-tight tracking-tight md:text-5xl">
            {p.title}
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-ink-2">{p.summary}</p>
          {p.metrics && p.metrics.length > 0 && (
            <dl className="mt-8 flex flex-wrap gap-3">
              {p.metrics.map((m) => (
                <div key={m.label} className="rounded-xl border border-line bg-bg-2 px-4 py-3">
                  <dt className="font-mono text-[11px] uppercase tracking-wider text-ink-3">{m.label}</dt>
                  <dd className="mt-1">
                    <span className="text-ink-3 line-through decoration-ink-3/60">{m.before}</span>{' '}
                    <span className="font-display text-xl font-semibold text-accent">→ {m.after}</span>
                  </dd>
                </div>
              ))}
            </dl>
          )}
          {p.cover && (
            <img
              src={p.cover}
              alt={`Capa: ${p.title}`}
              className="mt-10 w-full rounded-2xl border border-line bg-bg-2 object-cover"
              fetchPriority="high"
            />
          )}
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-5 pt-12 md:px-8 lg:grid-cols-[minmax(0,1fr)_240px]">
        <section
          ref={articleRef}
          className="prose prose-invert max-w-none prose-headings:font-display prose-headings:tracking-tight prose-a:text-accent prose-code:before:content-none prose-code:after:content-none prose-pre:border prose-pre:border-line"
        >
          <MDXProvider components={mdxComponents}>
            <Suspense
              fallback={
                <div className="space-y-3" aria-busy="true">
                  {[90, 75, 85, 60].map((w) => (
                    <div
                      key={w}
                      className="h-4 animate-pulse rounded bg-white/5"
                      style={{ width: `${w}%` }}
                    />
                  ))}
                </div>
              }
            >
              {Body && <Body />}
            </Suspense>
          </MDXProvider>
        </section>

        <aside className="space-y-10 lg:sticky lg:top-[calc(var(--nav-h)+2rem)] lg:self-start">
          {toc.length > 0 && (
            <nav aria-label="Nesta página" className="hidden lg:block">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-ink-3">Nesta página</p>
              <ul className="mt-3 space-y-2 border-l border-line text-sm">
                {toc.map((t) => (
                  <li key={t.id}>
                    <a
                      href={`#${t.id}`}
                      className={`-ml-px block border-l transition-colors ${t.level === 3 ? 'pl-7' : 'pl-4'} ${
                        active === t.id
                          ? 'border-accent text-accent'
                          : 'border-transparent text-ink-2 hover:text-ink'
                      }`}
                    >
                      {t.text}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-ink-3">Stack usada</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {p.stack.map((s) => (
                <li key={s}>
                  <Link
                    to={`/projetos?stack=${encodeURIComponent(s)}`}
                    className="flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-sm text-ink-2 hover:border-accent hover:text-accent"
                  >
                    <StackIcon name={s} className="size-3.5" />
                    {s}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {(p.repo || p.live) && (
            <div className="flex flex-col gap-2">
              {p.repo && (
                <a
                  href={p.repo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border border-line px-4 py-2.5 text-sm hover:border-accent hover:text-accent"
                >
                  Código no GitHub ↗
                </a>
              )}
              {p.live && (
                <a
                  href={p.live}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border border-line px-4 py-2.5 text-sm hover:border-accent hover:text-accent"
                >
                  Ver ao vivo ↗
                </a>
              )}
            </div>
          )}
        </aside>
      </div>
    </article>
  )
}
