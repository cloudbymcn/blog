import fs from 'node:fs'
import path from 'node:path'

const ROOT_DIR = process.cwd()
const DIRS_TO_SCAN = ['src', 'public', 'docs']
const IGNORED_FILES = new Set([path.normalize('docs/SPEC-FRONTEND-V2.md')])
function isIgnored(relPath) {
  const norm = path.normalize(relPath)
  if (IGNORED_FILES.has(norm)) return true
  if (norm.startsWith(path.normalize('docs/lighthouse-report')) || norm.startsWith('docs\\lighthouse-report'))
    return true
  if (norm.startsWith(path.normalize('docs/qa-screenshots')) || norm.startsWith('docs\\qa-screenshots'))
    return true
  if (norm.startsWith(path.normalize('docs/qa')) || norm.startsWith('docs\\qa')) return true
  return false
}

const BINARY_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.avif',
  '.gif',
  '.ico',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
  '.mp4',
  '.pdf',
  '.zip',
])

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Carregar termos proibidos de scripts/forbidden-terms.txt
const forbiddenTermsPath = path.join(ROOT_DIR, 'scripts', 'forbidden-terms.txt')
if (!fs.existsSync(forbiddenTermsPath)) {
  console.error(`[ERROR] Arquivo de termos proibidos não encontrado: ${forbiddenTermsPath}`)
  process.exit(1)
}

const rawTerms = fs
  .readFileSync(forbiddenTermsPath, 'utf8')
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith('#'))

const forbiddenTermPatterns = rawTerms.map((term) => ({
  name: `Termo proibido: "${term}"`,
  regex: new RegExp(`(?<![\\p{L}\\p{N}_])${escapeRegex(term)}(?![\\p{L}\\p{N}_])`, 'iu'),
}))

// Padrões estruturais obrigatórios da SPEC §8
const structuralPatterns = [
  {
    name: 'AWS Account ID (12 dígitos)',
    regex: /\b\d{12}\b/,
  },
  {
    name: 'AWS ARN real ou sensível',
    regex: /\barn:aws[a-z0-9-]*:[a-z0-9-]*:[a-z0-9-]*:[0-9]*:[a-z0-9-_/.:]+/i,
    filter: (match) => {
      // Permitir templates e ARNs gerenciados públicos da AWS (conforme contrato Cartógrafo)
      if (match.includes(':aws:policy/')) return false
      if (match.includes('::foundation-model/')) return false
      if (
        match.includes('ACCOUNT_ID') ||
        match.includes('BUCKET') ||
        match.includes('SEU_') ||
        match.includes('EXEMPLO') ||
        match.includes('${') ||
        match.includes('<')
      )
        return false
      return true
    },
  },
  {
    name: 'AWS Access Key ID',
    regex: /\bAKIA[0-9A-Z]{16}\b/,
  },
  {
    name: 'URL CloudFront de produção (*.cloudfront.net)',
    regex: /\b[a-z0-9-]+\.cloudfront\.net\b/i,
  },
  {
    name: 'Domínio/URL interna (*vitoriastone.com)',
    regex: /[a-zA-Z0-9.-]*vitoriastone\.com/i,
  },
  {
    name: 'CNPJ formatado',
    regex: /\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/,
  },
  {
    name: 'IPv4 suspeito',
    regex: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/,
    filter: (match) => {
      const allowedIps = new Set(['127.0.0.1', '0.0.0.0', '255.255.255.0', '255.255.255.255'])
      return !allowedIps.has(match)
    },
  },
  {
    name: 'E-mail não autorizado',
    regex: /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g,
    filter: (match) => {
      const lower = match.toLowerCase()
      if (lower === 'matheuscamposti@gmail.com') return false
      if (lower.endsWith('@cloudbymcn.com') || lower.includes('@cloudbymcn.')) return false
      if (lower.endsWith('example.com') || lower.endsWith('exemplo.com')) return false
      if (lower.endsWith('@anthropic.com')) return false
      if (lower.endsWith('@github.com')) return false
      return true
    },
  },
  {
    name: 'Sigla da empresa VS isolada (§8.2)',
    regex: /\bVS\b(?!\s*Code)/,
  },
]

