#!/usr/bin/env node
// One-off: converte posts/*.html (site v1) em MDX (site v2).
//
// Uso:
//   node scripts/migrate-posts.mjs [--out <dir>]
// Deps (só para rodar a migração, não entram no bundle):
//   npm i -D turndown turndown-plugin-gfm linkedom
//
// O corpo é convertido automaticamente; o frontmatter vem de um JSON curado à mão (env META)
// com slug novo, categoria, tier, stack normalizada, métricas e resumo, indexado pelo nome do
// post antigo. Esse JSON e o pós-processamento de anonimização (SPEC §8) ficaram fora do repo
// de propósito: os dois citam os nomes reais que estão sendo removidos.
// Componentes MDX gerados: Callout, Metrics/Metric, Steps/Step, Card, CostCompare/CostBar,
// Instruction, Figure. Ver contrato na nota de status do time.

import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync, readdirSync } from 'node:fs'
import { join, basename, resolve } from 'node:path'
import TurndownService from 'turndown'
import { gfm } from 'turndown-plugin-gfm'
import { parseHTML } from 'linkedom'

const ROOT = process.cwd()
const outArg = process.argv.indexOf('--out')
const OUT = outArg > -1 ? resolve(process.argv[outArg + 1]) : ROOT
const META = JSON.parse(
  readFileSync(process.env.META || join(ROOT, 'scripts/migrate-posts.meta.json'), 'utf8'),
)

const attr = (v) => `{${JSON.stringify(v.replace(/\s+/g, ' ').trim())}}`
const block = (s) => `\n\n${s.trim()}\n\n`

function makeTurndown(ctx) {
  const td = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
    emDelimiter: '_',
  })
  td.use(gfm)

  // MDX: { } < precisam de escape fora de código.
  const baseEscape = td.escape.bind(td)
  td.escape = (s) => baseEscape(s).replace(/[{}<>]/g, (c) => '\\' + c)

  td.remove(['script', 'style', 'noscript'])

  const cls = (n) => (n.getAttribute && n.getAttribute('class')) || ''
  const has = (n, c) => n.nodeName === 'DIV' && cls(n).split(/\s+/).includes(c)

  // Turndown dá prioridade à regra adicionada por último, então o fallback vem primeiro.
  // Wrappers sem semântica: só passa o conteúdo.
  td.addRule('unwrap', {
    filter: (n) => n.nodeName === 'DIV',
    replacement: (content) => block(content),
  })

  td.addRule('fencedLang', {
    filter: (n) => n.nodeName === 'PRE' && n.firstChild && n.firstChild.nodeName === 'CODE',
    replacement: (_c, n) => {
      const code = n.firstChild
      const lang = (cls(code).match(/language-(\S+)/) || [])[1] || ''
      const text = code.textContent.replace(/\n$/, '')
      const fence = text.includes('```') ? '~~~~' : '```'
      return block(`${fence}${lang}\n${text}\n${fence}`)
    },
  })

  td.addRule('callout', {
    filter: (n) => has(n, 'callout') || has(n, 'tip') || has(n, 'warning'),
    replacement: (content, n) => {
      const c = cls(n)
      const type = /danger/.test(c)
        ? 'danger'
        : /warn/.test(c)
          ? 'warn'
          : /success|tip/.test(c)
            ? 'success'
            : 'info'
      return block(`<Callout type="${type}">\n\n${content.trim()}\n\n</Callout>`)
    },
  })

  td.addRule('metrics', {
    filter: (n) => n.nodeName === 'DIV' && Array.from(n.childNodes).some((c) => has(c, 'metric-card')),
    replacement: (_c, n) => {
      const items = [...n.querySelectorAll('.metric-card')].map((m) => {
        const v = m.querySelector('.metric-value')?.textContent || ''
        const l = m.querySelector('.metric-label')?.textContent || ''
        return `  <Metric value=${attr(v)} label=${attr(l)} />`
      })
      return block(`<Metrics>\n${items.join('\n')}\n</Metrics>`)
    },
  })

  td.addRule('stats', {
    filter: (n) => n.nodeName === 'DIV' && Array.from(n.childNodes).some((c) => has(c, 'stat')),
    replacement: (_c, n) => {
      const items = [...n.querySelectorAll('.stat')].map((m) => {
        const v = m.querySelector('.stat-value')?.textContent || ''
        const l = m.querySelector('.stat-label')?.textContent || ''
        return `  <Metric value=${attr(v)} label=${attr(l)} />`
      })
      return block(`<Metrics>\n${items.join('\n')}\n</Metrics>`)
    },
  })

  // títulos lidos pelo pai; o próprio nó some do corpo
  td.addRule('titles', {
    filter: (n) =>
      has(n, 'step-num') ||
      has(n, 'card-title') ||
      (has(n, 't') && n.parentNode && has(n.parentNode, 'print')) ||
      n.nodeName === 'SUMMARY',
    replacement: () => '',
  })

  td.addRule('step', {
    filter: (n) => has(n, 'step'),
    replacement: (content, n) => {
      const num = n.querySelector('.step-num')?.textContent.trim() || ''
      return block(`<Step n={${JSON.stringify(num)}}>

${content.trim()}

</Step>`)
    },
  })

  td.addRule('card', {
    filter: (n) => has(n, 'card'),
    replacement: (content, n) => {
      const title = n.querySelector('.card-title')?.textContent || ''
      return block(`<Card title=${attr(title)}>

${content.trim()}

</Card>`)
    },
  })

  td.addRule('cost', {
    filter: (n) => has(n, 'cost-comparison'),
    replacement: (_c, n) => {
      const bars = [...n.querySelectorAll('.cost-bar')].map((b) => {
        const label = b.querySelector('.cost-label')?.textContent || ''
        const fill = b.querySelector('.cost-fill')
        const value = fill?.textContent || ''
        const variant = /new/.test(fill?.getAttribute('class') || '') ? 'new' : 'old'
        const w = (fill?.getAttribute('style') || '').match(/width:\s*(\d+)/)
        const pct = w ? Number(w[1]) : variant === 'old' ? 100 : 10
        return `  <CostBar label=${attr(label)} value=${attr(value)} pct={${pct}} variant="${variant}" />`
      })
      return block(`<CostCompare>\n${bars.join('\n')}\n</CostCompare>`)
    },
  })

  td.addRule('instruction', {
    filter: (n) => has(n, 'print'),
    replacement: (content, n) => {
      const t = n.querySelector('.t')?.textContent || ''
      return block(`<Instruction title=${attr(t)}>

${content.trim()}

</Instruction>`)
    },
  })

  td.addRule('figure', {
    filter: (n) =>
      has(n, 'diagram-container') ||
      ((n.nodeName === 'IMG' || n.nodeName.toLowerCase() === 'svg') &&
        !n.parentNode?.closest?.('.diagram-container')),
    replacement: (_c, n) => {
      const cap = n.querySelector?.('.diagram-caption')?.textContent || ''
      const svg = n.nodeName.toLowerCase() === 'svg' ? n : n.querySelector?.('svg')
      const img = n.nodeName === 'IMG' ? n : n.querySelector?.('img')
      let src = ''
      let alt = cap
      if (svg) {
        ctx.svgN += 1
        const file = `diagram-${ctx.svgN}.svg`
        let xml = svg.outerHTML
        if (!/xmlns=/.test(xml)) xml = xml.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')
        ctx.assets.push({ kind: 'svg', file, xml })
        src = `/projects/${ctx.slug}/${file}`
        alt = alt || 'Diagrama de arquitetura'
      } else if (img) {
        const from = img.getAttribute('src') || ''
        const file = basename(from)
        ctx.assets.push({ kind: 'copy', file, from: resolve(ROOT, 'posts', from) })
        src = `/projects/${ctx.slug}/${file}`
        const a = img.getAttribute('alt') || ''
        alt = alt || (/Descrição do conteúdo/i.test(a) ? '' : a)
      } else return ''
      return block(
        `<Figure src="${src}" alt=${attr(alt || 'Figura')}${cap ? ` caption=${attr(cap)}` : ''} />`,
      )
    },
  })

  td.addRule('details', {
    filter: 'details',
    replacement: (content, n) => {
      const summary = (n.querySelector('summary')?.textContent || 'Detalhes').replace(/\s+/g, ' ').trim()
      return block(`<details>
<summary>${summary}</summary>

${content.trim()}

</details>`)
    },
  })

  return td
}

