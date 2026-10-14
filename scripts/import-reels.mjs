// Modo manual (sem token): gera public/reels/ + src/content/reels.json a partir de vídeos numa pasta.
//
//   npm run reels:import -- <pasta>
//
// Ordem no site = ordem alfabética dos arquivos (use 01-..., 02-... pra escolher). Formatos: mp4, mov,
// m4v, webm. Link e legenda de cada reel (opcional) num <pasta>/reels.json:
//   { "01-meu-reel.mp4": { "permalink": "https://www.instagram.com/reel/XXXX/", "caption": "texto" } }
// Sem link, o clique abre a aba de reels do perfil. A pasta substitui a lista inteira.
import fs from 'node:fs'
import path from 'node:path'
import {
  checkFfmpeg,
  commitReels,
  encodeVideo,
  entryFor,
  makePoster,
  makeStaging,
  PROFILE_REELS,
  safeId,
} from './reels-lib.mjs'

const dir = process.argv[2]
if (!dir || !fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
  console.error('uso: npm run reels:import -- <pasta com os vídeos>')
  process.exit(1)
}

const manifestPath = path.join(dir, 'reels.json')
const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : {}
const files = fs
  .readdirSync(dir)
  .filter((f) => /\.(mp4|mov|m4v|webm)$/i.test(f))
  .sort((a, b) => a.localeCompare(b, 'pt-BR', { numeric: true }))

if (files.length === 0) {
  console.error(`nenhum vídeo em ${dir}`)
  process.exit(1)
}

function permalinkOf(meta) {
  const url = meta?.permalink
  if (!url) return PROFILE_REELS
  if (!/^https:\/\/(www\.)?instagram\.com\//.test(url))
    throw new Error(`permalink fora do instagram.com: ${url}`)
  return url
}

try {
  checkFfmpeg()
  const staging = makeStaging()
  const entries = []
  const ids = new Set()
  for (const f of files) {
    let id = safeId(path.parse(f).name)
    while (ids.has(id)) id = `${id}-2`
    ids.add(id)
    console.log(`- ${f} -> ${id}`)
    const src = path.join(dir, f)
    encodeVideo(src, path.join(staging, `${id}.mp4`))
    makePoster(path.join(staging, `${id}.mp4`), path.join(staging, `${id}.webp`), { fromVideo: true })
    entries.push(entryFor(id, permalinkOf(manifest[f]), manifest[f]?.caption))
  }
  commitReels(entries, staging)
} catch (e) {
  console.error(`import-reels: ${e.message}`)
  process.exit(1)
}
