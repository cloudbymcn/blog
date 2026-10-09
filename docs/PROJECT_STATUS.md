# PROJECT_STATUS — cloudbymcn v2 (Lanyard)

Atualizado: 2026-10-09 · Branch: `v2-lanyard` · Espec: [SPEC-FRONTEND-V2.md](SPEC-FRONTEND-V2.md)

## Estado atual

- Commit 1 (Forja): scaffold Vite 6 + React 19 + TS + Tailwind v4 + MDX, estrutura de pastas do §10 (b5edd45).
- Lanyard integrado com `React.lazy` + placeholder, reduced-motion/GPU fraca cai no placeholder (48a484c).
- Home com os 6 blocos, nav fixa, `/sobre` e `/contato` (a1b3133).
- `scripts/scrub-check.mjs` + `scripts/forbidden-terms.txt` implementados pelo Vigia e integrados ao `npm run check` (5d5acc5, 53ff2fc).
- 11 posts v1 migrados pra MDX + diagramas de arquitetura (b836b02).
- 22 projetos novos (8 Tier A + 14 Tier B) escritos, scrubados e com diagrama SVG, em 5 lotes (d8d25a6, d21c939, d3e88f6, 6cb3c57, d3ceddd). Índice com 33 projetos.
- `/projetos` (busca, chips de categoria/stack, ordenação, filtros na URL) e `/projetos/:slug` (hero, TOC, corpo MDX lazy, Stack usada, links) com os componentes MDX (fcf8a25, 58a5e19). Validado no portal em 390/768/1280.
- `.github/workflows/deploy.yml`: push em `main` ou manual → check + build + `404.html` (fallback SPA) → `actions/deploy-pages` (a91d025).
- Site legado: `legacy/index.html` (antigo `index.html` da raiz), `posts/*.html` e `assets/` continuam no repo até a migração ser validada.
- Hosting (P1 resolvida): GitHub Pages do repo `cloudbymcn/blog`, deploy via `actions/deploy-pages`, `base: '/'`, `public/CNAME = cloudbymcn.com`.

- Pivô claro estilo Apple (§0-bis): tokens, nav glass, hero com crachá por cima do texto + painel `<LanyardControls>`, covers `public/projects/<slug>/cover.webp` (37ec0ed..f794581).
- Camada imersiva (Forja): Lenis (desktop), nav que encolhe, reveal/stagger, hero em máscara, tilt 3D nos cards, botões magnéticos, fundo three.js no hero e cubo de vidro no Sobre (1b0cb5d..ddd470f).
- Rodada de 09/10 à tarde (decisões do Matheus na SPEC §0-bis): fonte SF Pro + Inter self-hosted e tudo em minúsculo (a9ae7f2); Paper Mono como `--font-mono` (03d93b2); seção Projetos = Concave Carousel reproduzido do React Bits Pro (f9df36e); Contato = bloco "Let's connect" adaptado do rbp-portfolio (f80e94d); Interference Ribbons atrás do crachá, ligado por padrão, `?ribbons=0` desliga (6ab9d9f, 2172c83); crachá ~30% menor (85d413c); trajetória = livro aberto em Paper Mono com virar de página 3D (831a1d1, 6431ca3); certificação CloudOps Engineer – Associate (0869fa2 + badge ea13b44).
- Assets (Lente): 33/33 covers reais/gerados em `public/projects/<slug>/cover.webp` (6c60e40, ff5c66a); crachá com retrato sorrindo gerado por IA, ombros até as bordas (991f442..58db89e); logo nova — ícone squircle "m" (flat SVG + 3D PNG), wordmark "cloudbymcn", favicons, OG (43d0507, dc2dfa3) e aplicada na nav/rodapé (c68268e).
- QA do Vigia resolvido no código: 320px sem overflow, a11y (contraste/aria), perf mobile (WebP no LCP, zero webfont, 3D/Lenis fora do mobile, rotas lazy). Falta rodar Lighthouse de novo.

## Contratos pro time

- Conteúdo: `src/content/projects/<slug>.mdx` com frontmatter do §5. Tipo em `src/lib/content.ts` (`ProjectMeta`).
  O índice é montado via `import.meta.glob`; não existe lista manual.
- Stack: nomes do frontmatter `stack:` têm que estar em `src/lib/stack.ts` (vocabulário do §7).
- Assets: `public/lanyard/{card-front,card-back,strap}.png` (o app usa `card-front.webp` e `card-front-480.webp` derivados do PNG: se o PNG mudar, regerar os dois), `public/photos/*.webp`, `public/projects/<slug>/cover.webp`.
- `npm run check` roda `scripts/scrub-check.mjs` (regras §8: marcas legadas, pessoas, account IDs, ARNs, IPs, CNPJ, emails, .env).
- Working tree é compartilhado entre as frentes: `git add` só dos próprios arquivos, nunca `-A`.
- Componentes MDX expostos via MDXProvider: Callout, Metrics/Metric, Steps/Step, Card, CostCompare/CostBar, Instruction, Figure.

## Em andamento

| Frente | Dono | Estado |
|---|---|---|
| App | Forja | completo: pivô claro, imersivo, carrossel, let's connect, livro, logo, ribbons; aguardando QA final |
| Conteúdo (33 MDX) | Cartógrafo | 33/33 no índice com cover.webp; dispensável após redirects §11 |
| Assets | Lente | completo (covers, crachá, logo, OG, badges) |
| QA + scrub-check | Vigia | ciclo final em andamento: 6 larguras, Lighthouse desktop/mobile, FPS com/sem ribbons |

## Próximo passo

- Forja: redirects dos 11 posts antigos (§11), OG/meta por página; deploy só roda depois do merge em `main` (origin HEAD hoje é `master`: Matheus decide a branch de publicação e muda Settings → Pages → Source = GitHub Actions).
- Vigia: `scripts/scrub-check.mjs` local está fora do Prettier (quebra `npm run check` e o deploy.yml).
- Cartógrafo: trocar `cover:` para `/projects/<slug>/cover.webp` conforme a Lente entregar os prints; redirects dos 11 posts antigos (§11).
- Vigia: relatório final (FPS, Lighthouse) e eventuais fixes pra Forja.
- Matheus: revisar o site no portal, decidir branch de publicação (`master` vs `main`) e Settings → Pages → Source = GitHub Actions; merge em `main` dispara o deploy.
