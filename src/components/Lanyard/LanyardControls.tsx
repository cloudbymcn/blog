import { useEffect, useId, useState, type ReactNode } from 'react'
import { LANYARD_DEFAULTS, type Finish, type LanyardSettings, type Metal } from './settings'

const FINISHES: Finish[] = ['matte', 'glossy', 'holographic', 'metallic']
const METALS: Metal[] = ['silver', 'graphite', 'gold']

type NumberKey = {
  [K in keyof LanyardSettings]: LanyardSettings[K] extends number ? K : never
}[keyof LanyardSettings]

const SLIDERS: { key: NumberKey; label: string; min: number; max: number; step: number }[] = [
  { key: 'cornerRadius', label: 'Corner radius', min: 0, max: 1, step: 0.05 },
  { key: 'size', label: 'Size', min: 0.3, max: 0.9, step: 0.01 },
  { key: 'strapLength', label: 'Band length', min: 0, max: 1, step: 0.05 },
  { key: 'strapWidth', label: 'Band width', min: 0.4, max: 2, step: 0.05 },
  { key: 'gravity', label: 'Gravity', min: 0, max: 3, step: 0.1 },
  { key: 'damping', label: 'Damping', min: 0, max: 1, step: 0.05 },
  { key: 'elasticity', label: 'Elasticity', min: 0, max: 1, step: 0.05 },
  { key: 'breeze', label: 'Breeze', min: 0, max: 1, step: 0.05 },
]

function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="text-xs font-medium text-ink-2">
      {children}
    </label>
  )
}

/** Controle segmentado (Finish, Metal). */
function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: T[]
  onChange: (v: T) => void
}) {
  return (
    <div role="group" aria-label={label}>
      <Label>{label}</Label>
      <div className="mt-1.5 grid grid-flow-col gap-0.5 rounded-xl bg-black/[0.05] p-0.5">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            aria-pressed={value === o}
            onClick={() => onChange(o)}
            className={`rounded-[10px] px-1.5 py-1 text-xs capitalize transition-colors ${
              value === o ? 'bg-white font-medium text-ink shadow-sm' : 'text-ink-2 hover:text-ink'
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  )
}

function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  const id = useId()
  return (
    <div className="flex items-center justify-between gap-3">
      <Label htmlFor={id}>{label}</Label>
      <span className="flex items-center gap-2">
        <span className="font-mono text-[11px] text-ink-2">{value}</span>
        <input
          id={id}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="lanyard-color size-6 cursor-pointer rounded-full border border-line"
        />
      </span>
    </div>
  )
}

/** Toggle estilo iOS. */
function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="lc text-xs font-medium text-ink-2">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors ${
          checked ? 'bg-[#34c759]' : 'bg-black/[0.12]'
        }`}
      >
        <span
          className={`absolute top-[2px] size-[18px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.25)] transition-[left] ${
            checked ? 'left-[18px]' : 'left-[2px]'
          }`}
        />
      </button>
    </div>
  )
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
}) {
  const id = useId()
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div>
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>{label}</Label>
        <span className="font-mono text-[11px] tabular-nums text-ink-2">{value.toFixed(2)}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="lanyard-range mt-1.5 w-full"
        style={{ '--pct': `${pct}%` } as React.CSSProperties}
      />
    </div>
  )
}

function SlidersIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
    >
      <path strokeLinecap="round" d="M4 7h10M18 7h2M4 17h4M12 17h8" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="10" cy="17" r="2" />
    </svg>
  )
}

/**
 * Botão discreto + painel glass com os ajustes do crachá (SPEC §0-bis).
 * Desktop: painel flutuante à direita do hero. Mobile (<768px): bottom sheet.
 * data-lanyard-block: o hit test do cartão ignora cliques aqui (o canvas fica por baixo).
 */
export function LanyardControls({
  value,
  onChange,
}: {
  value: LanyardSettings
  onChange: (next: LanyardSettings) => void
}) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const set = <K extends keyof LanyardSettings>(key: K, v: LanyardSettings[K]) =>
    onChange({ ...value, [key]: v })

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div data-lanyard-block>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? 'Fechar ajustes do crachá' : 'Ajustar crachá'}
        title="Ajustar crachá"
        onClick={() => setOpen((o) => !o)}
        className="glass absolute right-6 top-[calc(var(--nav-h)+16px)] z-30 flex size-10 items-center justify-center rounded-full text-ink-2 transition-colors hover:text-ink md:right-8"
      >
        <SlidersIcon />
      </button>

      {open && (
        <>
          {/* mobile: fundo que fecha o bottom sheet */}
          <div
            className="fixed inset-0 z-40 bg-black/10 md:hidden"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            id={panelId}
            role="dialog"
            data-lenis-prevent
            aria-label="Ajustes do crachá"
            className="glass fixed inset-x-0 bottom-0 z-50 max-h-[70svh] overflow-y-auto rounded-t-3xl bg-white/80 px-5 pb-8 pt-4 md:absolute md:inset-x-auto md:bottom-auto md:right-8 md:top-[calc(var(--nav-h)+68px)] md:z-30 md:max-h-[calc(100svh-var(--nav-h)-96px)] md:w-72 md:rounded-3xl md:pb-5"
          >
            <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-black/15 md:hidden" aria-hidden="true" />
            <div className="flex items-center justify-between">
              <p className="lc text-[15px] font-semibold tracking-[-0.01em] text-ink">Customize</p>
              <button
                type="button"
                onClick={() => onChange(LANYARD_DEFAULTS)}
                className="text-xs font-medium text-link hover:underline"
              >
                Reset
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <Segmented
                label="Finish"
                value={value.finish}
                options={FINISHES}
                onChange={(v) => set('finish', v)}
              />
              <Segmented
                label="Metal"
                value={value.metal}
                options={METALS}
                onChange={(v) => set('metal', v)}
              />
              <div className="space-y-2.5 border-t border-line pt-4">
                <ColorRow label="Card color" value={value.cardColor} onChange={(v) => set('cardColor', v)} />
                <ColorRow
                  label="Band color"
                  value={value.strapColor}
                  onChange={(v) => set('strapColor', v)}
                />
                <Toggle label="Plain band" checked={value.plainBand} onChange={(v) => set('plainBand', v)} />
              </div>
              <div className="space-y-3 border-t border-line pt-4">
                {SLIDERS.map(({ key, ...s }) => (
                  <Slider key={key} {...s} value={value[key]} onChange={(v) => set(key, v)} />
                ))}
              </div>
              <div className="space-y-2.5 border-t border-line pt-4">
                <Toggle
                  label="Interactive"
                  checked={value.interactive}
                  onChange={(v) => set('interactive', v)}
                />
                <Toggle label="Intro" checked={value.intro} onChange={(v) => set('intro', v)} />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
