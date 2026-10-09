# CLAUDE.md

Antes de continuar qualquer trabalho, leia [docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md) (estado atual, o que está em andamento, próximo passo) e a espec [docs/SPEC-FRONTEND-V2.md](docs/SPEC-FRONTEND-V2.md). Atualize o PROJECT_STATUS nos checkpoints.

## Stack

Vite 6 + React 19 + TypeScript + Tailwind v4 + MDX (`@mdx-js/rollup`, Shiki). 3D do Lanyard com `three`. Deploy estático no GitHub Pages.

## Comandos

- `npm run dev` — servidor local (Vite)
- `npm run build` — `tsc -b` + build de produção em `dist/`
- `npm run preview` — serve o build em `localhost:4173`
- `npm run check` — typecheck (tsc) + ESLint + Prettier + `scripts/scrub-check.mjs` (rode antes de commitar)
- `npm run format` — aplica Prettier

## Regras do repo

- Branch de trabalho `v2-lanyard`. Nunca commitar em `main`; merge só o Matheus.
- Commits pequenos com prefixo da frente: `[forja]`, `[carto]`, `[lente]`, `[vigia]`. Rebase antes de push.
- Anonimização (SPEC §8) é regra dura: nada de IDs AWS, ARNs, nomes de empresa/colegas, dados reais em screenshots.
- Pastas legadas (`legacy/`, `posts/`, `assets/`) ficam até a migração ser validada; não editar.

# Regras do Maestri (valem para toda tarefa, sem exceção)

Você roda dentro do Maestri. Regra que manda em todas as outras: **tudo o que você
fizer tem que ser visível para mim no canvas.** Se eu não consigo ver acontecendo,
está errado, mesmo que o resultado final esteja certo.

A CLI `maestri` está no PATH (se não achar, use "$MAESTRI_CLI"). Antes da primeira
ação de qualquer tarefa, rode `maestri list` para ver o que já está conectado a você.

## 1. Nota de status é a PRIMEIRA ação, sempre

Antes de começar qualquer trabalho, crie a nota com `maestri note create --name "Status: <tarefa>"`,
um checklist com uma linha por etapa. Marque cada etapa com `maestri note edit` ao terminar.

## 2. Agente é terminal no canvas, nunca subagente interno

Pedido de agentes/paralelismo = `maestri recruit "Codinome" --preset "<preset>" --role "<papel>"`
e delegação com `maestri ask`. Se não conseguir recrutar, pare e diga o motivo.

## 3. Internet é portal no canvas

Proibido WebSearch, WebFetch, curl, Playwright. Navegação só via `maestri portal ...`.

## 4. Todo terminal nasce em modo bypass

## 5. Conecte todo mundo na nota (`maestri connect`)

## 6. Fechamento: resultado na nota, `maestri dismiss`, `maestri notify`.
