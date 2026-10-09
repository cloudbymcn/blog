import { useState } from 'react'

/** Badge da certificação; sem a imagem (ainda não commitada), cai num badge genérico no mesmo tamanho. */
export function CertBadge({
  src,
  name,
  code,
  className = 'w-full max-w-40',
}: {
  src: string
  name: string
  code: string
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return (
      <div
        role="img"
        aria-label={name}
        className={`flex aspect-square flex-col items-center justify-center rounded-[28%] border border-black/10 bg-white text-center shadow-[0_8px_30px_rgba(0,0,0,0.06)] ${className}`}
      >
        <span className="text-xs font-semibold text-ink-2">aws certified</span>
        <span className="mt-1 font-display text-lg font-semibold tracking-[-0.02em] text-ink">{code}</span>
      </div>
    )
  }
  return (
    <img
      src={src}
      alt={name}
      width={160}
      height={160}
      loading="lazy"
      decoding="async"
      draggable={false}
      onError={() => setFailed(true)}
      className={`aspect-square object-contain ${className}`}
    />
  )
}