function collectFiles(dirPath) {
  const results = []
  if (!fs.existsSync(dirPath)) return results

  const entries = fs.readdirSync(dirPath, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name)
    const relPath = path.normalize(path.relative(ROOT_DIR, fullPath))

    if (isIgnored(relPath)) continue

    if (entry.isDirectory()) {
      results.push(...collectFiles(fullPath))
    } else if (entry.isFile()) {
      results.push({ fullPath, relPath, name: entry.name })
    }
  }
  return results
}

const violations = []
let filesScanned = 0

// Checar presença de arquivos .env no repo
const rootEntries = fs.readdirSync(ROOT_DIR, { withFileTypes: true })
for (const entry of rootEntries) {
  if (entry.isFile() && /^\.env(\..+)?$/i.test(entry.name) && entry.name !== '.env.example') {
    violations.push({
      file: entry.name,
      line: 0,
      rule: 'Arquivo sensível (.env)',
      match: entry.name,
      snippet: 'Arquivo .env encontrado no repositório.',
    })
  }
}

for (const dirName of DIRS_TO_SCAN) {
  const dirPath = path.join(ROOT_DIR, dirName)
  const files = collectFiles(dirPath)

  for (const file of files) {
    filesScanned++
    const { fullPath, relPath, name } = file

    // 1. Checagem no nome/caminho do arquivo
    for (const pattern of forbiddenTermPatterns) {
      if (pattern.regex.test(relPath)) {
        violations.push({
          file: relPath,
          line: 0,
          rule: `Nome de arquivo viola: ${pattern.name}`,
          match: relPath,
          snippet: name,
        })
      }
    }

    const ext = path.extname(name).toLowerCase()
    if (BINARY_EXTENSIONS.has(ext)) {
      continue
    }

    // 2. Checagem de conteúdo em arquivos texto
    let content = ''
    try {
      content = fs.readFileSync(fullPath, 'utf8')
    } catch (err) {
      console.warn(`[WARN] Não foi possível ler arquivo ${relPath}: ${err.message}`)
      continue
    }

    const lines = content.split(/\r?\n/)
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const lineNum = i + 1

      for (const pattern of forbiddenTermPatterns) {
        const match = pattern.regex.exec(line)
        if (match) {
          violations.push({
            file: relPath,
            line: lineNum,
            rule: pattern.name,
            match: match[0],
            snippet: line.trim(),
          })
        }
      }

      for (const pattern of structuralPatterns) {
        if (pattern.regex.global) {
          pattern.regex.lastIndex = 0
          let match
          while ((match = pattern.regex.exec(line)) !== null) {
            if (pattern.filter && !pattern.filter(match[0])) {
              continue
            }
            violations.push({
              file: relPath,
              line: lineNum,
              rule: pattern.name,
              match: match[0],
              snippet: line.trim(),
            })
          }
        } else {
          const match = pattern.regex.exec(line)
          if (match) {
            if (pattern.filter && !pattern.filter(match[0])) {
              continue
            }
            violations.push({
              file: relPath,
              line: lineNum,
              rule: pattern.name,
              match: match[0],
              snippet: line.trim(),
            })
          }
        }
      }
    }
  }
}

if (violations.length > 0) {
  console.error(
    `\n❌ [scrub-check] Falha de anonimização (SPEC §8): ${violations.length} violação(ões) encontrada(s):\n`,
  )
  for (const v of violations) {
    console.error(`  - ${v.file}:${v.line} [${v.rule}]`)
    console.error(`    Termo: "${v.match}"`)
    console.error(`    Linha: ${v.snippet}\n`)
  }
  process.exit(1)
} else {
  console.log(
    `\n✅ [scrub-check] Passou com sucesso: ${filesScanned} arquivo(s) inspecionado(s) em [${DIRS_TO_SCAN.join(', ')}], 0 violações.\n`,
  )
  process.exit(0)
}
