# Cloud by MCN

Portfolio and technical blog showcasing real-world AWS architectures, case studies, and production decisions.

**Live:** [cloudbymcn.com](https://cloudbymcn.com)

## Tech Stack

- **HTML5 / CSS3 / Vanilla JS** - Zero frameworks, zero build tools
- **Google Fonts** - Inter, Space Grotesk, DM Serif Display, JetBrains Mono
- **Prism.js** - Syntax highlighting on post pages

## Project Structure

```
.
├── index.html              # Single-page app (hero, projects, about, contact)
├── assets/
│   ├── css/
│   │   ├── style.css       # Global styles, variables, animations, responsive
│   │   └── post.css        # Blog post page styles
│   ├── img/                # Images, certs, video background
│   └── js/
│       └── main.js         # Animations, scroll, filters, i18n, nav
├── posts/
│   ├── TEMPLATE.html       # Copy this to create new posts
│   ├── gestao-midia-aws-serverless.html
│   ├── integracao-api-aws.html
│   └── otimizacao-mp4.html
├── .gitignore
└── README.md
```

## Features

- Bilingual support (PT/EN) via custom i18n system
- CSS-driven animations: split-text hero, word-by-word reveal, scroll-triggered reveals
- 3D tilt cards with glow effect (desktop)
- Project filtering and sorting
- SVG cloud draw loading screen
- Scroll progress bar, circular back-to-top button
- Fully responsive (mobile-first breakpoints at 900px, 680px, 380px)
- Respects `prefers-reduced-motion`

## Running Locally

1. Open in VS Code
2. Install the **Live Server** extension
3. Right-click `index.html` > **Open with Live Server**

Or use any static server:

```bash
npx serve .
# or
python -m http.server 8000
```

## Adding a New Post

1. Copy `posts/TEMPLATE.html` and rename it
2. Edit the `<title>`, meta tags, and content
3. Add a project card in `index.html` inside `.proj-grid`

## Adding a New Project Category

1. In `style.css`, add a color variable:
   ```css
   .pj[data-cat="aiml"]{--pj-c:#ec4899}
   ```
2. In `index.html`, add a filter button:
   ```html
   <button class="f-btn" data-filter="aiml">AI/ML</button>
   ```

## Deployment

Recommended options:
- **S3 + CloudFront** (doubles as a case study)
- **Netlify** (drag & drop or connect GitHub)
- **Vercel** (connect GitHub repo)
- **GitHub Pages** (free, from this repo)

## License

All rights reserved. Content and design by Matheus N.