function yamlList(arr) {
  return `[${arr.map((s) => JSON.stringify(s)).join(', ')}]`
}

function frontmatter(m) {
  const lines = [
    '---',
    `title: ${JSON.stringify(m.title)}`,
    `slug: ${m.slug}`,
    `summary: ${JSON.stringify(m.summary)}`,
    `category: ${m.category}`,
    `tier: ${m.tier}`,
    `date: ${m.date}`,
    `stack: ${yamlList(m.stack)}`,
  ]
  if (m.metrics?.length) {
    lines.push('metrics:')
    for (const x of m.metrics) {
      const parts = [`label: ${JSON.stringify(x.label)}`]
      if (x.before) parts.push(`before: ${JSON.stringify(x.before)}`)
      parts.push(`after: ${JSON.stringify(x.after)}`)
      lines.push(`  - { ${parts.join(', ')} }`)
    }
  }
  lines.push(`cover: ${m.cover || `/projects/${m.slug}/architecture.svg`}`)
  if (m.repo) lines.push(`repo: ${m.repo}`)
  if (m.live) lines.push(`live: ${m.live}`)
  lines.push('---')
  return lines.join('\n')
}

function convert(file) {
  const legacy = basename(file, '.html')
  const meta = META[legacy]
  if (!meta) throw new Error(`sem metadata para ${legacy} em migrate-posts.meta.json`)
  const html = readFileSync(file, 'utf8')
  const { document } = parseHTML(html)
  const content = document.querySelector('.post-content')
  const ctx = { slug: meta.slug, svgN: 0, assets: [] }
  const td = makeTurndown(ctx)
  let body = td.turndown(content.innerHTML)
  body = body
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  for (const [from, to] of meta.replace || []) body = body.split(from).join(to)

  const mdx = `${frontmatter(meta)}\n\n${body}\n`
  const contentDir = join(OUT, 'src/content/projects')
  const pubDir = join(OUT, 'public/projects', meta.slug)
  mkdirSync(contentDir, { recursive: true })
  mkdirSync(pubDir, { recursive: true })
  writeFileSync(join(contentDir, `${meta.slug}.mdx`), mdx)
  for (const a of ctx.assets) {
    if (a.kind === 'svg') writeFileSync(join(pubDir, a.file), a.xml)
    else if (existsSync(a.from)) copyFileSync(a.from, join(pubDir, a.file))
    else console.warn(`  ! asset ausente: ${a.from}`)
  }
  console.log(`${legacy} -> ${meta.slug}.mdx (${ctx.assets.length} assets)`)
}

const files = readdirSync(join(ROOT, 'posts'))
  .filter((f) => f.endsWith('.html') && f !== 'TEMPLATE.html')
  .map((f) => join(ROOT, 'posts', f))
for (const f of files) convert(f)
