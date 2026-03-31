# Cloud by MCN

Portfolio e blog documentando arquiteturas AWS reais, case studies e decisoes tecnicas de producao.

**Site:** [cloudbymcn.com](https://cloudbymcn.com)

## Stack

- **HTML5 / CSS3 / JavaScript puro** — zero frameworks, zero build tools
- **Google Fonts** — Inter, Space Grotesk, DM Serif Display, JetBrains Mono
- **Prism.js** — syntax highlighting nas paginas de post

## Estrutura

```
.
├── index.html              # Pagina principal (hero, projetos, sobre, contato)
├── robots.txt              # SEO — permissoes de indexacao
├── sitemap.xml             # SEO — mapa do site
├── assets/
│   ├── css/
│   │   ├── style.css       # Estilos globais, variaveis, animacoes, responsivo
│   │   └── post.css        # Estilos das paginas de post
│   ├── img/                # Imagens, certificacoes, video de fundo
│   └── js/
│       └── main.js         # Animacoes, scroll, filtros, i18n, nav
├── posts/
│   ├── TEMPLATE.html       # Copie este arquivo para criar novos posts
│   ├── gestao-midia-aws-serverless.html
│   ├── integracao-api-aws.html
│   └── otimizacao-mp4.html
├── .gitignore
└── README.md
```

## Funcionalidades

- Suporte bilingue (PT/EN) com sistema i18n proprio
- Animacoes CSS: split-text no hero, reveal palavra por palavra, reveals no scroll
- Cards 3D com tilt e glow (desktop)
- Filtros e ordenacao de projetos
- Tela de loading com desenho SVG de nuvem
- Barra de progresso de scroll + botao voltar ao topo circular
- Totalmente responsivo (breakpoints em 900px, 680px, 380px)
- Respeita `prefers-reduced-motion`
- Formulario de contato funcional via mailto

## Como rodar

1. Abra no VS Code
2. Instale a extensao **Live Server**
3. Clique direito em `index.html` > **Open with Live Server**

Ou use qualquer servidor estatico:

```bash
npx serve .
# ou
python -m http.server 8000
```

## Como adicionar um novo post

1. Copie `posts/TEMPLATE.html` e renomeie
2. Edite o `<title>`, meta tags e conteudo
3. Adicione um card de projeto no `index.html` dentro de `.proj-grid`
4. Atualize o `sitemap.xml` com a nova URL

## Como adicionar nova categoria

1. No `style.css`, adicione a cor:
   ```css
   .pj[data-cat="aiml"]{--pj-c:#ec4899}
   ```
2. No `index.html`, adicione o botao de filtro:
   ```html
   <button class="f-btn" data-filter="aiml">AI/ML</button>
   ```

## Deploy

Opcoes recomendadas:
- **S3 + CloudFront** (vira case study)
- **Netlify** (drag & drop ou conecta ao GitHub)
- **Vercel** (conecta ao repo)
- **GitHub Pages** (gratis, direto deste repo)

## Licenca

Todos os direitos reservados. Conteudo e design por Matheus N.
