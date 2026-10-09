import { useEffect, useRef, useState } from 'react'
import type { CoverVideo } from '../lib/content'

type Connection = { saveData?: boolean; effectiveType?: string }

/** Vídeo só com movimento liberado e rede boa: reduced-motion, economia de dados e 2g ficam no poster. */
function motionAllowed() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  const c = (navigator as Navigator & { connection?: Connection }).connection
  if (c?.saveData) return false
  return !/2g$/.test(c?.effectiveType ?? '')
}

/** Fontes que o navegador diz tocar, na ordem webm → mp4 (Safari antigo pula o webm). */
function playableSources(video?: CoverVideo) {
  if (!video) return []
  const probe = document.createElement('video')
  return [
    { src: video.webm, type: 'video/webm' },
    { src: video.mp4, type: 'video/mp4' },
  ].filter((s): s is { src: string; type: string } => !!s.src && probe.canPlayType(s.type) !== '')
}

/**
 * Cover de projeto: imagem (cover.webp) ou, quando existe cover.webm/mp4, vídeo curto em loop, mudo,
 * com o webp de poster. Só toca com `active` (no carrossel: central e vizinhos) e enquanto está na tela;
 * se o vídeo falhar (onError) tenta a próxima fonte, depois o cover.gif, e por fim fica no poster.
 */
export function CoverMedia({
  poster,
  video,
  active,
  alt,
  className,
  width,
  height,
  priority = false,
}: {
  poster?: string
  video?: CoverVideo
  active: boolean
  alt: string
  className: string
  width?: number
  height?: number
  priority?: boolean
}) {
  const [motion] = useState(motionAllowed)
  const [sources] = useState(() => (motion ? playableSources(video) : []))
  const [failed, setFailed] = useState(0) // quantas fontes já deram erro
  const [gifFailed, setGifFailed] = useState(false)
  const [inView, setInView] = useState(false)
  const ref = useRef<HTMLVideoElement>(null)

  const source = active ? sources[failed] : undefined
  const gif = active && motion && !source && !gifFailed ? video?.gif : undefined

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting))
    io.observe(el)
    return () => io.disconnect()
  }, [source])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    // atributo além da propriedade: o Safari iOS só deixa dar autoplay com `muted` no HTML
    el.muted = true
    el.setAttribute('muted', '')
    if (inView) el.play().catch(() => {})
    else el.pause()
  }, [inView, source])

  const imgProps = {
    alt,
    width,
    height,
    draggable: false,
    decoding: 'async' as const,
    loading: priority ? undefined : ('lazy' as const),
    fetchPriority: priority ? ('high' as const) : undefined,
    className,
  }

  if (source) {
    return (
      <video
        key={source.src}
        ref={ref}
        src={source.src}
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
        preload="none"
        disablePictureInPicture
        draggable={false}
        onError={() => setFailed((f) => f + 1)}
        aria-label={alt || undefined}
        aria-hidden={alt ? undefined : true}
        className={className}
        width={width}
        height={height}
      />
    )
  }
  if (gif) return <img src={gif} {...imgProps} onError={() => setGifFailed(true)} />
  return poster ? <img src={poster} {...imgProps} /> : null
}
