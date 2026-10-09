import {
  siAnthropic,
  siDocker,
  siDuckdb,
  siGithubactions,
  siGnubash,
  siGooglegemini,
  siJavascript,
  siNextdotjs,
  siNodedotjs,
  siOpenapiinitiative,
  siPwa,
  siPython,
  siReact,
  siShadcnui,
  siSst,
  siTailwindcss,
  siTerraform,
  siThreedotjs,
  siTypescript,
  siVite,
  type SimpleIcon,
} from 'simple-icons'

/** Ícones de marca disponíveis no simple-icons (SPEC §7). Os demais caem no ícone genérico. */
const ICONS: Record<string, SimpleIcon> = {
  Terraform: siTerraform,
  SST: siSst,
  'GitHub Actions': siGithubactions,
  Docker: siDocker,
  Bash: siGnubash,
  Python: siPython,
  TypeScript: siTypescript,
  JavaScript: siJavascript,
  'Node.js': siNodedotjs,
  React: siReact,
  'Next.js': siNextdotjs,
  Vite: siVite,
  Tailwind: siTailwindcss,
  'shadcn/ui': siShadcnui,
  'three.js': siThreedotjs,
  PWA: siPwa,
  DuckDB: siDuckdb,
  OpenAPI: siOpenapiinitiative,
  Gemini: siGooglegemini,
  'Bedrock (Claude)': siAnthropic,
}

export function stackIcon(name: string): SimpleIcon | undefined {
  return ICONS[name]
}
