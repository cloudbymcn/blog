import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import type { Plugin, ResolvedConfig } from 'vite'
import { NOT_FOUND, PAGES, absolute, projectSeo, type SeoMeta } from '../../src/lib/seoMeta'
import { readProjects } from './projects-index'

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Troca título, description, og:*, canonical (e robots) do index.html pelas metas da rota. */
function withMeta(html: string, m: SeoMeta, noindex = false) {
  const attr = (selector: RegExp, value: string) => {
    if (!selector.test(html)) throw new Error(`static-pages: tag não encontrada no index.html: ${selector}`)
    html = html.replace(selector, `$1${esc(value)}$2`)
  }
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(m.title)}</title>`)
  attr(/(<meta\s+name="description"\s+content=")[^"]*(")/, m.description)
  attr(/(<meta\s+property="og:title"\s+content=")[^"]*(")/, m.title)
  attr(/(<meta\s+property="og:description"\s+content=")[^"]*(")/, m.description)
  attr(/(<meta\s+property="og:image"\s+content=")[^"]*(")/, absolute(m.image))
  attr(/(<meta\s+property="og:url"\s+content=")[^"]*(")/, absolute(m.path))
  attr(/(<link\s+rel="canonical"\s+href=")[^"]*(")/, absolute(m.path))
  if (noindex) html = html.replace('</head>', '    <meta name="robots" content="noindex" />\n  </head>')
  return html
}

function write(outDir: string, rel: string, html: string) {
  const file = join(outDir, rel)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, html)
}

/** Página estática de redirect (GitHub Pages não tem redirect server-side). */
function redirectHtml(to: string) {
  const url = to.startsWith('/') ? absolute(to) : to
  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <title>Redirecionando…</title>
    <link rel="canonical" href="${esc(url)}" />
    <meta name="robots" content="noindex" />
    <meta http-equiv="refresh" content="0;url=${esc(to)}" />
    <script>location.replace(${JSON.stringify(to)})</script>
  </head>
  <body>
    <p><a href="${esc(to)}">Continuar para ${esc(to)}</a></p>
  </body>
</html>
`
}

/**
 * Build: (1) dist/<rota>/index.html pra /projetos, /sobre, /contato e cada /projetos/<slug>, com
 * title/description/og/canonical da rota (crawler de rede social não roda JS; e o GitHub Pages
 * passa a responder 200 nessas rotas); (2) dist/404.html com noindex (fallback da SPA);
 * (3) redirects de scripts/redirects.json ({from,to}[]) como HTML com refresh + canonical + replace.
 */
export function staticPages(): Plugin {
  let config: ResolvedConfig
  return {
    name: 'static-pages',
    apply: 'build',
    configResolved(c) {
      config = c
    },
    closeBundle() {
      const outDir = resolve(config.root, config.build.outDir)
      const index = readFileSync(join(outDir, 'index.html'), 'utf8')
      const generated = new Set<string>(['index.html', '404.html'])

      const routes: [string, SeoMeta][] = [
        ['projetos/index.html', PAGES['/projetos']],
        ['contato/index.html', PAGES['/contato']],
      ]
      const projects = readProjects(resolve(config.root, 'src/content/projects'), config.publicDir)
      for (const p of projects) {
        routes.push([
          `projetos/${p.slug}/index.html`,
          projectSeo({ title: String(p.title), summary: String(p.summary), slug: p.slug, image: p.image }),
        ])
      }
      for (const [rel, meta] of routes) {
        write(outDir, rel, withMeta(index, meta))
        generated.add(rel)
      }
      write(outDir, '404.html', withMeta(index, NOT_FOUND, true))

      const file = resolve(config.root, 'scripts/redirects.json')
      let redirects = 0
      if (existsSync(file)) {
        const list = JSON.parse(readFileSync(file, 'utf8')) as { from: string; to: string }[]
        for (const { from, to } of list) {
          if (!from?.startsWith('/') || !(to?.startsWith('/') || to?.startsWith('https://'))) {
            config.logger.warn(`static-pages: redirect inválido ignorado: ${from} -> ${to}`)
            continue
          }
          const rel = from.endsWith('/') ? `${from.slice(1)}index.html` : from.slice(1)
          if (generated.has(rel)) {
            // ex.: /index.html -> / (o próprio app já responde nesse caminho)
            config.logger.warn(`static-pages: redirect ${from} colide com página gerada, ignorado`)
            continue
          }
          write(outDir, rel, redirectHtml(to))
          redirects++
        }
      }
      config.logger.info(
        `static-pages: ${routes.length} rotas com meta própria, 404.html, ${redirects} redirects`,
      )
    },
  }
}
