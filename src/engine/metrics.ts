import type { CharBreakdown, KeyStat, Keystroke, Session, TestResult } from './types'

/** Standard WPM convention: one "word" is five characters. */
export const CHARS_PER_WORD = 5

export function wpmFromChars(chars: number, ms: number): number {
  if (ms <= 0) return 0
  return chars / CHARS_PER_WORD / (ms / 60000)
}

/**
 * Characters that count toward net WPM: every correctly typed word plus its
 * trailing space, plus the matching prefix of the word in progress.
 * `finalWordHasNoSpace` is true once a words/quote test has ended on its last word.
 */
export function correctChars(s: Pick<Session, 'words' | 'typed' | 'input' | 'current' | 'status'>): number {
  let n = 0
  const committed = s.typed.length
  for (let i = 0; i < committed; i++) {
    const isLast = i === s.words.length - 1
    if (s.typed[i] === s.words[i]) n += s.words[i].length + (isLast ? 0 : 1)
  }
  const target = s.words[s.current] ?? ''
  for (let i = 0; i < s.input.length && i < target.length; i++) {
    if (s.input[i] === target[i]) n++
  }
  return n
}

export function totalTypedChars(keystrokes: Keystroke[]): number {
  return keystrokes.length
}

export function accuracy(keystrokes: Keystroke[]): number {
  if (keystrokes.length === 0) return 100
  const ok = keystrokes.reduce((a, k) => a + (k.correct ? 1 : 0), 0)
  return (ok / keystrokes.length) * 100
}

/**
 * Consistency of per-second speed, 0-100. Uses the coefficient of variation
 * passed through a tanh-based curve so that normal human variation scores
 * around 60-80 rather than collapsing to zero.
 */
export function consistency(values: number[]): number {
  if (values.length < 2) return 100
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  if (mean === 0) return 0
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length
  const cv = Math.sqrt(variance) / mean
  const x = cv + cv ** 3 / 3 + cv ** 5 / 5
  return Math.max(0, Math.min(100, 100 * (1 - Math.tanh(x))))
}

export function charBreakdown(s: Pick<Session, 'words' | 'typed' | 'input' | 'current'>): CharBreakdown {
  const out: CharBreakdown = { correct: 0, incorrect: 0, extra: 0, missed: 0 }
  const tally = (typed: string, target: string, countMissed: boolean) => {
    const common = Math.min(typed.length, target.length)
    for (let i = 0; i < common; i++) {
      if (typed[i] === target[i]) out.correct++
      else out.incorrect++
    }
    if (typed.length > target.length) out.extra += typed.length - target.length
    if (countMissed && typed.length < target.length) out.missed += target.length - typed.length
  }
  s.typed.forEach((t, i) => tally(t, s.words[i], true))
  if (s.input.length > 0) tally(s.input, s.words[s.current] ?? '', false)
  return out
}

export function keyStats(keystrokes: Keystroke[]): KeyStat[] {
  const map = new Map<string, { hits: number; misses: number; lat: number; latN: number }>()
  keystrokes.forEach((k, i) => {
    if (k.expected === null) return
    const key = k.expected.toLowerCase()
    const e = map.get(key) ?? { hits: 0, misses: 0, lat: 0, latN: 0 }
    if (k.correct) e.hits++
    else e.misses++
    if (i > 0 && k.correct) {
      e.lat += k.t - keystrokes[i - 1].t
      e.latN++
    }
    map.set(key, e)
  })
  return [...map.entries()].map(([key, e]) => ({
    key,
    hits: e.hits,
    misses: e.misses,
    avgLatency: e.latN ? e.lat / e.latN : 0,
  }))
}

export function computeResult(s: Session): TestResult {
  const durationMs = s.endedAt ?? s.clock
  const net = correctChars(s)
  const wpm = wpmFromChars(net, durationMs)
  const raw = wpmFromChars(totalTypedChars(s.keystrokes), durationMs)
  return {
    wpm,
    raw,
    accuracy: accuracy(s.keystrokes),
    consistency: consistency(s.samples.map((x) => x.raw)),
    durationMs,
    chars: charBreakdown(s),
    samples: s.samples,
    keys: keyStats(s.keystrokes),
  }
}
