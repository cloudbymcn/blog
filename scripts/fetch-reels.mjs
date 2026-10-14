// Busca os últimos reels do @cloudbymcn pela Instagram API with Instagram Login e gera
// public/reels/<id>.{mp4,webp} + src/content/reels.json. Passo a passo do token: docs/INSTAGRAM-REELS.md.
//
//   IG_TOKEN=<long-lived token> npm run reels:fetch
//
// Variáveis: IG_TOKEN (obrigatória; sem ela o script não faz nada), REELS_COUNT (padrão 8),
// IG_TOKEN_OUT (arquivo onde gravar o token renovado; o CI usa pra atualizar o secret),
// REELS_SKIP_REFRESH=1, REELS_MAX_SECONDS (20), REELS_MAX_RATE (700k), FFMPEG (caminho do binário).
// O token nunca é impresso: os logs e erros mostram só caminho e mensagem da API.
import fs from 'node:fs'
import path from 'node:path'
import {
  alreadyBuilt,
  checkFfmpeg,
  commitReels,
  encodeVideo,
  entryFor,
  makePoster,
  makeStaging,
  safeId,
} from './reels-lib.mjs'

const API = 'https://graph.instagram.com'
const FIELDS = 'id,media_type,media_product_type,media_url,thumbnail_url,permalink,caption,timestamp'
const COUNT = Math.max(1, Number(process.env.REELS_COUNT || 8))
const MAX_PAGES = 6

let token = process.env.IG_TOKEN?.trim()
if (!token) {
  console.log('IG_TOKEN não definido: nada a buscar (o site usa os arquivos já commitados).')
  process.exit(0)
}

/** GET na Graph API; erro vira mensagem sem a URL (que leva o token). */
async function graph(url) {
  const res = await fetch(url)
  const body = await res.json().catch(() => ({}))
  if (!res.ok || body.error) {
    const e = body.error ?? {}
    throw new Error(`Instagram API ${res.status}: ${e.message ?? res.statusText} (code ${e.code ?? '?'})`)
  }
  return body
}

async function download(url, file) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`download falhou (${res.status})`)
  fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()))
}

/** Long-lived token vale 60 dias; renovar (com mais de 24h de vida) devolve outro de 60 dias. */
async function refreshToken() {
  if (process.env.REELS_SKIP_REFRESH) return
  try {
    const r = await graph(`${API}/refresh_access_token?grant_type=ig_refresh_token&access_token=${token}`)
    const changed = r.access_token !== token
    token = r.access_token
    const days = Math.round((r.expires_in ?? 0) / 86400)
    console.log(`token renovado: vale mais ${days} dias${changed ? ' (valor novo)' : ''}`)
    if (process.env.IG_TOKEN_OUT) {
      fs.writeFileSync(process.env.IG_TOKEN_OUT, token, { mode: 0o600 })
    }
  } catch (e) {
    // token novo (<24h) ou já vencido: segue com o atual; se vencido, a listagem falha logo abaixo
    console.warn(`refresh do token não rolou: ${e.message}`)
  }
}

async function latestReels() {
  const found = []
  let url = `${API}/me/media?fields=${FIELDS}&limit=50&access_token=${token}`
  for (let page = 0; url && page < MAX_PAGES && found.length < COUNT; page++) {
    const body = await graph(url)
    for (const m of body.data ?? []) {
      // media_url some quando o reel tem música com direitos autorais: esse fica de fora
      if (m.media_product_type === 'REELS' && m.media_type === 'VIDEO' && m.media_url) found.push(m)
      if (found.length >= COUNT) break
    }
    url = body.paging?.next
  }
  return found
}

async function main() {
  checkFfmpeg()
  await refreshToken()
  const media = await latestReels()
  if (media.length === 0) {
    console.log('nenhum reel com vídeo disponível na conta: reels.json fica como está.')
    return
  }

  const staging = makeStaging()
  const entries = []
  for (const m of media) {
    const id = safeId(m.id)
    console.log(`- ${id} ${m.timestamp ?? ''}`)
    if (!alreadyBuilt(id)) {
      const raw = path.join(staging, `${id}.src.mp4`)
      await download(m.media_url, raw)
      encodeVideo(raw, path.join(staging, `${id}.mp4`))
      let poster = false
      if (m.thumbnail_url) {
        const thumb = path.join(staging, `${id}.thumb.jpg`)
        try {
          await download(m.thumbnail_url, thumb)
          makePoster(thumb, path.join(staging, `${id}.webp`))
          poster = true
        } catch (e) {
          console.warn(`  thumb falhou (${e.message}), poster sai do vídeo`)
        }
        fs.rmSync(thumb, { force: true })
      }
      if (!poster)
        makePoster(path.join(staging, `${id}.mp4`), path.join(staging, `${id}.webp`), { fromVideo: true })
      fs.rmSync(raw, { force: true })
    }
    entries.push(entryFor(id, m.permalink, m.caption))
  }
  commitReels(entries, staging)
}

main().catch((e) => {
  console.error(`fetch-reels: ${e.message}`)
  process.exit(1)
})
