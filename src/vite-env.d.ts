/// <reference types="vite/client" />

declare module 'virtual:projects-index' {
  const entries: Array<Record<string, unknown> & { file: string }>
  export default entries
}
