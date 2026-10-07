import { useState } from 'react'
import { ROWS } from '../engine/keyboard'
import type { KeyStat } from '../engine/types'

const OFFSETS = [0, 0.5, 0.75, 1.25]

export function KeyboardHeatmap({ keys }: { keys: KeyStat[] }) {
  const [view, setView] = useState<'errors' | 'speed'>('errors')
  const by = new Map(keys.map((k) => [k.key, k]))
  const maxLat = Math.max(1, ...keys.map((k) => k.avgLatency))
  const minLat = Math.min(...keys.filter((k) => k.avgLatency > 0).map((k) => k.avgLatency), maxLat)

  const heat = (k?: KeyStat): number => {
    if (!k) return -1
    if (view === 'errors') return k.hits + k.misses === 0 ? -1 : k.misses / (k.hits + k.misses)
    return k.avgLatency === 0 ? -1 : (k.avgLatency - minLat) / Math.max(1, maxLat - minLat)
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-sub">Keyboard heatmap</h3>
        <div className="flex rounded-lg border border-line p-0.5 text-xs">
          {(['errors', 'speed'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              aria-pressed={view === v}
              className={`rounded-md px-2.5 py-1 capitalize transition-colors ${
                view === v ? 'bg-surface-2 text-ink' : 'text-sub hover:text-ink'
              }`}
            >
              {v === 'errors' ? 'Mistakes' : 'Slowness'}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        {ROWS.map((row, r) => (
          <div key={r} className="flex gap-1.5" style={{ marginLeft: `${OFFSETS[r] * 2.4}rem` }}>
            {row.map((key) => {
              const k = by.get(key)
              const h = heat(k)
              const used = h >= 0
              // a key typed without mistakes stays neutral; only real errors get colour
              const tinted = used && (view === 'speed' || h > 0)
              const alpha = tinted ? 0.3 + Math.min(1, h * (view === 'errors' ? 2.2 : 1)) * 0.65 : 0
              const color = view === 'errors' ? 'var(--bad)' : 'var(--accent)'
              return (
                <div
                  key={key}
                  title={
                    k
                      ? `${key.toUpperCase()}: ${k.misses} mistakes / ${k.hits + k.misses} presses${
                          k.avgLatency ? `, ${Math.round(k.avgLatency)} ms avg` : ''
                        }`
                      : `${key.toUpperCase()}: not used`
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-line font-mono text-xs uppercase sm:h-10 sm:w-10"
                  style={{
                    background: tinted
                      ? `color-mix(in srgb, ${color} ${alpha * 100}%, var(--surface))`
                      : used
                        ? 'var(--surface-2)'
                        : 'var(--surface)',
                    color: tinted && alpha > 0.6 ? 'var(--accent-ink)' : used ? 'var(--ink)' : 'var(--muted)',
                  }}
                >
                  {key}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
