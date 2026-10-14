import { useEffect } from 'react'
import { absolute, type SeoMeta } from './seoMeta'

/** Atualiza (ou cria uma vez) a tag do head; nunca duplica. */
function upsert(selector: string, create: () => HTMLElement, attr: string, value: string) {
  let el = document.head.querySelector<HTMLElement>(selector)
  if (!el) {
    el = create()
    document.head.appendChild(el)
  }
  el.setAttribute(attr, value)
}

const meta = (key: 'name' | 'property', name: string) => () => {
  const el = document.createElement('meta')
  el.setAttribute(key, name)
  return el
}

/**
 * SEO por rota sem lib: reaproveita as tags do index.html (title, description, og:*, twitter:*,
 * canonical) e só troca o conteúdo. Os crawlers recebem o mesmo via dist/<rota>/index.html.
 */
export function useSeo(m: SeoMeta, { noindex = false } = {}) {
  const { title, description, image, path } = m
  useEffect(() => {
    document.title = title
    upsert('meta[name="description"]', meta('name', 'description'), 'content', description)
    upsert('meta[property="og:title"]', meta('property', 'og:title'), 'content', title)
    upsert('meta[property="og:description"]', meta('property', 'og:description'), 'content', description)
    upsert('meta[property="og:image"]', meta('property', 'og:image'), 'content', absolute(image))
    upsert('meta[property="og:url"]', meta('property', 'og:url'), 'content', absolute(path))
    upsert('meta[name="twitter:card"]', meta('name', 'twitter:card'), 'content', 'summary_large_image')
    upsert(
      'link[rel="canonical"]',
      () => Object.assign(document.createElement('link'), { rel: 'canonical' }),
      'href',
      absolute(path),
    )
    upsert('meta[name="robots"]', meta('name', 'robots'), 'content', noindex ? 'noindex' : 'index, follow')
  }, [title, description, image, path, noindex])
}
