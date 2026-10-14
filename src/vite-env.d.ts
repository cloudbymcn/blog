/// <reference types="vite/client" />

declare module 'virtual:projects-index' {
  const entries: Array<Record<string, unknown> & { file: string }>
  export default entries
}

/** true quando src/content/reels.json tem reels (vite.config.ts); false tira o card do bundle. */
declare const __HAS_REELS__: boolean
