import { useEffect, useSyncExternalStore } from 'react'
import type { PathIcon } from '../assets/stackIcons'
import { stackIcon } from '../lib/icons'
import { stackGroup } from '../lib/stack'

/*
 * Ícones fora do simple-icons (serviços AWS, Codex, Antigravity, Nova, VS Code…) ficam num chunk
 * separado (~13 KB gzip), carregado quando o primeiro StackIcon monta: não pesa no bundle inicial.
 */
let paths: Record<string, PathIcon> | undefined
let loading: Promise<void> | undefined
const listeners = new Set<() => void>()

function loadPaths() {
  loading ??= import('../assets/stackIcons').then((m) => {
    paths = m.STACK_ICON_PATHS
    listeners.forEach((l) => l())
  })
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

/** SVG inline monocromático (currentColor); sem ícone de marca, usa um genérico da categoria. */
export function StackIcon({ name, className = 'size-5' }: { name: string; className?: string }) {
  const icon = stackIcon(name)
  const loaded = useSyncExternalStore(subscribe, () => paths)
  useEffect(() => {
    if (!icon) loadPaths()
  }, [icon])

  if (icon) {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
        <path d={icon.path} />
      </svg>
    )
  }
  // enquanto o chunk não chega, reserva o espaço em vez de piscar o genérico
  if (!loaded) return <svg viewBox="0 0 24 24" className={className} aria-hidden="true" />
  const own = loaded[name]
  if (own) {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
        <path d={own.d} fillRule={own.evenodd ? 'evenodd' : undefined} />
      </svg>
    )
  }
  const group = stackGroup(name)
  // JEV (extensão de voz): microfone
  if (name === 'JEV') {
    return (
      <svg
        viewBox="0 0 24 24"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="9" y="2" width="6" height="12" rx="3" />
        <path d="M19 10v1a7 7 0 0 1-14 0v-1M12 18v4M8 22h8" />
      </svg>
    )
  }
  // nuvem pra AWS, cilindro pra dados, faísca pra IA, chaves pro resto
  const d =
    group === 'AWS'
      ? 'M7 18a5 5 0 0 1-.6-9.96A6 6 0 0 1 18 8.5a4.75 4.75 0 0 1-.5 9.5H7z'
      : group === 'Dados/Integrações'
        ? 'M12 3c4.4 0 8 1.3 8 3v12c0 1.7-3.6 3-8 3s-8-1.3-8-3V6c0-1.7 3.6-3 8-3zm0 2C8 5 6 6.1 6 6.5S8 8 12 8s6-1.1 6-1.5S16 5 12 5z'
        : group === 'IA'
          ? 'M12 2l2.2 6.3L20.5 10l-6.3 2.2L12 18.5l-2.2-6.3L3.5 10l6.3-1.7L12 2z'
          : 'M8 4 3 12l5 8h2l-5-8 5-8H8zm8 0h-2l5 8-5 8h2l5-8-5-8z'
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d={d} />
    </svg>
  )
}
