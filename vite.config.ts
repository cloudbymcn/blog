import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import mdx from '@mdx-js/rollup'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import rehypeShiki from '@shikijs/rehype'
import { projectsIndex } from './scripts/vite/projects-index'
import { staticPages } from './scripts/vite/static-pages'

// reels.json vazio = card do Instagram fora do bundle (a Home testa __HAS_REELS__ e o rollup corta o resto).
// No dev fica sempre ligado: o json pode mudar com o servidor de pé e o card já some sozinho se vazio.
const hasReels = () => (JSON.parse(readFileSync('src/content/reels.json', 'utf8')) as unknown[]).length > 0

export default defineConfig(({ command }) => ({
  base: '/',
  define: { __HAS_REELS__: JSON.stringify(command === 'serve' || hasReels()) },
  plugins: [
    projectsIndex(),
    staticPages(),
    {
      enforce: 'pre',
      ...mdx({
        providerImportSource: '@mdx-js/react',
        remarkPlugins: [remarkFrontmatter, [remarkMdxFrontmatter, { name: 'frontmatter' }], remarkGfm],
        rehypePlugins: [rehypeSlug, [rehypeShiki, { theme: 'github-dark-default' }]],
      }),
    },
    react({ include: /\.(jsx|js|mdx|md|tsx|ts)$/ }),
    tailwindcss(),
  ],
}))
