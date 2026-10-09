import { useSearchParams } from 'react-router'
import { ProjectCard } from '../components/ProjectCard'
import { CATEGORIES, projects, type Category } from '../lib/content'

function normalize(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

/** Stacks presentes no índice, das mais usadas pras menos. */
const STACK_COUNTS = [
  ...projects
    .flatMap((p) => p.stack)
    .reduce((m, s) => m.set(s, (m.get(s) ?? 0) + 1), new Map<string, number>()),
].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-sm transition-colors ${
        active
          ? 'border-accent bg-accent/10 text-accent'
          : 'border-line text-ink-2 hover:border-ink-3 hover:text-ink'
      }`}
    >
      {children}
    </button>
  )
}

export function Projects() {
  // filtros na URL: dá pra compartilhar /projetos?cat=ia&stack=Bedrock
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const cat = params.get('cat') as Category | null
  const stack = params.getAll('stack')
  const order = params.get('ordem') === 'antigos' ? 'antigos' : 'recentes'

  function update(fn: (p: URLSearchParams) => void) {
    const next = new URLSearchParams(params)
    fn(next)
    setParams(next, { replace: true, preventScrollReset: true })
  }

  const nq = normalize(q.trim())
  const filtered = projects.filter(
    (p) =>
      (!cat || p.category === cat) &&
      stack.every((s) => p.stack.includes(s)) &&
      (!nq || normalize(`${p.title} ${p.summary} ${p.stack.join(' ')}`).includes(nq)),
  )
  const list = order === 'antigos' ? [...filtered].reverse() : filtered

  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-[calc(var(--nav-h)+3rem)] md:px-8">
      <title>Projetos · Cloud by MCN</title>
      <meta
        name="description"
        content="Case studies de arquitetura AWS, integrações, IA aplicada e produtos em produção."
      />
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Portfolio</p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-6xl">Projetos</h1>
      <p className="mt-4 max-w-2xl text-ink-2">
        {projects.length} projetos: case studies completos e cards curtos. Filtre por categoria, stack ou
        texto.
      </p>

      <div className="mt-10 space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="flex-1">
            <span className="sr-only">Buscar projetos</span>
            <input
              type="search"
              value={q}
              onChange={(e) => update((p) => (e.target.value ? p.set('q', e.target.value) : p.delete('q')))}
              placeholder="Buscar por título, resumo ou stack…"
              className="w-full rounded-xl border border-line bg-bg-2 px-4 py-2.5 text-sm placeholder:text-ink-3 focus:border-accent focus:outline-none"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-ink-2">
            Ordem
            <select
              value={order}
              onChange={(e) =>
                update((p) => (e.target.value === 'antigos' ? p.set('ordem', 'antigos') : p.delete('ordem')))
              }
              className="rounded-xl border border-line bg-bg-2 px-3 py-2.5 text-ink focus:border-accent focus:outline-none"
            >
              <option value="recentes">Mais recentes</option>
              <option value="antigos">Mais antigos</option>
            </select>
          </label>
        </div>

        <div role="group" aria-label="Categoria" className="flex flex-wrap gap-2">
          <Chip active={!cat} onClick={() => update((p) => p.delete('cat'))}>
            Todas
          </Chip>
          {(Object.entries(CATEGORIES) as [Category, string][]).map(([key, label]) => (
            <Chip
              key={key}
              active={cat === key}
              onClick={() => update((p) => (cat === key ? p.delete('cat') : p.set('cat', key)))}
            >
              {label}
            </Chip>
          ))}
        </div>

        {STACK_COUNTS.length > 0 && (
          <details className="group" open={stack.length > 0}>
            <summary className="cursor-pointer font-mono text-xs uppercase tracking-[0.18em] text-ink-3 hover:text-ink">
              Filtrar por stack {stack.length > 0 && `(${stack.length})`}
            </summary>
            <div role="group" aria-label="Stack" className="mt-3 flex flex-wrap gap-2">
              {STACK_COUNTS.map(([s, n]) => (
                <Chip
                  key={s}
                  active={stack.includes(s)}
                  onClick={() =>
                    update((p) => {
                      const cur = p.getAll('stack')
                      p.delete('stack')
                      const next = cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]
                      next.forEach((x) => p.append('stack', x))
                    })
                  }
                >
                  {s} <span className="text-ink-3">{n}</span>
                </Chip>
              ))}
            </div>
          </details>
        )}
      </div>

      <p className="mt-8 text-sm text-ink-3" aria-live="polite">
        {list.length} {list.length === 1 ? 'projeto' : 'projetos'}
      </p>

      {list.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-line p-10 text-center text-ink-2">
          Nenhum projeto com esses filtros.{' '}
          <button
            type="button"
            onClick={() => setParams({}, { replace: true })}
            className="text-accent hover:underline"
          >
            Limpar filtros
          </button>
        </div>
      ) : (
        <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => (
            <li key={p.slug}>
              <ProjectCard project={p} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
