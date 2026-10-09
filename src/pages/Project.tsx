import { MDXProvider } from '@mdx-js/react'
import { Suspense, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { CoverMedia } from '../components/CoverMedia'
import { Figure } from '../components/mdx'
import { mdxComponents } from '../components/mdx/components'
import { StackIcon } from '../components/StackIcon'
import { CATEGORIES, getProject, projectBodies } from '../lib/content'
import { NOT_FOUND, projectSeo } from '../lib/seoMeta'
import { useSeo } from '../lib/useSeo'
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
  useSeo(project ? projectSeo(project) : NOT_FOUND, { noindex: !project })

  if (!project) return <NotFound />
  const p = project

  return (
    <article className="pb-24 pt-[var(--nav-h)]">
      <header className="border-b border-line bg-bg-2">
        <div className="mx-auto max-w-6xl px-5 pb-12 pt-12 md:px-8">
          <Link to="/projetos" className="lc text-sm text-link hover:underline">
            ‹ Todos os projetos
          </Link>
          <p className="lc mt-8 text-sm font-medium text-ink-2">
            {CATEGORIES[p.category] ?? p.category} · {formatDate(p.date)}
          </p>
          <h1 className="mt-2 max-w-4xl font-display text-4xl font-semibold leading-[1.08] tracking-[-0.02em] md:text-6xl">
            {p.title}
          </h1>
          <p className="mt-5 max-w-3xl text-xl leading-relaxed text-ink-2">{p.summary}</p>
          {p.metrics && p.metrics.length > 0 && (
            <dl className="mt-8 flex flex-wrap gap-3">
              {p.metrics.map((m) => (
                <div key={m.label} className="glass rounded-2xl px-5 py-4">
                  <dt className="lc text-xs font-medium text-ink-2">{m.label}</dt>
                  <dd className="mt-1">
                    <span className="text-ink-3 line-through decoration-ink-3/60">{m.before}</span>{' '}
                    <span className="font-display text-xl font-semibold tracking-[-0.02em] text-ink">
                      → {m.after}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          )}
          {(p.image ?? p.cover ?? p.video) && (
            <CoverMedia
              key={p.slug}
              poster={p.image ?? p.cover}
              video={p.video}
              active
              priority
              alt={`Capa: ${p.title}`}
              width={p.image ? 1600 : undefined}
              height={p.image ? 1000 : undefined}
              className={`mt-12 aspect-[16/10] w-full rounded-3xl border border-line bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)] ${
                p.image || p.video ? 'object-cover' : 'object-contain p-6'
              }`}
            />
          )}
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-5 pt-12 md:px-8 lg:grid-cols-[minmax(0,1fr)_240px]">
        <section
          ref={articleRef}
          className="prose prose-lg max-w-none prose-headings:font-display prose-headings:font-semibold prose-headings:tracking-[-0.02em] prose-headings:text-ink prose-p:text-ink/85 prose-a:text-link prose-a:no-underline hover:prose-a:underline prose-strong:text-ink prose-code:text-ink prose-code:before:content-none prose-code:after:content-none prose-pre:rounded-2xl"
        >
          {/* com print no hero, o SVG de arquitetura vai pro corpo (se o MDX já não mostra ele) */}
          {p.image && p.cover && !p.coverInBody && (
            <Figure src={p.cover} alt={`Arquitetura: ${p.title}`} caption="Arquitetura" />
          )}
          <MDXProvider components={mdxComponents}>
            <Suspense
              fallback={
                <div className="space-y-3" aria-busy="true">
                  {[90, 75, 85, 60].map((w) => (
                    <div
                      key={w}
                      className="h-4 animate-pulse rounded bg-black/5"
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
              <p className="lc text-xs font-semibold text-ink">Nesta página</p>
              <ul className="lc mt-3 space-y-2 border-l border-line text-sm">
                {toc.map((t) => (
                  <li key={t.id}>
                    <a
                      href={`#${t.id}`}
                      className={`-ml-px block border-l transition-colors ${t.level === 3 ? 'pl-7' : 'pl-4'} ${
                        active === t.id
                          ? 'border-accent text-link'
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
            <p className="lc text-xs font-semibold text-ink">Stack usada</p>
            <ul className="lc mt-3 flex flex-wrap gap-2">
              {p.stack.map((s) => (
                <li key={s}>
                  <Link
                    to={`/projetos?stack=${encodeURIComponent(s)}`}
                    className="glass flex items-center gap-1.5 rounded-full px-3 py-1 text-sm text-ink-2 hover:text-link"
                  >
                    <StackIcon name={s} className="size-3.5" />
                    {s}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {(p.repo || p.live) && (
            <div className="lc flex flex-col gap-2">
              {p.repo && (
                <a
                  href={p.repo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass rounded-full px-4 py-2.5 text-center text-sm font-medium text-link hover:bg-white"
                >
                  Código no GitHub ↗
                </a>
              )}
              {p.live && (
                <a
                  href={p.live}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass rounded-full px-4 py-2.5 text-center text-sm font-medium text-link hover:bg-white"
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
