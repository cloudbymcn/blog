// Partes comuns de fetch-reels.mjs (Instagram API) e import-reels.mjs (pasta local):
// compressão com ffmpeg, poster webp, legenda segura pro scrub-check e troca atômica de
// public/reels/ + src/content/reels.json (só mexe nos arquivos do site se tudo deu certo).
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

export const ROOT = process.cwd()
export const OUT_DIR = path.join(ROOT, 'public', 'reels')
export const JSON_PATH = path.join(ROOT, 'src', 'content', 'reels.json')
export const PROFILE_REELS = 'https://www.instagram.com/cloudbymcn/reels/'

const FFMPEG = process.env.FFMPEG || 'ffmpeg'
// 720 de largura no máximo (720x1280 num reel), sem áudio, corte nos primeiros N segundos:
// com teto de ~700 kbps um reel de 20s fica em ~1-2 MB
const MAX_SECONDS = Number(process.env.REELS_MAX_SECONDS || 20)
const MAX_RATE = process.env.REELS_MAX_RATE || '700k'
const SCALE = "scale='min(720,iw)':-2:flags=lanczos"

function ffmpeg(args) {
  const r = spawnSync(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-y', ...args], { encoding: 'utf8' })
  if (r.error)
    throw new Error(`ffmpeg não encontrado (${r.error.message}). Instale ou aponte FFMPEG=<caminho>.`)
  if (r.status !== 0)
    throw new Error(`ffmpeg falhou: ${(r.stderr || '').trim().split('\n').slice(-3).join(' | ')}`)
}

export function checkFfmpeg() {
  ffmpeg(['-version'])
}

/** mp4 H.264 mudo, faststart (começa a tocar antes de baixar tudo), 30 fps, até 720 de largura. */
export function encodeVideo(input, output) {
  ffmpeg([
    '-i',
    input,
    '-t',
    String(MAX_SECONDS),
    '-an',
    '-vf',
    `${SCALE},fps=30`,
    '-c:v',
    'libx264',
    '-profile:v',
    'high',
    '-preset',
    'slow',
    '-crf',
    '28',
    '-maxrate',
    MAX_RATE,
    '-bufsize',
    `${parseInt(MAX_RATE, 10) * 2}k`,
    '-pix_fmt',
    'yuv420p',
    '-movflags',
    '+faststart',
    output,
  ])
}

/** Poster webp a partir da thumb (imagem) ou do vídeo (frame em 0,5s). */
export function makePoster(input, output, { fromVideo = false } = {}) {
  ffmpeg([
    ...(fromVideo ? ['-ss', '0.5'] : []),
    '-i',
    input,
    '-frames:v',
    '1',
    '-vf',
    SCALE,
    '-c:v',
    'libwebp',
    '-quality',
    '76',
    output,
  ])
}

export function safeId(raw) {
  const id = String(raw)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
  if (!id) throw new Error(`id inválido: ${raw}`)
  return id
}

// mesmas regras do scripts/scrub-check.mjs que fazem sentido numa legenda: se bater, a legenda sai
// vazia (o reel continua) em vez de derrubar o `npm run check` do deploy
const forbidden = (() => {
  const file = path.join(ROOT, 'scripts', 'forbidden-terms.txt')
  if (!fs.existsSync(file)) return []
  return fs
    .readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
    .map(
      (t) =>
        new RegExp(
          `(?<![\\p{L}\\p{N}_])${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\p{N}_])`,
          'iu',
        ),
    )
})()
const structural = [
  /\b\d{12}\b/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/,
  /\b(?:\d{1,3}\.){3}\d{1,3}\b/,
  /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/,
  /[a-zA-Z0-9.-]*vitoriastone\.com/i,
  /\bVS\b(?!\s*Code)/,
]

export function safeCaption(text) {
  const clean = String(text ?? '')
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .trim()
    .slice(0, 300)
  if ([...forbidden, ...structural].some((re) => re.test(clean))) {
    console.warn('  legenda descartada (bateu numa regra do scrub-check)')
    return ''
  }
  return clean
}

export function readReels() {
  try {
    const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'))
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export function makeStaging() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'reels-'))
}

/**
 * Publica o resultado: copia os arquivos novos do staging pra public/reels/, apaga os que não estão
 * mais na lista e reescreve o reels.json. Só roda depois de todos os reels terem dado certo.
 */
export function commitReels(entries, staging) {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  for (const f of fs.readdirSync(staging)) fs.copyFileSync(path.join(staging, f), path.join(OUT_DIR, f))
  const keep = new Set(entries.flatMap((e) => [path.basename(e.video), path.basename(e.poster)]))
  for (const f of fs.readdirSync(OUT_DIR)) {
    if (!keep.has(f) && /\.(mp4|webp)$/.test(f)) fs.rmSync(path.join(OUT_DIR, f))
  }
  fs.writeFileSync(JSON_PATH, `${JSON.stringify(entries, null, 2)}\n`)
  fs.rmSync(staging, { recursive: true, force: true })
  const bytes = entries.reduce((s, e) => s + fs.statSync(path.join(OUT_DIR, path.basename(e.video))).size, 0)
  console.log(
    `${entries.length} reels em public/reels/ (${(bytes / 1048576).toFixed(1)} MB de vídeo) + src/content/reels.json`,
  )
}

export function entryFor(id, permalink, caption) {
  return {
    id,
    permalink,
    caption: safeCaption(caption),
    video: `/reels/${id}.mp4`,
    poster: `/reels/${id}.webp`,
  }
}

/** Reel já publicado com os dois arquivos no lugar: reaproveita sem baixar/comprimir de novo. */
export function alreadyBuilt(id) {
  return fs.existsSync(path.join(OUT_DIR, `${id}.mp4`)) && fs.existsSync(path.join(OUT_DIR, `${id}.webp`))
}
