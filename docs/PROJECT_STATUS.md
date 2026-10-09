# PROJECT_STATUS — cloudbymcn v2 (Lanyard)

Atualizado: 2026-10-09 · Branch: `v2-lanyard` · Espec: [SPEC-FRONTEND-V2.md](SPEC-FRONTEND-V2.md)

## Estado atual

- Commit 1 (Forja): scaffold Vite 6 + React 19 + TS + Tailwind v4 + MDX, estrutura de pastas do §10 (b5edd45).
- Lanyard integrado com `React.lazy` + placeholder, reduced-motion/GPU fraca cai no placeholder (48a484c).
- Home com os 6 blocos, nav fixa, `/sobre` e `/contato` (a1b3133).
- `scripts/scrub-check.mjs` + `scripts/forbidden-terms.txt` implementados pelo Vigia e integrados ao `npm run check` (5d5acc5, 53ff2fc).
- 11 posts v1 migrados pra MDX + diagramas de arquitetura (b836b02).
- Site legado: `legacy/index.html` (antigo `index.html` da raiz), `posts/*.html` e `assets/` continuam no repo até a migração ser validada.
- Hosting (P1 resolvida): GitHub Pages do repo `cloudbymcn/blog`, deploy via `actions/deploy-pages`, `base: '/'`, `public/CNAME = cloudbymcn.com`.

## Contratos pro time

- Conteúdo: `src/content/projects/<slug>.mdx` com frontmatter do §5. Tipo em `src/lib/content.ts` (`ProjectMeta`).
  O índice é montado via `import.meta.glob`; não existe lista manual.
- Stack: nomes do frontmatter `stack:` têm que estar em `src/lib/stack.ts` (vocabulário do §7).
- Assets: `public/lanyard/{card-front,card-back,strap}.png`, `public/photos/*.webp`, `public/projects/<slug>/cover.webp`.
- `npm run check` roda `scripts/scrub-check.mjs` (regras §8: marcas legadas, pessoas, account IDs, ARNs, IPs, CNPJ, emails, .env).
- Working tree é compartilhado entre as frentes: `git add` só dos próprios arquivos, nunca `-A`.
- Componentes MDX expostos via MDXProvider: Callout, Metrics/Metric, Steps/Step, Card, CostCompare/CostBar, Instruction, Figure.

## Em andamento

| Frente | Dono | Estado |
|---|---|---|
| App (scaffold, Lanyard, home, /projetos, deploy) | Forja | scaffold, Lanyard e home feitos; `/projetos` + `/projetos/:slug` + MDX em andamento (não commitado); deploy.yml pendente |
| Conteúdo (33 MDX) | Cartógrafo | 11 posts v1 migrados; lotes 1-5 (22 novos) pendentes |
| Assets | Lente | pendente: card-front/back/strap, fotos WebP, OG |
| QA + scrub-check | Vigia | scrub-check feito; QA 6 larguras + Lighthouse pendente (aguarda preview) |

## Próximo passo

- Forja: commitar `/projetos` + `/projetos/:slug` + componentes MDX; depois `.github/workflows/deploy.yml`.
- Cartógrafo: lote 1 (5 Tier A).
- Lente: texturas do Lanyard + fotos + OG.
- Vigia: commitar ajustes do scrub-check; QA assim que `npm run preview` subir em 4173.
