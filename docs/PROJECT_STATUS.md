# PROJECT_STATUS — cloudbymcn v2 (Lanyard)

Atualizado: 2026-10-09 (Forja: carrossel vivo — drift + wheel) · Branch: `v2-lanyard` · Espec: [SPEC-FRONTEND-V2.md](SPEC-FRONTEND-V2.md)

## Estado atual

- Commit 1 (Forja): scaffold Vite 6 + React 19 + TS + Tailwind v4 + MDX, estrutura de pastas do §10 (b5edd45).
- Lanyard integrado com `React.lazy` + placeholder, reduced-motion/GPU fraca cai no placeholder (48a484c).
- Home com os 6 blocos, nav fixa, `/sobre` e `/contato` (a1b3133).
- `scripts/scrub-check.mjs` + `scripts/forbidden-terms.txt` implementados pelo Vigia e integrados ao `npm run check` (5d5acc5, 53ff2fc).
- 11 posts v1 migrados pra MDX + diagramas de arquitetura (b836b02).
- 22 projetos novos (8 Tier A + 14 Tier B) escritos, scrubados e com diagrama SVG, em 5 lotes (d8d25a6, d21c939, d3e88f6, 6cb3c57, d3ceddd). Índice com 33 projetos.
- `/projetos` (busca, chips de categoria/stack, ordenação, filtros na URL) e `/projetos/:slug` (hero, TOC, corpo MDX lazy, Stack usada, links) com os componentes MDX (fcf8a25, 58a5e19). Validado no portal em 390/768/1280.
- `.github/workflows/deploy.yml`: push em `main` ou manual → check + build → `actions/deploy-pages` (a91d025; o `404.html` agora sai do build, 4458d02).
- Site legado: `legacy/index.html` (antigo `index.html` da raiz), `posts/*.html` e `assets/` continuam no repo até a migração ser validada.
- Hosting (P1 resolvida): GitHub Pages do repo `cloudbymcn/blog`, deploy via `actions/deploy-pages`, `base: '/'`, `public/CNAME = cloudbymcn.com`.

