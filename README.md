# Cloud by MCN — Projeto do Blog

## Estrutura

```
cloudbymcn/
├── index.html                 ← Página principal (hero + projetos + sobre + contato)
├── assets/
│   ├── css/
│   │   ├── style.css          ← Estilos globais (todas as páginas)
│   │   └── post.css           ← Estilos específicos de artigos
│   ├── img/
│   │   ├── hero-bg.webp       ← (ADICIONAR: imagem gerada no Nano Banana)
│   │   ├── favicon.svg
│   │   └── ...                ← Prints dos artigos
│   └── js/
│       └── main.js            ← Scroll, filtros, animações, nav mobile
└── posts/
    ├── TEMPLATE.html           ← Template para novos posts (copiar e editar)
    ├── gestao-midia-aws-serverless.html
    ├── integracao-api-aws.html
    └── otimizacao-mp4.html
```

## Como rodar local

1. Abra a pasta no VS Code
2. Instale a extensão **Live Server**
3. Clique direito no `index.html` → "Open with Live Server"

## Como adicionar um novo projeto

1. Abra `index.html`
2. Procure `<!-- COMO ADICIONAR UM NOVO PROJETO -->`
3. Copie um bloco `<article class="pj">` existente
4. Cole dentro do `<div class="proj-grid">`
5. Edite: `data-cat`, `data-date`, título, descrição, tags, métricas

## Como adicionar um novo post

1. Copie `posts/TEMPLATE.html`
2. Renomeie (ex: `posts/meu-novo-post.html`)
3. Edite o `<title>`, `<h1>`, conteúdo
4. Adicione um card de projeto no `index.html` apontando para o post

## Como adicionar nova categoria de projeto

1. No `assets/css/style.css`, adicione:
   ```css
   .pj[data-cat="aiml"]{--pj-c:#ec4899}
   ```
2. No `index.html`, adicione um botão de filtro:
   ```html
   <button class="f-btn" data-filter="aiml">Cloud AI/ML</button>
   ```

## Deploy

Opções recomendadas:
- **S3 + CloudFront** (vira case study)
- **Netlify** (drag & drop da pasta)
- **Vercel** (conecta ao GitHub)
