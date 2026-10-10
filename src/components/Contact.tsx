import { useState } from 'react'
import { Link } from 'react-router'
import { siGithub, siInstagram } from 'simple-icons'
import { Magnet } from './ui/Magnet'
import { Reveal } from './ui/Reveal'

const EMAIL = 'matheuscamposti@gmail.com'

// LinkedIn saiu do simple-icons; path desenhado à mão
const LINKEDIN_PATH =
  'M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z'
const MAIL_PATH = 'M2 5h20v14H2V5zm2 2v.5l8 5 8-5V7H4zm16 2.86-8 5-8-5V17h16V9.86z'

const CHANNELS = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/m-cnascimento', path: LINKEDIN_PATH },
  { label: 'GitHub', href: 'https://github.com/cloudbymcn', path: siGithub.path },
  { label: 'Instagram', href: 'https://instagram.com/cloudbymcn', path: siInstagram.path },
  { label: 'E-mail', href: `mailto:${EMAIL}`, path: MAIL_PATH },
]

function Icon({ path, className = 'size-5' }: { path: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d={path} />
    </svg>
  )
}

/** Botão escuro "contato" que, no hover/foco, abre e mostra o e-mail; clique copia (rbp-portfolio). */
function ContactButton() {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(EMAIL)
    } catch {
      window.location.href = `mailto:${EMAIL}`
      return
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <button
      type="button"
      onClick={copy}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      aria-label={copied ? 'E-mail copiado' : `Copiar ${EMAIL}`}
      className="relative inline-flex h-12 items-center rounded-2xl bg-ink px-5 text-[15px] font-medium text-white transition-[background-color] hover:bg-black"
    >
      <span className="inline-flex items-center gap-2 whitespace-nowrap">
        <span className="relative inline-flex size-4 shrink-0">
          {/* ícone troca: envelope -> copiar -> check */}
          <svg
            viewBox="0 0 24 24"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            {copied ? (
              <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
            ) : open ? (
              <>
                <rect x="9" y="9" width="11" height="11" rx="2" />
                <path d="M5 15V5a1 1 0 0 1 1-1h10" />
              </>
            ) : (
              <path d="M3 6h18v12H3zM3 7l9 6 9-6" strokeLinejoin="round" />
            )}
          </svg>
        </span>
        {(copied || !open) && <span className="lc">{copied ? 'copiado!' : 'contato'}</span>}
        {/* e-mail entra em blur + largura, como o layout animado do original */}
        <span
          className={`overflow-hidden tabular-nums transition-[max-width,opacity,filter] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            open && !copied ? 'max-w-[16rem] opacity-100 blur-0' : 'max-w-0 opacity-0 blur-[6px]'
          }`}
          aria-hidden="true"
        >
          {EMAIL}
        </span>
      </span>
    </button>
  )
}

/**
 * Bloco "Let's connect" (adaptado de components/contact do rbp-portfolio, tema claro):
 * card glass com chamada + CTAs à esquerda e canais à direita, botões magnéticos.
 */
export function Contact() {
  return (
    <section id="contato" data-section="contato" className="bg-bg-2">
      <div className="mx-auto max-w-6xl px-6 py-28 md:px-8 md:py-40">
        <Reveal>
          <div className="glass rounded-[2rem] p-1.5">
            <div className="relative overflow-hidden rounded-[1.6rem] bg-white/60">
              {/* brilho suave no lugar do shader do original */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    'radial-gradient(60% 80% at 15% 20%, rgba(0,113,227,0.08), transparent 70%), radial-gradient(50% 70% at 85% 90%, rgba(159,179,204,0.18), transparent 70%)',
                }}
              />
              <div className="relative grid gap-8 p-6 sm:p-8 md:grid-cols-[1.2fr_1fr] md:items-stretch md:gap-6">
                <div className="flex flex-col gap-5">
                  <h2 className="font-display text-4xl font-semibold leading-[1.05] tracking-[-0.02em] sm:text-5xl lg:text-6xl">
                    Let&rsquo;s connect.
                  </h2>
                  <p className="mb-4 max-w-[32ch] text-lg leading-snug text-ink-2 sm:text-xl">
                    Arquitetura AWS, integrações, automação ou IA aplicada. Se tem um problema real pra
                    resolver, me chama.
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <Magnet>
                      <ContactButton />
                    </Magnet>
                    <Magnet>
                      <Link
                        to="/projetos"
                        className="lc group inline-flex h-12 items-center gap-2 rounded-2xl border border-line bg-white px-5 text-[15px] font-medium text-ink shadow-sm transition-colors hover:border-black/15"
                      >
                        ver projetos
                        <svg
                          viewBox="0 0 24 24"
                          className="size-4 transition-transform duration-300 group-hover:translate-x-0.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          aria-hidden="true"
                        >
                          <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </Link>
                    </Magnet>
                  </div>
                </div>

                <div className="flex flex-col justify-between gap-6 rounded-[1.1rem] border border-line bg-white/80 p-5 sm:p-6">
                  <ul className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2">
                    {CHANNELS.map((c) => {
                      const external = c.href.startsWith('http')
                      return (
                        <li key={c.label}>
                          <Magnet strength={0.15} className="block">
                            <a
                              href={c.href}
                              target={external ? '_blank' : undefined}
                              rel={external ? 'noopener noreferrer' : undefined}
                              className="lc group flex h-14 w-full min-w-[9.5rem] items-center gap-3 rounded-2xl border border-line bg-white px-4 text-[15px] font-medium text-ink transition-[border-color,box-shadow] hover:border-black/15 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
                            >
                              <Icon
                                path={c.path}
                                className="size-5 text-ink-2 transition-colors group-hover:text-ink"
                              />
                              {c.label}
                            </a>
                          </Magnet>
                        </li>
                      )
                    })}
                  </ul>
                  <div className="lc text-center">
                    <p className="text-[13px] text-ink-2">{new Date().getFullYear()} © cloudbymcn</p>
                    <p className="mt-0.5 text-xs text-ink-3">beyond the cloud</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
