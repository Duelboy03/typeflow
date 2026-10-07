import clsx from 'clsx'
import { AtSign, Hash, Quote, Timer, Type } from 'lucide-react'
import { TIME_OPTIONS, WORD_OPTIONS, type Mode, type QuoteLength, type TestConfig } from '../engine/types'

interface Props {
  config: TestConfig
  onChange: (c: TestConfig) => void
}

function Pill({
  active,
  onClick,
  children,
  label,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  label?: string
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors',
        active ? 'bg-surface-2 text-accent' : 'text-sub hover:text-ink',
      )}
    >
      {children}
    </button>
  )
}

const Divider = () => <span className="mx-1 hidden h-4 w-px bg-line sm:block" />

export function ConfigBar({ config, onChange }: Props) {
  const set = (patch: Partial<TestConfig>) => onChange({ ...config, ...patch })
  const modes: { id: Mode; icon: React.ReactNode; label: string }[] = [
    { id: 'time', icon: <Timer size={14} />, label: 'time' },
    { id: 'words', icon: <Type size={14} />, label: 'words' },
    { id: 'quote', icon: <Quote size={14} />, label: 'quote' },
  ]
  const quoteLengths: QuoteLength[] = ['short', 'medium', 'long']
  const noExtras = config.mode === 'quote'

  return (
    <div
      className="mx-auto flex w-fit max-w-full flex-wrap items-center justify-center gap-1 rounded-2xl border border-line bg-surface p-1.5"
      role="toolbar"
      aria-label="Test settings"
    >
      <Pill active={config.punctuation && !noExtras} onClick={() => set({ punctuation: !config.punctuation })} label="punctuation">
        <AtSign size={14} /> punctuation
      </Pill>
      <Pill active={config.numbers && !noExtras} onClick={() => set({ numbers: !config.numbers })} label="numbers">
        <Hash size={14} /> numbers
      </Pill>
      <Divider />
      {modes.map((m) => (
        <Pill key={m.id} active={config.mode === m.id} onClick={() => set({ mode: m.id })}>
          {m.icon} {m.label}
        </Pill>
      ))}
      <Divider />
      {config.mode === 'time' &&
        TIME_OPTIONS.map((t) => (
          <Pill key={t} active={config.time === t} onClick={() => set({ time: t })}>
            {t}
          </Pill>
        ))}
      {config.mode === 'words' &&
        WORD_OPTIONS.map((w) => (
          <Pill key={w} active={config.words === w} onClick={() => set({ words: w })}>
            {w}
          </Pill>
        ))}
      {config.mode === 'quote' &&
        quoteLengths.map((q) => (
          <Pill key={q} active={config.quoteLength === q} onClick={() => set({ quoteLength: q })}>
            {q}
          </Pill>
        ))}
    </div>
  )
}