- Pivô claro estilo Apple (§0-bis): tokens, nav glass, hero com crachá por cima do texto + painel `<LanyardControls>`, covers `public/projects/<slug>/cover.webp` (37ec0ed..f794581).
- Camada imersiva (Forja): Lenis (desktop), nav que encolhe, reveal/stagger, hero em máscara, tilt 3D nos cards, botões magnéticos, fundo three.js no hero e cubo de vidro no Sobre (1b0cb5d..ddd470f).
- Rodada de 09/10 à tarde (decisões do Matheus na SPEC §0-bis): fonte SF Pro + Inter self-hosted e tudo em minúsculo (a9ae7f2); Paper Mono como `--font-mono` (03d93b2); seção Projetos = Concave Carousel reproduzido do React Bits Pro (f9df36e); Contato = bloco "Let's connect" adaptado do rbp-portfolio (f80e94d); Interference Ribbons atrás do crachá, ligado por padrão, `?ribbons=0` desliga (6ab9d9f, 2172c83); crachá ~30% menor (85d413c); trajetória = livro aberto em Paper Mono com virar de página 3D (831a1d1, 6431ca3); certificação CloudOps Engineer – Associate (0869fa2 + badge ea13b44).
- Assets (Lente): 33/33 covers reais/gerados em `public/projects/<slug>/cover.webp` (6c60e40, ff5c66a); crachá com retrato sorrindo gerado por IA, ombros até as bordas (991f442..58db89e); logo nova — ícone squircle "m" (flat SVG + 3D PNG), wordmark "cloudbymcn", favicons, OG (43d0507, dc2dfa3) e aplicada na nav/rodapé (c68268e).
- QA do Vigia resolvido no código: 320px sem overflow, a11y (contraste/aria), perf mobile (WebP no LCP, 3D/Lenis fora do mobile, rotas lazy).
- Fechamento da Forja: SEO por rota sem tags duplicadas (c9aab00); build gera `dist/<rota>/index.html` com OG próprio pras 36 rotas, `404.html` noindex e os 12 redirects de `scripts/redirects.json` (4458d02); nav de vidro + página sem sobra de scrollbar (8530b0a); livro menor com a fonte do site, Paper Mono só na marginália (75f049b); perf desktop: three.js só na primeira interação, Lenis em idle (12c7c94).
- Rodada de 09/10 fim de tarde (Forja): livro da trajetória menor, 720x380 no desktop / 640 abaixo de 1280 / página de 300 no mobile (f585b2d); covers animados `public/projects/<slug>/cover.{mp4,webm,gif}` detectados no build, tocando só no card central + vizinhos e no hero de `/projetos/:slug`, com poster `cover.webp` e fallback por onError; reduced-motion/saveData/2g ficam no poster (f0bd309); scrub-check ignora vídeo (5f6a3d5); **15 projetos removidos a pedido do Matheus, índice com 18** (f71dc00); nome de produto na frente do título: JEV, StoneTrack, Atelier de Pedra, Sentinela, DungeonAI (c3cde5b). Pendente pro Matheus: liberar SerraVans (gestao-frota-ocr) e batizar os outros 12.
- Carrossel vivo (Forja, 09/10 noite): ConcaveCarousel com posição contínua em rAF: deslize lento (20px/s no arco) em vez do passo de 6s, desacelera pra ~6px/s no hover e volta com easing ~1,8s depois de interagir; roda do mouse sobre os cards avança/volta com inércia e snap por mola, sem rolar a página (gesto vertical contínuo >1,2s ou shift devolvem pra página; deltaX funciona); arraste com arremesso; loop para fora da tela; reduced-motion sem deslize/mola. Seção Sobre removida antes disso (4c23d94). Validado no portal (rAF do portal só anda com screenshot, timing testado com busy-wait).
- Vapor Type no nome (Forja, 09/10 noite): `src/components/ui/VaporName.tsx` envolve o h1 do hero; no hover o nome evapora em grãos a partir da esquerda (canvas 2D, ~9k partículas, DPR ≤ 2), o vapor sobe em mechas pra #9fb3cc e as letras recondensam (overlap 0.6); ponteiro rápido sopra as letras (mola de volta em 1,2s); toque dispara uma vez; reduced-motion sem efeito. O h1 real fica sempre no DOM e visível: o canvas só pinta com a cor do fundo as células que saíram do lugar. Astral Shell no hero foi testado e descartado a pedido do Matheus (nada commitado).
- Lighthouse (`npx lighthouse`, headless, `npm run preview`): desktop 98–99 (TBT ~100 ms, LCP 0,8 s, CLS 0); mobile 88 (LCP 3,6 s, TBT 40 ms, CLS 0); acessibilidade 96, SEO 100. Bundle inicial do `/`: ~151 KB gzip (JS 137 + CSS 13 + HTML 1).
- PR #1 `v2-lanyard → main` aberto (https://github.com/cloudbymcn/blog/pull/1), sem merge. Screenshots no PR ainda são as de 3e59b93: as do QA final (f0a1d83) saíram capturadas antes das animações e precisam ser refeitas.

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
| App | Forja | **encerrada**: app completo, SEO/redirects, perf desktop 98–99, PR #1 aberto |
| Conteúdo (33 MDX) | Cartógrafo | 33/33 no índice com cover.webp; dispensável após redirects §11 |
| Assets | Lente | completo (covers, crachá, logo, OG, badges) |
| QA + scrub-check | Vigia | QA final feito (f0a1d83); pendente: recapturar screenshots depois das animações |

## Próximo passo

- **Matheus (decisão):** branch de publicação e merge. O PR #1 aponta pra `main`, que é a branch que dispara o `deploy.yml`; a branch padrão do repo no GitHub ainda é `master` (mais antiga, fev/2026, 2 commits fora da v2). Decidir se `main` vira a padrão, configurar Settings → Pages → Source = GitHub Actions, domínio `cloudbymcn.com` (+ DNS, hoje NXDOMAIN) e fazer o merge.
- Vigia: recapturar as screenshots (rolar cada seção até a viewport e esperar ~1,5 s) e commitar; a Forja ou quem estiver ativo troca as imagens no corpo do PR #1.
- Depois do deploy validado: apagar `legacy/`, `posts/`, `assets/` antigos e `public/img/logo-mcn.png`; conferir em produção um redirect de `/posts/*.html` e o OG de uma página de projeto.
- Se o `card-front.png` mudar: regerar `card-front.webp` (1024) e `card-front-480.webp` (480).
