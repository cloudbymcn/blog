# Reels do Instagram no site

O fim da home tem um card do **@cloudbymcn** que passa os reels como parte do site: vídeo próprio
(mp4 mudo, em loop, servido pelo GitHub Pages), sem embed do Instagram. Um reel por vez em destaque
e os vizinhos menores. Só toca quando o card está na tela. Clicar no reel central abre o reel no
Instagram e o botão "seguir" abre o perfil.

## Como funciona

| Peça                              | O que faz                                                                                                         |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `src/content/reels.json`          | Lista `[{ id, permalink, caption, video, poster }]`. **Vazio (`[]`) = a seção não aparece** e não pesa no bundle. |
| `public/reels/<id>.mp4` / `.webp` | Vídeo comprimido (720 de largura no máximo, sem áudio, ~1-2 MB) e poster.                                         |
| `npm run reels:fetch`             | `scripts/fetch-reels.mjs`: busca os últimos reels pela API do Instagram (precisa de `IG_TOKEN`).                  |
| `npm run reels:import -- <pasta>` | `scripts/import-reels.mjs`: modo manual, sem token, a partir de vídeos numa pasta.                                |
| `.github/workflows/deploy.yml`    | Se o secret `IG_TOKEN` existir, roda o fetch antes do build. Sem secret, usa os arquivos commitados.               |

Os dois scripts precisam do `ffmpeg` no PATH (ou `FFMPEG=<caminho>`). Legendas que batem numa regra
do `scrub-check` (nomes proibidos, e-mails, IPs etc.) são descartadas: o reel entra sem legenda.

Vídeo e animação respeitam o visitante: com reduced-motion, economia de dados ou rede 2g o card mostra
só os posters. Nada do card é baixado antes de ele chegar perto da tela.

## Modo manual (sem token)

1. Baixe os reels (os mp4 originais) numa pasta, por exemplo `C:\reels`.
2. A ordem no site é a ordem alfabética dos arquivos: nomeie `01-...mp4`, `02-...mp4`.
3. Opcional: crie `C:\reels\reels.json` com o link e a legenda de cada um. Sem link, o clique abre a
   aba de reels do perfil.

   ```json
   {
     "01-meu-reel.mp4": {
       "permalink": "https://www.instagram.com/reel/CODIGO/",
       "caption": "texto que aparece embaixo"
     }
   }
   ```

4. Rode `npm run reels:import -- C:\reels`. A pasta substitui a lista inteira.
5. Confira com `npm run dev` e commite `public/reels/` + `src/content/reels.json`.

## Modo automático (Instagram API with Instagram Login)

### 1. Conta profissional

No app do Instagram, com o @cloudbymcn: **Configurações → Tipo de conta e ferramentas → Mudar para
conta profissional** (Criador de conteúdo ou Empresa). Esse fluxo não precisa de Página do Facebook.

### 2. App na Meta

1. Entre em [developers.facebook.com](https://developers.facebook.com/) → **Meus apps → Criar app**.
2. Caso de uso: **Gerenciar mensagens e conteúdo no Instagram** (Instagram API). Se perguntar o tipo,
   **Empresa**. Nome sugerido: `cloudbymcn-site`.
3. No painel do app: **Instagram → Configuração da API com login do Instagram**.
4. Em **Gerar tokens de acesso**, clique em **Adicionar conta** e entre com o @cloudbymcn. Se o
   painel pedir, adicione a conta em **Funções do app → Funções → Testadores do Instagram** e aceite o
   convite no Instagram (**Configurações → Apps e sites → Convites de testador**).
5. Clique em **Gerar token** ao lado da conta e copie. Esse token já é de longa duração (60 dias) e só
   precisa da permissão `instagram_business_basic`.

O app pode ficar em **modo de desenvolvimento**: ele só lê a própria conta, então não precisa de App
Review.

### 3. Testar no PC (opcional, recomendado)

PowerShell, na pasta do repo:

```powershell
$env:IG_TOKEN = "<cole o token>"
npm run reels:fetch
Remove-Item Env:IG_TOKEN
npm run dev
```

O script mostra quantos reels baixou e o tamanho total. Se estiver bom, commite `public/reels/` e
`src/content/reels.json`. **O token nunca vai pro repo** (`.env*` está no `.gitignore`; não crie
arquivo com ele dentro do projeto).

Variáveis opcionais: `REELS_COUNT` (padrão 8), `REELS_MAX_SECONDS` (corte, padrão 20),
`REELS_MAX_RATE` (teto de bitrate, padrão `700k`).

### 4. Secret no GitHub

Repo `cloudbymcn/blog` → **Settings → Secrets and variables → Actions → New repository secret**:

- `IG_TOKEN` = o token.

A partir daí todo deploy (push em `main`, manual ou o cron de segunda 09:00 UTC) baixa os reels mais
novos antes do build. O cron só roda na branch padrão do repo. Se a API falhar, o deploy segue com o
que está commitado.

### 5. Validade do token

O token vale 60 dias. A cada execução o script chama `GET /refresh_access_token`, que estende a
validade (precisa ter mais de 24 h de vida e ainda não ter vencido). O cron semanal mantém o token vivo.

Se o refresh devolver um valor novo, o workflow só consegue gravar de volta no secret com um PAT:

- Crie um **fine-grained personal access token** em GitHub → Settings → Developer settings, só para o
  repo `cloudbymcn/blog`, com a permissão **Secrets: Read and write**.
- Salve como secret `GH_PAT_SECRETS`.

Sem esse PAT, se o log do passo "Reels do Instagram" mostrar `token renovado ... (valor novo)` ou um
erro `code 190` (token vencido), gere outro token no painel da Meta (passo 2.5) e troque o secret.

## Problemas comuns

- **Reel não aparece**: reels com música licenciada às vezes vêm sem `media_url` na API e ficam de
  fora. Use o modo manual pra esses.
- **`code 190`**: token vencido ou revogado. Gere outro e atualize o secret.
- **`ffmpeg não encontrado`**: instale o ffmpeg ou rode com `FFMPEG=<caminho do ffmpeg.exe>`.
- **Seção sumiu**: `src/content/reels.json` está `[]`. Rode um dos dois modos.
