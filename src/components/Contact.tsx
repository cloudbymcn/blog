import { siGithub, siInstagram } from 'simple-icons'
import { Section } from './ui/Section'

// LinkedIn saiu do simple-icons; path desenhado à mão
const LINKEDIN_PATH =
  'M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z'
const MAIL_PATH = 'M2 5h20v14H2V5zm2 2v.5l8 5 8-5V7H4zm16 2.86-8 5-8-5V17h16V9.86z'

const CHANNELS = [
  {
    label: 'E-mail',
    value: 'matheuscamposti@gmail.com',
    href: 'mailto:matheuscamposti@gmail.com',
    path: MAIL_PATH,
  },
  {
    label: 'LinkedIn',
    value: 'in/m-cnascimento',
    href: 'https://www.linkedin.com/in/m-cnascimento',
    path: LINKEDIN_PATH,
  },
  {
    label: 'Instagram',
    value: '@cloudbymcn',
    href: 'https://instagram.com/cloudbymcn',
    path: siInstagram.path,
  },
  { label: 'GitHub', value: 'cloudbymcn', href: 'https://github.com/cloudbymcn', path: siGithub.path },
]

export function Contact() {
  return (
    <Section id="contato" eyebrow="Contato" title="Vamos conversar." tint>
      <p className="max-w-xl text-lg text-ink-2">
        Arquitetura AWS, integrações, automação ou IA aplicada. Me chama em qualquer um destes canais.
      </p>
      <ul className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {CHANNELS.map((c) => {
          const external = c.href.startsWith('http')
          return (
            <li key={c.label}>
              <a
                href={c.href}
                target={external ? '_blank' : undefined}
                rel={external ? 'noopener noreferrer' : undefined}
                className="glass group flex items-center gap-4 rounded-3xl p-6 transition-shadow hover:shadow-[0_16px_40px_rgba(0,0,0,0.10)]"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="size-6 shrink-0 text-ink-2 group-hover:text-link"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d={c.path} />
                </svg>
                <span className="min-w-0">
                  <span className="block text-xs font-medium text-ink-2">{c.label}</span>
                  <span className="block truncate font-medium">{c.value}</span>
                </span>
              </a>
            </li>
          )
        })}
      </ul>
    </Section>
  )
}
