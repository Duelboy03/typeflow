import type { HistoryEntry } from '../engine/types'
import { configKey } from './storage'

export interface Summary {
  tests: number
  totalSeconds: number
  best: number
  avgLast10: number
  avgAccuracy: number
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)

export function summarize(h: HistoryEntry[]): Summary {
  return {
    tests: h.length,
    totalSeconds: h.reduce((a, e) => a + e.durationMs / 1000, 0),
    best: h.reduce((a, e) => Math.max(a, e.wpm), 0),
    avgLast10: mean(h.slice(-10).map((e) => e.wpm)),
    avgAccuracy: mean(h.map((e) => e.accuracy)),
  }
}

export function bestsByConfig(h: HistoryEntry[]): { key: string; wpm: number; accuracy: number; count: number }[] {
  const map = new Map<string, { wpm: number; accuracy: number; count: number }>()
  for (const e of h) {
    const k = configKey(e.config)
    const cur = map.get(k)
    if (!cur) map.set(k, { wpm: e.wpm, accuracy: e.accuracy, count: 1 })
    else {
      cur.count++
      if (e.wpm > cur.wpm) {
        cur.wpm = e.wpm
        cur.accuracy = e.accuracy
      }
    }
  }
  return [...map.entries()].map(([key, v]) => ({ key, ...v })).sort((a, b) => b.wpm - a.wpm)
}

/** Trailing moving average, so early points average over what is available. */
export function movingAverage(values: number[], window: number): number[] {
  return values.map((_, i) => mean(values.slice(Math.max(0, i - window + 1), i + 1)))
}

export function formatDuration(totalSeconds: number): string {
  const s = Math.round(totalSeconds)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ${s % 60}s`
  return `${Math.floor(m / 60)}h ${m % 60}m`
}
