# SPEC — Frontend v2 do cloudbymcn.com (Lanyard)

Data: 2026-10-09 · Autor da espec: Fable 5.1 (só espec) · Executores: ver §9
Repo: `C:\projetos\cbm\cloudbymcn` → `github.com/cloudbymcn/blog` · Branch de trabalho: `v2-lanyard` (nunca commitar direto em `main`)

Esta espec é a fonte da verdade. Dúvida que a espec não resolve → perguntar na nota de status, não inventar.

---

## 0-bis. Direção visual REVISADA (2026-10-09, decisão do Matheus — sobrepõe tudo que contradiz abaixo)

Referência: vídeo do David Haz do Lanyard rebuilt do React Bits (crachá holográfico sobre fundo branco). O site tem que parecer isso:

- **Fundo branco** (`#ffffff`, seções alternando com `#f5f5f7` estilo Apple). Sem grão, sem spotlight, sem fundo quase preto. Modo escuro NÃO é prioridade.
- **Tipografia Apple**: `-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Inter, system-ui, sans-serif`. Títulos com `letter-spacing: -0.02em`, peso 600, tamanhos grandes e muito respiro. Nada de Space Grotesk. Mono só em labels pequenos.
- **Glass**: cards, nav e chips com `background: rgba(255,255,255,.6)`, `backdrop-filter: blur(20px) saturate(180%)`, borda `1px solid rgba(0,0,0,.06)`, sombra suave `0 8px 30px rgba(0,0,0,.06)`, raio 20-24px. Nav fixa translúcida igual apple.com.
- **Cores**: texto `#1d1d1f`, secundário `#6e6e73`, linhas `rgba(0,0,0,.08)`, acento único `#0071e3` (azul Apple) só em links/botões. Âmbar fora.
- **Lanyard (hero)**: `cardColor="#ffffff"`, `finish="holographic"`, `metal="silver"`, `strapColor="#111111"`, `cornerRadius=0.3`, `size≈0.42` (Matheus 12:05: crachá estava ocupando a dobra inteira; reduzir ~30%, cartão com ~55-60% da altura da viewport em desktop), `gravity=1`, `breeze=0.5`, `intro`, `interactive`. Cartão = foto do Matheus em P&B com fundo removido sobre branco, topo com logo pequeno à esquerda e `@cloudbymcn` à direita (igual ao vídeo). Strap preto com texto branco repetido.
- **Hero** (ajuste Matheus 10:55): layout atual mantido — texto à esquerda (nome, cargo, sub, 2 botões, 3 contadores), crachá à direita. MAS o canvas do Lanyard ocupa a dobra INTEIRA (100vw × 100vh, `position:absolute; inset:0`) e fica com `z-index` ACIMA do texto: o crachá sobrepõe os textos quando balança/é arrastado. Canvas com `pointer-events:none` e só o cartão captura o pointer (raycast), pra botões/links continuarem clicáveis. Âncora do strap na direita (`anchor="right"` ou offset), fundo branco.
- **Scroll pra baixo = projetos**: grid minimalista de cards glass (cover, título, uma linha, chips de stack), 3 colunas em desktop, 1 em mobile, muito espaço em branco entre seções. Sobre/contato vêm depois, curtos.
- **Cartão (ajuste Matheus 11:10)**: `card-front.png` SEM nome e SEM cargo. Só: logo MCN discreto no topo-esquerda (cinza claro, pode ser marca d'água maior atrás da foto como no React Bits), `@cloudbymcn` pequeno no topo-direita, foto P&B com ombros cortados na base. Fundo branco puro.
- **Acabamento padrão = fosco branco** (`finish="matte"`, `cardColor="#ffffff"`, `metal="silver"`), SEM brilho/holográfico por padrão. O cartão começa branquinho.
- **Painel de ajustes** (`<LanyardControls>`): botão discreto (ícone sliders) no canto direito do hero que abre um painel glass flutuante à direita com abas/grupos iguais ao "Customize" do React Bits: Finish (matte/glossy/holographic/metallic), Metal (silver/graphite/gold), Card color, Band color, Plain band, Corner radius, Size, Band length/width, Gravity, Damping, Elasticity, Breeze, Interactive, Intro, botão Reset. Fechado por padrão; estado em `useState` (opcional `localStorage`). Mobile: vira bottom sheet ou some.
- **Covers = prints reais (Matheus 11:20)**: cada projeto tem `public/projects/<slug>/cover.webp` com screenshot real da aplicação (portal) ou, quando não há app público, imagem gerada (Higgsfield/Gemini) a partir de prompt anonimizado, enquadrada em janela macOS clara. SVG de arquitetura continua no corpo do post. Meta: quem entra se diverte e acha tudo foda — cards com imagem forte, hover suave, zero card "vazio".
- **Cartão v3 (Matheus 11:35)**: foto MENOR (ocupa ~55% da altura, centralizada verticalmente um pouco abaixo do meio, ombros cortados), logo MCN pequeno no canto superior ESQUERDO, `@cloudbymcn` pequeno no canto superior DIREITO, muito branco em volta. Foto = retrato P&B sorrindo de boca fechada (gerado por IA a partir das fotos de referência do Matheus; maestro gera, Lente compõe).
- **Camada imersiva Apple (Matheus 11:35)**: o site precisa de "toque Apple": scroll suave (Lenis ou CSS scroll-timeline), seções com reveal (fade+translate 24px, stagger 60ms), parallax leve nos covers, cards com tilt 3D sutil no hover (max 6°) e sombra que acompanha, botões magnéticos, contadores com count-up, nav que encolhe ao rolar, texto do hero com entrada em máscara. Three.js além do Lanyard: fundo do hero com partículas/vidro flutuante bem sutil (desligado em reduced-motion e GPU fraca), e, na seção Sobre, um objeto 3D leve girando devagar (ex.: cubo de vidro com logo). Tudo 60fps, lazy, sem travar mobile. Referência: apple.com/macbook-air (ritmo, respiro, revelações).
- **Projetos = Concave Carousel (Matheus 12:15)**: a seção de projetos na home vira um carrossel côncavo igual ao React Bits Pro "Concave Carousel" (parede de galeria curvada em volta do viewer): cards grandes 16:10 com o cover, dispostos em arco com perspectiva (rotateY crescente nas laterais, leve escala/opacidade decrescente), passando de lado com setas ‹ › + contador "02 / 08", arraste/trackpad horizontal, teclado ← →, autoplay lento opcional, título + 1 linha sob o card central, reflexo suave abaixo. Fonte Pro é paga: reproduzir visualmente (CSS 3D transforms ou three.js) observando o preview no portal. Grid de cards continua em /projetos.
- **Let's connect (Matheus 12:15)**: bloco de contato igual ao do rbp-portfolio do David Haz (components/contact/contact-card.tsx, contact-card-ctas.tsx, contact-button.tsx): card glass com título "Let's connect", botões grandes pras redes (LinkedIn, GitHub cloudbymcn, Instagram @cloudbymcn, e-mail), hover magnético. Substitui a seção Contato atual.
- **Interference Ribbons atrás do crachá (Matheus 13:50, fila)**: testar o efeito "Interference Ribbons" do React Bits Pro (Backgrounds) como fundo da metade direita do hero, atrás do Lanyard: fitas/ondas de interferência em tons quase brancos/cinza-azulado muito sutis sobre o branco, bem lentas, mascaradas com gradiente radial pra sumir perto do texto. Fonte é paga: reproduzir com shader (three.js/GLSL ou canvas 2D) observando o preview no portal. Só manter se ficar bom e não custar FPS; desligado em reduced-motion/mobile. Pode substituir ou complementar as formas de vidro.
- Tokens em `tokens.css` devem ser trocados pra esse esquema; §1 item "fundo quase preto" e §12 tokens escuros ficam obsoletos.

## 0. Decisão de fundo

O site atual é HTML/CSS/JS puro, sem build. O componente **Lanyard** do React Bits é **React + three.js** (sem versão vanilla). Logo: a v2 é um app React com build estático. Reescrita 100%, sem aproveitar CSS/JS antigos. O **conteúdo** dos 11 posts atuais é aproveitado (migrado), o visual não.

| Item | Decisão |
|---|---|
| Framework | Vite 6 + React 19 + TypeScript |
| Estilo | Tailwind v4 (React Bits tem variante TW) + CSS vars pros tokens |
| 3D | `three` (única dependência do Lanyard atual) |
| Rotas | `react-router` (modo estático: `/`, `/projetos`, `/projetos/:slug`, `/sobre`, `/contato`) |
| Conteúdo | MDX em `src/content/projects/*.mdx` com frontmatter (ver §5) |
| Deploy | GitHub Actions → GitHub Pages (`actions/deploy-pages`), `base: '/'`, `public/CNAME = cloudbymcn.com` |
| Idioma | PT-BR único na v1. EN fica pra fase 2 (não implementar toggle agora) |
| Pacote | npm (não pnpm). `npm run dev` / `npm run build` / `npm run check` (tsc + eslint + prettier) |

> **P1 resolvida (2026-10-09):** hospedagem é GitHub Pages do repo `cloudbymcn/blog`. Deploy via Actions (`actions/deploy-pages`), `public/CNAME = cloudbymcn.com`. Depois do primeiro deploy, Vigia confere em Settings → Pages (portal) que a fonte mudou para "GitHub Actions" e que o domínio custom continua.

---

## 1. Layout da home (`/`)

Ordem vertical, uma tela por bloco no desktop, fluido no mobile:

1. **Hero Lanyard** (100vh)
   - Fundo quase preto com grão sutil + "spotlight" radial que segue o mouse (React Bits *Glow Cursor* ou CSS puro).
   - `<Lanyard>` ocupa a metade direita no desktop (esquerda fica texto); no mobile fica em cima, texto embaixo. Container do Lanyard: `min-height: 520px`.
   - Esquerda: `SplitText`/`BlurText` (React Bits) com o nome e o título, depois um sub (ver §3 copy), CTAs "Ver projetos" (`Magnet`) e "Falar comigo".
   - Barra de stats com `CountUp`: N projetos publicados · N serviços AWS usados · 3 certificações AWS. Valores vêm do índice de conteúdo, não hardcoded.
   - Seta "scroll" animada no rodapé do hero.
2. **Apresentação** — "Quem é o MCN". O Matheus vai escrever o texto final; o executor deixa um texto placeholder marcado `<!-- TODO Matheus -->` baseado na copy atual (§3). Ao lado, strip horizontal com 3-4 fotos (§4) em `Masonry`/marquee lento com hover-zoom.
3. **Projetos em destaque** — 6 cards `SpotlightCard` (ou `TiltedCard`) dos projetos Tier A (§6). Botão "Todos os projetos" → `/projetos`.
4. **Stack** — `LogoLoop` (React Bits) com os logos da stack (§7), dois loops em sentidos opostos. Abaixo, grid de chips agrupados por categoria.
5. **Certificações + timeline** — 3 badges AWS (imagens já existem em `assets/img/cert-*.{png,webp}`) + timeline vertical com `ScrollReveal`.
6. **Contato** — e-mail, LinkedIn, Instagram **@cloudbymcn**, GitHub. Sem formulário (o atual aponta pra lugar nenhum). Rodapé mínimo.

Nav fixa com blur (`backdrop-filter`), logo `logo-mcn.png` à esquerda, links `Projetos · Sobre · Contato`, indicador de seção ativa.

---

## 2. Lanyard — configuração

Fonte: `https://reactbits.dev/components/lanyard` (variante **TS + Tailwind**). Instalar manualmente copiando o componente (`src/components/Lanyard/`), não via jsrepo/CLI. Dependência: `npm i three @types/three`.

Props a usar:

```tsx
<Lanyard
  frontImage="/lanyard/card-front.png"
  backImage="/lanyard/card-back.png"
  strapImage="/lanyard/strap.png"
  imageFit="cover"
  cardColor="#0e0e10"
  orientation="portrait"
  finish="glossy"          // testar "holographic" e escolher o que ler melhor com a foto
  cornerRadius={0.35}
  size={0.62}
  anchor="center"
  strapLength={0.45}
  strapColor="#111111"
  strapWidth={0.65}
  metal="graphite"
  gravity={1}
  damping={0.5}
  elasticity={0.5}
  breeze={0.5}
  interactive
  intro
/>
```

Artes do cartão (executor "Lente" produz, §9):

- **`card-front.png`** — 1024×1440 (2:3). Fundo claro (#f4f4f5) com leve grão. Topo: logo MCN pequeno à esquerda e `@cloudbymcn` em mono à direita (igual ao exemplo do React Bits). Centro: foto do Matheus com fundo removido, em tratamento **monocromático/halftone suave** (mesma linguagem do exemplo), ombros cortados na base. Rodapé: `MATHEUS NASCIMENTO` em Space Grotesk + `Cloud Engineer · AWS` menor.
  - Foto base: `Imagens\matheus\WhatsApp Image 2026-10-09 at 09.35.50.jpeg` (fundo branco, frontal). Alternativa: `...09.36.53 (1).jpeg` (sorrindo).
- **`card-back.png`** — 1024×1440. Fundo escuro. Grid 3×3 com ícones da stack principal (AWS Lambda, DynamoDB, Bedrock, EventBridge, S3, Python, TypeScript, Next.js, Terraform). Base: QR code pra `https://cloudbymcn.com` + tagline `beyond the cloud`.
- **`strap.png`** — 2048×256, repetível na horizontal. Texto `CLOUD BY MCN  ·  BEYOND THE CLOUD  ·` em mono, branco sobre #111, com o logo entre as repetições.

Performance obrigatória: Lanyard carregado com `React.lazy` + `Suspense` (placeholder = o `card-front.png` estático com leve balanço CSS). Em `prefers-reduced-motion: reduce` ou GPU fraca (`navigator.hardwareConcurrency <= 4` no mobile) renderiza só o placeholder. Alvo: 60 fps no desktop, sem jank no scroll.

---

## 3. Copy base (placeholder — o Matheus substitui)

Tirada do site atual, só pra os executores não inventarem:

- Nome: **Matheus Nascimento** · "Engenheiro de Infraestrutura Cloud"
- Sub: "Arquiteturas AWS reais, decisões técnicas e implementações completas. Pós-graduando em Arquitetura Cloud, com foco em IA, escalabilidade e sistemas distribuídos."
- Por que documento: "Cada vez que resolvo um problema em produção, documento. Cada vez que erro, documento melhor ainda."
- Timeline: 2024 CLF-C02 · 2024 AIF-C01 · 2025 SAA-C03 · 2026 lançamento do Cloud by MCN · 2026 pós-graduação em Arquitetura Cloud.
- Canais: `matheuscamposti@gmail.com` · `linkedin.com/in/m-cnascimento` · `instagram.com/cloudbymcn` · `github.com/cloudbymcn`.

---

## 4. Fotos

Origem: `C:\Users\MatheusNascimento\OneDrive - Vitoria Stone\Imagens\matheus\` (8 JPEGs, WhatsApp).

| Arquivo | Uso |
|---|---|
| `09.35.50.jpeg` | Cartão do Lanyard (frontal, fundo branco) |
| `09.36.53 (1).jpeg` | Alternativa pro cartão / avatar da seção Sobre |
| `09.36.52.jpeg`, `09.36.52 (1).jpeg` | Strip "bastidores" (perfil, ambiente de TI) |
| `09.36.51.jpeg`, `09.36.53.jpeg`, `09.36.53 (2).jpeg` | Strip "bastidores" |
| `09.36.52 (2).jpeg` | Reserva |

Processamento: exportar em **WebP** (≤ 200 KB cada, 1200px no lado maior) + `AVIF` opcional; `srcset` 600/1200. Copiar pra `public/photos/`. **Nunca** commitar os JPEGs originais. Nas fotos de ambiente, checar se aparece tela de monitor/laptop com dado legível (a `09.36.52 (1)` mostra um laptop aberto) → desfocar a tela.

---

## 5. Modelo de conteúdo

`src/content/projects/<slug>.mdx`:

```yaml
---
title: "De 24 horas para 3 segundos: integração CRM em tempo real"
slug: salesforce-cdc-eventbridge
summary: "Pipeline event-driven que trocou um batch diário por eventos com latência de ~3 s e custo 10× menor."
category: integracoes          # cloud | integracoes | ia | produtos | ferramentas
tier: A                        # A = case study completo | B = card curto
date: 2026-03-15
stack: [AWS Lambda, EventBridge, Salesforce CDC, Python, Firebird]
metrics:                       # aparecem no card
  - { label: "latência", before: "24 h", after: "3 s" }
  - { label: "custo/mês", before: "US$ 30", after: "US$ 1,50" }
cover: /projects/salesforce-cdc/cover.webp     # screenshot ou diagrama
repo: https://github.com/cloudbymcn/…          # só se público
live: https://…                                # só se público e sem dado sensível
---
```

Página `/projetos`: filtros por `category` e por `stack` (chips), busca por texto, ordenação por data. Card mostra cover, título, summary, até 2 métricas e chips de stack.
Página `/projetos/:slug`: hero com cover, TOC lateral, corpo MDX, bloco "Stack usada", diagrama de arquitetura, links. Código com Shiki (tema escuro).

---

## 6. Projetos — seleção e tiers

Fonte: `C:\projetos\` (ler `README.md` / `CLAUDE.md` / `docs/` de cada um). Tudo passa pelo filtro de anonimização do §8.

### 6.1 Já publicados (migrar os 11 posts de `posts/*.html` → MDX, preservando conteúdo, reescrevendo só o que viola o §8)

| Post atual | Slug novo | Categoria | Tier |
|---|---|---|---|
| salesforce-cdc-eventbridge-firebird | salesforce-cdc-eventbridge | integracoes | A |
| sharepoint-lambda-firebird | sharepoint-lambda-pipeline | integracoes | A |
| ptax-lambda-migration | ptax-lambda-terraform | cloud | A |
| stonetrack-pwa-inventario | pwa-inventario-patio | produtos | A |
| gestao-midia-aws-serverless | portal-corporativo-serverless | cloud | A |
| sentinela-finops-bedrock | finops-security-bedrock | ia | A |
| dungeonai-rpg-bedrock | dungeonai | ia | A |
| serravans-frota-sst | gestao-frota-ocr | produtos | B |
| mailbox-cleaner-mrm | mailbox-cleaner-m365 | ferramentas | B |
| integracao-api-aws | api-segura-banco-privado | integracoes | B |
| otimizacao-mp4 | entrega-video-mediaconvert | cloud | B |

### 6.2 Novos (ainda sem post) — ordem de prioridade

**Tier A (case study completo, 600–1000 palavras, diagrama + 1 screenshot):**
1. `duckdb-salesforce` — extensão DuckDB pra consultar Salesforce. Open source. Categoria `ferramentas`.
2. `mapa3d` — Digital Twin 3D de planta industrial (three.js, DWG → mapa). Categoria `produtos`. Cuidado: anonimizar endereço e empresa.
3. `classificador` — classificador de chapas de rocha com IA explicável (fila, análise por regiões). Categoria `ia`.
4. `entrevista` — PWA de prática de inglês por voz com IA (Next.js + Lambda WebSocket + Cognito). Categoria `ia`.
5. `backups3-onedrive` — backup Firebird → S3 + OneDrive, 5 saltos viraram 1. Categoria `cloud`.
6. `novidades aws` — site estático com anúncios AWS traduzidos por Bedrock, cron diário. Categoria `ia`.
7. `simulador-ambiente` — simulador de pedra em ambientes com geração de imagem (Gemini). Categoria `ia`.
8. `nexus` — app desktop Windows de orquestração de agentes + editor + vault Markdown. Categoria `ferramentas`.

**Tier B (card + 150–250 palavras):**
9. `email-andrea` → "Relatório financeiro diário em Excel via Lambda + SES" (`cloud`)
10. `conciliacao-nfse` → "Conciliação de NFS-e entre API fiscal e ERP" (`integracoes`)
11. `arquivei` → "Consulta de NF-e via API com React + Cloudscape" (`produtos`)
12. `controle-de-borracha` → "Controle de vida útil de insumos industriais, Entra ID + DynamoDB" (`produtos`)
13. `ordemcompras` → "Portal de ordens de compra em lote no ERP" (`produtos`)
14. `relatorio_diario_producao_mvp_v7` → "Painel diário de produção industrial" (`produtos`)
15. `jev-listener-web` → "Extensão de navegador controlada por voz, parser local + LLM" (`ferramentas`)
16. `sergio-lembrete` → "PWA de agenda com push notifications, SST" (`produtos`)
17. `aereas` → "Radar de passagens aéreas, PWA + alertas" (`produtos`)
18. `airbnb` → "Monitor de casas de temporada pra grupo, com rateio" (`produtos`)
19. `ricardo-igo` → "Vitrine serverless de chapas" (`produtos`)
20. `daily-report` → "Relatório diário de infra em PowerShell → Exchange Online" (`ferramentas`)
21. `amostras` → "Pedidos de amostras: form → e-mail pra expedição" (`produtos`)
22. `video-downloader` → "Downloader multi-plataforma com merge MP4" (`ferramentas`)

**Fora** (não publicar): `aws-job`, `analista-inteligente`, `comissões`, `alvim`, `planilhas-valdir`, `telefones`, `pdf-editr`, `fortigate`, `fg-deploy*`, `bypass-android`, `deepfake`, `analise-virus`, `fakenewsjev`, `suporte-bat`, `duvidas`, `viagens`, `youtube`, `reels-instagram`, `trabalhos facul`, `teste`, `nexus-*` (sandbox), `my-clone` (template de terceiro), `vitoria-stone-sam`, `transpetro`, `aws-professional`, `localizaii` (já coberto), `pramio` (guarda-chuva), `granitetrack`/`lumabot`/`pipeline-ci-cd` (POCs sem README).

Se um executor abrir um projeto e achar que a prioridade está errada, escreve na nota e segue.

---

## 7. Stack (taxonomia dos chips e do LogoLoop)

Logos: usar `simple-icons` (npm) como SVG inline; onde não houver (ex.: Bedrock, Strands), usar ícone genérico da categoria. Nada de PNG de marca baixado de site aleatório.

- **AWS:** Lambda, API Gateway, EventBridge, S3, CloudFront, DynamoDB, Cognito, SES, SQS, Step Functions, Bedrock, MediaConvert, Batch, Secrets Manager, CloudWatch, SAM, CDK
- **IaC/DevOps:** Terraform, SST, GitHub Actions, Docker, PowerShell, Bash
- **Linguagens:** Python, TypeScript, JavaScript, Node.js, SQL
- **Front:** React, Next.js, Vite, Tailwind, shadcn/ui, three.js, PWA
- **Dados/Integrações:** Firebird, DuckDB, Salesforce, SharePoint/Graph API, Microsoft 365, OpenAPI
- **IA:** Bedrock (Claude, Nova Canvas), Strands Agents, Gemini, OCR

Os chips de cada projeto vêm do frontmatter; a lista acima é o vocabulário permitido (normalizar nomes, ex.: sempre "AWS Lambda", nunca "lambda").

---

## 8. Anonimização — regra dura, sem exceção

Nada abaixo pode aparecer em código, MDX, imagem, alt text, nome de arquivo, commit ou screenshot:

1. **IDs e endereços:** account IDs AWS (`\b\d{12}\b`), ARNs, IPv4/IPv6, hostnames internos, URLs `*.cloudfront.net` de produção, URLs `*.vitoriastone.com*`, buckets, nomes de distribution, chaves, tokens, `.env`.
2. **Empresa e sistemas:** "Vitória Stone"/"Vitoria Stone"/"VS" → **"uma indústria de rochas ornamentais no ES"** (ou nome fictício **"Pedra Viva Rochas"** quando precisar de nome). "Athenas"/"Sankhya"/"HQbird" → **"ERP legado (Firebird)"**. "LeverPro", "consultorPRO", "Arquivei/Qive", "Mercos" → descrever pela função ("plataforma de BI financeiro", "API fiscal"), sem marca.
3. **Pessoas:** nenhum nome de colega/cliente (Sérgio, Andrea, Valdir, Ricardo, Guilherme, Winnye, Jean, Caio, Alvim, etc.) → papel ("o motorista", "a analista financeira"). Único nome real no site: Matheus Nascimento.
4. **Endereços físicos, CNPJ, placas, telefones, e-mails** (exceto o de contato do §3).
5. **Screenshots:** só de app público ou de `localhost` com dados fictícios. Qualquer tela com dado real → desfocar ou substituir por diagrama.

Verificação automática (executor "Vigia"): script `scripts/scrub-check.mjs` que roda no `npm run check` e falha se achar os padrões acima em `src/`, `public/`, `docs/`. Lista de termos proibidos em `scripts/forbidden-terms.txt` (não commitar os termos reais sensíveis como IDs; os de marca podem).

---

## 9. Time e divisão (terminais Maestri)

| Codinome | Preset / modelo | Frente | Entregáveis |
|---|---|---|---|
| **Forja** | Claude Code, `--model opus` | App | Scaffold Vite/React/TS/Tailwind, design tokens, nav, 6 blocos da home, Lanyard integrado e lazy, `/projetos`, `/projetos/:slug`, MDX pipeline, workflow de deploy, `npm run check` verde |
| **Cartógrafo** | Claude Code, `--model opus` | Conteúdo | 11 MDX migrados + 8 Tier A + 14 Tier B, frontmatter completo, diagramas de arquitetura em SVG (Mermaid → SVG ou desenhado), tudo scrubado |
| **Lente** | Codex | Assets | `card-front/back/strap.png`, fotos WebP, logos da stack, favicon/OG novo, screenshots via portal dos apps públicos (lista: Cartógrafo fornece) |
| **Vigia** | Antigravity | QA | `scrub-check`, investigação do hosting (P1), teste em 6 larguras (360/390/768/1024/1440/1920) via portal em `localhost:4173`, Lighthouse ≥ 90 perf/≥ 95 a11y, revisão de PR |

Regras do time:
- Todos conectados à nota **"Status- Frontend v2 cloudbymcn (Lanyard)"**; cada um marca suas etapas lá.
- Branch única `v2-lanyard`; commits pequenos com prefixo `[forja]`, `[carto]`, `[lente]`, `[vigia]`. Rebase antes de push. Sem push em `main`.
- Forja define a estrutura de pastas primeiro (commit 1) e escreve `docs/PROJECT_STATUS.md`; os outros só começam a commitar depois desse commit.
- Navegação na web só por portal Maestri. Nada de curl/WebFetch.
- Dúvida → nota. Não parar esperando resposta: seguir com a melhor hipótese e marcar `[ASSUMIDO]`.

---

## 10. Estrutura de pastas (Forja cria no commit 1)

```
cloudbymcn/
├── .github/workflows/deploy.yml
├── docs/SPEC-FRONTEND-V2.md      ← este arquivo
├── docs/PROJECT_STATUS.md
├── public/{CNAME,lanyard/,photos/,projects/<slug>/,favicon.svg,og.png}
├── scripts/{scrub-check.mjs,forbidden-terms.txt,migrate-posts.mjs}
├── src/
│   ├── main.tsx · App.tsx · routes.tsx
│   ├── styles/{tokens.css,globals.css}
│   ├── components/{Lanyard/,Nav,Hero,About,FeaturedProjects,StackLoop,Certs,Contact,Footer,ProjectCard,…}
│   ├── content/projects/*.mdx
│   ├── lib/{content.ts (índice via import.meta.glob),stack.ts (taxonomia §7)}
│   └── pages/{Home,Projects,Project,About,Contact,NotFound}.tsx
├── index.html · vite.config.ts · tsconfig.json · package.json
└── posts/ (legado — apagar após migração validada, com redirects 301 no `public/_redirects` ou meta refresh em `posts/*.html` → `/projetos/<slug>`)
```

Design tokens (`tokens.css`): `--bg #09090b`, `--bg-2 #121214`, `--ink #f4f4f5`, `--ink-2 #a1a1aa`, `--ink-3 #71717a`, `--accent #38bdf8` (azul nuvem), `--accent-2 #f59e0b` (âmbar AWS, só em destaques), `--ring rgba(56,189,248,.35)`. Fontes: Space Grotesk (display), Inter (texto), JetBrains Mono (código/labels) via Google Fonts com `preconnect`.

---

## 11. Definição de pronto

- [ ] `npm run check` e `npm run build` verdes; `scrub-check` passa.
- [ ] Home com os 6 blocos; Lanyard arrastável, flip ao clicar, intro ao montar, placeholder em reduced-motion.
- [ ] 33 projetos no índice (11 migrados + 22 novos), filtros funcionando, 100 % com cover.
- [ ] Lighthouse mobile: perf ≥ 90, a11y ≥ 95, SEO ≥ 95. CLS < 0,1.
- [ ] Redirects dos 11 posts antigos funcionando.
- [ ] `sitemap.xml`, `robots.txt`, OG image, favicon atualizados.
- [ ] Preview em `localhost:4173` revisado nas 6 larguras, com screenshots anexados na nota.
- [ ] PR `v2-lanyard → main` aberto, descrição com screenshots. **Merge só o Matheus.**

---

## 12. Fase 2 (não fazer agora)

Toggle PT/EN · modo claro · busca com atalho `/` · RSS · analytics sem cookie (Plausible/Umami) · página "Uses".
