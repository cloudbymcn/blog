// Renderiza um diagrama de arquitetura (spec declarativa) em SVG 960×540, no tema do site.
// Os SVGs servem de diagrama no corpo do case e de cover do card (16:9).
//
// spec = {
//   title, subtitle?,
//   groups?: [{ x, y, w, h, label }],              // caixas tracejadas (VPC, "on-premises"…)
//   nodes: { id: { x, y, label, sub?, kind?, w? } }, // x,y = centro; kind define a cor
//   edges: [{ from, to, label?, dashed?, bend? }],  // bend: 'h' (cotovelo horizontal) | 'v'
//   note?: string,                                  // rodapé
// }

const W = 960
const H = 540
const NODE_H = 64
const NODE_W = 150

const KIND = {
  aws: { stroke: '#f59e0b', fill: '#1c1608' },
  app: { stroke: '#38bdf8', fill: '#0b1a22' },
  data: { stroke: '#34d399', fill: '#0a1a14' },
  ai: { stroke: '#c084fc', fill: '#170d22' },
  ext: { stroke: '#a1a1aa', fill: '#151518' },
  user: { stroke: '#f4f4f5', fill: '#18181b' },
}

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function box(n) {
  const k = KIND[n.kind || 'aws']
  const w = n.w || NODE_W
  const x = n.x - w / 2
  const y = n.y - NODE_H / 2
  const label = `<text x="${n.x}" y="${n.sub ? n.y - 4 : n.y + 5}" text-anchor="middle" font-size="14" font-weight="600" fill="#f4f4f5">${esc(n.label)}</text>`
  const sub = n.sub
    ? `<text x="${n.x}" y="${n.y + 15}" text-anchor="middle" font-size="11" fill="#a1a1aa" font-family="JetBrains Mono, ui-monospace, monospace">${esc(n.sub)}</text>`
    : ''
  return `<g><rect x="${x}" y="${y}" width="${w}" height="${NODE_H}" rx="12" fill="${k.fill}" stroke="${k.stroke}" stroke-width="1.5"/>${label}${sub}</g>`
}

// ponto na borda do retângulo do nó, na direção de (tx, ty)
function anchor(n, tx, ty) {
  const w = (n.w || NODE_W) / 2
  const h = NODE_H / 2
  const dx = tx - n.x
  const dy = ty - n.y
  if (dx === 0 && dy === 0) return [n.x, n.y]
  const s = Math.min(dx ? w / Math.abs(dx) : Infinity, dy ? h / Math.abs(dy) : Infinity)
  return [n.x + dx * s, n.y + dy * s]
}

function edge(e, nodes) {
  const a = nodes[e.from]
  const b = nodes[e.to]
  if (!a || !b) throw new Error(`edge ${e.from} -> ${e.to}: nó inexistente`)
  let d
  let lx
  let ly
  if (e.bend === 'h' || e.bend === 'v') {
    // cotovelo: sai na horizontal (h) ou vertical (v) e entra no outro eixo
    const [sx, sy] = e.bend === 'h' ? anchor(a, b.x, a.y) : anchor(a, a.x, b.y)
    const [ex, ey] = e.bend === 'h' ? anchor(b, b.x, a.y) : anchor(b, a.x, b.y)
    const [cx, cy] = e.bend === 'h' ? [ex, sy] : [sx, ey]
    d = `M${sx},${sy} L${cx},${cy} L${ex},${ey}`
    ;[lx, ly] = [(sx + cx) / 2, (sy + cy) / 2 - 8]
  } else {
    const [sx, sy] = anchor(a, b.x, b.y)
    const [ex, ey] = anchor(b, a.x, a.y)
    d = `M${sx},${sy} L${ex},${ey}`
    ;[lx, ly] = [(sx + ex) / 2, (sy + ey) / 2 - 8]
  }
  const dash = e.dashed ? ' stroke-dasharray="5 5"' : ''
  const lw = e.label ? e.label.length * 6.8 + 10 : 0
  const label = e.label
    ? `<rect x="${lx - lw / 2}" y="${ly - 12}" width="${lw}" height="17" rx="4" fill="#0e0e10"/><text x="${lx}" y="${ly}" text-anchor="middle" font-size="11" fill="#a1a1aa" font-family="JetBrains Mono, ui-monospace, monospace">${esc(e.label)}</text>`
    : ''
  return `<path d="${d}" fill="none" stroke="#52525b" stroke-width="1.5"${dash} marker-end="url(#arrow)"/>${label}`
}

function group(g) {
  return `<g><rect x="${g.x}" y="${g.y}" width="${g.w}" height="${g.h}" rx="16" fill="none" stroke="#3f3f46" stroke-dasharray="6 6"/><text x="${g.x + 14}" y="${g.y + 22}" font-size="11" fill="#71717a" font-family="JetBrains Mono, ui-monospace, monospace" letter-spacing="1">${esc(g.label.toUpperCase())}</text></g>`
}

export function render(spec) {
  const nodes = spec.nodes
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="Inter, system-ui, sans-serif" role="img" aria-label="${esc(spec.title)}">`,
    `<title>${esc(spec.title)}</title>`,
    `<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#71717a"/></marker>`,
    `<radialGradient id="glow" cx="80%" cy="0%" r="70%"><stop offset="0" stop-color="#38bdf8" stop-opacity=".10"/><stop offset="1" stop-color="#38bdf8" stop-opacity="0"/></radialGradient></defs>`,
    `<rect width="${W}" height="${H}" fill="#0e0e10"/><rect width="${W}" height="${H}" fill="url(#glow)"/>`,
    `<text x="40" y="52" font-size="22" font-weight="700" fill="#f4f4f5" font-family="Space Grotesk, Inter, sans-serif">${esc(spec.title)}</text>`,
    spec.subtitle ? `<text x="40" y="76" font-size="13" fill="#a1a1aa">${esc(spec.subtitle)}</text>` : '',
    ...(spec.groups || []).map(group),
    ...spec.edges.map((e) => edge(e, nodes)),
    ...Object.values(nodes).map(box),
    spec.note
      ? `<text x="40" y="${H - 24}" font-size="11" fill="#71717a" font-family="JetBrains Mono, ui-monospace, monospace">${esc(spec.note)}</text>`
      : '',
    `<text x="${W - 40}" y="${H - 24}" text-anchor="end" font-size="11" fill="#52525b" font-family="JetBrains Mono, ui-monospace, monospace">cloudbymcn.com</text>`,
    '</svg>',
  ]
  return parts.filter(Boolean).join('\n') + '\n'
}
