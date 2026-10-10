/**
 * Textos de SEO/OG por rota. Sem dependência de browser: usado pelo hook useSeo (runtime) e pelo
 * plugin scripts/vite/static-pages.ts (gera dist/<rota>/index.html com as metas pros crawlers).
 */
export const SITE = 'https://cloudbymcn.com'
export const DEFAULT_IMAGE = '/og.png'
const BRAND = 'Cloud by MCN'

export interface SeoMeta {
  title: string
  description: string
  /** caminho absoluto no site (/og.png, /projects/<slug>/cover.webp) */
  image: string
  /** rota canônica (/projetos/<slug>) */
  path: string
}

export const PAGES = {
  '/': {
    title: `Matheus Nascimento · ${BRAND}`,
    description:
      'Arquiteturas AWS reais, decisões técnicas e implementações completas. Portfolio de Matheus Nascimento.',
    image: DEFAULT_IMAGE,
    path: '/',
  },
  '/projetos': {
    title: `Projetos · ${BRAND}`,
    description: 'Case studies de arquitetura AWS, integrações, IA aplicada e produtos em produção.',
    image: DEFAULT_IMAGE,
    path: '/projetos',
  },
  '/contato': {
    title: `Contato · ${BRAND}`,
    description:
      'Arquitetura AWS, integrações, automação ou IA aplicada: LinkedIn, GitHub, Instagram e e-mail.',
    image: DEFAULT_IMAGE,
    path: '/contato',
  },
} satisfies Record<string, SeoMeta>

/** Meta de um projeto: cover.webp (se existir) + summary. */
export function projectSeo(p: { title: string; summary: string; slug: string; image?: string }): SeoMeta {
  return {
    title: `${p.title} · ${BRAND}`,
    description: p.summary,
    image: p.image ?? DEFAULT_IMAGE,
    path: `/projetos/${p.slug}`,
  }
}

/** 404: não indexar. */
export const NOT_FOUND: SeoMeta = {
  title: `Página não encontrada · ${BRAND}`,
  description: PAGES['/'].description,
  image: DEFAULT_IMAGE,
  path: '/404',
}

export const absolute = (path: string) => `${SITE}${path}`
