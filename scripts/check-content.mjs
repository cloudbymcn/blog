#!/usr/bin/env node
// Valida src/content/projects/*.mdx: compila o MDX, confere o frontmatter (SPEC §5),
// o vocabulário de stack (src/lib/stack.ts, SPEC §7) e se cover/Figure apontam pra arquivo existente.
// Uso: node scripts/check-content.mjs
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { compile } from '@mdx-js/mdx'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import { parse as parseYaml } from 'yaml'

const DIR = 'src/content/projects'
const CATEGORIES = ['cloud', 'integracoes', 'ia', 'produtos', 'ferramentas']
const COMPONENTS = [
  'Callout',
  'Metrics',
  'Metric',
  'Steps',
  'Step',
  'Card',
  'CostCompare',
  'CostBar',
  'Instruction',
  'Figure',
]

// vocabulário: todas as strings entre aspas dentro do objeto STACK
const stackSrc = readFileSync('src/lib/stack.ts', 'utf8')
const stackBlock = stackSrc.slice(stackSrc.indexOf('export const STACK'), stackSrc.indexOf('} as const'))
const VOCAB = new Set([...stackBlock.replace(/'[^']*'\s*:/g, '').matchAll(/'([^']+)'/g)].map((m) => m[1]))

const errors = []
const err = (file, msg) => errors.push(`${file}: ${msg}`)
const files = readdirSync(DIR).filter((f) => f.endsWith('.mdx') && !f.startsWith('_'))
const slugs = new Set()
const unknownStack = new Map()

for (const file of files) {
  const src = readFileSync(join(DIR, file), 'utf8')
  const fm = src.match(/^---\n([\s\S]*?)\n---/)
  if (!fm) {
    err(file, 'sem frontmatter')
    continue
  }
  let m
  try {
    m = parseYaml(fm[1])
  } catch (e) {
    err(file, `YAML inválido: ${e.message}`)
    continue
  }
  for (const k of ['title', 'slug', 'summary', 'category', 'tier', 'date', 'stack', 'cover']) {
    if (m[k] === undefined || m[k] === '') err(file, `campo obrigatório ausente: ${k}`)
  }
  if (m.slug && `${m.slug}.mdx` !== file) err(file, `slug "${m.slug}" ≠ nome do arquivo`)
  if (slugs.has(m.slug)) err(file, `slug duplicado: ${m.slug}`)
  slugs.add(m.slug)
  if (m.category && !CATEGORIES.includes(m.category)) err(file, `category inválida: ${m.category}`)
  if (m.tier && !['A', 'B'].includes(m.tier)) err(file, `tier inválido: ${m.tier}`)
  for (const s of m.stack || []) {
    if (!VOCAB.has(s)) unknownStack.set(s, [...(unknownStack.get(s) || []), m.slug])
  }
  for (const x of m.metrics || []) {
    if (!x.label || !x.after) err(file, `metric sem label/after: ${JSON.stringify(x)}`)
  }
  if (m.summary && m.summary.length > 200) err(file, `summary com ${m.summary.length} chars (máx 200)`)

  const assets = [m.cover, ...[...src.matchAll(/<Figure src="([^"]+)"/g)].map((x) => x[1])].filter(Boolean)
  for (const a of assets) {
    if (a.startsWith('/') && !existsSync(join('public', a))) err(file, `arquivo ausente: public${a}`)
  }

  const prose = src.replace(/^(```|~~~~)[\s\S]*?^\1/gm, '').replace(/`[^`\n]*`/g, '')
  for (const tag of prose.matchAll(/<([A-Z][A-Za-z]+)[\s/>]/g)) {
    if (!COMPONENTS.includes(tag[1])) err(file, `componente MDX fora do contrato: <${tag[1]}>`)
  }

  try {
    await compile(src, { remarkPlugins: [remarkFrontmatter, remarkGfm] })
  } catch (e) {
    err(file, `MDX não compila: ${e.message}`)
  }
}

for (const [s, where] of unknownStack) err('stack', `"${s}" fora do vocabulário (${where.join(', ')})`)

if (errors.length) {
  console.error(errors.join('\n'))
  console.error(`\ncheck-content: ${errors.length} problema(s) em ${files.length} arquivo(s)`)
  process.exit(1)
}
console.log(`check-content: ${files.length} projetos ok`)
