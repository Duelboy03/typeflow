import clsx from 'clsx'
import { BarChart3, Keyboard } from 'lucide-react'
import { THEMES, type ThemeName } from '../lib/storage'

const SWATCH: Record<ThemeName, string> = {
  midnight: 'linear-gradient(135deg,#0a0c11 50%,#8b9dff 50%)',
  paper: 'linear-gradient(135deg,#f4f1ea 50%,#b4491f 50%)',
  matcha: 'linear-gradient(135deg,#0c1511 50%,#7ee8a8 50%)',
}

interface Props {
  view: 'test' | 'stats'
  onView: (v: 'test' | 'stats') => void
  theme: ThemeName
  onTheme: (t: ThemeName) => void
}

export function Header({ view, onView, theme, onTheme }: Props) {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5">
      <button onClick={() => onView('test')} className="flex items-center gap-2.5" aria-label="typeflow home">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-ink">
          <Keyboard size={18} strokeWidth={2.25} />
        </span>
        <span className="hidden text-lg font-semibold tracking-tight sm:inline">typeflow</span>
      </button>

      <nav className="flex items-center gap-1" aria-label="Main">
        {([
          ['test', 'Test', <Keyboard size={15} key="k" />],
          ['stats', 'Stats', <BarChart3 size={15} key="b" />],
        ] as const).map(([id, label, icon]) => (
          <button
            key={id}
            onClick={() => onView(id)}
            aria-current={view === id ? 'page' : undefined}
            className={clsx(
              'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors',
              view === id ? 'bg-surface-2 text-ink' : 'text-sub hover:text-ink',
            )}
          >
            {icon} {label}
          </button>
        ))}
        <span className="mx-2 h-4 w-px bg-line" />
        <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Theme">
          {THEMES.map((t) => (
            <button
              key={t}
              role="radio"
              aria-checked={theme === t}
              aria-label={`${t} theme`}
              title={t}
              onClick={() => onTheme(t)}
              className={clsx(
                'h-5 w-5 rounded-full border transition',
                theme === t ? 'border-ink ring-2 ring-accent/50' : 'border-line hover:border-sub',
              )}
              style={{ background: SWATCH[t] }}
            />
          ))}
        </div>
      </nav>
    </header>
  )
}
