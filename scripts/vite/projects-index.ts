import { readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import type { Plugin } from 'vite'
import { parse } from 'yaml'

const ID = 'virtual:projects-index'
const RESOLVED = '\0' + ID

/**
 * Exporta só o frontmatter de src/content/projects/*.mdx.
 * Assim o índice (home, /projetos) não puxa o corpo dos MDX pro bundle principal;
 * o corpo é carregado lazy por projeto em src/lib/content.ts.
 */
export function projectsIndex(): Plugin {
  let dir = ''
  return {
    name: 'projects-index',
    configResolved(c) {
      dir = resolve(c.root, 'src/content/projects')
    },
    resolveId(id) {
      return id === ID ? RESOLVED : undefined
    },
    load(id) {
      if (id !== RESOLVED) return
      const entries = readdirSync(dir)
        .filter((f) => f.endsWith('.mdx'))
        .map((file) => {
          const path = join(dir, file)
          this.addWatchFile(path)
          const src = readFileSync(path, 'utf8')
          const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(src)
          const meta = m ? parse(m[1]) : {}
          return { ...meta, file }
        })
      return `export default ${JSON.stringify(entries)}`
    },
    configureServer(server) {
      // MDX criado/apagado muda o índice: invalida o módulo virtual e recarrega a página
      const onAddOrRemove = (file: string) => {
        if (!file.replaceAll('\\', '/').includes('/src/content/projects/') || !file.endsWith('.mdx')) return
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
