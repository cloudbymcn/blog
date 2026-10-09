import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import index from 'virtual:projects-index' // só frontmatter (scripts/vite/projects-index.ts)
import { CERTS } from './certs'
import { isAwsService } from './stack'

export type Category = 'cloud' | 'integracoes' | 'ia' | 'produtos' | 'ferramentas'

export const CATEGORIES: Record<Category, string> = {
  cloud: 'Cloud',
  integracoes: 'Integrações',
  ia: 'IA',
  produtos: 'Produtos',
  ferramentas: 'Ferramentas',
}

export interface Metric {
  label: string
  before: string
  after: string
}

/** Cover animado (loop curto, sem áudio): webm/mp4 em <video>, gif como último recurso. */
export interface CoverVideo {
  webm?: string
  mp4?: string
  gif?: string
}

/** Frontmatter de `src/content/projects/<slug>.mdx` (SPEC §5). */
export interface ProjectMeta {
  title: string
  slug: string
  summary: string
  category: Category
  tier: 'A' | 'B'
  date: string
  stack: string[]
  metrics?: Metric[]
  cover?: string
  repo?: string
  live?: string
  /** calculado no build: /projects/<slug>/cover.webp quando existe (imagem do card e do hero) */
  image?: string
  /** calculado no build: cover animado em public/projects/<slug>/ (só os formatos que existem) */
  video?: CoverVideo
  /** calculado no build: o SVG de `cover` já é referenciado no corpo do MDX */
  coverInBody?: boolean
}

const bodies = import.meta.glob<{ default: ComponentType }>('../content/projects/*.mdx')

function toDateString(d: unknown): string {
  return d instanceof Date ? d.toISOString().slice(0, 10) : String(d ?? '')
}

const entries = index.map(({ file, ...raw }) => {
  const m = raw as Partial<ProjectMeta>
  const meta = {
    ...m,
    slug: m.slug ?? file.replace(/\.mdx$/, ''),
    date: toDateString(m.date),
    stack: m.stack ?? [],
  } as ProjectMeta
  return { meta, path: `../content/projects/${file}` }
})

/** Índice de projetos, mais recente primeiro. */
export const projects: ProjectMeta[] = entries.map((e) => e.meta).sort((a, b) => b.date.localeCompare(a.date))

export function getProject(slug: string): ProjectMeta | undefined {
  return projects.find((p) => p.slug === slug)
}

/** Corpo MDX de cada projeto como componente lazy (um chunk por projeto). */
export const projectBodies: Record<string, LazyExoticComponent<ComponentType>> = Object.fromEntries(
  entries.filter((e) => bodies[e.path]).map((e) => [e.meta.slug, lazy(bodies[e.path])]),
)

export const featured = projects.filter((p) => p.tier === 'A').slice(0, 6)

export const stats = {
  projects: projects.length,
  awsServices: new Set(projects.flatMap((p) => p.stack).filter(isAwsService)).size,
  certifications: CERTS.length,
}
