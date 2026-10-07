import { Copy, Check, RotateCcw, ChevronRight, Trophy } from 'lucide-react'
import { useState } from 'react'
import type { TestConfig, TestResult } from '../engine/types'
import { configKey } from '../lib/storage'
import { KeyboardHeatmap } from './KeyboardHeatmap'
import { LineChart } from './LineChart'

interface Props {
  result: TestResult
  config: TestConfig
  isPb: boolean
  onNext: () => void
  onRepeat: () => void
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div title={hint}>
      <div className="text-xs uppercase tracking-wider text-sub">{label}</div>
      <div className="font-mono text-2xl text-ink">{value}</div>
    </div>
  )
}

export function Results({ result, config, isPb, onNext, onRepeat }: Props) {
  const [copied, setCopied] = useState(false)
  const secs = result.durationMs / 1000
  const c = result.chars
  const labels = result.samples.map((s) => `${s.second}s`)
  const weakest = result.keys
    .filter((k) => k.misses > 0)
    .sort((a, b) => b.misses / (b.hits + b.misses) - a.misses / (a.hits + a.misses) || b.misses - a.misses)
    .slice(0, 5)

  const share = `typeflow · ${configKey(config)} · ${Math.round(result.wpm)} wpm · ${Math.round(result.accuracy)}% acc · ${Math.round(result.consistency)}% consistency`
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(share)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      /* clipboard blocked: nothing useful to do */
    }
  }

  return (
    <div className="fade-in space-y-8" data-testid="results">
      <div className="grid gap-8 md:grid-cols-[auto_1fr]">
        <div className="flex gap-10 md:flex-col md:gap-6">
          <div>
            <div className="flex items-center gap-2 text-sm text-sub">
              wpm
              {isPb && (
                <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-ink">
                  <Trophy size={11} /> New best
                </span>
              )}
            </div>
            <div className="font-mono text-6xl font-semibold leading-none text-accent md:text-7xl" data-testid="wpm">
              {Math.round(result.wpm)}
            </div>
          </div>
          <div>
            <div className="text-sm text-sub">accuracy</div>
            <div className="font-mono text-6xl font-semibold leading-none text-ink md:text-7xl" data-testid="acc">
              {Math.round(result.accuracy)}
              <span className="text-3xl text-sub">%</span>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4 pt-5">
          <LineChart
            series={[
              { name: 'wpm', color: 'var(--accent)', values: result.samples.map((s) => s.wpm), area: true },
              { name: 'raw', color: 'var(--sub)', values: result.samples.map((s) => s.raw), dashed: true },
            ]}
            xLabels={labels}
            markers={result.samples.map((s) => s.errors)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 rounded-2xl border border-line bg-surface p-5 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="raw" value={String(Math.round(result.raw))} hint="Speed counting every keystroke, errors included" />
        <Stat label="consistency" value={`${Math.round(result.consistency)}%`} hint="How steady your speed was second to second" />
        <Stat label="time" value={`${secs.toFixed(secs < 10 ? 1 : 0)}s`} />
        <Stat label="characters" value={`${c.correct}/${c.incorrect}/${c.extra}/${c.missed}`} hint="correct / incorrect / extra / missed" />
        <Stat label="test" value={configKey(config).replace('time ', '').replace('words ', '')} />
        <Stat label="mistakes" value={String(result.samples.reduce((a, s) => a + s.errors, 0))} />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_auto]">
        <div className="rounded-2xl border border-line bg-surface p-5">
          <KeyboardHeatmap keys={result.keys} />
        </div>
        <div className="min-w-56 rounded-2xl border border-line bg-surface p-5">
          <h3 className="mb-3 text-sm font-medium text-sub">Keys to practise</h3>
          {weakest.length === 0 ? (
            <p className="text-sm text-sub">No mistakes. Clean run.</p>
          ) : (
            <ul className="space-y-2">
              {weakest.map((k) => (
                <li key={k.key} className="flex items-center gap-3">
                  <span className="kbd w-8 text-center uppercase">{k.key === ' ' ? '␣' : k.key}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                    <div
                      className="h-full rounded-full bg-bad"
                      style={{ width: `${Math.max(8, (k.misses / (k.hits + k.misses)) * 100)}%` }}
                    />
                  </div>
                  <span className="font-mono text-xs text-sub">
                    {k.misses}/{k.hits + k.misses}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={onNext}
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          autoFocus
        >
          Next test <ChevronRight size={16} />
        </button>
        <button
          onClick={onRepeat}
          className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm text-ink transition hover:bg-surface-2"
        >
          <RotateCcw size={15} /> Repeat same text
        </button>
        <button
          onClick={copy}
          className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm text-ink transition hover:bg-surface-2"
        >
          {copied ? <Check size={15} className="text-good" /> : <Copy size={15} />} {copied ? 'Copied' : 'Copy result'}
        </button>
        <span className="ml-auto hidden text-xs text-sub sm:block">
          <span className="kbd">Enter</span> next · <span className="kbd">Tab</span> restart
        </span>
      </div>
    </div>
  )
}
