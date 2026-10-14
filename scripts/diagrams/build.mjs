#!/usr/bin/env node
// Gera public/projects/<slug>/architecture.svg a partir de scripts/diagrams/specs.mjs.
// Chave com barra ('<slug>/<nome>') gera um diagrama extra do post: public/projects/<slug>/<nome>.svg.
// Uso: node scripts/diagrams/build.mjs [slug...]   (filtrar por slug inclui os extras dele)
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { render } from './render.mjs'
import { specs } from './specs.mjs'

const only = process.argv.slice(2)
for (const [key, spec] of Object.entries(specs)) {
  const [slug, name = 'architecture'] = key.split('/')
  if (only.length && !only.includes(slug) && !only.includes(key)) continue
  const dir = join('public/projects', slug)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, `${name}.svg`), render(spec))
  console.log(`${slug}/${name}.svg`)
}
