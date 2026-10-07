import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { HistoryEntry } from '../engine/types'
import { bestsByConfig, formatDuration, movingAverage, summarize } from '../lib/stats'
import { configKey } from '../lib/storage'
import { LineChart } from './LineChart'

function Card({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="text-xs uppercase tracking-wider text-sub">{label}</div>
      <div className="mt-1 font-mono text-3xl text-ink">{value}</div>
      {sub && <div className="mt-1 text-xs text-sub">{sub}</div>}
    </div>
  )
}

export function StatsPage({ history, onClear }: { history: HistoryEntry[]; onClear: () => void }) {
  const [confirming, setConfirming] = useState(false)

  if (history.length === 0) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-dashed border-line p-12 text-center">
        <h2 className="text-lg font-medium">No tests yet</h2>
        <p className="mt-2 text-sm text-sub">Finish a test and your progress will show up here. Results stay in this browser.</p>
      </div>
    )
  }

  const s = summarize(history)
  const recent = history.slice(-40)
  const wpms = recent.map((h) => h.wpm)
  const bests = bestsByConfig(history)

  return (
    <div className="fade-in mx-auto w-full max-w-5xl space-y-8">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card label="Tests" value={String(s.tests)} sub={`${formatDuration(s.totalSeconds)} typing`} />
        <Card label="Best" value={`${Math.round(s.best)}`} sub="wpm" />
        <Card label="Last 10 avg" value={`${Math.round(s.avgLast10)}`} sub="wpm" />
        <Card label="Accuracy" value={`${Math.round(s.avgAccuracy)}%`} sub="all tests" />
      </div>

      <div className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="mb-3 text-sm font-medium text-sub">Speed over your last {recent.length} tests</h2>
        <LineChart
          series={[
            { name: 'wpm', color: 'var(--accent)', values: wpms, area: true },
            { name: '5-test avg', color: 'var(--good)', values: movingAverage(wpms, 5), dashed: true },
          ]}
          xLabels={recent.map((_, i) => `#${history.length - recent.length + i + 1}`)}
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
        <div className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="mb-3 text-sm font-medium text-sub">Personal bests</h2>
          <table className="w-full text-sm">
            <tbody>
              {bests.map((b) => (
                <tr key={b.key} className="border-t border-line first:border-0">
                  <td className="py-2 text-sub">{b.key}</td>
                  <td className="py-2 text-right font-mono text-ink">{Math.round(b.wpm)}</td>
                  <td className="py-2 pl-4 text-right font-mono text-xs text-sub">{Math.round(b.accuracy)}%</td>
                  <td className="py-2 pl-4 text-right text-xs text-muted">×{b.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="mb-3 text-sm font-medium text-sub">Recent tests</h2>
          <div className="max-h-72 overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-sub">
                <tr>
                  <th className="pb-2 font-normal">When</th>
                  <th className="pb-2 font-normal">Test</th>
                  <th className="pb-2 text-right font-normal">wpm</th>
                  <th className="pb-2 text-right font-normal">acc</th>
                  <th className="pb-2 text-right font-normal">cons</th>
                </tr>
              </thead>
              <tbody>
                {[...history].reverse().slice(0, 30).map((h) => (
                  <tr key={h.id} className="border-t border-line">
                    <td className="py-2 text-sub">
                      {new Date(h.at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}{' '}
                      <span className="text-muted">
                        {new Date(h.at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="py-2 text-sub">{configKey(h.config)}</td>
                    <td className="py-2 text-right font-mono text-ink">{Math.round(h.wpm)}</td>
                    <td className="py-2 text-right font-mono text-sub">{Math.round(h.accuracy)}%</td>
                    <td className="py-2 text-right font-mono text-sub">{Math.round(h.consistency)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        {confirming ? (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-sub">Delete all {history.length} results?</span>
            <button
              onClick={() => {
                onClear()
                setConfirming(false)
              }}
              className="rounded-lg bg-bad px-3 py-1.5 font-medium text-white"
            >
              Delete
            </button>
            <button onClick={() => setConfirming(false)} className="rounded-lg border border-line px-3 py-1.5 text-sub">
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-sub transition-colors hover:text-bad"
          >
            <Trash2 size={14} /> Clear history
          </button>
        )}
      </div>
    </div>
  )
}
