#!/usr/bin/env node
// Gera public/projects/<slug>/architecture.svg a partir de scripts/diagrams/specs.mjs.
// Uso: node scripts/diagrams/build.mjs [slug...]
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { render } from './render.mjs'
import { specs } from './specs.mjs'

const only = process.argv.slice(2)
for (const [slug, spec] of Object.entries(specs)) {
  if (only.length && !only.includes(slug)) continue
  const dir = join('public/projects', slug)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'architecture.svg'), render(spec))
  console.log(`${slug}/architecture.svg`)
}
