import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import type { Plugin } from 'vite'
import { parse } from 'yaml'

const ID = 'virtual:projects-index'
const RESOLVED = '\0' + ID

/** Arquivos que mudam o índice: MDX dos projetos e covers em public/projects/<slug>/cover.webp. */
function affectsIndex(file: string) {
  const f = file.replaceAll('\\', '/')
  return (
    (f.includes('/src/content/projects/') && f.endsWith('.mdx')) ||
    (f.includes('/public/projects/') && f.endsWith('/cover.webp'))
  )
}

export interface ProjectEntry extends Record<string, unknown> {
  file: string
  slug: string
  image?: string
  coverInBody: boolean
}

/** Lê o frontmatter de cada MDX (também usado pelo static-pages no build). */
export function readProjects(
  dir: string,
  publicDir: string,
  onFile?: (path: string) => void,
): ProjectEntry[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.mdx'))
    .map((file) => {
      const path = join(dir, file)
      onFile?.(path)
      const src = readFileSync(path, 'utf8')
      const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(src)
      const meta = (m ? parse(m[1]) : {}) as Record<string, unknown>
      const slug = typeof meta.slug === 'string' ? meta.slug : file.replace(/\.mdx$/, '')
      const image = existsSync(join(publicDir, 'projects', slug, 'cover.webp'))
        ? `/projects/${slug}/cover.webp`
        : undefined
      // o SVG de arquitetura já aparece no corpo? (senão a página mostra ele no topo do corpo)
      const coverInBody = typeof meta.cover === 'string' && src.split(meta.cover).length > 2
      return { ...meta, file, slug, image, coverInBody }
    })
}

/**
 * Exporta só o frontmatter de src/content/projects/*.mdx.
 * Assim o índice (home, /projetos) não puxa o corpo dos MDX pro bundle principal;
 * o corpo é carregado lazy por projeto em src/lib/content.ts.
 *
 * `image`: /projects/<slug>/cover.webp quando o arquivo existe (print real ou gerado, SPEC §0-bis).
 * O `cover` do frontmatter (SVG de arquitetura) continua só como fallback e no corpo.
 */
export function projectsIndex(): Plugin {
  let dir = ''
  let publicDir = ''
  return {
    name: 'projects-index',
    configResolved(c) {
      dir = resolve(c.root, 'src/content/projects')
      publicDir = c.publicDir
    },
    resolveId(id) {
      return id === ID ? RESOLVED : undefined
    },
    load(id) {
      if (id !== RESOLVED) return
      const entries = readProjects(dir, publicDir, (path) => this.addWatchFile(path))
      return `export default ${JSON.stringify(entries)}`
    },
    configureServer(server) {
      // MDX ou cover criado/apagado muda o índice: invalida o módulo virtual e recarrega a página
      const onAddOrRemove = (file: string) => {
        if (!affectsIndex(file)) return
        const mod = server.moduleGraph.getModuleById(RESOLVED)
        if (mod) server.moduleGraph.invalidateModule(mod)
        server.ws.send({ type: 'full-reload' })
      }
      server.watcher.on('add', onAddOrRemove)
      server.watcher.on('unlink', onAddOrRemove)
    },
    handleHotUpdate({ file, server }) {
      if (file.replaceAll('\\', '/').includes('/src/content/projects/') && file.endsWith('.mdx')) {
        const mod = server.moduleGraph.getModuleById(RESOLVED)
        if (mod) server.moduleGraph.invalidateModule(mod)
      }
    },
  }
}
