import type { ComponentType } from 'react'
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
}

const metas = import.meta.glob<ProjectMeta>('../content/projects/*.mdx', {
  eager: true,
  import: 'frontmatter',
})

const bodies = import.meta.glob<{ default: ComponentType }>('../content/projects/*.mdx')

function toDateString(d: unknown): string {
  return d instanceof Date ? d.toISOString().slice(0, 10) : String(d ?? '')
}

/** Índice de projetos, mais recente primeiro. */
export const projects: ProjectMeta[] = Object.entries(metas)
  .map(([path, m]) => ({
    ...m,
    slug:
      m.slug ??
      path
        .split('/')
        .pop()!
        .replace(/\.mdx$/, ''),
    date: toDateString(m.date),
    stack: m.stack ?? [],
  }))
  .sort((a, b) => b.date.localeCompare(a.date))

const pathBySlug = new Map(
  Object.entries(metas).map(([path, m]) => [
    m.slug ??
      path
        .split('/')
        .pop()!
        .replace(/\.mdx$/, ''),
    path,
  ]),
)

export function getProject(slug: string): ProjectMeta | undefined {
  return projects.find((p) => p.slug === slug)
}

export function loadProjectBody(slug: string): Promise<{ default: ComponentType }> | undefined {
  const path = pathBySlug.get(slug)
  return path ? bodies[path]() : undefined
}

export const featured = projects.filter((p) => p.tier === 'A').slice(0, 6)

export const stats = {
  projects: projects.length,
  awsServices: new Set(projects.flatMap((p) => p.stack).filter(isAwsService)).size,
  certifications: 3,
}
